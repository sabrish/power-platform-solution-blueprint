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
  Link,
  tokens,
} from '@fluentui/react-components';
import { Warning20Regular, FlashFlow20Regular, Cloud20Regular } from '@fluentui/react-icons';
import type { ClassicWorkflow } from '../core';
import { TruncatedText } from './TruncatedText';

interface ClassicWorkflowsListProps {
  workflows: ClassicWorkflow[];
  onSelectWorkflow: (workflow: ClassicWorkflow) => void;
}

/**
 * List view of classic workflows with migration complexity indicators
 */
export function ClassicWorkflowsList({ workflows, onSelectWorkflow }: ClassicWorkflowsListProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  // Sort workflows by complexity (Critical > High > Medium > Low) by default
  const sortedWorkflows = useMemo(() => {
    const complexityOrder: Record<string, number> = {
      Critical: 0,
      High: 1,
      Medium: 2,
      Low: 3,
    };

    return [...workflows].sort((a, b) => {
      const aComplexity = a.migrationRecommendation?.complexity || 'Low';
      const bComplexity = b.migrationRecommendation?.complexity || 'Low';
      return complexityOrder[aComplexity] - complexityOrder[bComplexity];
    });
  }, [workflows]);

  const handleRowClick = (workflow: ClassicWorkflow) => {
    setSelectedWorkflow(workflow.id);
    onSelectWorkflow(workflow);
  };

  const getMigrationComplexityColor = (
    complexity: 'Low' | 'Medium' | 'High' | 'Critical' | undefined
  ): 'success' | 'warning' | 'danger' | 'severe' => {
    switch (complexity) {
      case 'Critical':
        return 'severe';
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warning';
      case 'Low':
      default:
        return 'success';
    }
  };

  const getModeColor = (mode: number): 'warning' | 'informative' => {
    return mode === 1 ? 'warning' : 'informative'; // 1=RealTime (yellow), 0=Background (blue)
  };

  const getTriggerIcons = (workflow: ClassicWorkflow): string => {
    const triggers: string[] = [];
    if (workflow.triggerOnCreate) triggers.push('Create');
    if (workflow.triggerOnUpdate) triggers.push('Update');
    if (workflow.triggerOnDelete) triggers.push('Delete');
    if (workflow.onDemand) triggers.push('On-Demand');
    return triggers.join(', ') || 'None';
  };

  const columns: TableColumnDefinition<ClassicWorkflow>[] = [
    createTableColumn<ClassicWorkflow>({
      columnId: 'migration',
      compare: (a, b) => {
        const aComplexity = a.migrationRecommendation?.complexity || 'Low';
        const bComplexity = b.migrationRecommendation?.complexity || 'Low';
        return aComplexity.localeCompare(bComplexity);
      },
      renderHeaderCell: () => {
        return (
          <Tooltip content="Migration complexity assessment" relationship="label">
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Warning20Regular />
              <span>Migration</span>
            </div>
          </Tooltip>
        );
      },
      renderCell: (item) => {
        const complexity = item.migrationRecommendation?.complexity || 'Low';
        const effort = item.migrationRecommendation?.effort || 'Unknown';
        return (
          <TableCellLayout>
            <Tooltip
              content={`Migration Complexity: ${complexity} - Estimated Effort: ${effort}`}
              relationship="description"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Warning20Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
                <Badge
                  appearance="filled"
                  color={getMigrationComplexityColor(complexity)}
                  size="large"
                >
                  {complexity}
                </Badge>
              </div>
            </Tooltip>
          </TableCellLayout>
        );
      },
    }),
    createTableColumn<ClassicWorkflow>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Workflow Name',
      renderCell: (item) => (
        <TableCellLayout>
          <div style={{ fontWeight: 500 }}>
            <TruncatedText text={item.name} />
          </div>
          {item.description && (
            <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
              <TruncatedText text={item.description} />
            </div>
          )}
        </TableCellLayout>
      ),
    }),
    createTableColumn<ClassicWorkflow>({
      columnId: 'entity',
      compare: (a, b) => (a.entityDisplayName || a.entity).localeCompare(b.entityDisplayName || b.entity),
      renderHeaderCell: () => 'Entity',
      renderCell: (item) => (
        <TableCellLayout>
          <TruncatedText text={item.entityDisplayName || item.entity} />
        </TableCellLayout>
      ),
    }),
    createTableColumn<ClassicWorkflow>({
      columnId: 'mode',
      compare: (a, b) => a.mode - b.mode,
      renderHeaderCell: () => 'Mode',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge appearance="filled" shape="rounded" color={getModeColor(item.mode)}>
            {item.mode === 1 ? (
              <>
                <FlashFlow20Regular /> RealTime
              </>
            ) : (
              <>
                <Cloud20Regular /> Background
              </>
            )}
          </Badge>
        </TableCellLayout>
      ),
    }),
    createTableColumn<ClassicWorkflow>({
      columnId: 'triggers',
      renderHeaderCell: () => 'Triggers',
      renderCell: (item) => <TableCellLayout>{getTriggerIcons(item)}</TableCellLayout>,
    }),
    createTableColumn<ClassicWorkflow>({
      columnId: 'state',
      compare: (a, b) => a.state.localeCompare(b.state),
      renderHeaderCell: () => 'State',
      renderCell: (item) => (
        <TableCellLayout>
          <Badge
            appearance="filled"
            color={item.state === 'Active' ? 'success' : item.state === 'Draft' ? 'warning' : 'danger'}
          >
            {item.state}
          </Badge>
        </TableCellLayout>
      ),
    }),
  ];

  if (workflows.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
        No classic workflows found.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div
        style={{
          padding: '12px',
          backgroundColor: tokens.colorPaletteYellowBackground1,
          borderLeft: `4px solid ${tokens.colorPaletteYellowForeground1}`,
          marginBottom: '16px',
          borderRadius: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Warning20Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
          <strong>Classic Workflows Detected</strong>
        </div>
        <div style={{ fontSize: '13px', color: tokens.colorNeutralForeground2 }}>
          Classic workflows are legacy technology. Microsoft recommends creating new automation with Power
          Automate cloud flows and migrating existing workflows.{' '}
          <Link href="https://learn.microsoft.com/en-us/power-automate/replace-workflows-with-flows" target="_blank" rel="noopener noreferrer">
            Learn more
          </Link>
          . Click on a workflow below to see detailed migration guidance.
        </div>
      </div>

      <DataGrid
        items={sortedWorkflows}
        columns={columns}
        sortable
        selectionMode="single"
        selectedItems={selectedWorkflow ? [selectedWorkflow] : []}
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
        <DataGridBody<ClassicWorkflow>>
          {({ item, rowId }) => (
            <DataGridRow<ClassicWorkflow>
              key={rowId}
              style={{
                cursor: 'pointer',
                backgroundColor:
                  selectedWorkflow === item.id ? tokens.colorNeutralBackground1Selected : undefined,
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
