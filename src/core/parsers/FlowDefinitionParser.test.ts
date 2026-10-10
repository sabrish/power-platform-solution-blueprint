/**
 * FlowDefinitionParser characterisation tests for Dataverse action target extraction.
 *
 * ASSUMPTION (unverified): no real flow clientdata sample was available. The JSON below
 * is synthetic and follows the shapes the parser is written to read. In particular it
 * assumes the Dataverse connector's `entityName` parameter may carry an entity SET name
 * (e.g. "accounts"). These tests pin current behaviour; they do not prove the shapes
 * match what Power Automate actually emits.
 */
import { describe, expect, it } from 'vitest';
import type { DataverseAction } from '../types/blueprint.js';
import { FlowDefinitionParser } from './FlowDefinitionParser.js';

const DATAVERSE_API_ID = '/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps';
const SHAREPOINT_API_ID = '/providers/Microsoft.PowerApps/apis/shared_sharepointonline';

function parseActions(actions: Record<string, unknown>): DataverseAction[] {
  const clientdata = JSON.stringify({ properties: { definition: { triggers: {}, actions } } });
  const { dataverseActions } = FlowDefinitionParser.parse(clientdata);
  expect(dataverseActions).toBeDefined();
  return dataverseActions as DataverseAction[];
}

function parseOne(actions: Record<string, unknown>): DataverseAction {
  const result = parseActions(actions);
  expect(result).toHaveLength(1);
  return result[0];
}

function openApiAction(
  operationId: string,
  parameters: Record<string, unknown>,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    type: 'OpenApiConnection',
    inputs: {
      host: { apiId: DATAVERSE_API_ID, connectionName: 'shared_commondataserviceforapps', operationId },
      parameters,
      ...extra,
    },
  };
}

