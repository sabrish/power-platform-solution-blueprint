import type { FlowDefinition, ExternalCall, DataverseAction } from '../types/blueprint.js';

/**
 * Parses Power Automate flow definitions from clientdata JSON
 */
export class FlowDefinitionParser {
  /**
   * Parse flow definition from clientdata JSON string
   */
  static parse(clientdata: string | null): FlowDefinition {
    const defaultDefinition: FlowDefinition = {
      triggerType: 'Other',
      triggerEvent: 'Unknown',
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

      // Extract scope/run as information
      const scopeType = this.extractScopeType(data);

      return {
        triggerType: trigger.type,
        triggerEvent: trigger.event,
        triggerConditions: trigger.conditions,
        scopeType,
        actionsCount,
        externalCalls,
        connectionReferences,
        dataverseActions,
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
    conditions: string | null;
  } {
    const properties = data?.properties;
    const definition = properties?.definition;

    if (!definition || !definition.triggers) {
      return { type: 'Other', event: 'Unknown', conditions: null };
    }

    // Get first trigger (flows typically have one trigger)
    const triggerKey = Object.keys(definition.triggers)[0];
    const trigger = definition.triggers[triggerKey];

    if (!trigger) {
      return { type: 'Other', event: 'Unknown', conditions: null };
    }

    // Determine trigger type
    let triggerType: FlowDefinition['triggerType'] = 'Other';
    let triggerEvent: FlowDefinition['triggerEvent'] = 'Unknown';
    let conditions: string | null = null;

    const triggerKind = trigger.type?.toLowerCase() || '';

    // Check for Dataverse triggers
    if (triggerKind.includes('dataverse') || triggerKind.includes('commondataservice')) {
      triggerType = 'Dataverse';

      // Determine event type from trigger
      if (triggerKind.includes('create')) {
        triggerEvent = trigger.inputs?.message === 'Update' ? 'CreateOrUpdate' : 'Create';
      } else if (triggerKind.includes('update')) {
        triggerEvent = 'Update';
      } else if (triggerKind.includes('delete')) {
        triggerEvent = 'Delete';
      }

      // Extract filter conditions
      if (trigger.inputs?.filterExpression) {
        conditions = trigger.inputs.filterExpression;
      }
    } else if (triggerKind.includes('manual') || triggerKind.includes('request')) {
      triggerType = 'Manual';
      triggerEvent = 'Manual';
    } else if (triggerKind.includes('recurrence') || triggerKind.includes('schedule')) {
      triggerType = 'Scheduled';
      triggerEvent = 'Scheduled';
    }

    return { type: triggerType, event: triggerEvent, conditions };
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
          actionType === 'openApiConnection') {

        // Detect operation type
        const operation = this.detectDataverseOperation(action, actionName);
        if (operation) {
          dataverseActions.push(operation);
        }
      }

      // Process nested actions recursively
      if (action.actions) {
        Object.keys(action.actions).forEach((key) => {
          processAction(action.actions[key], key);
        });
      }

      // Process actions in 'else' branch (for conditions)
      if (action.else?.actions) {
        Object.keys(action.else.actions).forEach((key) => {
          processAction(action.else.actions[key], key);
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

    // Try to detect operation from action metadata
    const operationId = inputs.operationId?.toLowerCase() || '';
    const actionNameLower = actionName.toLowerCase();

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
    }

    if (!operation) {
      return null;
    }

    // Try to extract target entity
    // Method 1: From entityName parameter
    if (inputs.parameters?.entityName) {
      targetEntity = inputs.parameters.entityName;
      confidence = 'High';
    }
    // Method 2: From entityLogicalName (classic CDS connector)
    else if (inputs.parameters?.entityLogicalName) {
      targetEntity = inputs.parameters.entityLogicalName;
      confidence = 'High';
    }
    // Method 3: From path (OpenAPI style)
    else if (inputs.path) {
      const pathMatch = inputs.path.match(/\/([a-z_]+)\(/i);
      if (pathMatch) {
        targetEntity = pathMatch[1];
        confidence = 'Medium';
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
      return null;
    }

    return {
      operation,
      targetEntity,
      actionName,
      confidence,
    };
  }
}
