import type { EntityBlueprint, Flow } from '../types/blueprint.js';
import type { ClassicWorkflow } from '../types/classicWorkflow.js';
import type {
  CrossEntityAnalysisResult,
  CrossEntityEntityView,
  CrossEntityTrace,
  CrossEntityEntryPoint,
  AutomationActivation,
  CrossEntityBranch,
  CrossEntityChainLink,
  CrossEntityRisk,
  EntityAutomationPipeline,
  MessagePipeline,
  PipelineStep,
} from '../types/crossEntityTrace.js';
import { ClassicWorkflowXamlParser } from '../parsers/ClassicWorkflowXamlParser.js';
import { resolveEntityName } from '../utils/entityName.js';

/**
 * Performs 4-layer cross-entity automation analysis:
 *   Layer 1 — Discovery: entity blueprints (existing data)
 *   Layer 2 — Entry Points: which automations on other entities write to THIS entity
 *   Layer 3 — Activation Map: which of THIS entity's automations fire for each entry point
 *   Layer 4 — Risk Detection: performance, circular ref, deep sync chain, high fan-out
 *
 * No new Dataverse queries — analysis only.
 */
export class CrossEntityAnalyzer {
  /**
   * Analyze all entity blueprints and classic workflows to produce a
   * complete cross-entity trace result.
   */
  analyze(
    blueprints: EntityBlueprint[],
    classicWorkflows: ClassicWorkflow[] = [],
    allFlows: Flow[] = []
  ): CrossEntityAnalysisResult {
    // Build lookup maps
    const entityDisplayMap = new Map<string, string>();
    for (const { entity } of blueprints) {
      entityDisplayMap.set(
        entity.LogicalName.toLowerCase(),
        entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName
      );
    }

    const blueprintMap = new Map<string, EntityBlueprint>();
    for (const bp of blueprints) {
      blueprintMap.set(bp.entity.LogicalName.toLowerCase(), bp);
    }

    // Build cwByEntity map
    const cwByEntity = new Map<string, ClassicWorkflow[]>();
    for (const wf of classicWorkflows) {
      if (!wf.entity) continue;
      const key = wf.entity.toLowerCase();
      if (!cwByEntity.has(key)) cwByEntity.set(key, []);
      cwByEntity.get(key)!.push(wf);
    }

    // Layer 2: Discover all entry points (source-centric scan)
    // Key = target entity logical name (may or may not be in blueprints)
    const allEntryPointsByTarget = this.discoverAllEntryPoints(
      blueprints,
      classicWorkflows,
      entityDisplayMap,
      allFlows
    );

    const entityViews = new Map<string, CrossEntityEntityView>();
    // Seed chain links with unbound action calls (no entity target — chain map only)
    const chainLinks: CrossEntityChainLink[] = this.collectUnboundChainLinks(
      blueprints, entityDisplayMap, allFlows
    );
    let totalEntryPoints = 0;
    const globalRisks: CrossEntityRisk[] = [];

    for (const [targetEntity, entryPoints] of allEntryPointsByTarget) {
      const targetBp = blueprintMap.get(targetEntity);
      const targetDisplayName = entityDisplayMap.get(targetEntity) || targetEntity;

      const traces: CrossEntityTrace[] = [];

      for (const ep of entryPoints) {
        // Layer 3: Build activation map (only possible for in-scope entities)
        const activations: AutomationActivation[] = targetBp
          ? this.buildActivationMap(targetBp, ep, entityDisplayMap, cwByEntity)
          : [];

        const traceRisks = this.detectTraceRisks(ep, activations, targetEntity);

        traces.push({ entryPoint: ep, activations, risks: traceRisks });
        globalRisks.push(...traceRisks);
        totalEntryPoints++;

        // Build chain link for global overview
        chainLinks.push({
          sourceEntity: ep.sourceEntity,
          sourceEntityDisplayName: ep.sourceEntityDisplayName,
          targetEntity,
          targetEntityDisplayName: targetDisplayName,
          automationName: ep.automationName,
          automationType: ep.automationType,
          operation: ep.operation,
          isAsynchronous: ep.isAsynchronous,
          ...(ep.customActionApiName ? { customActionApiName: ep.customActionApiName } : {}),
        });
      }

      // Layer 4: Entity-level risk detection (circular refs)
      const entityRisks = this.detectEntityRisks(targetEntity, traces, entityViews);
      globalRisks.push(...entityRisks);

      entityViews.set(targetEntity, {
        entityLogicalName: targetEntity,
        entityDisplayName: targetDisplayName,
        traces,
      });
    }

    // Compute totalBranches from all entry points discovered
    const totalBranches = Array.from(allEntryPointsByTarget.values())
      .reduce((sum, eps) => sum + eps.length, 0);

    // Deduplicate global risks
    const deduplicatedRisks = this.deduplicateRisks(globalRisks);

    // Build allEntityPipelines — all blueprint entities with any automation
    const allEntityPipelines = new Map<string, EntityAutomationPipeline>();
    let noFilterPluginCount = 0;

    for (const bp of blueprints) {
      const entityKey = bp.entity.LogicalName.toLowerCase();
      const displayName = entityDisplayMap.get(entityKey) || bp.entity.LogicalName;
      const messagePipelines: MessagePipeline[] = [];

      for (const message of ['Create', 'Update', 'Delete'] as const) {
        const steps: PipelineStep[] = [];

        // Plugins
        for (const plugin of bp.plugins) {
          if (plugin.entity?.toLowerCase() !== entityKey) continue;
          if (!this.messageMatchesOperation(plugin.message, message)) continue;
          const isAsync = plugin.mode === 1 || plugin.stage === 50;
          const firesForAllUpdates = message === 'Update' && plugin.filteringAttributes.length === 0;
          if (firesForAllUpdates) noFilterPluginCount++;
          steps.push({
            automationType: 'Plugin',
            automationId: plugin.id,
            automationName: plugin.name,
            stage: plugin.stage,
            stageName: this.getStageName(plugin.stage),
            rank: plugin.rank,
            mode: isAsync ? 'Async' : 'Sync',
            filteringAttributes: plugin.filteringAttributes,
            firesForAllUpdates,
          });
        }

        // Flows triggered on this entity for this message
        for (const flow of bp.flows) {
          if (flow.definition.triggerType !== 'Dataverse') continue;
          const flowTriggerEntity = flow.definition.triggerEntity?.toLowerCase();
          if (flowTriggerEntity && flowTriggerEntity !== entityKey) continue;
          if (!this.triggerMatchesOperation(flow.definition.triggerEvent, message)) continue;
          const conditionFields = this.extractFieldsFromTriggerCondition(flow.definition.triggerConditions);
          const firesForAllUpdates = message === 'Update' && conditionFields.length === 0;
          const downstream = this.detectDownstreamBranch(
            flow.definition.dataverseActions ?? [], entityKey, entityDisplayMap
          );
          steps.push({
            automationType: 'Flow',
            automationId: flow.id,
            automationName: flow.name,
            mode: 'Async',
            filteringAttributes: conditionFields,
            firesForAllUpdates,
            ...(downstream ? { downstream } : {}),
            hasExternalCalls: (flow.definition.externalCalls?.length ?? 0) > 0,
            ...((() => {
              const nonDataverseRefs = flow.definition.connectionReferences.filter(
                r => !r.toLowerCase().includes('commondataservice') && !r.toLowerCase().includes('dynamicscrm')
              );
              return nonDataverseRefs.length > 0 ? { connectionReferences: nonDataverseRefs } : {};
            })()),
            ...(flow.definition.externalCalls?.length > 0 ? { externalCallSummaries: flow.definition.externalCalls.map(c => ({ url: c.url, domain: c.domain, method: c.method })) } : {}),
          });
        }

        // Business Rules (server-scope, Create + Update only)
        if (message !== 'Delete') {
          for (const br of bp.businessRules) {
            const isServer =
              br.definition.executionContext === 'Server' ||
              br.definition.executionContext === 'Both';
            if (!isServer) continue;
            steps.push({
              automationType: 'BusinessRule',
              automationId: br.id,
              automationName: br.name,
              stageName: 'Server',
              mode: 'Sync',
              filteringAttributes: [],
              firesForAllUpdates: false,
            });
          }
        }

        // Classic Workflows
        const entityCWs = cwByEntity.get(entityKey) ?? [];
        for (const wf of entityCWs) {
          const matches =
            (message === 'Create' && wf.triggerOnCreate) ||
            (message === 'Delete' && wf.triggerOnDelete) ||
            (message === 'Update' && wf.triggerOnUpdate);
          if (!matches) continue;
          const firesForAllUpdates = message === 'Update' && wf.triggerOnUpdateAttributes.length === 0;

          // Detect downstream cross-entity write from XAML
          let classicWfDownstream: CrossEntityBranch | undefined;
          if (wf.xaml) {
            const xamlSteps = ClassicWorkflowXamlParser.parse(wf.xaml);
            // Find first step that writes to a DIFFERENT entity
            const crossStep = xamlSteps.find(
              xs => xs.targetEntity.toLowerCase() !== entityKey
                && ['Create', 'Update', 'Delete'].includes(xs.operation)
            );
            if (crossStep) {
              const targetKey = crossStep.targetEntity.toLowerCase();
              const targetDisplayName = entityDisplayMap.get(targetKey) || crossStep.targetEntity;
              classicWfDownstream = {
                targetEntity: targetKey,
                targetEntityDisplayName: targetDisplayName,
                operation: crossStep.operation,
                fields: crossStep.fields,
                pipelineRef: targetKey,
              };
            }
          }

          steps.push({
            automationType: 'ClassicWorkflow',
            automationId: wf.id,
            automationName: wf.name,
            stageName: wf.mode === 1 ? 'RealTime' : 'Background',
            mode: wf.mode === 1 ? 'Sync' : 'Async',
            filteringAttributes: wf.triggerOnUpdateAttributes,
            firesForAllUpdates,
            ...(classicWfDownstream ? { downstream: classicWfDownstream } : {}),
          });
        }

        // Deduplicate by automationId — same automation cannot fire twice in one message pipeline
        const uniqueSteps = Array.from(new Map(steps.map(s => [s.automationId, s])).values());

        // Sort: stage ASC → rank ASC → Sync before Async
        uniqueSteps.sort((a, b) => {
          const sd = (a.stage ?? 999) - (b.stage ?? 999);
          if (sd !== 0) return sd;
          const rd = (a.rank ?? 999) - (b.rank ?? 999);
          if (rd !== 0) return rd;
          if (a.mode === b.mode) return 0;
          return a.mode === 'Sync' ? -1 : 1;
        });

        if (uniqueSteps.length > 0) messagePipelines.push({ message, steps: uniqueSteps });
      }

      if (messagePipelines.length === 0) continue;

      const inboundEPs = allEntryPointsByTarget.get(entityKey) ?? [];
      allEntityPipelines.set(entityKey, {
        entityLogicalName: entityKey,
        entityDisplayName: displayName,
        messagePipelines,
        inboundEntryPoints: inboundEPs,
        hasCrossEntityOutput: messagePipelines.some(mp => mp.steps.some(s => s.downstream !== undefined)),
        hasCrossEntityInput: inboundEPs.length > 0,
        hasExternalInteraction: messagePipelines.some(mp => mp.steps.some(s => s.hasExternalCalls === true)),
      });
    }

    // Step 1 — Process flows from allFlows that have a triggerEntity in blueprints
    // but are NOT already in any blueprint's flow list (e.g. manual flows with entity = 'none').
    const blueprintScopedFlowIdsForPipeline = new Set<string>();
    for (const bp of blueprints) {
      for (const flow of bp.flows) {
        blueprintScopedFlowIdsForPipeline.add(flow.id.toLowerCase());
      }
    }

    for (const flow of allFlows) {
      if (blueprintScopedFlowIdsForPipeline.has(flow.id.toLowerCase())) continue;
      const triggerEntity = resolveEntityName(flow.definition.triggerEntity)?.toLowerCase() ?? null;
      if (!triggerEntity) continue;
      const targetBp = blueprintMap.get(triggerEntity);
      if (!targetBp) continue;

      // This flow has a trigger entity in blueprints but wasn't in bp.flows.
      // Add it to that entity's pipeline under the 'Manual' message group.
      const entityKey = triggerEntity;
      const displayName = entityDisplayMap.get(entityKey) || entityKey;

      const conditionFields = this.extractFieldsFromTriggerCondition(flow.definition.triggerConditions);
      const downstream = this.detectDownstreamBranch(
        flow.definition.dataverseActions ?? [], entityKey, entityDisplayMap
      );
      const step: PipelineStep = {
        automationType: 'Flow',
        automationId: flow.id,
        automationName: flow.name,
        mode: 'Async',
        filteringAttributes: conditionFields,
        firesForAllUpdates: false,
        hasExternalCalls: (flow.definition.externalCalls?.length ?? 0) > 0,
        ...(downstream ? { downstream } : {}),
        ...((() => {
          const nonDataverseRefs = flow.definition.connectionReferences.filter(
            r => !r.toLowerCase().includes('commondataservice') && !r.toLowerCase().includes('dynamicscrm')
          );
          return nonDataverseRefs.length > 0 ? { connectionReferences: nonDataverseRefs } : {};
        })()),
        ...(flow.definition.externalCalls?.length > 0 ? { externalCallSummaries: flow.definition.externalCalls.map(c => ({ url: c.url, domain: c.domain, method: c.method })) } : {}),
      };

      const existing = allEntityPipelines.get(entityKey);
      if (existing) {
        // Add to existing pipeline under 'Manual' group
        const manualPipeline = existing.messagePipelines.find(mp => mp.message === 'Manual');
        if (manualPipeline) {
          if (!manualPipeline.steps.some(s => s.automationId === flow.id)) {
            manualPipeline.steps.push(step);
          }
        } else {
          existing.messagePipelines.push({ message: 'Manual', steps: [step] });
        }
      } else {
        // Create new entity pipeline entry
        const inboundEPs = allEntryPointsByTarget.get(entityKey) ?? [];
        allEntityPipelines.set(entityKey, {
          entityLogicalName: entityKey,
          entityDisplayName: displayName,
          messagePipelines: [{ message: 'Manual', steps: [step] }],
          inboundEntryPoints: inboundEPs,
          hasCrossEntityOutput: !!downstream,
          hasCrossEntityInput: inboundEPs.length > 0,
          hasExternalInteraction: step.hasExternalCalls ?? false,
        });
      }
    }

    // Step 2 — Compute hasExternalInteraction for all entity pipelines
    // and recompute hasCrossEntityOutput to include Manual steps.
    for (const [, pipeline] of allEntityPipelines) {
      const hasExt = pipeline.messagePipelines.some(mp =>
        mp.steps.some(s => s.hasExternalCalls === true)
      );
      pipeline.hasExternalInteraction = hasExt;
      // Also recompute hasCrossEntityOutput to include Manual steps
      pipeline.hasCrossEntityOutput = pipeline.messagePipelines.some(mp =>
        mp.steps.some(s => s.downstream !== undefined)
      );
    }

    // Step 3 — Add entities that only receive inbound cross-entity writes (no own automation).
    for (const [entityKey, entityView] of allEntryPointsByTarget) {
      if (allEntityPipelines.has(entityKey)) continue;
      const displayName = entityDisplayMap.get(entityKey) || entityKey;
      allEntityPipelines.set(entityKey, {
        entityLogicalName: entityKey,
        entityDisplayName: displayName,
        messagePipelines: [],
        inboundEntryPoints: entityView,
        hasCrossEntityOutput: false,
        hasCrossEntityInput: entityView.length > 0,
        hasExternalInteraction: false,
      });
    }

    return {
      entityViews,
      chainLinks,
      allEntityPipelines,
      totalEntryPoints,
      totalBranches,
      noFilterPluginCount,
      risks: deduplicatedRisks,
    };
  }

