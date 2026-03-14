import { useState, useMemo, useCallback } from 'react';
import {
  Text,
  Badge,
  ToggleButton,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { ConnectionReference } from '../core';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

const CONN_STATUS_VALUES = ['Connected', 'Not Connected'];

const useStyles = makeStyles({
  listContainer: {
    marginTop: tokens.spacingVerticalL,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) minmax(120px, 1fr) auto`,
    alignItems: 'start',
  },
  /** Connector display name column — AUDIT-006: full overflow protection required */
  connectorColumn: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    minWidth: 0,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  },
  /** Muted text for unset / placeholder values */
  mutedText: {
    color: tokens.colorNeutralForeground3,
  },
});

interface ConnectionReferencesListProps {
  connectionReferences: ConnectionReference[];
}

export function ConnectionReferencesList({ connectionReferences }: ConnectionReferencesListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<string>>(new Set());

  const sorted = useMemo(
    () => [...connectionReferences].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [connectionReferences]
  );

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(CONN_STATUS_VALUES.map(s => [s, 0]));
    for (const r of sorted) {
      const key = r.connectionId ? 'Connected' : 'Not Connected';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [sorted]);

  const filteredRefs = useMemo(() => {
    let filtered = sorted;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.displayName.toLowerCase().includes(q) ||
        (r.connectorDisplayName && r.connectorDisplayName.toLowerCase().includes(q))
      );
    }
    if (activeStatusFilters.size > 0) {
      filtered = filtered.filter(r =>
        activeStatusFilters.has(r.connectionId ? 'Connected' : 'Not Connected')
      );
    }
    return filtered;
  }, [sorted, searchQuery, activeStatusFilters]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  if (connectionReferences.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Connection References Found"
        message="No connection references were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search connection references..."
        filteredCount={filteredRefs.length}
        totalCount={sorted.length}
        itemLabel="references"
      >
        <FilterGroup
          label="Status:"
          hasActiveFilters={activeStatusFilters.size > 0}
          onClear={() => setActiveStatusFilters(new Set())}
        >
          {CONN_STATUS_VALUES.map(status => (
            <ToggleButton
              key={status}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeStatusFilters.has(status)}
              disabled={statusCounts[status] === 0}
              onClick={() => {
                setActiveStatusFilters(prev => {
                  const next = new Set(prev);
                  if (next.has(status)) next.delete(status); else next.add(status);
                  return next;
                });
              }}
            >
              {status}
            </ToggleButton>
          ))}
        </FilterGroup>
      </FilterBar>

      {filteredRefs.length === 0 && sorted.length > 0 && <EmptyState type="search" />}

      {filteredRefs.map(ref => {
        const isExpanded = expandedId === ref.id;
        const isConnected = Boolean(ref.connectionId);
        return (
          <div key={ref.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(ref.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(ref.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{ref.displayName}</Text>
                <Text className={shared.codeText}>{ref.name}</Text>
              </div>
              <Text className={styles.connectorColumn}>
                {ref.connectorDisplayName || '—'}
              </Text>
              <div className={shared.badgeGroup}>
                <Badge appearance="tint" shape="rounded" size="small" color={isConnected ? 'success' : 'danger'}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
                {ref.isManaged && (
                  <Badge appearance="outline" shape="rounded" size="small">Managed</Badge>
                )}
              </div>
            </div>
            {isExpanded && (
              <div className={shared.expandedDetails}>
                <div className={shared.detailsGrid}>
                  <div className={shared.detailItem}>
                    <Text className={shared.detailLabel}>Logical Name</Text>
                    <Text className={shared.codeText}>{ref.name}</Text>
                  </div>
                  <div className={shared.detailItem}>
                    <Text className={shared.detailLabel}>Connector</Text>
                    <Text className={shared.detailValue}>{ref.connectorDisplayName || '—'}</Text>
                  </div>
                  <div className={shared.detailItem}>
                    <Text className={shared.detailLabel}>Connection ID</Text>
                    {ref.connectionId
                      ? <Text className={shared.codeText}>{ref.connectionId}</Text>
                      : <span className={styles.mutedText}>Not set</span>}
                  </div>
                  <div className={shared.detailItem}>
                    <Text className={shared.detailLabel}>Owner</Text>
                    <Text className={shared.detailValue}>{ref.owner}</Text>
                  </div>
                </div>
                {ref.description && (
                  <div className={shared.section}>
                    <Text className={shared.detailLabel}>Description</Text>
                    <Text className={shared.wrapText}>{ref.description}</Text>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
