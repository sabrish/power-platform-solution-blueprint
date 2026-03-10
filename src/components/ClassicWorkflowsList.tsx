import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  Link,
  MessageBar,
  MessageBarBody,
  ToggleButton,
  Button,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import {
  ChevronDown20Regular,
  ChevronRight20Regular,
  Warning20Regular,
  FlashFlow20Regular,
  Cloud20Regular,
} from '@fluentui/react-icons';
import type { ClassicWorkflow } from '../core';
import { formatDate } from '../utils/dateFormat';
import { TruncatedText } from './TruncatedText';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

const WORKFLOW_MODE_VALUES = ['Background', 'RealTime'];
const WORKFLOW_STATE_VALUES = ['Active', 'Draft'];

const useStyles = makeStyles({
  warning: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderLeft: `4px solid ${tokens.colorPaletteYellowForeground1}`,
    marginBottom: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto auto auto',
  },
  featureItem: {
    padding: tokens.spacingVerticalS,
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalS,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
});

interface ClassicWorkflowsListProps {
  workflows: ClassicWorkflow[];
}

const complexityColor = (c: string | undefined): 'success' | 'warning' | 'danger' | 'severe' => {
  switch (c) {
    case 'Critical': return 'severe';
    case 'High': return 'danger';
    case 'Medium': return 'warning';
    default: return 'success';
  }
};