  /**
   * Collect chain links for unbound custom actions / APIs.
   * These have no entity target so they never appear in per-entity pipeline views —
   * they are added directly to the Global Chain Map only.
   */
  private collectUnboundChainLinks(
    blueprints: EntityBlueprint[],
    entityDisplayMap: Map<string, string>,
    allFlows: Flow[]
  ): CrossEntityChainLink[] {
    const links: CrossEntityChainLink[] = [];
    const seen = new Set<string>(); // deduplicate by flowId + actionName

    const addLink = (
      sourceEntity: string,
      sourceDisplayName: string,
      flow: Flow,
      action: import('../types/blueprint.js').DataverseAction
    ): void => {
      const key = `${flow.id}:${action.customActionApiName ?? action.actionName}`;
      if (seen.has(key)) return;
      seen.add(key);
      links.push({
        sourceEntity,
        sourceEntityDisplayName: sourceDisplayName,
        targetEntity: '(unbound)',
        targetEntityDisplayName: 'Unbound Custom Action / API',
        automationName: flow.name,
        automationType: 'Flow',
        operation: 'Action',
        isAsynchronous: true,
        ...(action.customActionApiName ? { customActionApiName: action.customActionApiName } : {}),
      });
    };

    // Entity-scoped flows
    for (const bp of blueprints) {
      const sourceEntity = bp.entity.LogicalName.toLowerCase();
      const sourceDisplayName = entityDisplayMap.get(sourceEntity) || sourceEntity;
      for (const flow of bp.flows) {
        for (const action of flow.definition.dataverseActions ?? []) {
          if (!action.isUnbound) continue;
          addLink(sourceEntity, sourceDisplayName, flow, action);
        }
      }
    }

    // Unscoped flows (scheduled, manual, solution-level)
    const blueprintScopedIds = new Set(blueprints.flatMap(bp => bp.flows.map(f => f.id.toLowerCase())));
    for (const flow of allFlows) {
      if (blueprintScopedIds.has(flow.id.toLowerCase())) continue;
      const entityName =
        resolveEntityName(flow.entity) ??
        resolveEntityName(flow.definition.triggerEntity);
      const sourceEntity = entityName?.toLowerCase()
        ?? (flow.definition.triggerType === 'Scheduled' ? '(scheduled)'
          : flow.definition.triggerType === 'Manual' ? '(manual)'
          : '(unscoped)');
      const sourceDisplayName = entityName
        ? entityDisplayMap.get(sourceEntity) || entityName
        : flow.definition.triggerType === 'Scheduled' ? 'Scheduled Flow'
        : flow.definition.triggerType === 'Manual' ? (() => {
            // DIAGNOSTIC — remove before release
            console.log('[PPSB-DIAG] Flow classified as Manual/On-Demand in collectUnboundChainLinks:', {
              id: flow.id,
              name: flow.name,
              entity: flow.entity,
              triggerEntity: flow.definition.triggerEntity,
            });
            return 'Manual / On-Demand Flow';
          })()
        : (() => {
            // DIAGNOSTIC — remove before release
            console.log('[PPSB-DIAG] Flow fell through to unscoped label in collectUnboundChainLinks:', {
              id: flow.id,
              name: flow.name,
              entity: flow.entity,
              triggerType: flow.definition.triggerType,
              triggerEntity: flow.definition.triggerEntity,
              triggerEvent: flow.definition.triggerEvent,
              scopeName: flow.scopeName,
            });
            return 'Solution Flow';
          })();
      for (const action of flow.definition.dataverseActions ?? []) {
        if (!action.isUnbound) continue;
        addLink(sourceEntity, sourceDisplayName, flow, action);
      }
    }

    return links;
  }

