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
  // ---------------------------------------------------------------------------
  // Static regex patterns — defined once at class level to avoid per-call
  // recompilation when parsing large numbers of business rules.
  // IMPORTANT: All /g patterns must have lastIndex reset to 0 before use in
  // while/exec loops to ensure they are stateless across calls.
  // ---------------------------------------------------------------------------

  // clientdata XML extraction
  private static readonly RE_CDATA = /<clientcode[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/clientcode>/i;

  // Variable declaration patterns
  private static readonly RE_FIELD_DECL = /var\s+(v\d+)\s*=\s*\S+\.attributes\.get\(['"]([^'"]+)['"]\)/g;
  private static readonly RE_TERNARY_VAL = /var\s+(v\d+)\s*=\s*\(?(v\d+)\)?\s*\?\s*\S+\.get(?:Value|UtcValue|Options)\(\)\s*:\s*null/g;
  private static readonly RE_DIRECT_VAL = /var\s+(v\d+)\s*=\s*(v\d+)\.get(?:Value|UtcValue)\(\)/g;
  private static readonly RE_DERIVED_VAR = /var\s+(v\d+)\s*=\s*\(\s*\(\s*\(\s*(v\d+)\s*\)\s*!=\s*undefined/g;

  // XAML parsing patterns
  private static readonly RE_COND_PATTERN = /<condition[^>]*attribute="([^"]*)"[^>]*operator="([^"]*)"[^>]*>[\s\S]*?<value[^>]*>([^<]*)<\/value>/gi;
  private static readonly RE_WF4_COND = /<(?:\w+:)?ConditionExpression[^>]*LeftOperand="([^"]*)"[^>]*Operator="([^"]*)"[^>]*RightOperand="([^"]*)"[^/]*/gi;
  private static readonly RE_ACTION_PATTERN = /<action[^>]*actiontype="([^"]*)"[^>]*>[\s\S]*?<\/action>/gi;
  private static readonly RE_WF4_SET = /<(?:\w+:)?SetAttributeValue(?:Step)?[^>]*AttributeName="([^"]*)"[^>]*/gi;
  private static readonly RE_VISIBILITY = /<(?:\w+:)?(ShowField|HideField|LockField|UnlockField)(?:Step)?[^>]*AttributeName="([^"]*)"[^>]*/gi;

  /**
   * Parse business rule — tries clientdata (JSON) first, then XAML
   */
  static parse(xaml: string | null, clientdata: string | null = null, _ruleName?: string): BusinessRuleDefinition {
    if (clientdata && clientdata.trim()) {
      if (clientdata.trimStart().startsWith('<')) {
        // XML format: <clientdata><clientcode><![CDATA[...compiled JS...]]></clientcode></clientdata>
        // This is the standard format for Dataverse business rules.
        const xmlResult = this.parseClientDataXml(clientdata);
        if (xmlResult) return xmlResult;
      } else {
        // JSON format (newer rule engine versions)
        try {
          const json = JSON.parse(clientdata) as Record<string, unknown>;
          const result = this.parseJson(json);
          if (result.conditions.length > 0 || result.thenActions.length > 0 || result.elseActions.length > 0) {
            return result;
          }
        } catch {
          // Fall through to XAML
        }
      }
    }

    // Fall back to XAML
    if (!xaml || xaml.trim() === '') {
      return {
        conditions: [],
        thenActions: [],
        elseActions: [],
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

      return { conditions: finalConditions, thenActions: finalActions, elseActions: [], executionContext, conditionLogic };
    } catch (error) {
      return {
        conditions: [],
        thenActions: [],
        elseActions: [],
        executionContext: 'Client',
        conditionLogic: 'Unable to parse conditions',
        parseError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // XML clientdata parsing (standard Dataverse format)
  // ---------------------------------------------------------------------------

  /**
   * Parse the standard Dataverse clientdata XML format.
   *
   * clientdata is always XML: <clientdata><clientcode><![CDATA[...]]></clientcode></clientdata>
   * The CDATA contains compiled JavaScript that implements the rule with this structure:
   *   1. var v0 = entity reference
   *   2. var v1 = v0.attributes.get('field_logical_name')  ← field attribute variables
   *   3. if(v1==null || v2==null ...) { return; }  ← null guard (skip — not a condition)
   *   4. var vN = (v1) ? v1.getValue() : null  ← value variable for the condition field
   *   5. if((vN) === (795390000)) { ... }  ← THE ACTUAL CONDITION (optionset/boolean/lookup equals)
   *   6. Inside the if block: THEN actions
   *   7. } else if(true) { ... }  ← ELSE actions (always "else if(true)", never plain "else")
   *
   * We extract:
   *   - Variable maps: vN → field logical name
   *   - Conditions: from the main if statement (not the null guard)
   *   - THEN actions: from the if block
   *   - ELSE actions: from the else if(true) block
   */
  private static parseClientDataXml(clientdata: string): BusinessRuleDefinition | null {
    const cdataMatch = clientdata.match(BusinessRuleParser.RE_CDATA);
    if (!cdataMatch) return null;
    const js = cdataMatch[1].trim();
    if (!js) return null;

    let m: RegExpExecArray | null;

    // ── Step 1: Build variable-to-field map ──────────────────────────────────

    // field-attribute var → field logical name
    // var v1 = v0.attributes.get('emailaddress1');
    const fieldVarMap = new Map<string, string>();
    BusinessRuleParser.RE_FIELD_DECL.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_FIELD_DECL.exec(js)) !== null) fieldVarMap.set(m[1], m[2]);

    // ── Step 2: Build value-variable map ──────────────────────────────────────

    // value-var → attribute-var
    // var v4 = (v1) ? v1.getValue() : null
    const valueVarMap = new Map<string, string>();
    BusinessRuleParser.RE_TERNARY_VAL.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_TERNARY_VAL.exec(js)) !== null) valueVarMap.set(m[1], m[2]);
    BusinessRuleParser.RE_DIRECT_VAL.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_DIRECT_VAL.exec(js)) !== null) {
      if (!valueVarMap.has(m[1])) valueVarMap.set(m[1], m[2]);
    }

    // derived-var → source value-var (date normalisation)
    const derivedVarMap = new Map<string, string>();
    BusinessRuleParser.RE_DERIVED_VAR.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_DERIVED_VAR.exec(js)) !== null) derivedVarMap.set(m[1], m[2]);

    // Resolve vN → field logical name (derivedVarMap → valueVarMap → fieldVarMap)
    const resolveField = (varName: string): string => {
      let v = varName;
      if (derivedVarMap.has(v)) v = derivedVarMap.get(v)!;
      if (valueVarMap.has(v)) v = valueVarMap.get(v)!;
      return fieldVarMap.get(v) ?? varName;
    };

    // ── Step 3: Skip null guard ────────────────────────────────────────────────

    // The null guard is always: if(v1==null || v2==null || v1==undefined || v2==undefined) { return; }
    // We don't extract conditions from it — we skip it entirely by looking for the NEXT if statement.

    // ── Step 4: Extract the main condition ─────────────────────────────────────

    const conditions: Condition[] = [];

    // After the null guard, the main condition appears. We detect three patterns:

    // Pattern A: option set equals integer
    // if((vN) === (795390000))
    const matchOptionSet = js.match(/if\s*\(\s*\((v\d+)\)\s*===\s*\((\d+)\)\s*\)/);
    if (matchOptionSet) {
      const valueVar = matchOptionSet[1];
      const optionValue = matchOptionSet[2];
      const field = resolveField(valueVar);
      if (field !== valueVar) {
        conditions.push({ field, operator: 'equals', value: optionValue, logicOperator: 'AND' });
      }
    }

    // Pattern B: boolean equals true
    // if((vN)==(true)||((vN)==true&&(true)=='1')||...)
    if (conditions.length === 0) {
      const matchBool = js.match(/if\s*\(\s*\((v\d+)\)\s*==\s*\(true\)/);
      if (matchBool) {
        const valueVar = matchBool[1];
        const field = resolveField(valueVar);
        if (field !== valueVar) {
          conditions.push({ field, operator: 'equals', value: 'true', logicOperator: 'AND' });
        }
      }
    }

    // Pattern C: lookup equals specific record (using comparator function v7)
    // if(v7((vN),(vM), function(op1,op2){ ...sanitizeGuid... }))
    // vM is the lookup array: var vM = [{id:'...', entityType:'...', name:'LookupName'}]
    if (conditions.length === 0) {
      const matchLookup = /if\s*\(v\d+\s*\(\s*\((v\d+)\)\s*,\s*\((v\d+)\)/;
      const lookupMatch = js.match(matchLookup);
      if (lookupMatch) {
        const valueVar = lookupMatch[1];
        const lookupArrayVar = lookupMatch[2];
        const field = resolveField(valueVar);
        // Extract the lookup name from the array definition: var vM = [{..., name:'...' }]
        const arrayDefRegex = new RegExp(`var\\s+${lookupArrayVar.replace('$', '\\$')}\\s*=\\s*\\[.*?name\\s*:\\s*'([^']+)'`, 's');
        const arrayMatch = js.match(arrayDefRegex);
        const lookupName = arrayMatch ? arrayMatch[1] : '(lookup record)';
        if (field !== valueVar) {
          conditions.push({ field, operator: 'equals', value: lookupName, logicOperator: 'AND' });
        }
      }
    }

    // ── Step 5: Extract THEN actions (inside the main if block) ───────────────

    const thenActions: Action[] = [];
    const elseActions: Action[] = [];

    // Find the main if block start and the else if(true) position
    // Main if: starts after the condition we just matched
    // ELSE: always "} else if(true) {"

    const elsePos = js.indexOf('} else if(true)');
    const thenBlock = elsePos > 0 ? js.substring(0, elsePos) : js;
    const elseBlock = elsePos > 0 ? js.substring(elsePos) : '';

    // Helper to parse actions from a block of code
    const parseActions = (block: string): Action[] => {
      const acts: Action[] = [];

      // .setRequiredLevel('required' | 'none' | 'recommended')
      const reqRe = /\(*(v\d+)\)*\.setRequiredLevel\(['"]([^'"]+)['"]\)/g;
      let match: RegExpExecArray | null;
      while ((match = reqRe.exec(block)) !== null) {
        const level = match[2];
        const type = level === 'none' ? 'SetOptional' : 'SetRequired';
        acts.push({ type, field: resolveField(match[1]), value: level });
      }

      // .controls.forEach(function(c,i){ c.setVisible(true|false) }) — delegate pattern
      const ctrlVisRe = /(v\d+)\.controls\.forEach[\s\S]{0,150}?c\.setVisible\((true|false)\)/g;
      while ((match = ctrlVisRe.exec(block)) !== null) {
        acts.push({ type: match[2] === 'true' ? 'ShowField' : 'HideField', field: resolveField(match[1]) });
      }

      // .setVisible(true|false) — direct call
      const visRe = /\(*(v\d+)\)*\.setVisible\((true|false)\)/g;
      while ((match = visRe.exec(block)) !== null) {
        acts.push({ type: match[2] === 'true' ? 'ShowField' : 'HideField', field: resolveField(match[1]) });
      }

      // .controls.forEach(function(c,i){ c.setDisabled(true|false) }) — delegate pattern
      const ctrlDisRe = /(v\d+)\.controls\.forEach[\s\S]{0,150}?c\.setDisabled\((true|false)\)/g;
      while ((match = ctrlDisRe.exec(block)) !== null) {
        acts.push({ type: match[2] === 'true' ? 'LockField' : 'UnlockField', field: resolveField(match[1]) });
      }

      // .setDisabled(true|false) — direct call
      const disRe = /\(*(v\d+)\)*\.setDisabled\((true|false)\)/g;
      while ((match = disRe.exec(block)) !== null) {
        acts.push({ type: match[2] === 'true' ? 'LockField' : 'UnlockField', field: resolveField(match[1]) });
      }

      // .setValue(value)
      const setValRe = /\(*(v\d+)\)*\.setValue\(([^)]*)\)/g;
      while ((match = setValRe.exec(block)) !== null) {
        const raw = match[2].trim().replace(/^['"]|['"]$/g, '');
        acts.push({ type: 'SetValue', field: resolveField(match[1]), value: raw || undefined });
      }

      // ShowError: c.setNotification(...)
      // Build stepId → message map
      const notifMsgMap = new Map<string, string>();
      const notifMsgRe = /GetResourceString\([^,]+,\s*'([^']+)'\)[^,)]*,\s*'([^'"]+)'/g;
      while ((match = notifMsgRe.exec(block)) !== null) notifMsgMap.set(match[2], match[1]);
      const notifLitRe = /c\.setNotification\('([^']+)',\s*'([^']+)'\)/g;
      while ((match = notifLitRe.exec(block)) !== null) {
        if (!notifMsgMap.has(match[2])) notifMsgMap.set(match[2], match[1]);
      }
      const cleanupRe = /\{'CId'\s*:\s*'([^']+)'\s*,\s*'SId'\s*:\s*'([^']+)'\}/g;
      const notifSeen = new Set<string>();
      while ((match = cleanupRe.exec(block)) !== null) {
        const field = match[1], stepId = match[2];
        const key = `${field}|${stepId}`;
        if (!notifSeen.has(key)) {
          notifSeen.add(key);
          acts.push({ type: 'ShowError', field, message: notifMsgMap.get(stepId) });
        }
      }

      return acts;
    };

    thenActions.push(...parseActions(thenBlock));
    elseActions.push(...parseActions(elseBlock));

    if (conditions.length === 0 && thenActions.length === 0 && elseActions.length === 0) return null;

    return {
      conditions,
      thenActions,
      elseActions,
      executionContext: 'Client',
      conditionLogic: this.buildConditionLogic(conditions),
    };
  }

  // ---------------------------------------------------------------------------
  // JSON (clientdata) parsing
  // ---------------------------------------------------------------------------

  private static parseJson(json: Record<string, unknown>): BusinessRuleDefinition {
    const rawConditions = this.findConditionsArray(json);
    const rawActions = this.findActionsArray(json);

    const combinatorRaw = String(
      json.conditionsCombinator ?? json.conditionCombinator ??
      json.ConditionsCombinator ?? json.ConditionCombinator ?? 'And'
    );

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

    return { conditions, thenActions: actions, elseActions: [], executionContext, conditionLogic };
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
      setfieldrequired: 'SetRequired',
      setfieldrequeired: 'SetRequired', // misspelled variant kept for backward compatibility
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
    let match: RegExpExecArray | null;
    BusinessRuleParser.RE_COND_PATTERN.lastIndex = 0;
    while ((match = BusinessRuleParser.RE_COND_PATTERN.exec(xaml)) !== null) {
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
    BusinessRuleParser.RE_WF4_COND.lastIndex = 0;
    while ((match = BusinessRuleParser.RE_WF4_COND.exec(xaml)) !== null) {
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
    let match: RegExpExecArray | null;
    BusinessRuleParser.RE_ACTION_PATTERN.lastIndex = 0;
    while ((match = BusinessRuleParser.RE_ACTION_PATTERN.exec(xaml)) !== null) {
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
    BusinessRuleParser.RE_WF4_SET.lastIndex = 0;
    while ((match = BusinessRuleParser.RE_WF4_SET.exec(xaml)) !== null) {
      const [, field] = match;
      actions.push({
        type: 'SetValue',
        field: field || 'unknown',
      });
    }
    if (actions.length > 0) return actions;

    // Pattern 3: ShowField/HideField/LockField/UnlockField steps
    BusinessRuleParser.RE_VISIBILITY.lastIndex = 0;
    while ((match = BusinessRuleParser.RE_VISIBILITY.exec(xaml)) !== null) {
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
