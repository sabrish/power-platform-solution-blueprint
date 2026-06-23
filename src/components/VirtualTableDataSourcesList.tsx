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
import type { VirtualTableDataSource } from '../core';

const useStyles = makeStyles({
  listContainer: {
    marginTop: tokens.spacingVerticalL,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto`,
    alignItems: 'start',
  },
});

interface VirtualTableDataSourcesListProps {
  virtualTableDataSources: VirtualTableDataSource[];
}

export function VirtualTableDataSourcesList({
  virtualTableDataSources,
}: VirtualTableDataSourcesListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...virtualTableDataSources].sort((a, b) => a.name.localeCompare(b.name)),
    [virtualTableDataSources]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(
      ds =>
        ds.name.toLowerCase().includes(q) ||
        (ds.description ?? '').toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (ds: VirtualTableDataSource): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Virtual Table Data Source Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          {ds.dataSourceTypeId && (
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Data Source Type ID</Text>
              <Text className={shared.codeText}>{ds.dataSourceTypeId}</Text>
            </div>
          )}
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(ds.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(ds.modifiedOn)}</Text>
          </div>
        </div>
        {ds.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.detailValue}>{ds.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (virtualTableDataSources.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Virtual Table Data Sources Found"
        message="No virtual table data sources were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search data sources..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="data sources"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(ds => {
        const isExpanded = expandedId === ds.id;
        return (
          <div key={ds.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(ds.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(ds.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{ds.name}</Text>
              </div>
              <Badge
                appearance="filled"
                shape="rounded"
                color={ds.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {ds.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(ds)}
          </div>
        );
      })}
    </div>
  );
}