  /**
   * Layer 2: Discover ALL entry points across all blueprints.
   * Scans source-first: for each blueprint's flows and classic workflows,
   * collects writes to any entity (including those NOT in blueprints).
   *
   * Returns a map keyed by target entity logical name.
   */
  private discoverAllEntryPoints(
    blueprints: EntityBlueprint[],
    classicWorkflows: ClassicWorkflow[],
    entityDisplayMap: Map<string, string>,
    allFlows: Flow[] = []
  ): Map<string, CrossEntityEntryPoint[]> {
    const result = new Map<string, CrossEntityEntryPoint[]>();

    const addEntryPoint = (targetEntity: string, ep: CrossEntityEntryPoint): void => {
      if (!result.has(targetEntity)) result.set(targetEntity, []);
      const existing = result.get(targetEntity)!;
      const isDuplicate = existing.some(
        e =>
          e.automationId === ep.automationId &&
          e.operation === ep.operation &&
          e.sourceEntity === ep.sourceEntity
      );
      if (!isDuplicate) existing.push(ep);
    };

    // Build allFlowsById from ALL flows (both entity-scoped and unscoped)
    // for child flow resolution
    const allFlowsById = new Map<string, { flow: Flow; sourceEntity: string }>();
    for (const bp of blueprints) {
      for (const flow of bp.flows) {
        allFlowsById.set(flow.id.toLowerCase(), {
          flow,
          sourceEntity: bp.entity.LogicalName.toLowerCase(),
        });
      }
    }
    for (const flow of allFlows) {
      const id = flow.id.toLowerCase();
      if (!allFlowsById.has(id)) {
        const rawEntity = resolveEntityName(flow.entity);
        allFlowsById.set(id, {
          flow,
          sourceEntity: rawEntity?.toLowerCase() ?? '(unscoped)',
        });
      }
    }

    // Scan all blueprints' flows (entity-scoped flows)
    for (const sourceBp of blueprints) {
      const sourceEntity = sourceBp.entity.LogicalName.toLowerCase();
      const sourceDisplayName = entityDisplayMap.get(sourceEntity) || sourceEntity;

      for (const flow of sourceBp.flows) {
        // Direct dataverse actions
        for (const action of flow.definition.dataverseActions ?? []) {
          if (action.isUnbound) continue; // handled separately in collectUnboundChainLinks
          const actionTarget = action.targetEntity.toLowerCase();
          if (actionTarget === '[dynamic]' || actionTarget.startsWith('[dynamic')) continue;
          if (actionTarget === sourceEntity) continue; // skip self-referential writes
          if (!['Create', 'Update', 'Delete', 'Action'].includes(action.operation)) continue;

          addEntryPoint(actionTarget, {
            automationType: 'Flow',
            automationName: flow.name,
            automationId: flow.id,
            sourceEntity,
            sourceEntityDisplayName: sourceDisplayName,
            operation: action.operation as 'Create' | 'Update' | 'Delete' | 'Action',
            fields: action.fields ?? [],
            isAsynchronous: true,
            isScheduled: flow.definition.triggerType === 'Scheduled',
            isOnDemand: flow.definition.triggerType === 'Manual',
            confidence: action.confidence,
            ...(action.customActionApiName ? { customActionApiName: action.customActionApiName } : {}),
          });
        }

        // Follow child flow chains
        if (flow.definition.childFlowIds && flow.definition.childFlowIds.length > 0) {
          this.addChildFlowEntryPoints(
            flow,
            sourceEntity,
            sourceDisplayName,
            flow.definition.childFlowIds,
            allFlowsById,
            new Set([flow.id.toLowerCase()]),
            addEntryPoint
          );
        }
      }
    }

    // Scan unscoped flows: scheduled, manual, or flows whose entity is not in blueprints.
    // These flows never appear in bp.flows but may write to Dataverse entities.
    const blueprintScopedFlowIds = new Set<string>();
    for (const bp of blueprints) {
      for (const flow of bp.flows) {
        blueprintScopedFlowIds.add(flow.id.toLowerCase());
      }
    }

    for (const flow of allFlows) {
      // Skip flows already scanned above
      if (blueprintScopedFlowIds.has(flow.id.toLowerCase())) continue;

      // Determine source entity label from trigger type.
      // Dataverse returns primaryentity="none" (literal string) for flows without a primary entity.
      const triggerType = flow.definition.triggerType;
      const entityName =
        resolveEntityName(flow.entity) ??
        resolveEntityName(flow.definition.triggerEntity);
      let sourceEntity: string;
      let sourceDisplayName: string;

      if (entityName) {
        sourceEntity = entityName.toLowerCase();
        sourceDisplayName = entityDisplayMap.get(sourceEntity) || entityName;
      } else if (triggerType === 'Scheduled') {
        sourceEntity = '(scheduled)';
        sourceDisplayName = 'Scheduled Flow';
      } else if (triggerType === 'Manual') {
        // DIAGNOSTIC — remove before release
        console.log('[PPSB-DIAG] Flow classified as Manual/On-Demand in discoverAllEntryPoints:', {
          id: flow.id,
          name: flow.name,
          entity: flow.entity,
          triggerEntity: flow.definition.triggerEntity,
        });
        sourceEntity = '(manual)';
        sourceDisplayName = 'Manual / On-Demand Flow';
      } else {
        // DIAGNOSTIC — remove before release
        console.log('[PPSB-DIAG] Flow fell through to unscoped label in discoverAllEntryPoints:', {
          id: flow.id,
          name: flow.name,
          entity: flow.entity,
          triggerType: flow.definition.triggerType,
          triggerEntity: flow.definition.triggerEntity,
          triggerEvent: flow.definition.triggerEvent,
          scopeName: flow.scopeName,
        });
        sourceEntity = '(unscoped)';
        sourceDisplayName = 'Solution Flow';
      }

      for (const action of flow.definition.dataverseActions ?? []) {
        if (action.isUnbound) continue; // handled separately in collectUnboundChainLinks
        const actionTarget = action.targetEntity.toLowerCase();
        if (actionTarget === '[dynamic]' || actionTarget.startsWith('[dynamic')) continue;
        if (actionTarget === sourceEntity) continue; // skip self-referential writes
        if (!['Create', 'Update', 'Delete', 'Action'].includes(action.operation)) continue;

        addEntryPoint(actionTarget, {
          automationType: 'Flow',
          automationName: flow.name,
          automationId: flow.id,
          sourceEntity,
          sourceEntityDisplayName: sourceDisplayName,
          operation: action.operation as 'Create' | 'Update' | 'Delete' | 'Action',
          fields: action.fields ?? [],
          isAsynchronous: true,
          isScheduled: triggerType === 'Scheduled',
          isOnDemand: triggerType === 'Manual',
          confidence: action.confidence,
          ...(action.customActionApiName ? { customActionApiName: action.customActionApiName } : {}),
        });
      }

      // Follow child flow chains for unscoped flows
      if (flow.definition.childFlowIds && flow.definition.childFlowIds.length > 0) {
        this.addChildFlowEntryPoints(
          flow,
          sourceEntity,
          sourceDisplayName,
          flow.definition.childFlowIds,
          allFlowsById,
          new Set([flow.id.toLowerCase()]),
          addEntryPoint
        );
      }
    }

    // Scan classic workflows
    for (const wf of classicWorkflows) {
      if (!wf.xaml || wf.xaml.trim().length === 0) continue;

      const sourceEntity = wf.entity.toLowerCase();
      const sourceDisplayName = entityDisplayMap.get(sourceEntity) || sourceEntity;

      const xamlSteps = ClassicWorkflowXamlParser.parse(wf.xaml);
      for (const step of xamlSteps) {
        const actionTarget = step.targetEntity.toLowerCase();
        if (actionTarget === sourceEntity) continue; // skip self-referential writes

        addEntryPoint(actionTarget, {
          automationType: 'ClassicWorkflow',
          automationName: wf.name,
          automationId: wf.id,
          sourceEntity,
          sourceEntityDisplayName: sourceDisplayName,
          operation: step.operation,
          fields: step.fields,
          isAsynchronous: wf.mode !== 1, // mode 1 = RealTime (sync)
          isScheduled: false,
          isOnDemand: wf.onDemand,
          confidence: step.confidence,
        });
      }
    }

    return result;
  }

