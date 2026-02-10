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
  Tooltip,
  tokens,
} from '@fluentui/react-components';
import { Flowchart20Regular, Layer20Regular } from '@fluentui/react-icons';
import type { BusinessProcessFlow } from '../core';

interface BusinessProcessFlowsListProps {
  businessProcessFlows: BusinessProcessFlow[];
  onSelectBPF: (bpf: BusinessProcessFlow) => void;
}

/**
 * List view of Business Process Flows
 */
export function BusinessProcessFlowsList({
  businessProcessFlows,
  onSelectBPF,
}: BusinessProcessFlowsListProps) {
  const [selectedBPF, setSelectedBPF] = useState<string | null>(null);

  // Sort BPFs alphabetically by name
  const sortedBPFs = useMemo(() => {
    return [...businessProcessFlows].sort((a, b) => a.name.localeCompare(b.name));
  }, [businessProcessFlows]);

  const handleRowClick = (bpf: BusinessProcessFlow) => {
    setSelectedBPF(bpf.id);
    onSelectBPF(bpf);
  };

  const getStateColor = (state: 'Draft' | 'Active'): 'success' | 'warning' => {
    return state === 'Active' ? 'success' : 'warning';
  };

  const columns: TableColumnDefinition<BusinessProcessFlow>[] = [
    createTableColumn<BusinessProcessFlow>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Business Process Flow Name',
      renderCell: (item) => (
        <TableCellLayout media={<Flowchart20Regular />}>
          <div style={{ fontWeight: 500 }}>{item.name}</div>
          {item.description && (
            <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
              {item.description}
            </div>
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn<BusinessProcessFlow>({
      columnId: 'primaryEntity',
      compare: (a, b) =>
        (a.primaryEntityDisplayName || a.primaryEntity).localeCompare(
          b.primaryEntityDisplayName || b.primaryEntity
        ),
      renderHeaderCell: () => 'Primary Entity',
      renderCell: (item) => (
        <TableCellLayout>
          {item.primaryEntityDisplayName || item.primaryEntity}
        </TableCellLayout>
      ),
    }),
    createTableColumn<BusinessProcessFlow>({
      columnId: 'stages',
      compare: (a, b) => a.definition.stages.length - b.definition.stages.length,
      renderHeaderCell: () => {
        return (
          <Tooltip content="Number of stages in this BPF" relationship="label">
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layer20Regular />
              <span>Stages</span>
            </div>
          </Tooltip>
        );
      },
      renderCell: (item) => (
        <TableCellLayout>
          <Badge appearance="tint" color="brand">
            {item.definition.stages.length} stages
          </Badge>
        </TableCellLayout>
      ),
    }),
    createTableColumn<BusinessProcessFlow>({
      columnId: 'entities',
      renderHeaderCell: () => 'Entities Involved',
      renderCell: (item) => (
        <TableCellLayout>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {item.definition.entities.length > 0 ? (
              item.definition.entities.map((entity) => (
                <Badge key={entity} appearance="outline" size="small">
                  {entity}
                </Badge>
              ))
            ) : (
              <span style={{ color: tokens.colorNeutralForeground3 }}>
                {item.primaryEntity}
              </span>
            )}
          </div>
        </TableCellLayout>
      ),
    }),
    createTableColumn<BusinessProcessFlow>({
      columnId: 'crossEntity',
      compare: (a, b) => Number(a.definition.crossEntityFlow) - Number(b.definition.crossEntityFlow),
      renderHeaderCell: () => 'Cross-Entity',
      renderCell: (item) => (
        <TableCellLayout>
          {item.definition.crossEntityFlow ? (
            <Badge appearance="filled" color="important">
              Yes
            </Badge>
          ) : (
            <Badge appearance="outline" color="subtle">
              No
            </Badge>
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn<BusinessProcessFlow>({
      columnId: 'state',
      compare: (a, b) => a.state.localeCompare(b.state),
      renderHeaderCell: () => 'State',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge appearance="filled" color={getStateColor(item.state)}>
            {item.state}
          </Badge>
        </TableCellLayout>
      ),
    }),
  ];

  if (businessProcessFlows.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
        No Business Process Flows found.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div
        style={{
          padding: '12px',
          backgroundColor: tokens.colorNeutralBackground2,
          borderRadius: '4px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Flowchart20Regular />
          <strong>About Business Process Flows</strong>
        </div>
        <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
          Business Process Flows guide users through defined business processes with a series of
          stages and steps. They can span single or multiple entities (cross-entity flows).
        </div>
      </div>

      <DataGrid
        items={sortedBPFs}
        columns={columns}
        sortable
        selectionMode="single"
        selectedItems={selectedBPF ? [selectedBPF] : []}
        getRowId={(item) => item.id}
        focusMode="composite"
        style={{ minWidth: '100%' }}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<BusinessProcessFlow>>
          {({ item, rowId }) => (
            <DataGridRow<BusinessProcessFlow>
              key={rowId}
              style={{
                cursor: 'pointer',
                backgroundColor:
                  selectedBPF === item.id ? tokens.colorNeutralBackground1Selected : undefined,
              }}
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
