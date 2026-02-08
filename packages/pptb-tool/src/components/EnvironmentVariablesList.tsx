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
} from '@fluentui/react-components';
import { Settings20Regular } from '@fluentui/react-icons';
import type { EnvironmentVariable } from '@ppsb/core';

interface EnvironmentVariablesListProps {
  environmentVariables: EnvironmentVariable[];
  onSelectVariable: (envVar: EnvironmentVariable) => void;
}

export function EnvironmentVariablesList({ environmentVariables, onSelectVariable }: EnvironmentVariablesListProps) {
  const [selectedVar, setSelectedVar] = useState<string | null>(null);

  const sortedVars = useMemo(() => {
    return [...environmentVariables].sort((a, b) => a.schemaName.localeCompare(b.schemaName));
  }, [environmentVariables]);

  const handleRowClick = (envVar: EnvironmentVariable) => {
    setSelectedVar(envVar.id);
    onSelectVariable(envVar);
  };

  const getTypeColor = (type: string): 'brand' | 'success' | 'danger' | 'warning' | 'severe' => {
    switch (type) {
      case 'String': return 'brand';
      case 'Number': return 'success';
      case 'Boolean': return 'danger';
      case 'JSON': return 'warning';
      case 'DataSource': return 'severe';
      default: return 'brand';
    }
  };

  const columns: TableColumnDefinition<EnvironmentVariable>[] = [
    createTableColumn<EnvironmentVariable>({
      columnId: 'name',
      compare: (a, b) => a.schemaName.localeCompare(b.schemaName),
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <TableCellLayout media={<Settings20Regular />}>
          <div style={{ fontWeight: 500 }}>{item.displayName}</div>
          <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, fontFamily: 'monospace' }}>
            {item.schemaName}
          </div>
        </TableCellLayout>
      ),
    }),
    createTableColumn<EnvironmentVariable>({
      columnId: 'type',
      renderHeaderCell: () => 'Type',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge appearance="filled" color={getTypeColor(item.typeName)}>
            {item.typeName}
          </Badge>
        </TableCellLayout>
      ),
    }),
    createTableColumn<EnvironmentVariable>({
      columnId: 'currentValue',
      renderHeaderCell: () => 'Current Value',
      renderCell: (item) => (
        <TableCellLayout>
          <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
            {item.currentValue || <span style={{ color: tokens.colorNeutralForeground3 }}>Not set</span>}
          </span>
        </TableCellLayout>
      ),
    }),
    createTableColumn<EnvironmentVariable>({
      columnId: 'defaultValue',
      renderHeaderCell: () => 'Default Value',
      renderCell: (item) => (
        <TableCellLayout>
          <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
            {item.defaultValue || <span style={{ color: tokens.colorNeutralForeground3 }}>None</span>}
          </span>
        </TableCellLayout>
      ),
    }),
    createTableColumn<EnvironmentVariable>({
      columnId: 'flags',
      renderHeaderCell: () => 'Flags',
      renderCell: (item) => (
        <TableCellLayout>
          <div style={{ display: 'flex', gap: '4px' }}>
            {item.isRequired && <Badge appearance="filled" color="danger" size="small">Required</Badge>}
            {item.isManaged && <Badge appearance="outline" size="small">Managed</Badge>}
          </div>
        </TableCellLayout>
      ),
    }),
  ];

  if (environmentVariables.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
        No Environment Variables found.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <DataGrid
        items={sortedVars}
        columns={columns}
        sortable
        selectionMode="single"
        selectedItems={selectedVar ? [selectedVar] : []}
        getRowId={(item) => item.id}
        focusMode="composite"
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<EnvironmentVariable>>
          {({ item, rowId }) => (
            <DataGridRow<EnvironmentVariable>
              key={rowId}
              style={{ cursor: 'pointer', backgroundColor: selectedVar === item.id ? tokens.colorNeutralBackground1Selected : undefined }}
              onClick={() => handleRowClick(item)}
            >
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
}
