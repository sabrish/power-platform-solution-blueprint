import type { FlowDefinition, ExternalCall, DataverseAction } from '../types/blueprint.js';
import { debugLog } from '../utils/debugLogger.js';

/**
 * Parses Power Automate flow definitions from clientdata JSON
 *
 * NOTE: Private methods use `data: any` / `action: any` parameters intentionally.
 * Power Automate does not publish a TypeScript schema for flow definitions.
 * Multiple historical connector formats (modern Dataverse connector, legacy CDS connector,
 * OpenApiConnection, direct HTTP) must all be handled. The `any` types reflect this
 * structural ambiguity and are acceptable technical debt for this parser.
 */
export class FlowDefinitionParser {
  /**
   * Parse flow definition from clientdata JSON string
   */
  static parse(clientdata: string | null): FlowDefinition {
    const defaultDefinition: FlowDefinition = {
      triggerType: 'Other',
      triggerEvent: 'Unknown',
      triggerEntity: null,
      triggerConditions: null,
      scopeType: 'Unknown',
      actionsCount: 0,
      externalCalls: [],
      connectionReferences: [],
      dataverseActions: [],
    };

    if (!clientdata) {
      return defaultDefinition;
    }

    try {
      const data = JSON.parse(clientdata);

      // Extract trigger information
      const trigger = this.extractTrigger(data);

      // Extract actions and external calls
      const { actionsCount, externalCalls, connectionReferences } = this.extractActions(data);

      // Extract Dataverse actions
      const dataverseActions = this.extractDataverseActions(data);

      // Extract child flow IDs
      const childFlowIds = this.extractChildFlowIds(data);

      // Extract scope/run as information
      const scopeType = this.extractScopeType(data);

      return {
        triggerType: trigger.type,
        triggerEvent: trigger.event,
        triggerEntity: trigger.entity,
        triggerConditions: trigger.conditions,
        scopeType,
        actionsCount,
        externalCalls,
        connectionReferences,
        dataverseActions,
        ...(childFlowIds.length > 0 ? { childFlowIds } : {}),
      };
    } catch (error) {
      return defaultDefinition;
    }
  }

  /**
   * Extract trigger information from flow definition
   */
  private static extractTrigger(data: any): {
    type: FlowDefinition['triggerType'];
    event: FlowDefinition['triggerEvent'];
    entity: string | null;
    conditions: string | null;
  } {
    const properties = data?.properties;
    const definition = properties?.definition;

    if (!definition || !definition.triggers) {
      return { type: 'Other', event: 'Unknown', entity: null, conditions: null };
    }

    // Get first trigger (flows typically have one trigger)
    const triggerKey = Object.keys(definition.triggers)[0];
    const trigger = definition.triggers[triggerKey];

    if (!trigger) {
      return { type: 'Other', event: 'Unknown', entity: null, conditions: null };
    }

    // Determine trigger type
    let triggerType: FlowDefinition['triggerType'] = 'Other';
    let triggerEvent: FlowDefinition['triggerEvent'] = 'Unknown';
    let triggerEntity: string | null = null;
    let conditions: string | null = null;

    const triggerKind = trigger.type?.toLowerCase() || '';

    // Real PA flows use type "OpenApiConnectionWebhook" (modern) or "ApiConnectionWebhook" (legacy)
    // for connection-based triggers — they never contain "dataverse" in the type string.
    // Detect Dataverse triggers via the connector's apiId in the host block instead.
    const apiId = (trigger.inputs?.host?.apiId || '').toLowerCase();
    const isDataverseTrigger =
      apiId.includes('commondataservice') ||
      // Fallback for older flow formats that do embed type names
      triggerKind.includes('dataverse') ||
      triggerKind.includes('commondataservice');

    if (isDataverseTrigger) {
      triggerType = 'Dataverse';

      // Modern Dataverse connector: event is a numeric message code in parameters
      // 1 = Create, 2 = Delete, 3 = Update, 4 = CreateOrUpdate
      const messageCode = trigger.inputs?.parameters?.['subscriptionRequest/message'];
      if (messageCode !== undefined && messageCode !== null) {
        const code = Number(messageCode);
        if (code === 1) triggerEvent = 'Create';
        else if (code === 2) triggerEvent = 'Delete';
        else if (code === 3) triggerEvent = 'Update';
        else if (code === 4) triggerEvent = 'CreateOrUpdate';
      } else {
        // Legacy connector: infer event from trigger type string
        if (triggerKind.includes('create')) {
          triggerEvent = 'Create';
        } else if (triggerKind.includes('update')) {
          triggerEvent = 'Update';
        } else if (triggerKind.includes('delete')) {
          triggerEvent = 'Delete';
        }
      }

      // Entity extraction — try modern connector path first, then legacy paths
      triggerEntity =
        trigger.inputs?.parameters?.['subscriptionRequest/entityname'] ||
        trigger.inputs?.body?.EntityLogicalName ||
        trigger.inputs?.parameters?.EntityLogicalName ||
        trigger.inputs?.parameters?.entityName ||
        trigger.inputs?.parameters?.entityLogicalName ||
        trigger.metadata?.entityName ||
        null;

      if (triggerEntity === null) {
        debugLog('flow-parse', 'Dataverse trigger — triggerEntity=null (all paths missed)', {
          triggerKind, apiId,
          'parameters': trigger.inputs?.parameters,
          'body': trigger.inputs?.body,
          'metadata': trigger.metadata,
        });
      }

      // Filter conditions — try modern connector path first, then legacy paths
      const filterExpr =
        trigger.inputs?.parameters?.['subscriptionRequest/filterexpression'] ||
        trigger.inputs?.body?.FilterExpression ||
        trigger.inputs?.filterExpression ||
        null;
      if (filterExpr) conditions = String(filterExpr);
    } else if (triggerKind.includes('manual') || triggerKind.includes('request')) {
      triggerType = 'Manual';
      triggerEvent = 'Manual';
    } else if (triggerKind.includes('recurrence') || triggerKind.includes('schedule')) {
      triggerType = 'Scheduled';
      triggerEvent = 'Scheduled';
    } else {
      debugLog('flow-parse', `triggerType=Other (no pattern matched)`, {
        triggerKind, apiId,
        'trigger.type': trigger.type,
        'inputs.host': trigger.inputs?.host,
      });
    }

    return { type: triggerType, event: triggerEvent, entity: triggerEntity, conditions };
  }