  /**
   * Recursively collect entry points from child flows.
   * Uses a callback `addEntryPoint` to write directly into the shared result map.
   */
  private addChildFlowEntryPoints(
    parentFlow: Flow,
    sourceEntity: string,
    sourceDisplayName: string,
    childFlowIds: string[],
    allFlowsById: Map<string, { flow: Flow; sourceEntity: string }>,
    visited: Set<string>,
    addEntryPoint: (targetEntity: string, ep: CrossEntityEntryPoint) => void
  ): void {
    for (const childId of childFlowIds) {
      if (visited.has(childId)) continue; // Prevent cycles
      visited.add(childId);

      const childEntry = allFlowsById.get(childId);
      if (!childEntry) continue;

      const childFlow = childEntry.flow;

      for (const action of childFlow.definition.dataverseActions ?? []) {
        if (action.isUnbound) continue; // unbound actions have no entity target
        const actionTarget = action.targetEntity.toLowerCase();
        if (actionTarget === '[dynamic]' || actionTarget.startsWith('[dynamic')) continue;
        if (actionTarget === sourceEntity) continue; // skip self-referential writes
        if (!['Create', 'Update', 'Delete', 'Action'].includes(action.operation)) continue;

        addEntryPoint(actionTarget, {
          automationType: 'Flow',
          automationName: `${childFlow.name} (via ${parentFlow.name})`,
          automationId: childFlow.id,
          sourceEntity,
          sourceEntityDisplayName: sourceDisplayName,
          operation: action.operation as 'Create' | 'Update' | 'Delete' | 'Action',
          fields: action.fields ?? [],
          isAsynchronous: true,
          isScheduled: false,
          isOnDemand: childFlow.definition.triggerType === 'Manual',
          // Downgrade confidence for child flows (we don't know if parent always calls child)
          confidence: action.confidence === 'High' ? 'Medium' : action.confidence,
          ...(action.customActionApiName ? { customActionApiName: action.customActionApiName } : {}),
        });
      }

      // Recurse into grandchild flows
      if (childFlow.definition.childFlowIds && childFlow.definition.childFlowIds.length > 0) {
        this.addChildFlowEntryPoints(
          childFlow,
          sourceEntity,
          sourceDisplayName,
          childFlow.definition.childFlowIds,
          allFlowsById,
          visited,
          addEntryPoint
        );
      }
    }
  }

