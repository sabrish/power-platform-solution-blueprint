import { useState, useMemo } from 'react';
import {
  DataGrid, DataGridBody, DataGridRow, DataGridHeader, DataGridHeaderCell, DataGridCell, TableCellLayout,
  TableColumnDefinition, createTableColumn, Badge, SearchBox, Text, tokens, makeStyles
} from '@fluentui/react-components';
import { PlugConnected20Regular } from '@fluentui/react-icons';
import type { ConnectionReference } from '../core';
import { TruncatedText } from './TruncatedText';

const useStyles = makeStyles({
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: '16px',
  },
  searchBox: {
    minWidth: '300px',
  },
  dataGridRow: {
    transitionDuration: '0.2s',
    transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
  dataGridRowSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
  },
  emptyState: {
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px dashed rgba(255, 255, 255, 0.1)`,
    minHeight: '200px',
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
  const sorted = useMemo(() => [...connectionReferences].sort((a, b) => a.name.localeCompare(b.name)), [connectionReferences]);

  const filteredRefs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.displayName && r.displayName.toLowerCase().includes(q)) ||
      (r.connectorDisplayName && r.connectorDisplayName.toLowerCase().includes(q))
    );
  }, [sorted, searchQuery]);

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
    return (
      <div className={styles.emptyState}>
        <PlugConnected20Regular style={{ fontSize: '48px' }} />
        <Text size={500} weight="semibold">No Connection References Found</Text>
        <Text>No connection references were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div className={styles.filters}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search connection references..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value || '')}
        />
        <Text style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>
          {filteredRefs.length} of {sorted.length} references
        </Text>
      </div>
      <DataGrid items={filteredRefs} columns={columns} sortable selectionMode="single" selectedItems={selectedRef ? [selectedRef] : []}
        getRowId={(item) => item.id} focusMode="composite">
        <DataGridHeader><DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow></DataGridHeader>
        <DataGridBody<ConnectionReference>>
          {({ item, rowId }) => (
            <DataGridRow<ConnectionReference> key={rowId}
              className={`${styles.dataGridRow} ${selectedRef === item.id ? styles.dataGridRowSelected : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => { setSelectedRef(item.id); onSelectReference(item); }}>
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
}
