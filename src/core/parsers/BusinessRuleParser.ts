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

  // Condition patterns
  private static readonly RE_NOT_EMPTY = /\(*(v\d+)\)*\s*!==?\s*(?:undefined|null|"")/g;
  private static readonly RE_IS_EMPTY = /\(*(v\d+)\)*\s*===?\s*(?:undefined|null|"")/g;
  private static readonly RE_EQ_LITERAL = /\(*(v\d+)\)*\s*===?\s*\((true|false|'[^']*'|"[^"]*"|-?\d+(?:\.\d+)?)\)/g;
  private static readonly RE_STR_OP = /\bv\d+\(\(\s*(v\d+)\s*\)\s*,\s*\(\s*'([^']*)'\s*\)\s*,\s*function[\s\S]{0,500}?indexOf[\s\S]{0,80}?(===|!==)\s*-1/g;
  private static readonly RE_COMP = /\(*(v\d+)\)*\s*([<>]=?)\s*\(*(v\d+)\)*/g;

  // Action patterns
  private static readonly RE_REQ_LEVEL = /\(*(v\d+)\)*\.setRequiredLevel\(['"]([^'"]+)['"]\)/g;
  private static readonly RE_VISIBLE = /\(*(v\d+)\)*\.setVisible\((true|false)\)/g;
  private static readonly RE_CTRL_VISIBLE = /(v\d+)\.controls\.forEach[\s\S]{0,150}?c\.setVisible\((true|false)\)/g;
  private static readonly RE_DISABLED = /\(*(v\d+)\)*\.setDisabled\((true|false)\)/g;
  private static readonly RE_CTRL_DISABLED = /(v\d+)\.controls\.forEach[\s\S]{0,150}?c\.setDisabled\((true|false)\)/g;
  private static readonly RE_SET_VAL = /\(*(v\d+)\)*\.setValue\(([^)]*)\)/g;
  private static readonly RE_NOTIF_MSG = /GetResourceString\([^,]+,\s*'([^']+)'\)[^,)]*,\s*'([^'"]+)'/g;
  private static readonly RE_NOTIF_LIT = /c\.setNotification\('([^']+)',\s*'([^']+)'\)/g;
  private static readonly RE_CLEANUP = /\{'CId'\s*:\s*'([^']+)'\s*,\s*'SId'\s*:\s*'([^']+)'\}/g;
  private static readonly RE_CTRL_NOTIF = /(v\d+)\.controls\.forEach[\s\S]{0,300}?c\.setNotification/g;

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
    // DIAGNOSTIC — remove before release
    if (clientdata && clientdata.trim()) {
      const format = clientdata.trimStart().startsWith('<') ? 'XML/compiled-JS' :
                     clientdata.trimStart().startsWith('{') ? 'JSON' : 'unknown';
      console.log('[PPSB-DIAG] BusinessRuleParser raw clientdata preview:', {
        ruleName: _ruleName ?? 'unknown',
        format,
        preview: clientdata.substring(0, 2000),
      });
    }

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
          if (result.conditions.length > 0 || result.actions.length > 0) {
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
  // XML clientdata parsing (standard Dataverse format)
  // ---------------------------------------------------------------------------

  /**
   * Parse the standard Dataverse clientdata XML format.
   *
   * clientdata is always XML: <clientdata><clientcode><![CDATA[...]]></clientcode></clientdata>
   * The CDATA contains compiled JavaScript that implements the rule. We extract conditions
   * and actions by analysing the variable bindings and method calls in that JS.
   *
   * Variable naming pattern Dataverse uses:
   *   var v0 = entity reference
   *   var v1 = v0.attributes.get('emailaddress1')  ← field-control variable
   *   var v4 = (v1) ? v1.getValue() : null          ← value variable
   *
   * Conditions come from: value-var != undefined checks (distinct from the guard-return
   * at the top which checks field-control vars with == undefined).
   * Actions come from: v2.setRequiredLevel(...), v2.setVisible(...), etc.
   */
  private static parseClientDataXml(clientdata: string): BusinessRuleDefinition | null {
    const cdataMatch = clientdata.match(BusinessRuleParser.RE_CDATA);
    if (!cdataMatch) return null;
    const js = cdataMatch[1].trim();
    if (!js) return null;

    let m: RegExpExecArray | null;

    // ── Variable maps ──────────────────────────────────────────────────────────

    // field-control var → field logical name
    // var v1 = v0.attributes.get('emailaddress1');
    const fieldVarMap = new Map<string, string>();
    BusinessRuleParser.RE_FIELD_DECL.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_FIELD_DECL.exec(js)) !== null) fieldVarMap.set(m[1], m[2]);

    // value-var → field-control var
    // (a) ternary: var v4 = (v1) ? v1.getValue() : null;  also handles getUtcValue/getOptions
    const valueVarMap = new Map<string, string>();
    BusinessRuleParser.RE_TERNARY_VAL.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_TERNARY_VAL.exec(js)) !== null) valueVarMap.set(m[1], m[2]);
    // (b) direct: var v4 = v1.getValue();
    BusinessRuleParser.RE_DIRECT_VAL.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_DIRECT_VAL.exec(js)) !== null) {
      if (!valueVarMap.has(m[1])) valueVarMap.set(m[1], m[2]);
    }

    // derived-var → source value-var  (date normalisation)
    // var v4 = (((v3) != undefined && ...) ? new Date((v3)...) : null)
    const derivedVarMap = new Map<string, string>();
    BusinessRuleParser.RE_DERIVED_VAR.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_DERIVED_VAR.exec(js)) !== null) derivedVarMap.set(m[1], m[2]);

    // Variables that only serve as null-guard sources inside a derived-var computation.
    // Their != undefined checks are implementation detail, not business-rule conditions.
    const derivedSources = new Set(derivedVarMap.values());

    // Resolve vN → field logical name (derivedVarMap → valueVarMap → fieldVarMap)
    const resolveField = (varName: string): string => {
      let v = varName;
      if (derivedVarMap.has(v)) v = derivedVarMap.get(v)!;
      if (valueVarMap.has(v)) v = valueVarMap.get(v)!;
      return fieldVarMap.get(v) ?? varName;
    };

    // ── Conditions ─────────────────────────────────────────────────────────────

    const conditions: Condition[] = [];
    const seenCondKeys = new Set<string>();
    const addCondition = (field: string, operator: string, value = '') => {
      if (/^v\d+$/.test(field)) return; // unresolved variable — skip
      const key = `${field}|${operator}|${value}`;
      if (seenCondKeys.has(key)) return;
      seenCondKeys.add(key);
      conditions.push({ field, operator, value, logicOperator: 'AND' });
    };

    // (a) "contains data": value-vars / derived-vars checked with != / !== undefined|null|""
    // \(* handles any number of wrapping parens: Dataverse uses both (vN) and ((vN))
    BusinessRuleParser.RE_NOT_EMPTY.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_NOT_EMPTY.exec(js)) !== null) {
      const varName = m[1];
      if (!valueVarMap.has(varName) && !derivedVarMap.has(varName)) continue; // guard-clause uses field-control vars
      if (derivedSources.has(varName)) continue; // null guard inside derived-var computation
      const field = resolveField(varName);
      addCondition(field, 'contains data');
    }

    // (b) "does not contain data": value-vars checked with == / === undefined|null|""
    // Early-return guard uses field-control vars (not in valueVarMap) — safely skipped by the filter.
    BusinessRuleParser.RE_IS_EMPTY.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_IS_EMPTY.exec(js)) !== null) {
      const varName = m[1];
      if (!valueVarMap.has(varName) && !derivedVarMap.has(varName)) continue;
      if (derivedSources.has(varName)) continue;
      const field = resolveField(varName);
      addCondition(field, 'does not contain data');
    }

    // (c) "equals literal": (vN)==(true|false|'string'|number)
    // Dataverse wraps the literal in parens, e.g. (v3)==(false) for Two Options fields.
    // The compound boolean check pattern is: (v3)==(false)||((v3)==true&&...)
    // Only the first clause uses parens around the literal, so this regex fires exactly once per branch.
    BusinessRuleParser.RE_EQ_LITERAL.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_EQ_LITERAL.exec(js)) !== null) {
      const varName = m[1];
      if (!valueVarMap.has(varName) && !derivedVarMap.has(varName)) continue;
      if (derivedSources.has(varName)) continue;
      const field = resolveField(varName);
      const rawVal = m[2].replace(/^['"]|['"]$/g, '');
      addCondition(field, 'equals', rawVal);
    }

    // (d) String "contains" / "does not contain" via Dataverse helper comparator function:
    // var vH = function(op1, op2, e){ return e(op1, op2); };
    // vH((vN), ('value'), function(op1,op2){ ... op1.toUpperCase().indexOf(op2.toUpperCase()) === -1 ... })
    // indexOf === -1 → "does not contain"; indexOf !== -1 → "contains"
    BusinessRuleParser.RE_STR_OP.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_STR_OP.exec(js)) !== null) {
      const varName = m[1], literal = m[2], cmp = m[3];
      if (!valueVarMap.has(varName) && !derivedVarMap.has(varName)) continue;
      if (derivedSources.has(varName)) continue;
      const field = resolveField(varName);
      addCondition(field, cmp === '===' ? 'does not contain' : 'contains', literal);
    }

    // (e) comparison: (vA) < (vB), (vA) > (vB), (vA) <= (vB), (vA) >= (vB)
    const compOpNames: Record<string, string> = {
      '<': 'is less than', '>': 'is greater than',
      '<=': 'is less than or equal to', '>=': 'is greater than or equal to',
    };
    const flipOps: Record<string, string> = {
      '<': 'is greater than', '>': 'is less than',
      '<=': 'is greater than or equal to', '>=': 'is less than or equal to',
    };
    BusinessRuleParser.RE_COMP.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_COMP.exec(js)) !== null) {
      const lhsVar = m[1], op = m[2], rhsVar = m[3];
      const lhsField = resolveField(lhsVar);
      const rhsField = resolveField(rhsVar);
      if (lhsField === lhsVar && rhsField === rhsVar) continue; // neither side resolved
      if (lhsField !== lhsVar) {
        addCondition(lhsField, compOpNames[op] ?? op, rhsField !== rhsVar ? rhsField : rhsVar);
      } else {
        addCondition(rhsField, flipOps[op] ?? op, lhsVar);
      }
    }

    // ── Actions ────────────────────────────────────────────────────────────────

    const actions: Action[] = [];

    // .setRequiredLevel('required' | 'none' | 'recommended')
    BusinessRuleParser.RE_REQ_LEVEL.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_REQ_LEVEL.exec(js)) !== null)
      actions.push({ type: 'SetRequired', field: resolveField(m[1]), value: m[2] });

    // .setVisible(true|false) — direct call
    BusinessRuleParser.RE_VISIBLE.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_VISIBLE.exec(js)) !== null)
      actions.push({ type: m[2] === 'true' ? 'ShowField' : 'HideField', field: resolveField(m[1]) });

    // .controls.forEach(function(c,i){ c.setVisible(true|false) }) — delegate pattern
    BusinessRuleParser.RE_CTRL_VISIBLE.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_CTRL_VISIBLE.exec(js)) !== null)
      actions.push({ type: m[2] === 'true' ? 'ShowField' : 'HideField', field: resolveField(m[1]) });

    // .setDisabled(true|false) — direct call
    BusinessRuleParser.RE_DISABLED.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_DISABLED.exec(js)) !== null)
      actions.push({ type: m[2] === 'true' ? 'LockField' : 'UnlockField', field: resolveField(m[1]) });

    // .controls.forEach(function(c,i){ c.setDisabled(true|false) }) — delegate pattern
    BusinessRuleParser.RE_CTRL_DISABLED.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_CTRL_DISABLED.exec(js)) !== null)
      actions.push({ type: m[2] === 'true' ? 'LockField' : 'UnlockField', field: resolveField(m[1]) });

    // .setValue(value)
    BusinessRuleParser.RE_SET_VAL.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_SET_VAL.exec(js)) !== null) {
      const raw = m[2].trim().replace(/^['"]|['"]$/g, '');
      actions.push({ type: 'SetValue', field: resolveField(m[1]), value: raw || undefined });
    }

    // ShowError: c.setNotification(GetResourceString(guid, 'message'), stepId)
    // Build stepId → message from GetResourceString fallback args
    const notifMsgMap = new Map<string, string>();
    BusinessRuleParser.RE_NOTIF_MSG.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_NOTIF_MSG.exec(js)) !== null) notifMsgMap.set(m[2], m[1]);
    // Literal string fallback: c.setNotification('message', 'stepId')
    BusinessRuleParser.RE_NOTIF_LIT.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_NOTIF_LIT.exec(js)) !== null) {
      if (!notifMsgMap.has(m[2])) notifMsgMap.set(m[2], m[1]);
    }
    // Cleanup array maps field → stepId: {'CId':'fieldname','SId':'stepId'}
    const notifSeen = new Set<string>();
    BusinessRuleParser.RE_CLEANUP.lastIndex = 0;
    while ((m = BusinessRuleParser.RE_CLEANUP.exec(js)) !== null) {
      const field = m[1], stepId = m[2];
      const key = `${field}|${stepId}`;
      if (!notifSeen.has(key)) {
        notifSeen.add(key);
        actions.push({ type: 'ShowError', field, message: notifMsgMap.get(stepId) });
      }
    }
    // Fallback: controls.forEach + setNotification without a cleanup array
    if (notifSeen.size === 0) {
      BusinessRuleParser.RE_CTRL_NOTIF.lastIndex = 0;
      while ((m = BusinessRuleParser.RE_CTRL_NOTIF.exec(js)) !== null) {
        const field = resolveField(m[1]);
        if (field !== m[1]) actions.push({ type: 'ShowError', field });
      }
    }

    if (conditions.length === 0 && actions.length === 0) return null;

    return {
      conditions,
      actions,
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

    // DIAGNOSTIC — remove before release
    const combinatorRaw = String(
      json.conditionsCombinator ?? json.conditionCombinator ??
      json.ConditionsCombinator ?? json.ConditionCombinator ?? 'And'
    );
    console.log('[PPSB-DIAG] BusinessRule raw conditions structure:', {
      rawConditions: JSON.stringify(rawConditions, null, 2).substring(0, 1000),
      rawActions: JSON.stringify(rawActions, null, 2).substring(0, 1000),
      conditionsCombinator: combinatorRaw,
    });

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