describe('FlowDefinitionParser - Dataverse action target extraction', () => {
  describe('modern Dataverse connector (OpenApiConnection)', () => {
    it('reads the target from the entityName parameter without resolving set names', () => {
      const action = parseOne({
        Step_one: openApiAction('CreateRecord', {
          entityName: 'accounts',
          item: { Name: 'x', '@odata.type': 'Microsoft.Dynamics.CRM.account', Description: 'y' },
        }),
      });

      expect(action).toMatchObject({
        operation: 'Create',
        targetEntity: 'accounts',
        actionName: 'Step_one',
        confidence: 'High',
        fields: ['name', 'description'],
      });
    });

    it('detects Update, Delete, Get and List from the operationId', () => {
      const actions = parseActions({
        Step_a: openApiAction('UpdateRecord', { entityName: 'contacts', item: { Telephone1: '1' } }),
        Step_b: openApiAction('DeleteRecord', { entityName: 'contacts' }),
        Step_c: openApiAction('GetItem', { entityName: 'contacts' }),
        Step_d: openApiAction('ListRecords', { entityName: 'contacts' }),
      });

      expect(actions.map((a) => [a.operation, a.confidence])).toEqual([
        ['Update', 'High'],
        ['Delete', 'High'],
        ['Get', 'High'],
        ['List', 'High'],
      ]);
      expect(actions[0].fields).toEqual(['telephone1']);
      expect(actions[1].fields).toBeUndefined();
    });

    it('prefers entityName over entityLogicalName', () => {
      const action = parseOne({
        Step_one: openApiAction('CreateRecord', { entityName: 'accounts', entityLogicalName: 'contact' }),
      });

      expect(action.targetEntity).toBe('accounts');
    });

    it('reads entityLogicalName when entityName is absent', () => {
      const action = parseOne({
        Step_one: openApiAction('CreateRecord', { entityLogicalName: 'account' }),
      });

      expect(action).toMatchObject({ targetEntity: 'account', confidence: 'High' });
    });

    it('flags a dynamic entityName expression as [dynamic] with low confidence', () => {
      const action = parseOne({
        Step_one: openApiAction('CreateRecord', { entityName: "@{triggerOutputs()?['body/entity']}" }),
      });

      expect(action).toMatchObject({ targetEntity: '[dynamic]', confidence: 'Low' });
    });

    it('reads the target from an OpenAPI-style path with medium confidence', () => {
      const action = parseOne({
        Step_one: openApiAction('UpdateRecord', {}, { path: '/accounts(11111111-1111-1111-1111-111111111111)' }),
      });

      expect(action).toMatchObject({ operation: 'Update', targetEntity: 'accounts', confidence: 'Medium' });
    });

    it('flags a dynamic path as [dynamic] with low confidence', () => {
      const action = parseOne({
        Step_one: openApiAction('UpdateRecord', {}, { path: "@{concat('/', variables('name'), '(1)')}" }),
      });

      expect(action).toMatchObject({ targetEntity: '[dynamic]', confidence: 'Low' });
    });

    it('falls back to the action name suffix with low confidence', () => {
      const action = parseOne({
        Create_new_Contact: openApiAction('CreateRecord', {}),
      });

      expect(action).toMatchObject({ operation: 'Create', targetEntity: 'contact', confidence: 'Low' });
    });

    it('drops an action whose target cannot be determined', () => {
      expect(parseActions({ Step_one: openApiAction('CreateRecord', {}) })).toEqual([]);
    });

    it('reads the operationId from inputs.operationId when host.operationId is missing', () => {
      const action = parseOne({
        Step_one: {
          type: 'OpenApiConnection',
          inputs: { host: { apiId: DATAVERSE_API_ID }, operationId: 'DeleteRecord', parameters: { entityName: 'accounts' } },
        },
      });

      expect(action.operation).toBe('Delete');
    });

    it('accepts an OpenApiConnection without an apiId', () => {
      const action = parseOne({
        Step_one: {
          type: 'OpenApiConnection',
          inputs: { host: { operationId: 'CreateRecord' }, parameters: { entityName: 'accounts' } },
        },
      });

      expect(action.targetEntity).toBe('accounts');
    });

    it('ignores OpenApiConnection actions for non-Dataverse connectors', () => {
      const actions = parseActions({
        Step_one: {
          type: 'OpenApiConnection',
          inputs: { host: { apiId: SHAREPOINT_API_ID, operationId: 'CreateRecord' }, parameters: { entityName: 'accounts' } },
        },
      });

      expect(actions).toEqual([]);
    });
  });

  describe('legacy CDS connector', () => {
    it('reads entityLogicalName and the record body from inputs.body', () => {
      const action = parseOne({
        Step_one: {
          type: 'CommonDataService',
          inputs: {
            operationId: 'CreateRecord',
            parameters: { entityLogicalName: 'account' },
            body: { Name: 'x', '@odata.type': 'Microsoft.Dynamics.CRM.account', entityName: 'ignored' },
          },
        },
      });

      expect(action).toMatchObject({
        operation: 'Create',
        targetEntity: 'account',
        confidence: 'High',
        fields: ['name'],
      });
    });
  });

  describe('custom actions', () => {
    it('captures the target and API name of a bound action', () => {
      const action = parseOne({
        Run_custom_action: openApiAction('PerformBoundAction', {
          entityName: 'accounts',
          actionName: 'new_Recalculate',
        }),
      });

      expect(action).toMatchObject({
        operation: 'Action',
        targetEntity: 'accounts',
        confidence: 'High',
        customActionApiName: 'new_Recalculate',
      });
      expect(action.isUnbound).toBeUndefined();
    });

    it('marks an unbound action with an empty target', () => {
      const action = parseOne({
        Run_custom_action: openApiAction('PerformUnboundAction', { actionName: 'new_DoThing' }),
      });

      expect(action).toMatchObject({
        operation: 'Action',
        targetEntity: '',
        confidence: 'Low',
        isUnbound: true,
        customActionApiName: 'new_DoThing',
      });
    });

    it('omits customActionApiName when the action name is a dynamic expression', () => {
      const action = parseOne({
        Run_custom_action: openApiAction('PerformBoundAction', {
          entityName: 'accounts',
          actionName: "@{variables('name')}",
        }),
      });

      expect(action.customActionApiName).toBeUndefined();
    });
  });

  describe('nesting', () => {
    it('finds actions inside conditions, else branches, switch cases and scopes', () => {
      const create = (entity: string): Record<string, unknown> =>
        openApiAction('CreateRecord', { entityName: entity });
      const actions = parseActions({
        Branch_one: {
          type: 'If',
          actions: { Inner_one: create('accounts') },
          else: { actions: { Inner_two: create('contacts') } },
        },
        Switch_one: {
          type: 'Switch',
          cases: { Case_one: { actions: { Inner_three: create('leads') } } },
          default: { actions: { Inner_four: create('tasks') } },
        },
        Scope_one: { type: 'Scope', actions: { Inner_five: create('notes') } },
      });

      expect(actions.map((a) => a.targetEntity).sort()).toEqual(['accounts', 'contacts', 'leads', 'notes', 'tasks']);
    });
  });

  describe('defaults', () => {
    it('returns no Dataverse actions for empty, invalid or action-less input', () => {
      expect(FlowDefinitionParser.parse(null).dataverseActions).toEqual([]);
      expect(FlowDefinitionParser.parse('not json').dataverseActions).toEqual([]);
      expect(FlowDefinitionParser.parse(JSON.stringify({ properties: { definition: {} } })).dataverseActions).toEqual([]);
    });
  });
});
