import type { BusinessRuleDefinition, Condition, Action } from '../types/blueprint.js';

/**
 * Parser for Business Rule definitions.
 * Modern business rules store their definition in clientdata (JSON).
 * XAML is kept as a fallback for older records.
 *
 * Dataverse business rules use WF4 XAML and a proprietary clientdata JSON schema.
 * Neither format is publicly documented, so parsing is best-effort.
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
        // Accept the result even with 0 conditions if actions > 0, or vice versa —
        // real rules can be action-only (always execute). Only skip if both are 0.
        if (result.conditions.length > 0 || result.actions.length > 0) {
          return result;
        }
        // clientdata parsed but found no conditions or actions — it is likely
        // visual designer metadata (positions, colours) rather than rule logic.
        // Fall through to the XAML parser which holds the actual rule definition.
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

      // If XAML regex patterns yielded nothing, count elements as a last resort
      // so the UI shows a non-zero count when data is definitely present.
      const conditionCount = conditions.length > 0
        ? conditions.length
        : this.countXamlConditions(xaml);
      const actionCount = actions.length > 0
        ? actions.length
        : this.countXamlActions(xaml);

      // Synthesize placeholder conditions/actions when counts > 0 but parsing failed
      const finalConditions: Condition[] = conditions.length > 0
        ? conditions
        : Array.from({ length: conditionCount }, (_, i) => ({
            field: `condition_${i + 1}`,
            operator: 'defined in XAML',
            value: '',
            logicOperator: 'AND' as const,
          }));

      const finalActions: Action[] = actions.length > 0
        ? actions
        : Array.from({ length: actionCount }, (_, i) => ({
            type: 'SetValue' as Action['type'],
            field: `action_${i + 1}`,
          }));

      const executionContext = this.determineExecutionContext(finalActions);
      const conditionLogic = this.buildConditionLogic(finalConditions);

      return { conditions: finalConditions, actions: finalActions, executionContext, conditionLogic };
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
    const rawConditions = this.findConditionsArray(json);
    const rawActions = this.findActionsArray(json);

    const conditions: Condition[] = rawConditions.map(c => ({
      field: String(
        c.attributeName ?? c.sourceAttributeName ?? c.field ?? c.attribute ??
        c.AttributeName ?? c.SourceAttributeName ?? c.Field ?? c.Attribute ??
        c.controlAttribute ?? c.ControlAttribute ?? c.attributeLogicalName ??
        c.AttributeLogicalName ?? c.leftOperand ?? c.LeftOperand ?? 'unknown'
      ),
      operator: this.normalizeJsonOperator(String(
        c.operatorCode ?? c.operator ?? c.operatorType ?? c.comparisonOperator ??
        c.OperatorCode ?? c.Operator ?? c.OperatorType ?? c.ComparisonOperator ?? 'eq'
      )),
      value: this.extractJsonValue(
        c.value ?? c.valueExpression ?? c.rightOperand ?? c.paramValue ??
        c.Value ?? c.ValueExpression ?? c.RightOperand ?? c.ParamValue
      ),
      logicOperator: 'AND' as const,
    }));

    // Apply combinator to conditions after the first
    const combinatorRaw = String(
      json.conditionsCombinator ?? json.conditionCombinator ??
      json.ConditionsCombinator ?? json.ConditionCombinator ?? 'And'
    );
    const isOr = combinatorRaw.toLowerCase() === 'or';
    for (let i = 1; i < conditions.length; i++) {
      conditions[i].logicOperator = isOr ? 'OR' : 'AND';
    }

    const actions: Action[] = rawActions.map(a => {
      const actionType = String(
        a.type ?? a.actionType ?? a.actionName ?? a.actionTypeName ??
        a.Type ?? a.ActionType ?? a.ActionName ?? a.ActionTypeName ?? ''
      );
      const value = this.extractJsonValue(
        a.value ?? a.paramValue ?? a.targetValue ?? a.Value ?? a.ParamValue ?? a.TargetValue
      );
      return {
        type: this.mapJsonActionType(actionType, value),
        field: String(
          a.attributeName ?? a.targetAttributeName ?? a.field ?? a.attribute ??
          a.AttributeName ?? a.TargetAttributeName ?? a.Field ?? a.Attribute ??
          a.controlAttribute ?? a.ControlAttribute ?? a.attributeLogicalName ?? 'unknown'
        ),
        value: value || undefined,
        message: (a.message ?? a.Message ?? a.messageText ?? a.MessageText)
          ? String(a.message ?? a.Message ?? a.messageText ?? a.MessageText)
          : undefined,
      };
    });

    const executionContext = this.determineExecutionContext(actions);
    const conditionLogic = this.buildConditionLogic(conditions);

    return { conditions, actions, executionContext, conditionLogic };
  }

  /**
   * Recursively search obj for a conditions array using many known key variants
   * and up to 3 levels of nesting.
   */
  private static findConditionsArray(obj: Record<string, unknown>): Record<string, unknown>[] {
    const conditionKeys = [
      'conditions', 'ruleConditions', 'Conditions', 'RuleConditions',
      'conditionSet', 'ConditionSet', 'conditionsList', 'ConditionsList',
      'ifConditions', 'IfConditions', 'conditionItems', 'ConditionItems',
      'conditionDefinitions', 'ConditionDefinitions',
      'triggerConditions', 'TriggerConditions',
      'ruleConditionSet', 'RuleConditionSet',
    ];
    return this.deepFindArray(obj, conditionKeys, 4);
  }

  /**
   * Recursively search obj for an actions array using many known key variants
   * and up to 3 levels of nesting.
   */
  private static findActionsArray(obj: Record<string, unknown>): Record<string, unknown>[] {
    const actionKeys = [
      'actions', 'ruleActions', 'Actions', 'RuleActions',
      'thenActions', 'ThenActions', 'actionsList', 'ActionsList',
      'actionItems', 'ActionItems', 'steps', 'Steps',
      'actionSteps', 'ActionSteps',
      'elseActions', 'ElseActions',
      'actionDefinitions', 'ActionDefinitions',
    ];
    return this.deepFindArray(obj, actionKeys, 4);
  }

  /** Search for an array value under any of the given keys, up to maxDepth levels deep */
  private static deepFindArray(
    obj: Record<string, unknown>,
    keys: string[],
    maxDepth: number
  ): Record<string, unknown>[] {
    if (maxDepth <= 0) return [];

    // Direct match at this level
    for (const key of keys) {
      const val = obj[key];
      if (Array.isArray(val)) {
        // Only return if array contains objects (not primitives)
        const objectItems = val.filter(
          (item): item is Record<string, unknown> =>
            item !== null && typeof item === 'object' && !Array.isArray(item)
        );
        if (objectItems.length > 0) return objectItems;
      }
      // Handle wrapper objects: key maps to {items:[...]}, {value:[...]}, etc.
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        const wrapper = val as Record<string, unknown>;
        for (const innerKey of ['items', 'Items', 'value', 'Value', 'list', 'List', 'entries', 'Entries']) {
          const innerVal = wrapper[innerKey];
          if (Array.isArray(innerVal)) {
            const objectItems = innerVal.filter(
              (item): item is Record<string, unknown> =>
                item !== null && typeof item === 'object' && !Array.isArray(item)
            );
            if (objectItems.length > 0) return objectItems;
          }
        }
      }
    }

    // Recurse into nested objects
    for (const val of Object.values(obj)) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        const found = this.deepFindArray(val as Record<string, unknown>, keys, maxDepth - 1);
        if (found.length > 0) return found;
      }
      // Also recurse into array elements that are objects
      if (Array.isArray(val)) {
        for (const item of val) {
          if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            const found = this.deepFindArray(item as Record<string, unknown>, keys, maxDepth - 1);
            if (found.length > 0) return found;
          }
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
      const inner = o.value ?? o.Value ?? o.param ?? o.stringValue ?? o.StringValue ?? '';
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
      // lowercase variants
      equal: 'equals',
      notequal: 'not equals',
      greaterthan: 'greater than',
      greaterthanorequalto: 'greater than or equals',
      lessthan: 'less than',
      lessthanorequalto: 'less than or equals',
      contains: 'contains',
      doesnotcontain: 'does not contain',
      beginswith: 'begins with',
      endswith: 'ends with',
      isnull: 'is null',
      isnotnull: 'is not null',
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
      setattributerequiredlevel: 'SetRequired',
      setrequiredlevel: 'SetRequired',
      showmessage: 'ShowError',
      showmessagestep: 'ShowError',
      displaymessage: 'ShowError',
      // Common designer names
      setfield: 'SetValue',
      setfieldvalue: 'SetValue',
      setfieldvisibility: 'ShowField',  // resolved below via value
      setfieldlock: 'LockField',        // resolved below via value
      setfieldrequeired: 'SetRequired',
      // Legacy XAML names
      show: 'ShowField',
      hide: 'HideField',
      setvalue: 'SetValue',
      setrequired: 'SetRequired',
      lock: 'LockField',
      unlock: 'UnlockField',
      showerror: 'ShowError',
      // Dataverse rule action types
      showfield: 'ShowField',
      hidefield: 'HideField',
      lockfield: 'LockField',
      unlockfield: 'UnlockField',
      enablefield: 'ShowField',
      disablefield: 'LockField',
    };
    return typeMap[lower] ?? 'SetValue';
  }

  // ---------------------------------------------------------------------------
  // XAML parsing (legacy fallback)
  // ---------------------------------------------------------------------------

  private static parseConditions(xaml: string): Condition[] {
    const conditions: Condition[] = [];

    // Pattern 1: <condition attribute="..." operator="..."> ... <value>...</value>
    const conditionPattern = /<condition[^>]*attribute="([^"]*)"[^>]*operator="([^"]*)"[^>]*>[\s\S]*?<value[^>]*>([^<]*)<\/value>/gi;
    let match: RegExpExecArray | null;
    while ((match = conditionPattern.exec(xaml)) !== null) {
      const [, field, operator, value] = match;
      conditions.push({
        field: field || 'unknown',
        operator: this.getOperatorDisplayName(operator || 'eq'),
        value: value || '',
        logicOperator: this.getLogicOperator(xaml, match.index),
      });
    }
    if (conditions.length > 0) return conditions;

    // Pattern 2: Dataverse WF4 XAML — ConditionExpression or RuleCondition elements
    // e.g. <mxsf:ConditionExpression LeftOperand="field" Operator="Equal" RightOperand="value" />
    const wf4Pattern = /<(?:\w+:)?ConditionExpression[^>]*LeftOperand="([^"]*)"[^>]*Operator="([^"]*)"[^>]*RightOperand="([^"]*)"[^/]*/gi;
    while ((match = wf4Pattern.exec(xaml)) !== null) {
      const [, field, operator, value] = match;
      conditions.push({
        field: field || 'unknown',
        operator: this.normalizeJsonOperator(operator || 'eq'),
        value: value || '',
        logicOperator: 'AND',
      });
    }

    return conditions;
  }

  private static parseActions(xaml: string): Action[] {
    const actions: Action[] = [];

    // Pattern 1: <action actiontype="..."> ... </action>
    const actionPattern = /<action[^>]*actiontype="([^"]*)"[^>]*>[\s\S]*?<\/action>/gi;
    let match: RegExpExecArray | null;
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
    if (actions.length > 0) return actions;

    // Pattern 2: Dataverse WF4 XAML — RuleAction or SetAttributeValue elements
    // e.g. <mxsf:SetAttributeValueStep AttributeName="field" ... />
    const wf4SetPattern = /<(?:\w+:)?SetAttributeValue(?:Step)?[^>]*AttributeName="([^"]*)"[^>]*/gi;
    while ((match = wf4SetPattern.exec(xaml)) !== null) {
      const [, field] = match;
      actions.push({
        type: 'SetValue',
        field: field || 'unknown',
      });
    }
    if (actions.length > 0) return actions;

    // Pattern 3: ShowField/HideField/LockField/UnlockField steps
    const visibilityPattern = /<(?:\w+:)?(ShowField|HideField|LockField|UnlockField)(?:Step)?[^>]*AttributeName="([^"]*)"[^>]*/gi;
    while ((match = visibilityPattern.exec(xaml)) !== null) {
      const [, type, field] = match;
      actions.push({
        type: this.getActionType(type),
        field: field || 'unknown',
      });
    }

    return actions;
  }

  /**
   * Count condition-like elements in XAML when regex patterns return 0.
   * Uses broad tag matching to detect any condition-related elements.
   */
  private static countXamlConditions(xaml: string): number {
    const patterns = [
      /<condition[\s>]/gi,
      /<ConditionExpression[\s>]/gi,
      /<(?:\w+:)?ConditionExpression[\s>]/gi,
      /<(?:\w+:)?Condition[\s>]/gi,
      /<RuleCondition[\s>]/gi,
      /<(?:\w+:)?RuleCondition[\s>]/gi,
      /<IfCondition[\s>]/gi,
      // WF4 If activity — each <If> block represents a conditional branch
      /<(?:\w+:)?If[\s>]/gi,
      /<(?:\w+:)?ExpressionCondition[\s>]/gi,
      /<(?:\w+:)?BoolExpressionActivity[\s>]/gi,
    ];
    for (const pattern of patterns) {
      const matches = xaml.match(pattern);
      if (matches && matches.length > 0) return matches.length;
    }
    // Last resort: AttributeName= in a condition context
    const attrInCondition = xaml.match(/LeftOperand\s*=|RightOperand\s*=|Condition\s*=/gi);
    if (attrInCondition) return Math.ceil(attrInCondition.length / 2);
    return 0;
  }

  /**
   * Count action-like elements in XAML when regex patterns return 0.
   */
  private static countXamlActions(xaml: string): number {
    const patterns = [
      /<action[\s>]/gi,
      /<(?:\w+:)?SetAttributeValue(?:Step)?[\s>]/gi,
      /<(?:\w+:)?ShowField(?:Step)?[\s>]/gi,
      /<(?:\w+:)?HideField(?:Step)?[\s>]/gi,
      /<(?:\w+:)?LockField(?:Step)?[\s>]/gi,
      /<(?:\w+:)?UnlockField(?:Step)?[\s>]/gi,
      /<(?:\w+:)?SetRequired(?:(?:Field|Level)?(?:Step)?)?[\s>]/gi,
      /<(?:\w+:)?ShowMessage(?:Step)?[\s>]/gi,
      /<(?:\w+:)?DisplayMessage(?:Step)?[\s>]/gi,
      /<RuleAction[\s>]/gi,
      /<(?:\w+:)?RuleStatementAction[\s>]/gi,
    ];
    let total = 0;
    for (const pattern of patterns) {
      const matches = xaml.match(pattern);
      if (matches && matches.length > 0) {
        total += matches.length;
      }
    }
    // Last resort: count elements whose name ends with "Step" — nearly always actions
    if (total === 0) {
      const stepTags = xaml.match(/<(?:\w+:)?\w+Step[\s>]/gi);
      if (stepTags) total = stepTags.length;
    }
    return total;
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
    return before.includes('<or>') || before.includes('<Or>') ? 'OR' : 'AND';
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
      showfield: 'ShowField',
      hidefield: 'HideField',
      lockfield: 'LockField',
      unlockfield: 'UnlockField',
    };
    return typeMap[actionType.toLowerCase()] || 'SetValue';
  }

  private static extractParameter(actionXml: string, paramName: string): string | null {
    const pattern = new RegExp(`<parameter[^>]*name="${paramName}"[^>]*>([^<]*)<\\/parameter>`, 'i');
    const match = pattern.exec(actionXml);
    return match ? match[1] : null;
  }
}
