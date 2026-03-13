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
import {
  ChevronDown20Regular,
  ChevronRight20Regular,
  Layer20Regular,
  ArrowDown20Regular,
} from '@fluentui/react-icons';
import type { BusinessProcessFlow, BPFStage } from '../core';
import { formatDate } from '../utils/dateFormat';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';
import { useListFilter, type FilterSpec } from '../hooks/useListFilter';

const BPF_STATE_VALUES = ['Active', 'Inactive'];

const BPF_FILTER_SPECS: readonly FilterSpec<BusinessProcessFlow>[] = [
  { name: 'state', getKey: (bpf) => bpf.state },
];

const useStyles = makeStyles({
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto auto auto`,
  },
  stagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  stageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  stageNumber: {
    minWidth: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  stageArrow: {
    display: 'flex',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
  },
});

interface BusinessProcessFlowsListProps {
  businessProcessFlows: BusinessProcessFlow[];
}

export function BusinessProcessFlowsList({ businessProcessFlows }: BusinessProcessFlowsListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...businessProcessFlows].sort((a, b) => a.name.localeCompare(b.name));
  }, [businessProcessFlows]);

  const stateCounts = useMemo(() => {
    const counts = Object.fromEntries(BPF_STATE_VALUES.map((s) => [s, 0]));
    for (const bpf of sorted) counts[bpf.state] = (counts[bpf.state] ?? 0) + 1;
    return counts;
  }, [sorted]);

  const {
    filteredItems: searchedBPFs,
    searchQuery,
    setSearchQuery,
    toggleKey,
    clearFilter,
    activeFilters,
  } = useListFilter(
    sorted,
    (bpf, q) =>
      bpf.name.toLowerCase().includes(q) ||
      bpf.primaryEntity.toLowerCase().includes(q) ||
      (bpf.primaryEntityDisplayName?.toLowerCase().includes(q) ?? false),
    BPF_FILTER_SPECS,
  );

  const toggleExpand = useCallback((id: string) => setExpandedId((prev) => (prev === id ? null : id)), []);

  const renderDetail = (bpf: BusinessProcessFlow): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Business Process Flow Details</Title3>

        <div className={`${shared.detailsGrid} ${shared.section}`}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Unique Name</Text>
            <Text className={shared.codeText} style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{bpf.uniqueName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Primary Entity</Text>
            <Text className={shared.detailValue}>
              {bpf.primaryEntityDisplayName || bpf.primaryEntity}
            </Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Total Stages</Text>
            <Text className={shared.detailValue}>{bpf.definition.stages.length}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Total Steps</Text>
            <Text className={shared.detailValue}>{bpf.definition.totalSteps}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Owner</Text>
            <Text className={shared.detailValue}>{bpf.owner}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>
              {formatDate(bpf.modifiedOn)} by {bpf.modifiedBy}
            </Text>
          </div>
        </div>

        {bpf.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text>{bpf.description}</Text>
          </div>
        )}

        {bpf.definition.crossEntityFlow && bpf.definition.entities.length > 0 && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Entities Involved</Text>
            <div className={shared.badgeGroup}>
              {bpf.definition.entities.map((entity) => (
                <Badge key={entity} appearance="outline" shape="rounded">{entity}</Badge>
              ))}
            </div>
            <Text
              style={{
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground3,
                marginTop: tokens.spacingVerticalXS,
                display: 'block',
              }}
            >
              This is a cross-entity flow that spans multiple entity forms.
            </Text>
          </div>
        )}

        {bpf.definition.stages.length > 0 && (
          <div className={shared.section}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Layer20Regular style={{ color: tokens.colorNeutralForeground3 }} />
              <Text weight="semibold">Process Stages</Text>
            </div>
            <div className={styles.stagesList}>
              {bpf.definition.stages.map((stage: BPFStage, index: number) => (
                <div key={stage.id}>
                  <div className={styles.stageItem}>
                    <div className={styles.stageNumber}>{stage.order + 1}</div>
                    <div>
                      <Text weight="semibold">{stage.name}</Text>
                      <Text
                        style={{
                          display: 'block',
                          fontSize: tokens.fontSizeBase200,
                          color: tokens.colorNeutralForeground3,
                        }}
                      >
                        Entity: {stage.entity}
                        {stage.steps.length > 0 && ` • ${stage.steps.length} steps`}
                      </Text>
                    </div>
                  </div>
                  {index < bpf.definition.stages.length - 1 && (
                    <div className={styles.stageArrow}>
                      <ArrowDown20Regular />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {bpf.definition.parseError && (
          <div className={shared.section}>
            <Text style={{ color: tokens.colorPaletteRedForeground1, fontSize: tokens.fontSizeBase200 }}>
              Parse warning: {bpf.definition.parseError}
            </Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (businessProcessFlows.length === 0) {
    return (
      <EmptyState
        type="workflows"
        message="No business process flows were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={shared.container} style={{ marginTop: tokens.spacingVerticalL }}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search business process flows..."
        filteredCount={searchedBPFs.length}
        totalCount={sorted.length}
        itemLabel="BPFs"
      >
        <FilterGroup
          label="State:"
          hasActiveFilters={(activeFilters['state']?.size ?? 0) > 0}
          onClear={() => clearFilter('state')}
        >
          {BPF_STATE_VALUES.map((state) => (
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
      </FilterBar>
      {searchedBPFs.length === 0 && sorted.length > 0 && (
        <EmptyState type="search" />
      )}
      {searchedBPFs.map((bpf) => {
        const isExpanded = expandedId === bpf.id;
        return (
          <div key={bpf.id}>
            <div
              className={`${shared.cardRow} ${styles.row} ${isExpanded ? shared.cardRowExpanded : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(bpf.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(bpf.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{bpf.name}</Text>
                <Text className={shared.codeText}>{bpf.uniqueName}</Text>
              </div>
              <Badge appearance="outline" shape="rounded" size="small">
                {bpf.primaryEntityDisplayName || bpf.primaryEntity}
              </Badge>
              <Badge appearance="tint" shape="rounded" color="brand" size="small">
                {bpf.definition.stages.length} stages
              </Badge>
              {bpf.definition.crossEntityFlow && (
                <Badge appearance="filled" shape="rounded" color="important" size="small">
                  Cross-Entity
                </Badge>
              )}
              <Badge
                appearance="filled"
                shape="rounded"
                color={bpf.state === 'Active' ? 'success' : 'warning'}
                size="small"
              >
                {bpf.state}
              </Badge>
            </div>
            {isExpanded && renderDetail(bpf)}
          </div>
        );
      })}
    </div>
  );
}
