import { useMemo } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
} from '@fluentui/react-components';
import type { Flow } from '@ppsb/core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
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
  tableContainer: {
    maxHeight: '800px',
    overflowY: 'auto',
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});

export interface FlowsListProps {
  flows: Flow[];
  entityLogicalName?: string;
  onFlowClick?: (flow: Flow) => void;
}

export function FlowsList({
  flows,
  entityLogicalName,
  onFlowClick,
}: FlowsListProps) {
  const styles = useStyles();

  // Filter flows by entity if specified
  const filteredFlows = useMemo(() => {
    if (!entityLogicalName) return flows;
    return flows.filter((f) => f.entity?.toLowerCase() === entityLogicalName.toLowerCase());
  }, [flows, entityLogicalName]);

  // Sort flows by state (Active first), then by name
  const sortedFlows = useMemo(() => {
    return [...filteredFlows].sort((a, b) => {
      // Active flows first
      if (a.state !== b.state) {
        if (a.state === 'Active') return -1;
        if (b.state === 'Active') return 1;
        if (a.state === 'Draft') return -1;
        if (b.state === 'Draft') return 1;
      }
      // Then by name
      return a.name.localeCompare(b.name);
    });
  }, [filteredFlows]);

  const getStateBadgeProps = (state: Flow['state']) => {
    switch (state) {
      case 'Active':
        return { appearance: 'filled' as const, color: 'success' as const };
      case 'Draft':
        return { appearance: 'filled' as const, color: 'warning' as const };
      case 'Suspended':
        return { appearance: 'filled' as const, color: 'danger' as const };
      default:
        return { appearance: 'outline' as const, color: 'subtle' as const };
    }
  };

  const getTriggerBadgeColor = (triggerType: Flow['definition']['triggerType']): 'brand' | 'success' | 'warning' | 'subtle' => {
    switch (triggerType) {
      case 'Dataverse':
        return 'brand';
      case 'Manual':
        return 'success';
      case 'Scheduled':
        return 'warning';
      default:
        return 'subtle';
    }
  };

  const columns: TableColumnDefinition<Flow>[] = useMemo(() => {
    const cols: TableColumnDefinition<Flow>[] = [
      createTableColumn<Flow>({
        columnId: 'name',
        renderHeaderCell: () => 'Flow Name',
        renderCell: (item) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Text weight="semibold">{item.name}</Text>
            {item.description && (
              <Text style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
                {item.description.length > 80 ? `${item.description.substring(0, 80)}...` : item.description}
              </Text>
            )}
          </div>
        ),
      }),
    ];

    // Only show entity column if not filtering by entity
    if (!entityLogicalName) {
      cols.push(
        createTableColumn<Flow>({
          columnId: 'entity',
          renderHeaderCell: () => 'Entity',
          renderCell: (item) => (
            <Text style={{ fontFamily: 'Consolas, Monaco, monospace' }}>
              {item.entity || '—'}
            </Text>
          ),
        })
      );
    }

    cols.push(
      createTableColumn<Flow>({
        columnId: 'trigger',
        renderHeaderCell: () => 'Trigger',
        renderCell: (item) => (
          <div className={styles.badgeGroup}>
            <Badge appearance="tint" color={getTriggerBadgeColor(item.definition.triggerType)}>
              {item.definition.triggerType}
            </Badge>
            {item.definition.triggerEvent !== 'Unknown' && item.definition.triggerEvent !== item.definition.triggerType && (
              <Badge appearance="outline" size="small">
                {item.definition.triggerEvent}
              </Badge>
            )}
          </div>
        ),
      }),
      createTableColumn<Flow>({
        columnId: 'state',
        renderHeaderCell: () => 'State',
        renderCell: (item) => {
          const props = getStateBadgeProps(item.state);
          return <Badge {...props}>{item.state}</Badge>;
        },
      }),
      createTableColumn<Flow>({
        columnId: 'scope',
        renderHeaderCell: () => 'Scope',
        renderCell: (item) => (
          <Badge appearance="outline">{item.scopeName}</Badge>
        ),
      }),
      createTableColumn<Flow>({
        columnId: 'details',
        renderHeaderCell: () => 'Details',
        renderCell: (item) => (
          <div className={styles.badgeGroup}>
            {item.definition.actionsCount > 0 && (
              <Badge appearance="tint" size="small">
                {item.definition.actionsCount} action{item.definition.actionsCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {item.hasExternalCalls && (
              <Badge appearance="tint" color="important" size="small">
                External calls
              </Badge>
            )}
            {item.definition.connectionReferences.length > 0 && (
              <Badge appearance="tint" size="small">
                {item.definition.connectionReferences.length} connector{item.definition.connectionReferences.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        ),
      }),
      createTableColumn<Flow>({
        columnId: 'modified',
        renderHeaderCell: () => 'Modified',
        renderCell: (item) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Text style={{ fontSize: tokens.fontSizeBase200 }}>
              {new Date(item.modifiedOn).toLocaleDateString()}
            </Text>
            <Text style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
              {item.modifiedBy}
            </Text>
          </div>
        ),
      })
    );

    return cols;
  }, [entityLogicalName, styles.badgeGroup]);

  // Empty state
  if (filteredFlows.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text style={{ fontSize: '48px' }}>🌊</Text>
        <Text size={500} weight="semibold">
          No Flows Found
        </Text>
        <Text>
          {entityLogicalName
            ? `No flows found for the ${entityLogicalName} entity.`
            : 'No flows were found in the selected solution(s).'}
        </Text>
      </div>
    );
  }

  // Render flows table
  return (
    <div className={styles.tableContainer}>
      <DataGrid
        items={sortedFlows}
        columns={columns}
        sortable
        focusMode="composite"
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<Flow>>
          {({ item, rowId }) => (
            <DataGridRow<Flow>
              key={rowId}
              onClick={() => onFlowClick?.(item)}
              style={{ cursor: onFlowClick ? 'pointer' : 'default' }}
            >
              {({ renderCell }) => (
                <DataGridCell>{renderCell(item)}</DataGridCell>
              )}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
}
