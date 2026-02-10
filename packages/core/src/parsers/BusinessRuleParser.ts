import type { BusinessRuleDefinition, Condition, Action } from '../types/blueprint.js';

/**
 * Parser for Business Rule XAML
 */
export class BusinessRuleParser {
  /**
   * Parse business rule XAML to extract conditions and actions
   */
  static parse(xaml: string | null): BusinessRuleDefinition {
    if (!xaml || xaml.trim() === '') {
      return {
        conditions: [],
        actions: [],
        executionContext: 'Client',
        conditionLogic: 'No conditions defined',
      };
    }

    try {
      const conditions = this.parseConditions(xaml);
      const actions = this.parseActions(xaml);
      const executionContext = this.determineExecutionContext(actions);
      const conditionLogic = this.buildConditionLogic(conditions);

      return {
        conditions,
        actions,
        executionContext,
        conditionLogic,
      };
    } catch (error) {
      return {
        conditions: [],
        actions: [],
        executionContext: 'Client',
        conditionLogic: 'Unable to parse conditions',
        parseError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse conditions from XAML
   */
  private static parseConditions(xaml: string): Condition[] {
    const conditions: Condition[] = [];

    // Simple regex-based parsing (could use XML parser for production)
    const conditionPattern = /<condition[^>]*attribute="([^"]*)"[^>]*operator="([^"]*)"[^>]*>[\s\S]*?<value[^>]*>([^<]*)<\/value>/gi;
    let match;

    while ((match = conditionPattern.exec(xaml)) !== null) {
      const [, field, operator, value] = match;

      // Determine logic operator from parent tags
      const logicOperator = this.getLogicOperator(xaml, match.index);

      conditions.push({
        field: field || 'unknown',
        operator: this.getOperatorDisplayName(operator || 'eq'),
        value: value || '',
        logicOperator,
      });
    }

    return conditions;
  }

  /**
   * Parse actions from XAML
   */
  private static parseActions(xaml: string): Action[] {
    const actions: Action[] = [];

    // Parse action tags
    const actionPattern = /<action[^>]*actiontype="([^"]*)"[^>]*>[\s\S]*?<\/action>/gi;
    let match;

    while ((match = actionPattern.exec(xaml)) !== null) {
      const [fullMatch, actionType] = match;

      // Extract parameters from this action
      const field = this.extractParameter(fullMatch, 'field');
      const value = this.extractParameter(fullMatch, 'value');
      const message = this.extractParameter(fullMatch, 'message');

      const type = this.getActionType(actionType);

      actions.push({
        type,
        field: field || 'unknown',
        value: value || undefined,
        message: message || undefined,
      });
    }

    return actions;
  }

  /**
   * Determine execution context based on actions
   */
  private static determineExecutionContext(actions: Action[]): 'Client' | 'Server' | 'Both' {
    let hasClientActions = false;
    let hasServerActions = false;

    for (const action of actions) {
      // Client-side actions affect UI
      if (['ShowField', 'HideField', 'LockField', 'UnlockField'].includes(action.type)) {
        hasClientActions = true;
      }

      // Server-side actions set data or validate
      if (['SetValue', 'SetRequired', 'ShowError'].includes(action.type)) {
        hasServerActions = true;
      }
    }

    if (hasClientActions && hasServerActions) {
      return 'Both';
    } else if (hasServerActions) {
      return 'Server';
    }
    return 'Client';
  }

  /**
   * Build human-readable condition logic
   */
  private static buildConditionLogic(conditions: Condition[]): string {
    if (conditions.length === 0) {
      return 'No conditions defined';
    }

    if (conditions.length === 1) {
      const c = conditions[0];
      return `IF ${c.field} ${c.operator} '${c.value}'`;
    }

    // Build multi-condition logic
    let logic = 'IF ';
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      if (i > 0) {
        logic += ` ${c.logicOperator} `;
      }
      logic += `${c.field} ${c.operator} '${c.value}'`;
    }

    return logic;
  }

  /**
   * Get logic operator from XML structure
   */
  private static getLogicOperator(xaml: string, position: number): 'AND' | 'OR' {
    const before = xaml.substring(Math.max(0, position - 200), position);
    if (before.includes('<or>')) {
      return 'OR';
    }
    return 'AND';
  }

  /**
   * Get display name for operator
   */
  private static getOperatorDisplayName(operator: string): string {
    const operators: Record<string, string> = {
      'eq': 'equals',
      'ne': 'not equals',
      'gt': 'greater than',
      'ge': 'greater than or equals',
      'lt': 'less than',
      'le': 'less than or equals',
      'contains': 'contains',
      'not-contains': 'does not contain',
      'begins-with': 'begins with',
      'ends-with': 'ends with',
    };

    return operators[operator] || operator;
  }

  /**
   * Get action type from XAML actiontype attribute
   */
  private static getActionType(actionType: string): Action['type'] {
    const typeMap: Record<string, Action['type']> = {
      'show': 'ShowField',
      'hide': 'HideField',
      'setvalue': 'SetValue',
      'setrequired': 'SetRequired',
      'lock': 'LockField',
      'unlock': 'UnlockField',
      'showerror': 'ShowError',
    };

    return typeMap[actionType.toLowerCase()] || 'SetValue';
  }

  /**
   * Extract parameter value from action XML
   */
  private static extractParameter(actionXml: string, paramName: string): string | null {
    const pattern = new RegExp(`<parameter[^>]*name="${paramName}"[^>]*>([^<]*)<\/parameter>`, 'i');
    const match = pattern.exec(actionXml);
    return match ? match[1] : null;
  }
}
