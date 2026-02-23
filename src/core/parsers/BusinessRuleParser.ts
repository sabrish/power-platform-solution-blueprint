import type { BusinessRuleDefinition, Condition, Action } from '../types/blueprint.js';

/**
 * Parser for Business Rule definitions.
 * Modern business rules store their definition in clientdata (JSON).
 * XAML is kept as a fallback for older records.
 */
export class BusinessRuleParser {
  /**
   * Parse business rule — tries clientdata (JSON) first, then XAML
   */
  static parse(xaml: string | null, clientdata: string | null = null): BusinessRuleDefinition {
    // Try JSON (clientdata) first — modern business rules store their definition here
    if (clientdata && clientdata.trim()) {
      try {
        const json = JSON.parse(clientdata) as Record<string, unknown>;
        const result = this.parseJson(json);
        if (result.conditions.length > 0 || result.actions.length > 0) {
          return result;
        }
      } catch {
        // Fall through to XAML
      }
    }

    // Fall back to XAML
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

      return { conditions, actions, executionContext, conditionLogic };
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

  // ---------------------------------------------------------------------------
  // JSON (clientdata) parsing
  // ---------------------------------------------------------------------------

  private static parseJson(json: Record<string, unknown>): BusinessRuleDefinition {
    const rawConditions = this.findArray(json, ['conditions', 'ruleConditions']) as Record<string, unknown>[];
    const rawActions = this.findArray(json, ['actions', 'ruleActions']) as Record<string, unknown>[];

    const conditions: Condition[] = rawConditions.map(c => ({
      field: String(c.attributeName ?? c.field ?? c.attribute ?? 'unknown'),
      operator: this.normalizeJsonOperator(String(c.operatorCode ?? c.operator ?? 'eq')),
      value: this.extractJsonValue(c.value ?? c.valueExpression),
      logicOperator: 'AND' as const,
    }));

    // Apply combinator to conditions after the first
    const combinatorRaw = String(json.conditionsCombinator ?? json.conditionCombinator ?? 'And');
    const isOr = combinatorRaw.toLowerCase() === 'or';
    for (let i = 1; i < conditions.length; i++) {
      conditions[i].logicOperator = isOr ? 'OR' : 'AND';
    }

    const actions: Action[] = rawActions.map(a => {
      const actionType = String(a.type ?? a.actionType ?? '');
      const value = this.extractJsonValue(a.value);
      return {
        type: this.mapJsonActionType(actionType, value),
        field: String(a.attributeName ?? a.field ?? 'unknown'),
        value: value || undefined,
        message: a.message ? String(a.message) : undefined,
      };
    });

    const executionContext = this.determineExecutionContext(actions);
    const conditionLogic = this.buildConditionLogic(conditions);

    return { conditions, actions, executionContext, conditionLogic };
  }

  /** Recursively search obj for an array under any of the given keys */
  private static findArray(obj: Record<string, unknown>, keys: string[]): unknown[] {
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    // One level of nesting
    for (const val of Object.values(obj)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const nested = val as Record<string, unknown>;
        for (const key of keys) {
          if (Array.isArray(nested[key])) return nested[key] as unknown[];
        }
      }
    }
    return [];
  }

