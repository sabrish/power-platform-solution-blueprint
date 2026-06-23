import { useCallback, useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  mergeClasses,
  tokens,
  Card,
  Title3,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';
import { formatDate } from '../utils/dateFormat';
import type { Chart } from '../core';

const useStyles = makeStyles({
  listContainer: {
    marginTop: tokens.spacingVerticalL,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto auto`,
    alignItems: 'start',
  },
});

interface ChartsListProps {
  charts: Chart[];
}

export function ChartsList({ charts }: ChartsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...charts].sort((a, b) => a.name.localeCompare(b.name)),
    [charts]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.primaryEntityTypeCode.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (chart: Chart): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Chart Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Entity</Text>
            <Text className={shared.codeText}>{chart.primaryEntityTypeCode}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Default Chart</Text>
            <Text className={shared.detailValue}>{chart.isDefault ? 'Yes' : 'No'}</Text>
          </div>
          {chart.chartType !== null && (
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Chart Type</Text>
              <Text className={shared.detailValue}>{chart.chartType}</Text>
            </div>
          )}
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(chart.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(chart.modifiedOn)}</Text>
          </div>
        </div>
        {chart.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.detailValue}>{chart.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (charts.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Charts Found"
        message="No charts were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search charts..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="charts"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(chart => {
        const isExpanded = expandedId === chart.id;
        return (
          <div key={chart.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(chart.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(chart.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{chart.name}</Text>
                <Text className={shared.codeText}>{chart.primaryEntityTypeCode}</Text>
              </div>
              {chart.isDefault && (
                <Badge appearance="tint" shape="rounded" color="brand" size="small">
                  Default
                </Badge>
              )}
              <Badge
                appearance="filled"
                shape="rounded"
                color={chart.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {chart.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(chart)}
          </div>
        );
      })}
    </div>
  );
}
