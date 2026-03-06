import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  ToggleButton,
  Button,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { BusinessRule } from '../core';
import { TruncatedText } from './TruncatedText';
import { filterDescription } from '../utils/descriptionFilter';

const RULE_STATE_VALUES = ['Active', 'Draft'];
const RULE_SCOPE_VALUES = ['Entity', 'AllForms'];

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  filterButton: {
    minWidth: 'unset',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    height: '22px',
    fontSize: tokens.fontSizeBase100,
  },
  emptyState: {
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
  ruleRow: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) minmax(100px, 1fr) auto auto auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: tokens.shadow4,
    },
  },
  ruleRowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },
  nameColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    wordBreak: 'break-word',
  },
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  section: {
    marginTop: tokens.spacingVerticalM,
  },
  conditionItem: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
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
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStateFilters, setActiveStateFilters] = useState<Set<string>>(new Set());
  const [activeScopeFilters, setActiveScopeFilters] = useState<Set<string>>(new Set());

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

  // Apply ToggleButton filters
  const toggleFilteredRules = useMemo(() => {
    let filtered = sortedRules;
    if (activeStateFilters.size > 0) {
      filtered = filtered.filter((r) => activeStateFilters.has(r.state));
    }
    if (activeScopeFilters.size > 0) {
      filtered = filtered.filter((r) => activeScopeFilters.has(r.scope));
    }
    return filtered;
  }, [sortedRules, activeStateFilters, activeScopeFilters]);

  // Apply search filter
  const searchedRules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return toggleFilteredRules;
    return toggleFilteredRules.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.entity.toLowerCase().includes(q)
    );
  }, [toggleFilteredRules, searchQuery]);

  const toggleStateFilter = (state: string) => {
    setActiveStateFilters((prev) => {
      const next = new Set(prev);
      if (next.has(state)) {
        next.delete(state);
      } else {
        next.add(state);
      }
      return next;
    });
  };

  const toggleScopeFilter = (scope: string) => {
    setActiveScopeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) {
        next.delete(scope);
      } else {
        next.add(scope);
      }
      return next;
    });
  };

  const toggleExpand = (ruleId: string) => {
    setExpandedRuleId(expandedRuleId === ruleId ? null : ruleId);
  };

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

  const getActionColor = (actionType: string): string => {
    const colors: Record<string, string> = {
      'ShowField': tokens.colorPaletteGreenBackground2,
      'HideField': tokens.colorPaletteRedBackground2,
      'SetValue': tokens.colorPaletteBlueBorderActive,
      'SetRequired': tokens.colorPaletteYellowBackground2,
      'LockField': tokens.colorPaletteDarkOrangeBackground2,
      'UnlockField': tokens.colorPaletteGreenBackground2,
      'ShowError': tokens.colorPaletteRedBackground2,
    };
    return colors[actionType] || tokens.colorNeutralBackground3;
  };

  const renderRuleDetails = (rule: BusinessRule) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>{rule.name}</Title3>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Entity</Text>
            <Text className={styles.detailValue}>
              {rule.entityDisplayName || rule.entity}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Scope</Text>
            <Text className={styles.detailValue}>{rule.scopeName}</Text>
          </div>
          {rule.formName && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Form</Text>
              <Text className={styles.detailValue}>{rule.formName}</Text>
            </div>
          )}
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Owner</Text>
            <Text className={styles.detailValue}>{rule.owner}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Last Modified</Text>
            <Text className={styles.detailValue}>
              {new Date(rule.modifiedOn).toLocaleString()}
            </Text>
          </div>
        </div>

        {filterDescription(rule.description ?? undefined) && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Description</Text>
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
          <div className={styles.section}>
            <Title3>IF (Conditions)</Title3>
            <Text weight="semibold" style={{ marginBottom: tokens.spacingVerticalS }}>
              {rule.definition.conditionLogic}
            </Text>
            {rule.definition.conditions.map((condition, idx) => (
              <div key={idx} className={styles.conditionItem}>
                <Text>
                  {idx > 0 && <strong>{condition.logicOperator} </strong>}
                  <span className={styles.codeText}>{condition.field}</span> {condition.operator} <strong>'{condition.value}'</strong>
                </Text>
              </div>
            ))}
          </div>
        )}

        {/* Actions Section */}
        {rule.definition.actions.length > 0 && (
          <div className={styles.section}>
            <Title3>THEN (Actions)</Title3>
            {rule.definition.actions.map((action, idx) => (
              <div
                key={idx}
                className={styles.actionItem}
                style={{ backgroundColor: getActionColor(action.type) }}
              >
                <Badge appearance="filled" shape="rounded" size="small">{action.type}</Badge>
                <Text>
                  <span className={styles.codeText}>{action.field}</span>
                  {action.value && <> = <strong>{action.value}</strong></>}
                  {action.message && <>: <em>{action.message}</em></>}
                </Text>
              </div>
            ))}
          </div>
        )}

        {rule.definition.parseError && (
          <div className={styles.section}>
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
      <div className={styles.emptyState}>
        <Text style={{ fontSize: '48px' }}>📋</Text>
        <Text size={500} weight="semibold">
          No Business Rules Found
        </Text>
        <Text>
          {entityLogicalName
            ? `No business rules found for the ${entityLogicalName} entity.`
            : 'No business rules were found in the selected solution(s).'}
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search business rules..."
        filteredCount={searchedRules.length}
        totalCount={sortedRules.length}
        itemLabel="rules"
      >
        <FilterGroup label="State:">
          {RULE_STATE_VALUES.map((state) => (
            <ToggleButton
              key={state}
              className={styles.filterButton}
              size="small"
              checked={activeStateFilters.has(state)}
              disabled={stateCounts[state] === 0}
              onClick={() => toggleStateFilter(state)}
            >
              {state}
            </ToggleButton>
          ))}
          {activeStateFilters.size > 0 && (
            <Button appearance="subtle" size="small" onClick={() => setActiveStateFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
        <FilterGroup label="Scope:">
          {RULE_SCOPE_VALUES.map((scope) => (
            <ToggleButton
              key={scope}
              className={styles.filterButton}
              size="small"
              checked={activeScopeFilters.has(scope)}
              disabled={scopeCounts[scope] === 0}
              onClick={() => toggleScopeFilter(scope)}
            >
              {scope}
            </ToggleButton>
          ))}
          {activeScopeFilters.size > 0 && (
            <Button appearance="subtle" size="small" onClick={() => setActiveScopeFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
      </FilterBar>
      {searchedRules.length === 0 && sortedRules.length > 0 && (
        <div className={styles.emptyState}>
          <Text>No business rules match your search.</Text>
        </div>
      )}
      {searchedRules.map((rule) => {
        const isExpanded = expandedRuleId === rule.id;
        const stateBadgeProps = getStateBadgeProps(rule.state);
        const conditionCount = rule.definition.conditions.length;
        const actionCount = rule.definition.actions.length;

        return (
          <div key={rule.id}>
            <div
              className={`${styles.ruleRow} ${isExpanded ? styles.ruleRowExpanded : ''}`}
              onClick={() => toggleExpand(rule.id)}
            >
              <div className={styles.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={styles.nameColumn}>
                <Text weight="semibold">
                  <TruncatedText text={rule.name} />
                </Text>
                {filterDescription(rule.description ?? undefined) && (
                  <Text className={styles.codeText}>
                    <TruncatedText text={filterDescription(rule.description ?? undefined)!} />
                  </Text>
                )}
              </div>
              {!entityLogicalName && (
                <Text className={styles.codeText}>
                  <TruncatedText text={rule.entity} />
                </Text>
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