export function ClassicWorkflowsList({ workflows }: ClassicWorkflowsListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModeFilters, setActiveModeFilters] = useState<Set<string>>(new Set());
  const [activeStateFilters, setActiveStateFilters] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return [...workflows].sort((a, b) => {
      const ac = a.migrationRecommendation?.complexity || 'Low';
      const bc = b.migrationRecommendation?.complexity || 'Low';
      return (order[ac] ?? 3) - (order[bc] ?? 3);
    });
  }, [workflows]);

  const modeCounts = useMemo(() => {
    const counts = Object.fromEntries(WORKFLOW_MODE_VALUES.map((m) => [m, 0]));
    for (const w of sorted) counts[w.modeName] = (counts[w.modeName] ?? 0) + 1;
    return counts;
  }, [sorted]);

  const stateCounts = useMemo(() => {
    const counts = Object.fromEntries(WORKFLOW_STATE_VALUES.map((s) => [s, 0]));
    for (const w of sorted) counts[w.state] = (counts[w.state] ?? 0) + 1;
    return counts;
  }, [sorted]);

  // Apply ToggleButton filters
  const toggleFilteredWorkflows = useMemo(() => {
    let filtered = sorted;
    if (activeModeFilters.size > 0) {
      filtered = filtered.filter((w) => activeModeFilters.has(w.modeName));
    }
    if (activeStateFilters.size > 0) {
      filtered = filtered.filter((w) => activeStateFilters.has(w.state));
    }
    return filtered;
  }, [sorted, activeModeFilters, activeStateFilters]);

  const searchedWorkflows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return toggleFilteredWorkflows;
    return toggleFilteredWorkflows.filter((w) =>
      w.name.toLowerCase().includes(q) ||
      (w.entity && w.entity.toLowerCase().includes(q)) ||
      (w.entityDisplayName && w.entityDisplayName.toLowerCase().includes(q))
    );
  }, [toggleFilteredWorkflows, searchQuery]);

  const toggleModeFilter = (mode: string) => {
    setActiveModeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) {
        next.delete(mode);
      } else {
        next.add(mode);
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

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const getTriggers = (w: ClassicWorkflow): string => {
    const t: string[] = [];
    if (w.triggerOnCreate) t.push('Create');
    if (w.triggerOnUpdate) t.push('Update');
    if (w.triggerOnDelete) t.push('Delete');
    if (w.onDemand) t.push('On-Demand');
    return t.join(', ') || 'None';
  };

  const renderDetail = (workflow: ClassicWorkflow) => {
    const rec = workflow.migrationRecommendation;
    return (
      <div className={shared.expandedDetails}>
        <Card>
          <Title3>Classic Workflow Details</Title3>

          {rec?.advisory && (
            <div className={shared.section}>
              <MessageBar intent={workflow.mode === 1 ? 'warning' : 'info'}>
                <MessageBarBody>{rec.advisory}</MessageBarBody>
              </MessageBar>
            </div>
          )}

          <div className={`${shared.detailsGrid} ${shared.section}`}>
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Entity</Text>
              <Text className={shared.detailValue}>{workflow.entityDisplayName || workflow.entity}</Text>
            </div>
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Type</Text>
              <Text className={shared.detailValue}>{workflow.typeName}</Text>
            </div>
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Scope</Text>
              <Text className={shared.detailValue}>{workflow.scopeName}</Text>
            </div>
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Triggers</Text>
              <Text className={shared.detailValue}>{getTriggers(workflow)}</Text>
            </div>
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Owner</Text>
              <Text className={shared.detailValue}>{workflow.owner}</Text>
            </div>
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Last Modified</Text>
              <Text className={shared.detailValue}>
                {formatDate(workflow.modifiedOn)} by {workflow.modifiedBy}
              </Text>
            </div>
          </div>

        </Card>
      </div>
    );
  };

  if (workflows.length === 0) {
    return (
      <EmptyState
        type="workflows"
        message="No classic workflows were found in the selected solution(s)."
      />
    );
  }

  return (
    <div style={{ marginTop: tokens.spacingVerticalL }}>
      <div className={styles.warning}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Warning20Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
          <Text weight="semibold">Classic Workflows Detected</Text>
        </div>
        <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 }}>
          Classic workflows are legacy technology. Microsoft recommends migrating to Power Automate cloud flows.{' '}
          <Link href="https://learn.microsoft.com/en-us/power-automate/replace-workflows-with-flows" target="_blank" rel="noopener noreferrer">
            Learn more
          </Link>
          . Click a row to see detailed migration guidance.
        </Text>
      </div>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search workflows..."
        filteredCount={searchedWorkflows.length}
        totalCount={sorted.length}
        itemLabel="workflows"
      >
        <FilterGroup label="Mode:">
          {WORKFLOW_MODE_VALUES.map((mode) => (
            <ToggleButton
              key={mode}
              className={shared.filterButton}
              size="small"
              checked={activeModeFilters.has(mode)}
              disabled={modeCounts[mode] === 0}
              onClick={() => toggleModeFilter(mode)}
            >
              {mode}
            </ToggleButton>
          ))}
          {activeModeFilters.size > 0 && (
            <Button appearance="transparent" size="small" onClick={() => setActiveModeFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
        <FilterGroup label="State:">
          {WORKFLOW_STATE_VALUES.map((state) => (
            <ToggleButton
              key={state}
              className={shared.filterButton}
              size="small"
              checked={activeStateFilters.has(state)}
              disabled={stateCounts[state] === 0}
              onClick={() => toggleStateFilter(state)}
            >
              {state}
            </ToggleButton>
          ))}
          {activeStateFilters.size > 0 && (
            <Button appearance="transparent" size="small" onClick={() => setActiveStateFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
      </FilterBar>

      <div className={shared.container}>
        {searchedWorkflows.length === 0 && sorted.length > 0 && (
          <EmptyState type="search" />
        )}
        {searchedWorkflows.map((workflow) => {
          const isExpanded = expandedId === workflow.id;
          const complexity = workflow.migrationRecommendation?.complexity || 'Low';
          return (
            <div key={workflow.id}>
              <div
                className={`${shared.cardRow} ${styles.row} ${isExpanded ? shared.cardRowExpanded : ''}`}
                onClick={() => toggleExpand(workflow.id)}
              >
                <div className={shared.chevron}>
                  {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                </div>
                <div className={shared.nameColumn}>
                  <Text weight="semibold">
                    <TruncatedText text={workflow.name} />
                  </Text>
                  {workflow.description && (
                    <Text className={shared.codeText}>
                      <TruncatedText text={workflow.description} />
                    </Text>
                  )}
                </div>
                <Text className={shared.codeText}>
                  <TruncatedText text={workflow.entityDisplayName || workflow.entity} />
                </Text>
                <Badge appearance="tint" shape="rounded" color={workflow.mode === 1 ? 'warning' : 'informative'} size="small">
                  {workflow.mode === 1 ? <><FlashFlow20Regular /> RealTime</> : <><Cloud20Regular /> Background</>}
                </Badge>
                <Badge appearance="filled" shape="rounded"
                  color={workflow.state === 'Active' ? 'success' : workflow.state === 'Draft' ? 'warning' : 'danger'}
                  size="small"
                >
                  {workflow.state}
                </Badge>
                <Badge appearance="filled" shape="rounded" color={complexityColor(complexity)} size="small">
                  {complexity}
                </Badge>
              </div>
              {isExpanded && renderDetail(workflow)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
