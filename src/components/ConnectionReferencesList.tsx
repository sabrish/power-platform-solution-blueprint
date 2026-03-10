import { useState, useMemo } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  ToggleButton,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { PlugConnected20Regular, PlugDisconnected20Regular } from '@fluentui/react-icons';
import type { ConnectionReference } from '../core';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

const CONN_STATUS_VALUES = ['Connected', 'Not Connected'];

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
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
  refRow: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) minmax(120px, 1fr) auto',
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
  refRowSelected: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
    paddingTop: '2px',
  },
  nameColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    wordBreak: 'break-word',
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  connectorText: {
    minWidth: 0,
    wordBreak: 'break-word',
  },
});

interface ConnectionReferencesListProps {
  connectionReferences: ConnectionReference[];
  onSelectReference: (ref: ConnectionReference) => void;
}

export function ConnectionReferencesList({ connectionReferences, onSelectReference }: ConnectionReferencesListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
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

  const toggleStatusFilter = (status: string) => {
    setActiveStatusFilters(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

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

  const handleRowClick = (ref: ConnectionReference) => {
    setSelectedRefId(ref.id);
    onSelectReference(ref);
  };

  if (connectionReferences.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={500} weight="semibold">No Connection References Found</Text>
        <Text>No connection references were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
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
              onClick={() => toggleStatusFilter(status)}
            >
              {status}
            </ToggleButton>
          ))}
        </FilterGroup>
      </FilterBar>

      {filteredRefs.length === 0 && sorted.length > 0 && (
        <div className={styles.emptyState}>
          <Text>No connection references match your search.</Text>
        </div>
      )}

      {filteredRefs.map(ref => {
        const isSelected = selectedRefId === ref.id;
        const isConnected = Boolean(ref.connectionId);

        return (
          <div
            key={ref.id}
            className={`${styles.refRow} ${isSelected ? styles.refRowSelected : ''}`}
            onClick={() => handleRowClick(ref)}
          >
            <div className={styles.icon}>
              {isConnected
                ? <PlugConnected20Regular />
                : <PlugDisconnected20Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
              }
            </div>
            <div className={styles.nameColumn}>
              <Text weight="semibold">{ref.displayName}</Text>
              <Text className={styles.codeText}>{ref.name}</Text>
            </div>
            <Text className={styles.connectorText} style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 }}>
              {ref.connectorDisplayName || '—'}
            </Text>
            <Badge
              appearance="tint"
              shape="rounded"
              color={isConnected ? 'success' : 'danger'}
            >
              {isConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
