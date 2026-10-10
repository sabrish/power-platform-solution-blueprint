/**
 * Synthetic fixtures for CrossEntityAnalyzer tests.
 *
 * ASSUMPTION (unverified): no real flow JSON sample was available when these were
 * written. They assume a Dataverse connector action's `entityName` parameter, and
 * therefore `DataverseAction.targetEntity`, can carry an entity SET name
 * (e.g. "accounts") rather than a logical name (e.g. "account"). Replace or
 * supplement with captured flow definitions once a real sample is verified.
 */
import type { DataverseAction, EntityBlueprint, Flow } from '../types/blueprint.js';

export function makeAction(
  operation: DataverseAction['operation'],
  targetEntity: string,
  fields: string[] = []
): DataverseAction {
  return {
    operation,
    targetEntity,
    actionName: `${operation}_${targetEntity}`,
    confidence: 'High',
    fields,
  };
}

interface FlowOptions {
  id: string;
  name?: string;
  /** Mirrors Flow.entity (the workflow's primaryentity logical name). */
  entity?: string | null;
  triggerType?: Flow['definition']['triggerType'];
  triggerEvent?: Flow['definition']['triggerEvent'];
  triggerEntity?: string | null;
  actions?: DataverseAction[];
  childFlowIds?: string[];
}

export function makeFlow(options: FlowOptions): Flow {
  return {
    id: options.id,
    name: options.name ?? options.id,
    description: null,
    state: 'Active',
    stateCode: 1,
    entity: options.entity ?? null,
    entityDisplayName: null,
    scope: 4,
    scopeName: 'Organization',
    owner: 'Test Owner',
    ownerId: '00000000-0000-0000-0000-000000000000',
    modifiedBy: 'Test Owner',
    modifiedOn: '2026-01-01T00:00:00Z',
    createdOn: '2026-01-01T00:00:00Z',
    definition: {
      triggerType: options.triggerType ?? 'Dataverse',
      triggerEvent: options.triggerEvent ?? 'Update',
      triggerEntity: options.triggerEntity ?? options.entity ?? null,
      triggerConditions: null,
      scopeType: 'Organization',
      actionsCount: options.actions?.length ?? 0,
      externalCalls: [],
      connectionReferences: [],
      dataverseActions: options.actions ?? [],
      ...(options.childFlowIds ? { childFlowIds: options.childFlowIds } : {}),
    },
    hasExternalCalls: false,
  };
}

/**
 * Builds a minimal blueprint. Only the fields CrossEntityAnalyzer reads are
 * populated; the cast documents that this is deliberately a partial fixture.
 */
export function makeBlueprint(
  logicalName: string,
  entitySetName: string,
  flows: Flow[] = []
): EntityBlueprint {
  return {
    entity: {
      LogicalName: logicalName,
      SchemaName: logicalName,
      DisplayName: { UserLocalizedLabel: { Label: `Display ${logicalName}` } },
      EntitySetName: entitySetName,
    },
    plugins: [],
    flows,
    businessRules: [],
    forms: [],
  } as unknown as EntityBlueprint;
}

/** Recursively freezes a value so any accidental mutation throws in strict mode. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
