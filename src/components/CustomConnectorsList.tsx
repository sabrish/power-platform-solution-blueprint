import { useState, useMemo } from 'react';
import { DataGrid, DataGridBody, DataGridRow, DataGridHeader, DataGridHeaderCell, DataGridCell, TableCellLayout,
  TableColumnDefinition, createTableColumn, Badge, tokens } from '@fluentui/react-components';
import { PlugDisconnected20Regular } from '@fluentui/react-icons';
import type { CustomConnector } from '../core';

interface CustomConnectorsListProps {
  customConnectors: CustomConnector[];
  onSelectConnector: (connector: CustomConnector) => void;
}

export function CustomConnectorsList({ customConnectors, onSelectConnector }: CustomConnectorsListProps) {
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const sorted = useMemo(() => [...customConnectors].sort((a, b) => a.name.localeCompare(b.name)), [customConnectors]);

  const columns: TableColumnDefinition<CustomConnector>[] = [
    createTableColumn<CustomConnector>({
      columnId: 'name',
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <TableCellLayout media={<PlugDisconnected20Regular />}>
          <div style={{ fontWeight: 500 }}>{item.displayName}</div>
          <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, fontFamily: 'monospace' }}>{item.name}</div>
        </TableCellLayout>
      ),
    }),
    createTableColumn<CustomConnector>({
      columnId: 'type',
      renderHeaderCell: () => 'Type',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge appearance="tint" shape="rounded">{item.connectorType}</Badge>
        </TableCellLayout>
      ),
    }),
    createTableColumn<CustomConnector>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <TableCellLayout>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge appearance="filled" shape="rounded" color={item.isManaged ? 'warning' : 'success'}>
              {item.isManaged ? 'Managed' : 'Unmanaged'}
            </Badge>
            {!item.isCustomizable && (
              <Badge appearance="outline" shape="rounded" color="important" size="small">
                Not Customizable
              </Badge>
            )}
          </div>
        </TableCellLayout>
      ),
    }),
  ];

  if (customConnectors.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>No Custom Connectors found.</div>;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <DataGrid items={sorted} columns={columns} sortable selectionMode="single" selectedItems={selectedConnector ? [selectedConnector] : []}
        getRowId={(item) => item.id} focusMode="composite">
        <DataGridHeader><DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow></DataGridHeader>
        <DataGridBody<CustomConnector>>
          {({ item, rowId }) => (
            <DataGridRow<CustomConnector> key={rowId} style={{ cursor: 'pointer',
              backgroundColor: selectedConnector === item.id ? tokens.colorNeutralBackground1Selected : undefined }}
              onClick={() => { setSelectedConnector(item.id); onSelectConnector(item); }}>
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
}
