import { useState, useMemo } from 'react';
import { DataGrid, DataGridBody, DataGridRow, DataGridHeader, DataGridHeaderCell, DataGridCell, TableCellLayout,
  TableColumnDefinition, createTableColumn, Badge, tokens, Text, Title3 } from '@fluentui/react-components';
import { Options20Regular } from '@fluentui/react-icons';
import type { GlobalChoice } from '@ppsb/core';

interface GlobalChoicesListProps {
  globalChoices: GlobalChoice[];
  onSelectChoice: (choice: GlobalChoice) => void;
}

export function GlobalChoicesList({ globalChoices, onSelectChoice }: GlobalChoicesListProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const sorted = useMemo(() => [...globalChoices].sort((a, b) => a.name.localeCompare(b.name)), [globalChoices]);

  // Debug logging
  console.log('[GlobalChoicesList] Received globalChoices:', globalChoices.length);
  console.log('[GlobalChoicesList] Sorted array:', sorted.length);
  console.log('[GlobalChoicesList] First item:', sorted[0]);

  const columns: TableColumnDefinition<GlobalChoice>[] = [
    createTableColumn<GlobalChoice>({
      columnId: 'name',
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <TableCellLayout media={<Options20Regular />}>
          <div style={{ fontWeight: 500 }}>{item.displayName}</div>
          <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, fontFamily: 'monospace' }}>{item.name}</div>
        </TableCellLayout>
      ),
    }),
    createTableColumn<GlobalChoice>({
      columnId: 'options',
      renderHeaderCell: () => 'Options',
      renderCell: (item) => <TableCellLayout>{item.totalOptions} options</TableCellLayout>,
    }),
    createTableColumn<GlobalChoice>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (item) => (
        <TableCellLayout>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge appearance="filled" color={item.isManaged ? 'warning' : 'success'}>
              {item.isManaged ? 'Managed' : 'Unmanaged'}
            </Badge>
            {!item.isCustomizable && (
              <Badge appearance="outline" color="danger" size="small">
                Not Customizable
              </Badge>
            )}
          </div>
        </TableCellLayout>
      ),
    }),
  ];

  if (globalChoices.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>No Global Choices found.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: tokens.spacingVerticalM }}>
        <Title3 style={{ marginBottom: tokens.spacingVerticalXS }}>🎯 Global Choices</Title3>
        <Text style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
          Click on a global choice to view its options and details ({sorted.length} found)
        </Text>
      </div>

      <DataGrid
        items={sorted}
        columns={columns}
        sortable
        selectionMode="single"
        selectedItems={selectedChoice ? [selectedChoice] : []}
        getRowId={(item) => item.id}
        focusMode="composite"
        style={{ minHeight: '200px' }}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<GlobalChoice>>
          {({ item, rowId }) => (
            <DataGridRow<GlobalChoice>
              key={rowId}
              style={{
                cursor: 'pointer',
                backgroundColor: selectedChoice === item.id ? tokens.colorNeutralBackground1Selected : undefined
              }}
              onClick={() => {
                setSelectedChoice(item.id);
                onSelectChoice(item);
              }}
            >
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
}