  /** Extract a scalar string from various value shapes */
  private static extractJsonValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') {
      const o = val as Record<string, unknown>;
      const inner = o.value ?? o.Value ?? o.param ?? o.stringValue ?? '';
      return String(inner);
    }
    return String(val);
  }

  private static normalizeJsonOperator(op: string): string {
    const opMap: Record<string, string> = {
      Equal: 'equals',
      NotEqual: 'not equals',
      GreaterThan: 'greater than',
      GreaterThanOrEqualTo: 'greater than or equals',
      LessThan: 'less than',
      LessThanOrEqualTo: 'less than or equals',
      Contains: 'contains',
      DoesNotContain: 'does not contain',
      BeginsWith: 'begins with',
      EndsWith: 'ends with',
      IsNull: 'is null',
      IsNotNull: 'is not null',
    };
    return opMap[op] ?? this.getOperatorDisplayName(op);
  }

  private static mapJsonActionType(actionType: string, value: string): Action['type'] {
    const lower = actionType.toLowerCase();
    // Visibility/disabled actions depend on the value
    if (lower === 'setattributevisibility') {
      return value === 'false' || value === '0' ? 'HideField' : 'ShowField';
    }
    if (lower === 'setattributedisabled') {
      return value === 'false' || value === '0' ? 'UnlockField' : 'LockField';
    }
    const typeMap: Record<string, Action['type']> = {
      setattributevalue: 'SetValue',
      setattributerequired: 'SetRequired',
      showmessage: 'ShowError',
      showmessagestep: 'ShowError',
      // Legacy XAML names
      show: 'ShowField',
      hide: 'HideField',
      setvalue: 'SetValue',
      setrequired: 'SetRequired',
      lock: 'LockField',
      unlock: 'UnlockField',
      showerror: 'ShowError',
    };
    return typeMap[lower] ?? 'SetValue';
  }

  // ---------------------------------------------------------------------------
  // XAML parsing (legacy fallback)
  // ---------------------------------------------------------------------------

  private static parseConditions(xaml: string): Condition[] {
    const conditions: Condition[] = [];
    const conditionPattern = /<condition[^>]*attribute="([^"]*)"[^>]*operator="([^"]*)"[^>]*>[\s\S]*?<value[^>]*>([^<]*)<\/value>/gi;
    let match;
    while ((match = conditionPattern.exec(xaml)) !== null) {
      const [, field, operator, value] = match;
      conditions.push({
        field: field || 'unknown',
        operator: this.getOperatorDisplayName(operator || 'eq'),
        value: value || '',
        logicOperator: this.getLogicOperator(xaml, match.index),
      });
    }
    return conditions;
  }

  private static parseActions(xaml: string): Action[] {
    const actions: Action[] = [];
    const actionPattern = /<action[^>]*actiontype="([^"]*)"[^>]*>[\s\S]*?<\/action>/gi;
    let match;
    while ((match = actionPattern.exec(xaml)) !== null) {
      const [fullMatch, actionType] = match;
      const field = this.extractParameter(fullMatch, 'field');
      const value = this.extractParameter(fullMatch, 'value');
      const message = this.extractParameter(fullMatch, 'message');
      actions.push({
        type: this.getActionType(actionType),
        field: field || 'unknown',
        value: value || undefined,
        message: message || undefined,
      });
    }
    return actions;
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  private static determineExecutionContext(actions: Action[]): 'Client' | 'Server' | 'Both' {
    let hasClient = false;
    let hasServer = false;
    for (const action of actions) {
      if (['ShowField', 'HideField', 'LockField', 'UnlockField'].includes(action.type)) hasClient = true;
      if (['SetValue', 'SetRequired', 'ShowError'].includes(action.type)) hasServer = true;
    }
    if (hasClient && hasServer) return 'Both';
    if (hasServer) return 'Server';
    return 'Client';
  }

  private static buildConditionLogic(conditions: Condition[]): string {
    if (conditions.length === 0) return 'No conditions defined';
    if (conditions.length === 1) {
      const c = conditions[0];
      return `IF ${c.field} ${c.operator} '${c.value}'`;
    }
    let logic = 'IF ';
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      if (i > 0) logic += ` ${c.logicOperator} `;
      logic += `${c.field} ${c.operator} '${c.value}'`;
    }
    return logic;
  }

  private static getLogicOperator(xaml: string, position: number): 'AND' | 'OR' {
    const before = xaml.substring(Math.max(0, position - 200), position);
    return before.includes('<or>') ? 'OR' : 'AND';
  }

  private static getOperatorDisplayName(operator: string): string {
    const operators: Record<string, string> = {
      eq: 'equals',
      ne: 'not equals',
      gt: 'greater than',
      ge: 'greater than or equals',
      lt: 'less than',
      le: 'less than or equals',
      contains: 'contains',
      'not-contains': 'does not contain',
      'begins-with': 'begins with',
      'ends-with': 'ends with',
    };
    return operators[operator] || operator;
  }

  private static getActionType(actionType: string): Action['type'] {
    const typeMap: Record<string, Action['type']> = {
      show: 'ShowField',
      hide: 'HideField',
      setvalue: 'SetValue',
      setrequired: 'SetRequired',
      lock: 'LockField',
      unlock: 'UnlockField',
      showerror: 'ShowError',
    };
    return typeMap[actionType.toLowerCase()] || 'SetValue';
  }

  private static extractParameter(actionXml: string, paramName: string): string | null {
    const pattern = new RegExp(`<parameter[^>]*name="${paramName}"[^>]*>([^<]*)<\\/parameter>`, 'i');
    const match = pattern.exec(actionXml);
    return match ? match[1] : null;
  }
}
