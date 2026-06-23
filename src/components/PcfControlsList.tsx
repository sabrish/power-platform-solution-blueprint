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
import { FilterBar } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { PcfControl } from '../core';
import { formatDate } from '../utils/dateFormat';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

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

interface PcfControlsListProps {
  pcfControls: PcfControl[];
}

export function PcfControlsList({ pcfControls }: PcfControlsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...pcfControls].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [pcfControls]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(
      c =>
        c.displayName.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.compatibleDataTypes.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (control: PcfControl): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>PCF Control Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Logical Name</Text>
            <Text className={shared.codeText}>{control.name}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Version</Text>
            <Text className={shared.detailValue}>{control.version || '—'}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(control.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(control.modifiedOn)}</Text>
          </div>
        </div>
        {control.compatibleDataTypes && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Compatible Data Types</Text>
            <div className={shared.badgeGroup}>
              {control.compatibleDataTypes.split(',').map((dt, i) => (
                <Badge key={i} appearance="outline" shape="rounded" size="small">
                  {dt.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  if (pcfControls.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No PCF Controls Found"
        message="No PCF controls were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search PCF controls..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="controls"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(control => {
        const isExpanded = expandedId === control.id;
        return (
          <div key={control.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(control.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(control.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{control.displayName}</Text>
                <Text className={shared.codeText}>{control.name}</Text>
              </div>
              {control.version && (
                <Badge appearance="outline" shape="rounded" size="small">
                  v{control.version}
                </Badge>
              )}
              <Badge
                appearance="filled"
                shape="rounded"
                color={control.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {control.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(control)}
          </div>
        );
      })}
    </div>
  );
}
