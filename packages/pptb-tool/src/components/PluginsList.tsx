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
import type { PluginStep } from '@ppsb/core';

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

type GroupBy = 'message' | 'stage' | 'assembly' | 'none';

export interface PluginsListProps {
  plugins: PluginStep[];
  entityLogicalName?: string;
  groupBy?: GroupBy;
  onPluginClick?: (plugin: PluginStep) => void;
}

export function PluginsList({
  plugins,
  entityLogicalName,
  onPluginClick,
}: PluginsListProps) {
  const styles = useStyles();

  // Filter plugins by entity if specified
  const filteredPlugins = useMemo(() => {
    if (!entityLogicalName) return plugins;
    return plugins.filter((p) => p.entity.toLowerCase() === entityLogicalName.toLowerCase());
  }, [plugins, entityLogicalName]);

  // Sort plugins by stage and rank
  const sortedPlugins = useMemo(() => {
    return [...filteredPlugins].sort((a, b) => {
      // First by entity
      if (a.entity !== b.entity) return a.entity.localeCompare(b.entity);
      // Then by message
      if (a.message !== b.message) return a.message.localeCompare(b.message);
      // Then by stage
      if (a.stage !== b.stage) return a.stage - b.stage;
      // Then by rank
      return a.rank - b.rank;
    });
  }, [filteredPlugins]);

  const getStageBadgeColor = (stage: number): string => {
    const stageColors: Record<number, string> = {
      10: '#0078D4', // PreValidation - Blue
      20: '#2B579A', // PreOperation - Navy
      40: '#107C10', // PostOperation - Green
      50: '#5C2D91', // Asynchronous - Purple
    };
    return stageColors[stage] || tokens.colorNeutralForeground3;
  };

  const columns: TableColumnDefinition<PluginStep>[] = useMemo(() => {
    const cols: TableColumnDefinition<PluginStep>[] = [
      createTableColumn<PluginStep>({
        columnId: 'rank',
        renderHeaderCell: () => 'Rank',
        renderCell: (item) => (
          <Text weight="semibold">{item.rank}</Text>
        ),
      }),
      createTableColumn<PluginStep>({
        columnId: 'name',
        renderHeaderCell: () => 'Step Name',
        renderCell: (item) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Text weight="semibold">{item.name}</Text>
            <Text style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
              {item.assemblyName}
            </Text>
          </div>
        ),
      }),
    ];

    // Only show entity column if not filtering by entity
    if (!entityLogicalName) {
      cols.push(
        createTableColumn<PluginStep>({
          columnId: 'entity',
          renderHeaderCell: () => 'Entity',
          renderCell: (item) => (
            <Text style={{ fontFamily: 'Consolas, Monaco, monospace' }}>{item.entity}</Text>
          ),
        })
      );
    }

    cols.push(
      createTableColumn<PluginStep>({
        columnId: 'message',
        renderHeaderCell: () => 'Message',
        renderCell: (item) => (
          <Badge appearance="outline">{item.message}</Badge>
        ),
      }),
      createTableColumn<PluginStep>({
        columnId: 'stage',
        renderHeaderCell: () => 'Stage',
        renderCell: (item) => (
          <Badge
            appearance="filled"
            style={{
              backgroundColor: getStageBadgeColor(item.stage),
              color: 'white',
            }}
          >
            {item.stageName}
          </Badge>
        ),
      }),
      createTableColumn<PluginStep>({
        columnId: 'mode',
        renderHeaderCell: () => 'Mode',
        renderCell: (item) => (
          <Badge appearance={item.mode === 0 ? 'outline' : 'filled'} color={item.mode === 0 ? 'brand' : 'important'}>
            {item.modeName}
          </Badge>
        ),
      }),
      createTableColumn<PluginStep>({
        columnId: 'details',
        renderHeaderCell: () => 'Details',
        renderCell: (item) => (
          <div className={styles.badgeGroup}>
            {item.filteringAttributes.length > 0 && (
              <Badge appearance="tint" color="warning" size="small">
                {item.filteringAttributes.length} filter{item.filteringAttributes.length > 1 ? 's' : ''}
              </Badge>
            )}
            {item.preImage && <Badge appearance="tint" size="small">Pre-Image</Badge>}
            {item.postImage && <Badge appearance="tint" size="small">Post-Image</Badge>}
          </div>
        ),
      })
    );

    return cols;
  }, [entityLogicalName]);

  // Empty state
  if (filteredPlugins.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text style={{ fontSize: '48px' }}>🔌</Text>
        <Text size={500} weight="semibold">
          No Plugins Found
        </Text>
        <Text>
          {entityLogicalName
            ? `No plugins registered for the ${entityLogicalName} entity.`
            : 'No plugins were found in the selected solution(s).'}
        </Text>
      </div>
    );
  }

  // Render plugins table
  return (
    <div className={styles.tableContainer}>
      <DataGrid
        items={sortedPlugins}
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
        <DataGridBody<PluginStep>>
          {({ item, rowId }) => (
            <DataGridRow<PluginStep>
              key={rowId}
              onClick={() => onPluginClick?.(item)}
              style={{ cursor: onPluginClick ? 'pointer' : 'default' }}
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
