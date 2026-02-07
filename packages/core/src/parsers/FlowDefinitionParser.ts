import type { FlowDefinition, ExternalCall } from '../types/blueprint.js';

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
      };
    } catch (error) {
      console.warn('Failed to parse flow definition:', error);
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
}
