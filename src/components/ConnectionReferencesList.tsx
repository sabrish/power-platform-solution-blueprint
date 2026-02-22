import { useState, useMemo } from 'react';
import { DataGrid, DataGridBody, DataGridRow, DataGridHeader, DataGridHeaderCell, DataGridCell, TableCellLayout,
  TableColumnDefinition, createTableColumn, Badge, tokens } from '@fluentui/react-components';
import { PlugConnected20Regular } from '@fluentui/react-icons';
import type { ConnectionReference } from '../core';
import { TruncatedText } from './TruncatedText';

interface ConnectionReferencesListProps {
  connectionReferences: ConnectionReference[];
  onSelectReference: (ref: ConnectionReference) => void;
}

export function ConnectionReferencesList({ connectionReferences, onSelectReference }: ConnectionReferencesListProps) {
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const sorted = useMemo(() => [...connectionReferences].sort((a, b) => a.name.localeCompare(b.name)), [connectionReferences]);

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
          <Badge appearance="filled" color={item.connectionId ? 'success' : 'danger'}>
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
      <DataGrid items={sorted} columns={columns} sortable selectionMode="single" selectedItems={selectedRef ? [selectedRef] : []}
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
