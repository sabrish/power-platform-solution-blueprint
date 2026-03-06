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
import type { Flow } from '../core';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import { TruncatedText } from './TruncatedText';

const FLOW_TYPE_VALUES = ['Dataverse', 'Scheduled', 'Manual', 'Other'];
const FLOW_STATE_VALUES = ['Active', 'Draft', 'Suspended'];

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
  flowRow: {
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
  flowRowExpanded: {
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
});

export interface FlowsListProps {
  flows: Flow[];
  entityLogicalName?: string;
}

export function FlowsList({
  flows,
  entityLogicalName,
}: FlowsListProps) {
  const styles = useStyles();
  const [expandedFlowId, setExpandedFlowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<string>>(new Set());
  const [activeStateFilters, setActiveStateFilters] = useState<Set<string>>(new Set());

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

  // Apply ToggleButton filters
  const toggleFilteredFlows = useMemo(() => {
    let filtered = sortedFlows;
    if (activeTypeFilters.size > 0) {
      filtered = filtered.filter((f) => activeTypeFilters.has(f.definition.triggerType));
    }
    if (activeStateFilters.size > 0) {
      filtered = filtered.filter((f) => activeStateFilters.has(f.state));
    }
    return filtered;
  }, [sortedFlows, activeTypeFilters, activeStateFilters]);

  // Apply search filter
  const searchedFlows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return toggleFilteredFlows;
    return toggleFilteredFlows.filter((f) =>
      f.name.toLowerCase().includes(q) ||
      (f.entity && f.entity.toLowerCase().includes(q)) ||
      (f.description && f.description.toLowerCase().includes(q)) ||
      (f.definition.triggerType && f.definition.triggerType.toLowerCase().includes(q))
    );
  }, [toggleFilteredFlows, searchQuery]);

  const toggleTypeFilter = (type: string) => {
    setActiveTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

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

  const toggleExpand = (flowId: string) => {
    setExpandedFlowId(expandedFlowId === flowId ? null : flowId);
  };

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

  const renderFlowDetails = (flow: Flow) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>Flow Details</Title3>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Entity</Text>
            <Text className={styles.detailValue}>
              {flow.entityDisplayName || flow.definition.triggerEntity || flow.entity || '—'}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Owner</Text>
            <Text className={styles.detailValue}>{flow.owner}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Modified By</Text>
            <Text className={styles.detailValue}>{flow.modifiedBy}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Modified On</Text>
            <Text className={styles.detailValue}>
              {formatDateTime(flow.modifiedOn)}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Actions Count</Text>
            <Text className={styles.detailValue}>{flow.definition.actionsCount}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Scope</Text>
            <Text className={styles.detailValue}>{flow.scopeName}</Text>
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
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Trigger Filter</Text>
            <Text className={`${styles.detailValue} ${styles.codeText}`} style={{ wordBreak: 'break-all' }}>
              {flow.definition.triggerConditions}
            </Text>
          </div>
        )}

        {flow.definition.connectionReferences.length > 0 && (
          <div className={styles.section}>
            <Title3>Connectors ({flow.definition.connectionReferences.length})</Title3>
            <div className={styles.badgeGroup}>
              {flow.definition.connectionReferences.map((ref, idx) => (
                <Badge key={idx} appearance="tint" size="small">
                  {ref}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {flow.definition.externalCalls.length > 0 && (
          <div className={styles.section}>
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
                    color={call.confidence === 'High' ? 'success' : call.confidence === 'Medium' ? 'warning' : 'subtle'}
                    size="small"
                  >
                    {call.confidence}
                  </Badge>
                </div>
                <Text className={styles.codeText}>
                  <TruncatedText text={call.url} />
                </Text>
                <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                  Domain: {call.domain}
                </Text>
              </div>
            ))}
          </div>
        )}

        <div className={styles.section}>
          <Title3>Technical Details</Title3>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Flow ID</Text>
              <Text className={styles.codeText}>{flow.id}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>State Code</Text>
              <Text className={styles.detailValue}>{flow.stateCode}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Scope Value</Text>
              <Text className={styles.detailValue}>{flow.scope}</Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Empty state
  if (filteredFlows.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text style={{ fontSize: '48px' }}>🌊</Text>
        <Text size={500} weight="semibold">
          No Flows Found
        </Text>
        <Text>
          {entityLogicalName
            ? `No flows found for the ${entityLogicalName} entity.`
            : 'No flows were found in the selected solution(s).'}
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search flows..."
        filteredCount={searchedFlows.length}
        totalCount={sortedFlows.length}
        itemLabel="flows"
      >
        <FilterGroup label="Type:">
          {FLOW_TYPE_VALUES.map((type) => (
            <ToggleButton
              key={type}
              className={styles.filterButton}
              size="small"
              checked={activeTypeFilters.has(type)}
              disabled={typeCounts[type] === 0}
              onClick={() => toggleTypeFilter(type)}
            >
              {type}
            </ToggleButton>
          ))}
          {activeTypeFilters.size > 0 && (
            <Button appearance="subtle" size="small" onClick={() => setActiveTypeFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
        <FilterGroup label="State:">
          {FLOW_STATE_VALUES.map((state) => (
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
      </FilterBar>
      {searchedFlows.length === 0 && sortedFlows.length > 0 && (
        <div className={styles.emptyState}>
          <Text>No flows match your search.</Text>
        </div>
      )}
      {searchedFlows.map((flow) => {
        const isExpanded = expandedFlowId === flow.id;
        const stateBadgeProps = getStateBadgeProps(flow.state);

        return (
          <div key={flow.id}>
            <div
              className={`${styles.flowRow} ${isExpanded ? styles.flowRowExpanded : ''}`}
              onClick={() => toggleExpand(flow.id)}
            >
              <div className={styles.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={styles.nameColumn}>
                <Text weight="semibold" className={styles.wrapText}>
                  {flow.name}
                </Text>
                {flow.description && (
                  <Text className={styles.codeText}>
                    <TruncatedText text={flow.description} />
                  </Text>
                )}
              </div>
              {!entityLogicalName && (flow.definition.triggerEntity || flow.entity) && (
                <Text className={styles.codeText}>
                  <TruncatedText text={flow.definition.triggerEntity || flow.entity || ''} />
                </Text>
              )}
              <Badge appearance="tint" shape="rounded" color="brand" size="small">
                {flow.definition.triggerType}
              </Badge>
              <Badge {...stateBadgeProps}>{flow.state}</Badge>
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