  /**
   * Layer 3: Build the activation map for a target entity and entry point.
   * Determines which automations registered on targetEntity will fire
   * given the entry point's operation and fields.
   */
  private buildActivationMap(
    targetBp: EntityBlueprint,
    ep: CrossEntityEntryPoint,
    entityDisplayMap: Map<string, string>,
    cwByEntity: Map<string, ClassicWorkflow[]>
  ): AutomationActivation[] {
    const activations: AutomationActivation[] = [];

    // --- Plugins ---
    for (const plugin of targetBp.plugins) {
      const pluginEntity = plugin.entity?.toLowerCase();
      const targetEntity = targetBp.entity.LogicalName.toLowerCase();
      if (!pluginEntity || pluginEntity !== targetEntity) continue;

      if (!this.messageMatchesOperation(plugin.message, ep.operation)) continue;

      const isAsync = plugin.mode === 1 || plugin.stage === 50;
      const mode: AutomationActivation['mode'] = isAsync ? 'Async' : 'Sync';
      const stageName = this.getStageName(plugin.stage);

      let firingStatus: AutomationActivation['firingStatus'];
      let matchedFields: string[] = [];

      if (ep.operation === 'Create' || ep.operation === 'Delete') {
        firingStatus = 'WillFire';
      } else {
        // Update: check filtering attributes
        if (plugin.filteringAttributes.length === 0) {
          firingStatus = 'WillFireNoFilter';
        } else {
          matchedFields = ep.fields.filter(f =>
            plugin.filteringAttributes.map(a => a.toLowerCase()).includes(f.toLowerCase())
          );
          firingStatus = matchedFields.length > 0 ? 'WillFire' : 'WontFire';
        }
      }

      activations.push({
        automationType: 'Plugin',
        automationId: plugin.id,
        automationName: plugin.name,
        stage: plugin.stage,
        stageName,
        rank: plugin.rank,
        mode,
        firingStatus,
        matchedFields,
        filteringAttributes: plugin.filteringAttributes,
      });
    }

    // --- Flows on target entity ---
    for (const flow of targetBp.flows) {
      if (flow.definition.triggerType !== 'Dataverse') continue;

      const flowTriggerEntity = flow.definition.triggerEntity?.toLowerCase();
      const targetEntity = targetBp.entity.LogicalName.toLowerCase();
      if (flowTriggerEntity && flowTriggerEntity !== targetEntity) continue;

      if (!this.triggerMatchesOperation(flow.definition.triggerEvent, ep.operation)) continue;

      let firingStatus: AutomationActivation['firingStatus'];
      let matchedFields: string[] = [];
      const filteringAttributes: string[] = [];

      if (ep.operation === 'Create' || ep.operation === 'Delete') {
        firingStatus = 'WillFire';
      } else {
        const conditionFields = this.extractFieldsFromTriggerCondition(
          flow.definition.triggerConditions
        );
        if (conditionFields.length === 0) {
          firingStatus = 'WillFireNoFilter';
        } else {
          filteringAttributes.push(...conditionFields);
          matchedFields = ep.fields.filter(f =>
            conditionFields.map(c => c.toLowerCase()).includes(f.toLowerCase())
          );
          firingStatus = matchedFields.length > 0 ? 'WillFire' : 'WontFire';
        }
      }

      const downstream = this.detectDownstreamBranch(
        flow.definition.dataverseActions ?? [],
        targetBp.entity.LogicalName.toLowerCase(),
        entityDisplayMap
      );

      activations.push({
        automationType: 'Flow',
        automationId: flow.id,
        automationName: flow.name,
        mode: 'Async',
        firingStatus,
        matchedFields,
        filteringAttributes,
        ...(downstream ? { downstream } : {}),
      });
    }

    // --- Business Rules (server-scoped only) ---
    // Client-only (form-scoped) BRs are excluded: they run in the browser during form interaction
    // and never fire for server-side API writes from flows or classic workflows.
    for (const br of targetBp.businessRules) {
      const isServer =
        br.definition.executionContext === 'Server' ||
        br.definition.executionContext === 'Both';

      // Business Rules only fire on Create and Update
      if (ep.operation !== 'Create' && ep.operation !== 'Update') continue;

      // Skip client-only (form-scoped) BRs — irrelevant to server-side API writes
      if (!isServer) continue;

      const actionFields = [...br.definition.thenActions, ...br.definition.elseActions]
        .filter(a => a.field)
        .map(a => a.field.toLowerCase());

      const matchedFields =
        ep.fields.length > 0 && actionFields.length > 0
          ? ep.fields.filter(f => actionFields.includes(f))
          : [];

      activations.push({
        automationType: 'BusinessRule',
        automationId: br.id,
        automationName: br.name,
        stageName: 'Server',
        mode: 'Sync',
        firingStatus: 'WillFire',
        matchedFields,
        filteringAttributes: [],
      });
    }

    // --- Classic Workflows on target entity ---
    const targetEntityCWs = cwByEntity.get(targetBp.entity.LogicalName.toLowerCase()) ?? [];
    for (const wf of targetEntityCWs) {
      const matches =
        (ep.operation === 'Create' && wf.triggerOnCreate) ||
        (ep.operation === 'Delete' && wf.triggerOnDelete) ||
        (ep.operation === 'Update' && wf.triggerOnUpdate);
      if (!matches) continue;

      const isSync = wf.mode === 1;
      let firingStatus: AutomationActivation['firingStatus'];
      let matchedFields: string[] = [];

      if (ep.operation === 'Create' || ep.operation === 'Delete') {
        firingStatus = 'WillFire';
      } else if (wf.triggerOnUpdateAttributes.length === 0) {
        firingStatus = 'WillFireNoFilter';
      } else {
        matchedFields = ep.fields.filter(f =>
          wf.triggerOnUpdateAttributes.some(a => a.toLowerCase() === f.toLowerCase())
        );
        firingStatus = matchedFields.length > 0 ? 'WillFire' : 'WontFire';
      }

      activations.push({
        automationType: 'ClassicWorkflow',
        automationId: wf.id,
        automationName: wf.name,
        stageName: isSync ? 'RealTime' : 'Background',
        mode: isSync ? 'Sync' : 'Async',
        firingStatus,
        matchedFields,
        filteringAttributes: wf.triggerOnUpdateAttributes,
      });
    }

    return activations;
  }

