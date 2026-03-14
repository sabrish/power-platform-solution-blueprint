import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { BusinessProcessFlow } from '../types/businessProcessFlow.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import type { IDiscoverer } from './IDiscoverer.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid, normalizeBatch } from '../utils/guid.js';

interface RawBusinessProcessFlow {
  workflowid: string;
  name: string;
  description: string | null;
  category: number;
  uniquename: string;
  primaryentity: string;
  statecode: number;
  ismanaged: boolean;
  createdon: string;
  modifiedon: string;
  clientdata?: string | null;
  _ownerid_value?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_primaryentity_value@OData.Community.Display.V1.FormattedValue'?: string;
}

interface RawProcessStageParam {
  processstageparameterid: string;
  name: string;
  value: string | null;
}

/**
 * Raw processstage record.
 * Schema: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/processstage
 *
 * processstage records can be:
 *  - Top-level stage  (_processid_value set, no _parentprocessstageid_value)
 *  - Child step record (_parentprocessstageid_value set to parent stage ID)
 *    In this case, parametername holds the step/field logical name.
 *
 * processstage.clientdata = "Step metadata for process stage" (JSON, read-only).
 * processstage_processstageparameter = expanded collection of related processstageparameter records.
 */
interface RawProcessStage {
  processstageid: string;
  stagename: string;
  primaryentitytypecode: string;
  parametername?: string | null;
  parametervalue?: string | null;
  clientdata?: string | null;
  '_processid_value'?: string;
  '_parentprocessstageid_value'?: string;
  // Expanded processstageparameter records (via $expand)
  processstage_processstageparameter?: RawProcessStageParam[];
}

export class BusinessProcessFlowDiscovery implements IDiscoverer<BusinessProcessFlow> {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;
  private logger?: FetchLogger;

  constructor(
    client: IDataverseClient,
    onProgress?: (current: number, total: number) => void,
    logger?: FetchLogger
  ) {
    this.client = client;
    this.onProgress = onProgress;
    this.logger = logger;
  }

  discoverByIds(ids: string[]): Promise<BusinessProcessFlow[]> {
    return this.getBusinessProcessFlowsByIds(ids);
  }

