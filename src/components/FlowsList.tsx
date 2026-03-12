import { useCallback, useMemo, useState } from 'react';
import {
  Text,
  Badge,
  Checkbox,
  makeStyles,
  mergeClasses,
  tokens,
  Card,
  Title3,
  ToggleButton,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular, Globe20Regular } from '@fluentui/react-icons';
import type { Flow } from '../core';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';
import { useListFilter, type FilterSpec } from '../hooks/useListFilter';

const FLOW_TYPE_VALUES = ['Dataverse', 'Scheduled', 'Manual', 'Other'];
const FLOW_STATE_VALUES = ['Active', 'Draft', 'Suspended'];

const FLOWS_FILTER_SPECS: readonly FilterSpec<Flow>[] = [
  { name: 'type',  getKey: (f) => f.definition.triggerType },
  { name: 'state', getKey: (f) => f.state },
];

const useStyles = makeStyles({
  flowRow: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) minmax(100px, 1fr) auto auto auto auto`,
  },
  externalCallItem: {
    padding: tokens.spacingVerticalS,
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    marginBottom: tokens.spacingVerticalS,
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalM,
  },
  codeBreakAll: {
    wordBreak: 'break-all',
  },
});

export interface FlowsListProps {
  flows: Flow[];
  entityLogicalName?: string;
}

export function FlowsList({
  flows,
  entityLogicalName,
}: FlowsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedFlowId, setExpandedFlowId] = useState<string | null>(null);
  const [showExternalOnly, setShowExternalOnly] = useState(false);

  // Filter flows by entity if specified
  const filteredFlows = useMemo(() => {
    if (!entityLogicalName) return flows;
    return flows.filter((f) => f.entity?.toLowerCase() === entityLogicalName.toLowerCase());
  }, [flows, entityLogicalName]);

  // Sort flows by state (Active first), then by name
  const sortedFlows = useMemo(() => {
    return [...filteredFlows].sort((a, b) => {
      if (a.state !== b.state) {
        if (a.state === 'Active') return -1;
        if (b.state === 'Active') return 1;
        if (a.state === 'Draft') return -1;
        if (b.state === 'Draft') return 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredFlows]);

  // Count per type / state in the base dataset (drives disabled state on filter buttons)
  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(FLOW_TYPE_VALUES.map((t) => [t, 0]));
    for (const f of sortedFlows) counts[f.definition.triggerType] = (counts[f.definition.triggerType] ?? 0) + 1;
    return counts;
  }, [sortedFlows]);

  const stateCounts = useMemo(() => {
    const counts = Object.fromEntries(FLOW_STATE_VALUES.map((s) => [s, 0]));
    for (const f of sortedFlows) counts[f.state] = (counts[f.state] ?? 0) + 1;
    return counts;
  }, [sortedFlows]);

  const {
    filteredItems: searchedFlows,
    searchQuery,
    setSearchQuery,
    toggleKey,
    clearFilter,
    activeFilters,
  } = useListFilter(
    sortedFlows,
    (f, q) =>
      f.name.toLowerCase().includes(q) ||
      (f.entity?.toLowerCase().includes(q) ?? false) ||
      (f.description?.toLowerCase().includes(q) ?? false) ||
      f.definition.triggerType.toLowerCase().includes(q),
    FLOWS_FILTER_SPECS,
  );

  const displayedFlows = useMemo(
    () => showExternalOnly ? searchedFlows.filter(f => f.hasExternalCalls) : searchedFlows,
    [searchedFlows, showExternalOnly],
  );

  const toggleExpand = useCallback((flowId: string) => {
    setExpandedFlowId(prev => prev === flowId ? null : flowId);
  }, []);

  const getStateBadgeProps = (state: Flow['state']) => {
    switch (state) {
      case 'Active':
        return { appearance: 'filled' as const, color: 'success' as const, shape: 'rounded' as const };
      case 'Draft':
        return { appearance: 'filled' as const, color: 'warning' as const, shape: 'rounded' as const };
      case 'Suspended':
        return { appearance: 'filled' as const, color: 'important' as const, shape: 'rounded' as const };
      default:
        return { appearance: 'outline' as const, color: 'subtle' as const, shape: 'rounded' as const };
    }
  };

  const renderFlowDetails = (flow: Flow): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Flow Details</Title3>

        <div className={shared.detailsGrid}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Entity</Text>
            <Text className={shared.detailValue}>
              {flow.entityDisplayName || flow.definition.triggerEntity || flow.entity || '—'}
            </Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Owner</Text>
            <Text className={shared.detailValue}>{flow.owner}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Modified By</Text>
            <Text className={shared.detailValue}>{flow.modifiedBy}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Modified On</Text>
            <Text className={shared.detailValue}>
              {formatDateTime(flow.modifiedOn)}
            </Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Actions Count</Text>
            <Text className={shared.detailValue}>{flow.definition.actionsCount}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Scope</Text>
            <Text className={shared.detailValue}>{flow.scopeName}</Text>
          </div>
        </div>

        <div className={styles.badges}>
          <Badge appearance="tint" shape="rounded" color="brand">
            {flow.definition.triggerType}
          </Badge>
          {flow.definition.triggerEvent !== 'Unknown' && flow.definition.triggerEvent !== flow.definition.triggerType && (
            <Badge appearance="outline" shape="rounded">
              {flow.definition.triggerEvent}
            </Badge>
          )}
          {flow.hasExternalCalls && (
            <Badge appearance="tint" shape="rounded" color="important">
              External Calls
            </Badge>
          )}
          {flow.definition.triggerConditions && (
            <Badge appearance="outline" shape="rounded" color="informative">
              Filtered
            </Badge>
          )}
        </div>

        {flow.definition.triggerConditions && (
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Trigger Filter</Text>
            <Text className={`${shared.detailValue} ${shared.codeText} ${styles.codeBreakAll}`}>
              {flow.definition.triggerConditions}
            </Text>
          </div>
        )}

        {flow.definition.connectionReferences.length > 0 && (
          <div className={shared.section}>
            <Title3>Connectors ({flow.definition.connectionReferences.length})</Title3>
            <div className={shared.badgeGroup}>
              {flow.definition.connectionReferences.map((ref, idx) => (
                <Badge key={idx} appearance="tint" shape="rounded" size="small">
                  {ref}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {flow.definition.externalCalls.length > 0 && (
          <div className={shared.section}>
            <Title3>External API Calls ({flow.definition.externalCalls.length})</Title3>
            {flow.definition.externalCalls.map((call, idx) => (
              <div key={idx} className={styles.externalCallItem}>
                <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text weight="semibold">{call.actionName}</Text>
                  <Badge appearance="outline" shape="rounded" size="small">
                    {call.method || 'UNKNOWN'}
                  </Badge>
                  <Badge
                    appearance="tint"
                    shape="rounded"
                    color={call.confidence === 'High' ? 'success' : call.confidence === 'Medium' ? 'warning' : 'subtle'}
                    size="small"
                  >
                    {call.confidence}
                  </Badge>
                </div>
                <Text className={shared.codeText} style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                  {call.url}
                </Text>
                <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                  Domain: {call.domain}
                </Text>
              </div>
            ))}
          </div>
        )}

        <div className={shared.section}>
          <Title3>Technical Details</Title3>
          <div className={shared.detailsGrid}>
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Flow ID</Text>
              <Text className={shared.codeText}>{flow.id}</Text>
            </div>
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>State Code</Text>
              <Text className={shared.detailValue}>{flow.stateCode}</Text>
            </div>
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Scope Value</Text>
              <Text className={shared.detailValue}>{flow.scope}</Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Empty state
  if (filteredFlows.length === 0) {
    return (
      <EmptyState
        type="flows"
        message={
          entityLogicalName
            ? `No flows found for the ${entityLogicalName} entity.`
            : 'No cloud flows are included in the selected solution(s).'
        }
      />
    );
  }

  return (
    <div className={shared.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search flows..."
        filteredCount={displayedFlows.length}
        totalCount={sortedFlows.length}
        itemLabel="flows"
      >
        <FilterGroup
          label="Type:"
          hasActiveFilters={(activeFilters['type']?.size ?? 0) > 0}
          onClear={() => clearFilter('type')}
        >
          {FLOW_TYPE_VALUES.map((type) => (
            <ToggleButton
              key={type}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeFilters['type']?.has(type) ?? false}
              disabled={typeCounts[type] === 0}
              onClick={() => toggleKey('type', type)}
            >
              {type}
            </ToggleButton>
          ))}
        </FilterGroup>
        <FilterGroup
          label="State:"
          hasActiveFilters={(activeFilters['state']?.size ?? 0) > 0}
          onClear={() => clearFilter('state')}
        >
          {FLOW_STATE_VALUES.map((state) => (
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
          label="Show:"
          hasActiveFilters={showExternalOnly}
          onClear={() => setShowExternalOnly(false)}
        >
          <Checkbox
            label="External calls only"
            checked={showExternalOnly}
            onChange={(_, data) => setShowExternalOnly(Boolean(data.checked))}
          />
        </FilterGroup>
      </FilterBar>
      {displayedFlows.length === 0 && sortedFlows.length > 0 && (
        <EmptyState type="search" />
      )}
      {displayedFlows.map((flow) => {
        const isExpanded = expandedFlowId === flow.id;
        const stateBadgeProps = getStateBadgeProps(flow.state);

        return (
          <div key={flow.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.flowRow, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(flow.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(flow.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold" className={shared.wrapText}>
                  {flow.name}
                </Text>
                {flow.description && (
                  <Text className={shared.codeText}>{flow.description}</Text>
                )}
              </div>
              {!entityLogicalName && (flow.definition.triggerEntity || flow.entity) && (
                <Text className={shared.codeText}>
                  {flow.definition.triggerEntity || flow.entity}
                </Text>
              )}
              <div className={shared.badgeGroup}>
                <Badge appearance="tint" shape="rounded" color="brand" size="small">
                  {flow.definition.triggerType}
                </Badge>
                {flow.definition.triggerEvent !== 'Unknown' &&
                  flow.definition.triggerEvent !== flow.definition.triggerType && (
                  <Badge appearance="outline" shape="rounded" size="small">
                    {flow.definition.triggerEvent}
                  </Badge>
                )}
              </div>
              <Badge {...stateBadgeProps}>{flow.state}</Badge>
              {flow.hasExternalCalls
                ? <Globe20Regular style={{ color: tokens.colorBrandForeground1 }} title="Makes external calls" />
                : <span aria-hidden="true" />
              }
              <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                {formatDate(flow.modifiedOn)}
              </Text>
            </div>
            {isExpanded && renderFlowDetails(flow)}
          </div>
        );
      })}
    </div>
  );
}