  /**
   * Detect a downstream branch from a set of dataverse actions.
   * Returns the first cross-entity write action found.
   */
  private detectDownstreamBranch(
    actions: import('../types/blueprint.js').DataverseAction[],
    sourceEntity: string,
    entityDisplayMap: Map<string, string>
  ): CrossEntityBranch | undefined {
    for (const action of actions) {
      if (action.isUnbound || action.targetEntity === '') continue; // unbound: no entity target
      const target = action.targetEntity.toLowerCase();
      if (target === sourceEntity) continue;
      if (target === '[dynamic]' || target.startsWith('[dynamic')) continue;
      if (!['Create', 'Update', 'Delete', 'Action'].includes(action.operation)) continue;

      const targetDisplayName = entityDisplayMap.get(target) || action.targetEntity;
      return {
        targetEntity: target,
        targetEntityDisplayName: targetDisplayName,
        operation: action.operation as 'Create' | 'Update' | 'Delete' | 'Action',
        fields: action.fields ?? [],
        pipelineRef: target,
      };
    }
    return undefined;
  }

  /**
   * Detect risks for a single trace (entry point + activations)
   */
  private detectTraceRisks(
    ep: CrossEntityEntryPoint,
    activations: AutomationActivation[],
    targetEntityName: string
  ): CrossEntityRisk[] {
    const risks: CrossEntityRisk[] = [];

    if (ep.operation === 'Update') {
      for (const act of activations) {
        if (act.firingStatus === 'WillFireNoFilter' && act.automationType === 'Plugin') {
          risks.push({
            type: 'NoFilterAttributes',
            severity: 'High',
            description: `Plugin "${act.automationName}" has no filtering attributes and will fire on ALL Update operations — potential performance risk.`,
            automationName: act.automationName,
          });
        }
      }
    }

    // Pipeline re-trigger: an activation writes BACK to the entity being traced
    for (const act of activations) {
      if (act.firingStatus !== 'WontFire' && act.downstream?.targetEntity === targetEntityName) {
        risks.push({
          type: 'ReTrigger',
          severity: 'High',
          description: `Re-trigger risk: "${act.automationName}" on ${targetEntityName} writes back to the same entity — risk of an infinite update loop.`,
          automationName: act.automationName,
        });
      }
    }

    // Count downstream branches for fan-out
    const uniqueDownstreamEntities = new Set(
      activations
        .filter(a => a.downstream)
        .map(a => a.downstream!.targetEntity)
    );
    if (uniqueDownstreamEntities.size > 3) {
      risks.push({
        type: 'HighFanOut',
        severity: 'Medium',
        description: `Entry point from "${ep.automationName}" activates ${uniqueDownstreamEntities.size} downstream entities — high fan-out may cause unpredictable behavior.`,
        automationName: ep.automationName,
      });
    }

    // Deep sync chain detection
    const syncDepth = this.countSyncDepth(ep, activations);
    if (syncDepth > 3) {
      risks.push({
        type: 'DeepSyncChain',
        severity: 'High',
        description: `Entry point from "${ep.automationName}" creates a synchronous chain of depth ${syncDepth} — may cause timeouts or transaction failures.`,
        automationName: ep.automationName,
      });
    }

    return risks;
  }