  /**
   * Extract actions, external calls, and connection references
   */
  private static extractActions(data: any): {
    actionsCount: number;
    externalCalls: ExternalCall[];
    connectionReferences: string[];
  } {
    const definition = data?.properties?.definition;
    const connectionReferences = new Set<string>();
    const externalCalls: ExternalCall[] = [];
    let actionsCount = 0;

    if (!definition || !definition.actions) {
      return { actionsCount: 0, externalCalls: [], connectionReferences: [] };
    }

    // Recursively count actions and find external calls
    const processAction = (action: any, actionName: string) => {
      actionsCount++;

      // Check for HTTP actions
      if (action.type === 'Http' || action.type === 'OpenApiConnection') {
        const url = this.extractUrl(action);
        if (url) {
          externalCalls.push({
            url,
            domain: this.extractDomain(url),
            method: action.inputs?.method || null,
            actionName,
            confidence: this.determineConfidence(action),
          });
        }
      }

      // Track connection references
      if (action.inputs?.host?.connectionName) {
        connectionReferences.add(action.inputs.host.connectionName);
      }

      // Process nested actions (if any)
      if (action.actions) {
        Object.keys(action.actions).forEach((key) => {
          processAction(action.actions[key], key);
        });
      }
    };

    // Process all top-level actions
    Object.keys(definition.actions).forEach((actionKey) => {
      processAction(definition.actions[actionKey], actionKey);
    });

    return {
      actionsCount,
      externalCalls,
      connectionReferences: Array.from(connectionReferences),
    };
  }

  /**
   * Extract scope/run as type
   */
  private static extractScopeType(data: any): FlowDefinition['scopeType'] {
    const runAs = data?.properties?.runAs;

    if (!runAs) {
      return 'Unknown';
    }

    // Map Dataverse scope values to readable names
    if (runAs === '0' || runAs === 0) {
      return 'User';
    } else if (runAs === '1' || runAs === 1) {
      return 'BusinessUnit';
    } else if (runAs === '2' || runAs === 2) {
      return 'Organization';
    }

    return 'Unknown';
  }

