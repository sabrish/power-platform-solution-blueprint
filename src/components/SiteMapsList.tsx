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
import type { SiteMap } from '../core';

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

interface SiteMapsListProps {
  siteMaps: SiteMap[];
}

export function SiteMapsList({ siteMaps }: SiteMapsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...siteMaps].sort((a, b) => a.name.localeCompare(b.name)),
    [siteMaps]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.uniqueName.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (siteMap: SiteMap): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Site Map Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Unique Name</Text>
            <Text className={shared.codeText}>{siteMap.uniqueName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>App-Aware</Text>
            <Text className={shared.detailValue}>{siteMap.isAppAware ? 'Yes' : 'No'}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(siteMap.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(siteMap.modifiedOn)}</Text>
          </div>
        </div>
      </Card>
    </div>
  );

  if (siteMaps.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Site Maps Found"
        message="No site maps were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search site maps..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="site maps"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(siteMap => {
        const isExpanded = expandedId === siteMap.id;
        return (
          <div key={siteMap.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(siteMap.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(siteMap.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{siteMap.name}</Text>
                <Text className={shared.codeText}>{siteMap.uniqueName}</Text>
              </div>
              <Badge
                appearance="tint"
                shape="rounded"
                color={siteMap.isAppAware ? 'brand' : 'subtle'}
                size="small"
              >
                {siteMap.isAppAware ? 'App-Aware' : 'Legacy'}
              </Badge>
              <Badge
                appearance="filled"
                shape="rounded"
                color={siteMap.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {siteMap.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(siteMap)}
          </div>
        );
      })}
    </div>
  );
}