  /**
   * Detect entity-level risks (circular references)
   */
  private detectEntityRisks(
    targetEntity: string,
    traces: CrossEntityTrace[],
    existingViews: Map<string, CrossEntityEntityView>
  ): CrossEntityRisk[] {
    const risks: CrossEntityRisk[] = [];

    for (const trace of traces) {
      const sourceEntity = trace.entryPoint.sourceEntity;
      const sourceView = existingViews.get(sourceEntity);
      if (sourceView) {
        const hasCircularEntryPoint = sourceView.traces.some(
          t => t.entryPoint.sourceEntity === targetEntity
        );
        if (hasCircularEntryPoint) {
          risks.push({
            type: 'CircularReference',
            severity: 'High',
            description: `Circular automation reference detected: "${targetEntity}" and "${sourceEntity}" trigger each other — risk of infinite loops.`,
          });
        }
      }
    }

    return risks;
  }

  /**
   * Count the synchronous chain depth starting from an entry point
   */
  private countSyncDepth(ep: CrossEntityEntryPoint, activations: AutomationActivation[]): number {
    if (ep.isAsynchronous) return 0;

    const syncActivations = activations.filter(
      a => a.mode === 'Sync' && a.firingStatus !== 'WontFire'
    );
    const maxDownstreamDepth = syncActivations.reduce((max, a) => {
      if (a.downstream && !ep.isAsynchronous) return Math.max(max, 2);
      return max;
    }, 0);

    return 1 + maxDownstreamDepth;
  }