  /**
   * Extract URL from action inputs
   */
  private static extractUrl(action: any): string | null {
    // Direct HTTP action
    if (action.inputs?.uri) {
      return action.inputs.uri;
    }

    // OpenAPI connection with path
    if (action.inputs?.path) {
      return action.inputs.path;
    }

    return null;
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/^(?:https?:\/\/)?([^\/\s:]+)/i);
      return match ? match[1] : 'unknown';
    }
  }

  /**
   * Determine confidence level of external call detection
   */
  private static determineConfidence(action: any): 'High' | 'Medium' | 'Low' {
    // High confidence: Direct HTTP action with explicit URL
    if (action.type === 'Http' && action.inputs?.uri) {
      return 'High';
    }

    // Medium confidence: OpenAPI connection with path
    if (action.type === 'OpenApiConnection' && action.inputs?.path) {
      return 'Medium';
    }

    // Low confidence: Unclear or indirect
    return 'Low';
  }

  /**
   * Extract Dataverse actions (create, update, delete, etc.) from flow definition
   * Used for cross-entity automation mapping
   */
  private static extractDataverseActions(data: any): DataverseAction[] {
    const definition = data?.properties?.definition;
    const dataverseActions: DataverseAction[] = [];

    if (!definition || !definition.actions) {
      return [];
    }

    // Recursively process actions to find Dataverse operations
    const processAction = (action: any, actionName: string) => {
      // Check for Dataverse/CDS actions
      const actionType = action.type?.toLowerCase() || '';

      if (actionType.includes('dataverse') || actionType.includes('commondataservice') ||
          actionType === 'openapiconnection') {

        // Detect operation type
        const operation = this.detectDataverseOperation(action, actionName);
        if (operation) {
          dataverseActions.push(operation);
        }
      }

      // Process nested actions recursively (Condition true branch, Scope, Apply to each, Switch)
      if (action.actions) {
        Object.keys(action.actions).forEach((key) => {
          processAction(action.actions[key], key);
        });
      }

      // Process actions in 'else' branch (Condition false branch)
      if (action.else?.actions) {
        Object.keys(action.else.actions).forEach((key) => {
          processAction(action.else.actions[key], key);
        });
      }

      // Process Switch/Select cases
      if (action.cases) {
        Object.values(action.cases).forEach((c: any) => {
          if (c?.actions) {
            Object.keys(c.actions).forEach((key) => processAction(c.actions[key], key));
          }
        });
      }

      // Process default case of Switch
      if (action.default?.actions) {
        Object.keys(action.default.actions).forEach((key) => {
          processAction(action.default.actions[key], key);
        });
      }
    };

    // Process all top-level actions
    Object.keys(definition.actions).forEach((actionKey) => {
      processAction(definition.actions[actionKey], actionKey);
    });

    return dataverseActions;
  }

  /**
   * Detect Dataverse operation from action
   */
  private static detectDataverseOperation(action: any, actionName: string): DataverseAction | null {
    const inputs = action.inputs;
    if (!inputs) return null;

    // For OpenApiConnection actions the operationId lives in inputs.host.operationId.
    // Older/direct formats put it in inputs.operationId directly. Check both.
    const operationId = (
      inputs.host?.operationId ||
      inputs.operationId ||
      ''
    ).toLowerCase();
    const actionNameLower = actionName.toLowerCase();
    const apiId = (inputs.host?.apiId || '').toLowerCase();

    // If this is an OpenApiConnection, verify it targets a Dataverse/CDS connector.
    // Non-Dataverse connectors (SharePoint, OneDrive, etc.) also use OpenApiConnection
    // and may have similar operation names — skip them early.
    if (action.type?.toLowerCase() === 'openapiconnection') {
      const isDataverseConnector =
        apiId.includes('commondataservice') ||
        apiId.includes('dynamicscrm') ||
        // No apiId → fall through to operationId-based detection (some internal formats)
        apiId === '';
      if (!isDataverseConnector) {
        return null;
      }
    }

    let operation: DataverseAction['operation'] | null = null;
    let targetEntity: string | null = null;
    let confidence: DataverseAction['confidence'] = 'Low';

    // Detect operation type
    if (operationId.includes('createrecord') || actionNameLower.includes('create')) {
      operation = 'Create';
      confidence = 'High';
    } else if (operationId.includes('updaterecord') || actionNameLower.includes('update')) {
      operation = 'Update';
      confidence = 'High';
    } else if (operationId.includes('deleterecord') || actionNameLower.includes('delete')) {
      operation = 'Delete';
      confidence = 'High';
    } else if (operationId.includes('getrecord') || operationId.includes('getitem') || actionNameLower.includes('get')) {
      operation = 'Get';
      confidence = 'Medium';
    } else if (operationId.includes('listrecords') || operationId.includes('listitems') || actionNameLower.includes('list')) {
      operation = 'List';
      confidence = 'Medium';
    } else if (operationId.includes('performboundaction')) {
      // Bound custom action/API targeting a specific entity — cross-entity relationship
      operation = 'Action';
      confidence = 'High';
    } else if (operationId.includes('performunboundaction')) {
      // Unbound custom actions — no entity target; flagged with isUnbound for chain map display
      operation = 'Action';
      confidence = 'Low';
    }

    if (!operation) {
      return null;
    }

    // For Action operations, extract the Dataverse custom action / API unique name
    // (inputs.parameters.actionName holds the action schema name, e.g. "new_SendWelcome")
    let customActionApiName: string | undefined;
    if (operation === 'Action') {
      const rawActionName =
        inputs.parameters?.actionName ||
        inputs.parameters?.Action ||
        inputs.parameters?.action;
      if (rawActionName && typeof rawActionName === 'string' && !this.isDynamicExpression(rawActionName)) {
        customActionApiName = rawActionName;
      }
    }

    // Try to extract target entity
    // Method 1: From entityName parameter
    if (inputs.parameters?.entityName) {
      const rawEntity = String(inputs.parameters.entityName);
      if (this.isDynamicExpression(rawEntity)) {
        targetEntity = '[dynamic]';
        confidence = 'Low';
      } else {
        targetEntity = rawEntity;
        confidence = 'High';
      }
    }
    // Method 2: From entityLogicalName (classic CDS connector)
    else if (inputs.parameters?.entityLogicalName) {
      const rawEntity = String(inputs.parameters.entityLogicalName);
      if (this.isDynamicExpression(rawEntity)) {
        targetEntity = '[dynamic]';
        confidence = 'Low';
      } else {
        targetEntity = rawEntity;
        confidence = 'High';
      }
    }
    // Method 3: From path (OpenAPI style)
    else if (inputs.path) {
      const rawPath = String(inputs.path);
      if (this.isDynamicExpression(rawPath)) {
        targetEntity = '[dynamic]';
        confidence = 'Low';
      } else {
        const pathMatch = rawPath.match(/\/([a-z_]+)\(/i);
        if (pathMatch) {
          targetEntity = pathMatch[1];
          confidence = 'Medium';
        }
      }
    }
    // Method 4: From action name (low confidence)
    else {
      // Try to extract entity from action name like "Create_new_Contact"
      const entityMatch = actionName.match(/_([A-Z][a-z]+)$/);
      if (entityMatch) {
        targetEntity = entityMatch[1].toLowerCase();
        confidence = 'Low';
      }
    }

    if (!targetEntity) {
      // Unbound actions have no entity target.
      // Return with isUnbound flag so the analyzer can create a chain link
      // without treating them as a real entity entry point.
      if (operation === 'Action') {
        return {
          operation,
          targetEntity: '',
          actionName,
          confidence,
          isUnbound: true,
          ...(customActionApiName ? { customActionApiName } : {}),
        };
      }
      return null;
    }

    // Extract fields being set for Create/Update operations
    let fields: string[] = [];
    if (operation === 'Create' || operation === 'Update') {
      // New Dataverse connector: record body is in inputs.parameters.item
      // Classic CDS connector: record body is in inputs.body
      const body = inputs.parameters?.item ?? inputs.body ?? {};
      if (body && typeof body === 'object') {
        fields = Object.keys(body)
          .filter(k => !k.startsWith('@') && k !== 'entityName' && k !== 'entityLogicalName')
          .map(k => k.toLowerCase());
      }
    }

    return {
      operation,
      targetEntity,
      actionName,
      confidence,
      ...(fields.length > 0 ? { fields } : {}),
      ...(customActionApiName ? { customActionApiName } : {}),
    };
  }

  /**
   * Check if a value contains a Power Automate dynamic expression (@{...})
   */
  private static isDynamicExpression(value: string): boolean {
    return typeof value === 'string' && (value.startsWith('@') || value.includes('@{'));
  }

  /**
   * Extract child flow IDs referenced by "Run a Child Flow" or similar actions.
   * Detects:
   * - OpenApiConnection actions with apiId containing 'logicflows'
   * - Actions with operationId containing 'InvokeFlow' or 'Run_Child_Flow'
   * - HTTP actions pointing to flow invoke endpoints
   */
  private static extractChildFlowIds(data: any): string[] {
    const definition = data?.properties?.definition;
    const childFlowIds: string[] = [];

    if (!definition || !definition.actions) {
      return childFlowIds;
    }

    const processAction = (action: any) => {
      const apiId = (action.inputs?.host?.apiId || '').toLowerCase();
      const operationId = (action.inputs?.host?.operationId || action.inputs?.operationId || '').toLowerCase();

      // Detect "Run a Child Flow" connector
      const isChildFlowAction =
        apiId.includes('logicflows') ||
        operationId.includes('invokeflow') ||
        operationId.includes('run_child_flow') ||
        operationId.includes('childflow');

      if (isChildFlowAction) {
        // Extract flow ID from definition path or parameters
        const definitionPath: string =
          action.inputs?.parameters?.definition ||
          action.inputs?.parameters?.flowId ||
          action.inputs?.path ||
          '';
        // Extract GUID from path like /providers/Microsoft.Logic/workflows/{GUID}
        const guidMatch = definitionPath.match(
          /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
        );
        if (guidMatch && !childFlowIds.includes(guidMatch[1].toLowerCase())) {
          childFlowIds.push(guidMatch[1].toLowerCase());
        }
      }

      // Recurse into nested actions
      if (action.actions) {
        Object.values(action.actions).forEach((a: any) => processAction(a));
      }
      if (action.else?.actions) {
        Object.values(action.else.actions).forEach((a: any) => processAction(a));
      }
    };

    Object.values(definition.actions).forEach((action: any) => processAction(action));
    return childFlowIds;
  }
}
