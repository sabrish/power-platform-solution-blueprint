import { useCallback, useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  mergeClasses,
  tokens,
  Card,
  Title3,
  ToggleButton,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { FilterBar, FilterGroup } from './FilterBar';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';
import { useListFilter, type FilterSpec } from '../hooks/useListFilter';
import { formatDate } from '../utils/dateFormat';
import type { View } from '../core';

const VIEW_TYPE_VALUES = ['Public View', 'Quick Find', 'Advanced Find', 'Associated View', 'Lookup'];

const VIEWS_FILTER_SPECS: readonly FilterSpec<View>[] = [
  { name: 'queryType', getKey: (v) => v.queryTypeName },
];

const useStyles = makeStyles({
  listContainer: {
    marginTop: tokens.spacingVerticalL,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto auto auto`,
    alignItems: 'start',
  },
});

interface ViewsListProps {
  views: View[];
}

export function ViewsList({ views }: ViewsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...views].sort((a, b) => a.name.localeCompare(b.name)),
    [views]
  );

  const queryTypeCounts = useMemo(() => {
    const counts = Object.fromEntries(VIEW_TYPE_VALUES.map(t => [t, 0]));
    for (const v of sorted) {
      if (Object.prototype.hasOwnProperty.call(counts, v.queryTypeName)) {
        counts[v.queryTypeName] = (counts[v.queryTypeName] ?? 0) + 1;
      }
    }
    return counts;
  }, [sorted]);

  const {
    filteredItems,
    searchQuery,
    setSearchQuery,
    toggleKey,
    clearFilter,
    activeFilters,
  } = useListFilter(
    sorted,
    (v, q) =>
      v.name.toLowerCase().includes(q) ||
      v.returnedTypeCode.toLowerCase().includes(q) ||
      v.queryTypeName.toLowerCase().includes(q),
    VIEWS_FILTER_SPECS,
  );

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (view: View): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>View Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Entity</Text>
            <Text className={shared.codeText}>{view.returnedTypeCode}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>View Type</Text>
            <Text className={shared.detailValue}>{view.queryTypeName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Default View</Text>
            <Text className={shared.detailValue}>{view.isDefault ? 'Yes' : 'No'}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(view.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(view.modifiedOn)}</Text>
          </div>
        </div>
        {view.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.detailValue}>{view.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (views.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Views Found"
        message="No views were found in the selected solution(s)."
      />
    );
  }

  const activeQueryTypes = activeFilters['queryType'] ?? new Set<string>();

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search views..."
        filteredCount={filteredItems.length}
        totalCount={sorted.length}
        itemLabel="views"
      >
        <FilterGroup
          label="Type:"
          hasActiveFilters={activeQueryTypes.size > 0}
          onClear={() => clearFilter('queryType')}
        >
          {VIEW_TYPE_VALUES.map(qt => (
            <ToggleButton
              key={qt}
              size="small"
              shape="rounded"
              checked={activeQueryTypes.has(qt)}
              disabled={(queryTypeCounts[qt] ?? 0) === 0}
              onClick={() => toggleKey('queryType', qt)}
            >
              {qt}
            </ToggleButton>
          ))}
        </FilterGroup>
      </FilterBar>
      {filteredItems.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filteredItems.map(view => {
        const isExpanded = expandedId === view.id;
        return (
          <div key={view.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(view.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(view.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{view.name}</Text>
                <Text className={shared.codeText}>{view.returnedTypeCode}</Text>
              </div>
              <Badge appearance="outline" shape="rounded" size="small">
                {view.queryTypeName}
              </Badge>
              {view.isDefault && (
                <Badge appearance="tint" shape="rounded" color="brand" size="small">
                  Default
                </Badge>
              )}
              <Badge
                appearance="filled"
                shape="rounded"
                color={view.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {view.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(view)}
          </div>
        );
      })}
    </div>
  );
}