  /**
   * Deduplicate risks by type + description
   */
  private deduplicateRisks(risks: CrossEntityRisk[]): CrossEntityRisk[] {
    const seen = new Set<string>();
    return risks.filter(r => {
      const key = `${r.type}:${r.description}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Check if plugin message matches entry point operation
   */
  private messageMatchesOperation(message: string, operation: string): boolean {
    const msg = message.toLowerCase();
    const op = operation.toLowerCase();
    if (op === 'create') return msg === 'create';
    if (op === 'update') return msg === 'update';
    if (op === 'delete') return msg === 'delete';
    // 'Action' (bound custom actions) is intentionally not mapped here: the SDK message
    // name for a custom action is the action's unique name, not 'action'. Matching it
    // would require knowing each action's message name at analysis time. The TracePipeline
    // UI surfaces an informational note to alert users that plugins on the action's
    // message may also fire.
    return false;
  }

  /**
   * Check if flow trigger event matches entry point operation
   */
  private triggerMatchesOperation(triggerEvent: string, operation: string): boolean {
    if (triggerEvent === 'CreateOrUpdate') {
      return operation === 'Create' || operation === 'Update';
    }
    return triggerEvent === operation;
  }

  /**
   * Extract field names from a trigger condition string.
   * Dataverse filter expressions look like: "fieldname eq value AND fieldname2 ne null"
   */
  private extractFieldsFromTriggerCondition(conditions: string | null): string[] {
    if (!conditions) return [];

    const fields: string[] = [];
    const fieldPattern =
      /\b([a-z_][a-z0-9_]*)(?:\s+(?:eq|ne|gt|lt|ge|le|contains|endswith|startswith)|\s*\/)/gi;
    let match: RegExpExecArray | null;
    while ((match = fieldPattern.exec(conditions)) !== null) {
      const field = match[1].toLowerCase();
      if (['and', 'or', 'not', 'true', 'false', 'null', 'any', 'all'].includes(field)) continue;
      if (!fields.includes(field)) fields.push(field);
    }

    return fields;
  }

  /**
   * Get human-readable stage name
   */
  private getStageName(stage: number): string {
    switch (stage) {
      case 10:
        return 'PreValidation';
      case 20:
        return 'PreOperation';
      case 40:
        return 'PostOperation';
      case 50:
        return 'PostOperation (Async)';
      default:
        return `Stage ${stage}`;
    }
  }
}