  async getBusinessProcessFlowsByIds(workflowIds: string[]): Promise<BusinessProcessFlow[]> {
    if (workflowIds.length === 0) return [];

    try {
      // Pass 1 — fetch BPF workflow records
      const { results: allResults } = await withAdaptiveBatch<string, RawBusinessProcessFlow>(
        workflowIds,
        async (batch) => {
          const filter = `(${buildOrFilter(batch, 'workflowid', { guids: true })}) and category eq 4`;
          const result = await this.client.query<RawBusinessProcessFlow>('workflows', {
            select: [
              'workflowid', 'name', 'description', 'category', 'uniquename',
              'primaryentity', 'statecode', 'ismanaged', 'createdon', 'modifiedon',
              'clientdata', '_ownerid_value', '_modifiedby_value',
            ],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'BPF Discovery',
          entitySet: 'workflows (BPF)',
          logger: this.logger,
          onProgress: (done, total) => this.onProgress?.(done, total),
        }
      );

      const stagesByBpfId = await this.fetchStages(allResults);
      const allStages = [...stagesByBpfId.values()].flat();
      const stepsByStageId = await this.fetchStepsByStageIds(allStages);

      return allResults.map(raw => this.mapToBusinessProcessFlow(raw, stagesByBpfId, stepsByStageId));
    } catch (error) {
      throw new Error(
        `Failed to retrieve Business Process Flows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch top-level process stages for all BPFs in a single batched query.
   * Also attempts $expand on processstageparameter and selects clientdata.
   */
  private async fetchStages(
    bpfs: RawBusinessProcessFlow[]
  ): Promise<Map<string, RawProcessStage[]>> {
    const stagesByBpfId = new Map<string, RawProcessStage[]>();
    if (bpfs.length === 0) return stagesByBpfId;

    const bpfIds = bpfs.map(b => b.workflowid);
    const idToName = new Map(bpfs.map(b => [normalizeGuid(b.workflowid), b.name]));

    try {
      const { results: allStages } = await withAdaptiveBatch<string, RawProcessStage>(
        bpfIds,
        async (batch) => {
          const stageFilter = buildOrFilter(
            normalizeBatch(batch),
            '_processid_value',
            { guids: true }
          );
          try {
            const result = await this.client.query<RawProcessStage>('processstages', {
              select: [
                'processstageid', 'stagename', 'primaryentitytypecode',
                'parametername', 'clientdata',
                '_processid_value', '_parentprocessstageid_value',
              ],
              filter: stageFilter,
              expand: 'processstage_processstageparameter($select=processstageparameterid,name,value)',
            });
            return result.value;
          } catch {
            // Fallback without $expand
            const result = await this.client.query<RawProcessStage>('processstages', {
              select: [
                'processstageid', 'stagename', 'primaryentitytypecode',
                'parametername', 'clientdata',
                '_processid_value', '_parentprocessstageid_value',
              ],
              filter: stageFilter,
            });
            return result.value;
          }
        },
        {
          initialBatchSize: 20,
          step: 'BPF Discovery',
          entitySet: 'processstages (stages)',
          logger: this.logger,
          getBatchLabel: (batch) => batch.map(id => idToName.get(normalizeGuid(id)) ?? id).join(', '),
        }
      );

      // Group top-level stages (no parent) by process ID
      for (const record of allStages) {
        const parentId = normalizeGuid(record['_parentprocessstageid_value'] || '');
        if (parentId) continue;
        const processId = normalizeGuid(record['_processid_value'] || '');
        if (!stagesByBpfId.has(processId)) stagesByBpfId.set(processId, []);
        stagesByBpfId.get(processId)!.push(record);
      }
    } catch {
      // Return empty map on total failure — BPF will show 0 stages
    }

    return stagesByBpfId;
  }

  /**
   * Fetch child processstage records where _parentprocessstageid_value = stageId.
   * These are the data step records with parametername = field logical name.
   */
  private async fetchStepsByStageIds(
    stages: RawProcessStage[]
  ): Promise<Map<string, RawProcessStage[]>> {
    const stepsByStageId = new Map<string, RawProcessStage[]>();
    if (stages.length === 0) return stepsByStageId;

    const stageIds = stages.map(s => s.processstageid);
    const idToName = new Map(stages.map(s => [normalizeGuid(s.processstageid), s.stagename]));

    try {
      const { results: allSteps } = await withAdaptiveBatch<string, RawProcessStage>(
        stageIds,
        async (batch) => {
          const stepFilter = buildOrFilter(
            normalizeBatch(batch),
            '_parentprocessstageid_value',
            { guids: true }
          );
          const result = await this.client.query<RawProcessStage>('processstages', {
            select: [
              'processstageid', 'stagename', 'parametername', 'parametervalue',
              '_parentprocessstageid_value',
            ],
            filter: stepFilter,
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'BPF Discovery',
          entitySet: 'processstages (steps)',
          logger: this.logger,
          getBatchLabel: (batch) => batch.map(id => idToName.get(normalizeGuid(id)) ?? id).join(', '),
        }
      );

      for (const step of allSteps) {
        const parentId = normalizeGuid(step['_parentprocessstageid_value'] || '');
        if (!parentId) continue;
        if (!stepsByStageId.has(parentId)) stepsByStageId.set(parentId, []);
        stepsByStageId.get(parentId)!.push(step);
      }
    } catch {
      // Return empty map on total failure
    }

    return stepsByStageId;
  }

  /**
   * Extract ordered stage IDs from workflow clientdata.
   * The clientdata is a nested WorkflowStep structure where each StageStep
   * object has a "stageId" property. Collecting them in traversal order
   * gives the correct BPF stage sequence.
   */
  private parseStageOrder(clientdata: string | null | undefined): string[] {
    if (!clientdata) return [];
    try {
      const data = JSON.parse(clientdata);
      const stageIds: string[] = [];

      const walk = (obj: unknown): void => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          for (const item of obj) walk(item);
          return;
        }
        const record = obj as Record<string, unknown>;
        if (
          typeof record['__class'] === 'string' &&
          record['__class'].startsWith('StageStep:') &&
          record['stageId']
        ) {
          const id = normalizeGuid(String(record['stageId']));
          if (!stageIds.includes(id)) stageIds.push(id);
        }
        for (const val of Object.values(record)) walk(val);
      };

      walk(data);
      return stageIds;
    } catch {
      return [];
    }
  }

  private parseClientDataSteps(
    clientdata: string | null | undefined
  ): Array<{ displayName: string; fieldName: string; required: boolean }> {
    if (!clientdata) return [];
    try {
      const data = JSON.parse(clientdata);
      // Actual Dataverse format: top-level array of
      // { DisplayName, Type, Field: { AttributeName, IsRequired } }
      if (Array.isArray(data)) {
        return (data as Record<string, unknown>[])
          .filter(item => item['Type'] === 'Field' && item['Field'])
          .map(item => {
            const field = item['Field'] as Record<string, unknown>;
            return {
              displayName: String(item['DisplayName'] || ''),
              fieldName: String(field['AttributeName'] || ''),
              required: Boolean(field['IsRequired']),
            };
          })
          .filter(s => s.fieldName);
      }
      // Legacy nested formats
      if (Array.isArray((data as Record<string, unknown>)?.steps)) {
        return ((data as Record<string, unknown>).steps as Record<string, unknown>[]).map(s => ({
          displayName: String(s['displayName'] || s['name'] || ''),
          fieldName: String(s['dataFieldName'] || s['fieldName'] || s['name'] || ''),
          required: Boolean(s['required'] || s['isRequired']),
        })).filter(s => s.fieldName);
      }
      if (Array.isArray((data as Record<string, unknown>)?.fields)) {
        return ((data as Record<string, unknown>).fields as Record<string, unknown>[]).map(f => ({
          displayName: String(f['displayName'] || f['name'] || ''),
          fieldName: String(f['logicalName'] || f['name'] || ''),
          required: false,
        })).filter(s => s.fieldName);
      }
    } catch {
      // not valid JSON
    }
    return [];
  }

  private mapToBusinessProcessFlow(
    raw: RawBusinessProcessFlow,
    stagesByBpfId: Map<string, RawProcessStage[]>,
    stepsByStageId: Map<string, RawProcessStage[]>
  ): BusinessProcessFlow {
    const bpfId = normalizeGuid(raw.workflowid);
    const rawStages = stagesByBpfId.get(bpfId) || [];

    // Sort stages by the order defined in workflow clientdata.
    const stageOrder = this.parseStageOrder(raw.clientdata);
    if (stageOrder.length > 0) {
      rawStages.sort((a, b) => {
        const aIdx = stageOrder.indexOf(normalizeGuid(a.processstageid));
        const bIdx = stageOrder.indexOf(normalizeGuid(b.processstageid));
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    }

    const stages = rawStages.map((s, index) => {
      const stageId = normalizeGuid(s.processstageid);

      // Source 1: expanded processstageparameter records
      const expandedParams = s.processstage_processstageparameter || [];
      let steps = expandedParams.map((p, stepIdx) => ({
        id: p.processstageparameterid,
        name: p.name,
        fieldName: p.name,
        required: false,
        order: stepIdx,
      }));

      // Source 2: child processstage records (separate query)
      if (steps.length === 0) {
        const rawSteps = stepsByStageId.get(stageId) || [];
        steps = rawSteps.map((p, stepIdx) => ({
          id: p.processstageid,
          name: p.parametername || p.stagename || `Step ${stepIdx + 1}`,
          fieldName: p.parametername || '',
          required: false,
          order: stepIdx,
        }));
      }

      // Source 3: clientdata JSON on the stage
      if (steps.length === 0 && s.clientdata) {
        const parsedSteps = this.parseClientDataSteps(s.clientdata);
        steps = parsedSteps.map((parsed, stepIdx) => ({
          id: `${stageId}_step_${stepIdx}`,
          name: parsed.displayName || parsed.fieldName,
          fieldName: parsed.fieldName,
          required: parsed.required,
          order: stepIdx,
        }));
      }

      return { id: s.processstageid, name: s.stagename, entity: s.primaryentitytypecode, order: index, steps };
    });

    const entities = [...new Set(stages.map(s => s.entity))];
    const totalSteps = stages.reduce((sum, s) => sum + s.steps.length, 0);

    return {
      id: raw.workflowid,
      name: raw.name,
      description: raw.description,
      primaryEntity: raw.primaryentity,
      primaryEntityDisplayName: raw['_primaryentity_value@OData.Community.Display.V1.FormattedValue'] || null,
      state: this.getStateName(raw.statecode),
      stateCode: raw.statecode,
      isManaged: raw.ismanaged,
      uniqueName: raw.uniquename,
      xaml: '',
      definition: { stages, entities, totalSteps, crossEntityFlow: entities.length > 1 },
      owner: raw['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      ownerId: raw._ownerid_value || '',
      modifiedBy: raw['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  private getStateName(statecode: number): 'Draft' | 'Active' {
    switch (statecode) {
      case 0: return 'Draft';
      case 1: return 'Active';
      default: return 'Draft';
    }
  }
}
