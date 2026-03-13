import { useMemo, useState, useCallback } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  ToggleButton,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { BusinessRule } from '../core';
import { filterDescription } from '../utils/descriptionFilter';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';
import { useListFilter, type FilterSpec } from '../hooks/useListFilter';

const RULE_STATE_VALUES = ['Active', 'Draft'];
const RULE_SCOPE_VALUES = ['Entity', 'AllForms'];

const RULES_FILTER_SPECS: readonly FilterSpec<BusinessRule>[] = [
  { name: 'state', getKey: (r) => r.state },
  { name: 'scope', getKey: (r) => r.scope },
];

const useStyles = makeStyles({
  ruleRow: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) minmax(100px, 1fr) auto auto auto`,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
  },
  conditionItem: {
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalXS,
  },
  actionItem: {
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalXS,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    borderLeft: '3px solid transparent',
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalM,
  },
});

export interface BusinessRulesListProps {
  businessRules: BusinessRule[];
  entityLogicalName?: string;
}

export function BusinessRulesList({
  businessRules,
  entityLogicalName,
}: BusinessRulesListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  // Filter business rules by entity if specified
  const filteredRules = useMemo(() => {
    if (!entityLogicalName) return businessRules;
    return businessRules.filter((r) => r.entity.toLowerCase() === entityLogicalName.toLowerCase());
  }, [businessRules, entityLogicalName]);

  // Sort business rules by entity, state, and name
  const sortedRules = useMemo(() => {
    return [...filteredRules].sort((a, b) => {
      if (a.entity !== b.entity) return a.entity.localeCompare(b.entity);
      if (a.state !== b.state) {
        if (a.state === 'Active') return -1;
        if (b.state === 'Active') return 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredRules]);

  const stateCounts = useMemo(() => {
    const counts = Object.fromEntries(RULE_STATE_VALUES.map((s) => [s, 0]));
    for (const r of sortedRules) counts[r.state] = (counts[r.state] ?? 0) + 1;
    return counts;
  }, [sortedRules]);

  const scopeCounts = useMemo(() => {
    const counts = Object.fromEntries(RULE_SCOPE_VALUES.map((s) => [s, 0]));
    for (const r of sortedRules) counts[r.scope] = (counts[r.scope] ?? 0) + 1;
    return counts;
  }, [sortedRules]);

  const {
    filteredItems: searchedRules,
    searchQuery,
    setSearchQuery,
    toggleKey,
    clearFilter,
    activeFilters,
  } = useListFilter(
    sortedRules,
    (r, q) =>
      r.name.toLowerCase().includes(q) ||
      r.entity.toLowerCase().includes(q),
    RULES_FILTER_SPECS,
  );

  const toggleExpand = useCallback((ruleId: string) => {
    setExpandedRuleId((prev) => (prev === ruleId ? null : ruleId));
  }, []);

  const getStateBadgeProps = (state: BusinessRule['state']) => {
    return state === 'Active'
      ? { appearance: 'filled' as const, color: 'success' as const, shape: 'rounded' as const }
      : { appearance: 'filled' as const, color: 'warning' as const, shape: 'rounded' as const };
  };

  const getScopeBadgeColor = (scope: BusinessRule['scope']): 'brand' | 'important' | 'informative' => {
    if (scope === 'Entity') return 'brand';
    if (scope === 'AllForms') return 'important';
    return 'informative';
  };

  const getActionBorderColor = (actionType: string): string => {
    const colors: Record<string, string> = {
      'ShowField': tokens.colorPaletteGreenForeground1,
      'HideField': tokens.colorPaletteRedForeground1,
      'SetValue': tokens.colorBrandForeground1,
      'SetRequired': tokens.colorPaletteYellowForeground1,
      'LockField': tokens.colorPaletteDarkOrangeForeground1,
      'UnlockField': tokens.colorPaletteGreenForeground1,
      'ShowError': tokens.colorPaletteRedForeground1,
    };
    return colors[actionType] ?? tokens.colorNeutralStroke1;
  };

  const renderRuleDetails = (rule: BusinessRule): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>{rule.name}</Title3>

        <div className={shared.detailsGrid}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Entity</Text>
            <Text className={shared.detailValue}>
              {rule.entityDisplayName || rule.entity}
            </Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Scope</Text>
            <Text className={shared.detailValue}>{rule.scopeName}</Text>
          </div>
          {rule.formName && (
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Form</Text>
              <Text className={shared.detailValue}>{rule.formName}</Text>
            </div>
          )}
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Owner</Text>
            <Text className={shared.detailValue}>{rule.owner}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>
              {new Date(rule.modifiedOn).toLocaleString()}
            </Text>
          </div>
        </div>

        {filterDescription(rule.description ?? undefined) && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text>{filterDescription(rule.description ?? undefined)}</Text>
          </div>
        )}

        <div className={styles.badges}>
          <Badge appearance="tint" shape="rounded" color={getScopeBadgeColor(rule.scope)}>
            {rule.scopeName}
          </Badge>
          <Badge appearance="tint" shape="rounded" color={
            rule.definition.executionContext === 'Client' ? 'brand' :
            rule.definition.executionContext === 'Server' ? 'important' : 'informative'
          }>
            {rule.definition.executionContext}
          </Badge>
        </div>

        {/* Conditions Section */}
        {rule.definition.conditions.length > 0 && (
          <div className={shared.section}>
            <div className={styles.sectionHeader}>
              <Text weight="semibold">IF</Text>
            </div>
            {rule.definition.conditions.map((condition, idx) => (
              <div key={idx} className={styles.conditionItem}>
                <Text>
                  {idx > 0 && <strong>{condition.logicOperator} </strong>}
                  <span className={shared.codeText}>{condition.field}</span> {condition.operator} <strong>'{condition.value}'</strong>
                </Text>
              </div>
            ))}
          </div>
        )}

        {/* THEN Actions Section */}
        {rule.definition.thenActions.length > 0 && (
          <div className={shared.section}>
            <div className={styles.sectionHeader}>
              <Text weight="semibold">THEN</Text>
            </div>
            {rule.definition.thenActions.map((action, idx) => (
              <div
                key={idx}
                className={styles.actionItem}
                style={{ borderLeftColor: getActionBorderColor(action.type) }}
              >
                <Badge appearance="filled" shape="rounded" size="small">{action.type}</Badge>
                <Text>
                  <span className={shared.codeText}>{action.field}</span>
                  {action.value && <> = <strong>{action.value}</strong></>}
                  {action.message && <>: <em>{action.message}</em></>}
                </Text>
              </div>
            ))}
          </div>
        )}

        {/* ELSE Actions Section */}
        {rule.definition.elseActions.length > 0 && (
          <div className={shared.section}>
            <div className={styles.sectionHeader}>
              <Text weight="semibold">ELSE</Text>
            </div>
            {rule.definition.elseActions.map((action, idx) => (
              <div
                key={idx}
                className={styles.actionItem}
                style={{ borderLeftColor: getActionBorderColor(action.type) }}
              >
                <Badge appearance="filled" shape="rounded" size="small">{action.type}</Badge>
                <Text>
                  <span className={shared.codeText}>{action.field}</span>
                  {action.value && <> = <strong>{action.value}</strong></>}
                  {action.message && <>: <em>{action.message}</em></>}
                </Text>
              </div>
            ))}
          </div>
        )}

        {rule.definition.parseError && (
          <div className={shared.section}>
            <Badge appearance="filled" shape="rounded" color="important">Parse Error</Badge>
            <Text style={{ color: tokens.colorPaletteRedForeground1, marginTop: tokens.spacingVerticalXS }}>
              {rule.definition.parseError}
            </Text>
          </div>
        )}
      </Card>
    </div>
  );

  // Empty state
  if (filteredRules.length === 0) {
    return (
      <EmptyState
        type="businessrules"
        message={
          entityLogicalName
            ? `No business rules found for the ${entityLogicalName} entity.`
            : 'No business rules are included in the selected solution(s).'
        }
      />
    );
  }

  return (
    <div className={shared.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search business rules..."
        filteredCount={searchedRules.length}
        totalCount={sortedRules.length}
        itemLabel="rules"
      >
        <FilterGroup
          label="State:"
          hasActiveFilters={(activeFilters['state']?.size ?? 0) > 0}
          onClear={() => clearFilter('state')}
        >
          {RULE_STATE_VALUES.map((state) => (
            <ToggleButton
              key={state}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeFilters['state']?.has(state) ?? false}
              disabled={stateCounts[state] === 0}
              onClick={() => toggleKey('state', state)}
            >
              {state}
            </ToggleButton>
          ))}
        </FilterGroup>
        <FilterGroup
          label="Scope:"
          hasActiveFilters={(activeFilters['scope']?.size ?? 0) > 0}
          onClear={() => clearFilter('scope')}
        >
          {RULE_SCOPE_VALUES.map((scope) => (
            <ToggleButton
              key={scope}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeFilters['scope']?.has(scope) ?? false}
              disabled={scopeCounts[scope] === 0}
              onClick={() => toggleKey('scope', scope)}
            >
              {scope}
            </ToggleButton>
          ))}
        </FilterGroup>
      </FilterBar>
      {searchedRules.length === 0 && sortedRules.length > 0 && (
        <EmptyState type="search" />
      )}
      {searchedRules.map((rule) => {
        const isExpanded = expandedRuleId === rule.id;
        const stateBadgeProps = getStateBadgeProps(rule.state);
        const conditionCount = rule.definition.conditions.length;
        const actionCount = rule.definition.thenActions.length + rule.definition.elseActions.length;

        return (
          <div key={rule.id}>
            <div
              className={`${shared.cardRow} ${styles.ruleRow} ${isExpanded ? shared.cardRowExpanded : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(rule.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(rule.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{rule.name}</Text>
                {filterDescription(rule.description ?? undefined) && (
                  <Text className={shared.codeText}>
                    {filterDescription(rule.description ?? undefined)}
                  </Text>
                )}
              </div>
              {!entityLogicalName && (
                <Text className={shared.codeText}>{rule.entity}</Text>
              )}
              <Badge appearance="tint" shape="rounded" color={getScopeBadgeColor(rule.scope)} size="small">
                {rule.scopeName}
              </Badge>
              <Badge {...stateBadgeProps}>{rule.state}</Badge>
              <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                {conditionCount} cond{conditionCount !== 1 ? 's' : ''}, {actionCount} action{actionCount !== 1 ? 's' : ''}
              </Text>
            </div>
            {isExpanded && renderRuleDetails(rule)}
          </div>
        );
      })}
    </div>
  );
}
