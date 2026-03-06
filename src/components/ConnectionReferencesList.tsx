import { useState, useMemo } from 'react';
import {
  DataGrid,
  DataGridBody,
  DataGridRow,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  Badge,
  tokens,
  makeStyles,
  ToggleButton,
  Button,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { PlugConnected20Regular } from '@fluentui/react-icons';
import type { ConnectionReference } from '../core';
import { TruncatedText } from './TruncatedText';

const CONN_STATUS_VALUES = ['Connected', 'Not Connected'];

const useStyles = makeStyles({
  filterButton: {
    minWidth: 'unset',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    height: '22px',
    fontSize: tokens.fontSizeBase100,
  },
});

interface ConnectionReferencesListProps {
  connectionReferences: ConnectionReference[];
  onSelectReference: (ref: ConnectionReference) => void;
}

export function ConnectionReferencesList({ connectionReferences, onSelectReference }: ConnectionReferencesListProps) {
  const styles = useStyles();
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => [...connectionReferences].sort((a, b) => a.name.localeCompare(b.name)), [connectionReferences]);

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(CONN_STATUS_VALUES.map((s) => [s, 0]));
    for (const r of sorted) {
      const key = r.connectionId ? 'Connected' : 'Not Connected';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [sorted]);

  const toggleStatusFilter = (status: string) => {
    setActiveStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const filteredRefs = useMemo(() => {
    let filtered = sorted;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        (r.displayName && r.displayName.toLowerCase().includes(q)) ||
        (r.connectorDisplayName && r.connectorDisplayName.toLowerCase().includes(q))
      );
    }
    if (activeStatusFilters.size > 0) {
      filtered = filtered.filter((r) =>
        activeStatusFilters.has(r.connectionId ? 'Connected' : 'Not Connected')
      );
    }
    return filtered;
  }, [sorted, searchQuery, activeStatusFilters]);

  const columns: TableColumnDefinition<ConnectionReference>[] = [
    createTableColumn<ConnectionReference>({
      columnId: 'name',
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <TableCellLayout media={<PlugConnected20Regular />}>
          <div style={{ fontWeight: 500 }}>
            <TruncatedText text={item.displayName} />
          </div>
          <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, fontFamily: 'monospace' }}>
            <TruncatedText text={item.name} />
          </div>
        </TableCellLayout>
      ),
    }),
    createTableColumn<ConnectionReference>({
      columnId: 'connector',
      renderHeaderCell: () => 'Connector',
      renderCell: (item) => (
        <TableCellLayout>
          <TruncatedText text={item.connectorDisplayName || 'Unknown'} />
        </TableCellLayout>
      ),
    }),
    createTableColumn<ConnectionReference>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge appearance="filled" shape="rounded" color={item.connectionId ? 'success' : 'danger'}>
            {item.connectionId ? 'Connected' : 'Not Connected'}
          </Badge>
        </TableCellLayout>
      ),
    }),
  ];

  if (connectionReferences.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>No Connection References found.</div>;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search connection references..."
        filteredCount={filteredRefs.length}
        totalCount={sorted.length}
        itemLabel="references"
        style={{ marginBottom: '16px' }}
      >
        <FilterGroup label="Status:">
          {CONN_STATUS_VALUES.map((status) => (
            <ToggleButton
              key={status}
              className={styles.filterButton}
              size="small"
              checked={activeStatusFilters.has(status)}
              disabled={statusCounts[status] === 0}
              onClick={() => toggleStatusFilter(status)}
            >
              {status}
            </ToggleButton>
          ))}
          {activeStatusFilters.size > 0 && (
            <Button appearance="subtle" size="small" onClick={() => setActiveStatusFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
      </FilterBar>
      <DataGrid items={filteredRefs} columns={columns} sortable selectionMode="single" selectedItems={selectedRef ? [selectedRef] : []}
        getRowId={(item) => item.id} focusMode="composite">
        <DataGridHeader><DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow></DataGridHeader>
        <DataGridBody<ConnectionReference>>
          {({ item, rowId }) => (
            <DataGridRow<ConnectionReference> key={rowId} style={{ cursor: 'pointer',
              backgroundColor: selectedRef === item.id ? tokens.colorNeutralBackground1Selected : undefined }}
              onClick={() => { setSelectedRef(item.id); onSelectReference(item); }}>
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
}
