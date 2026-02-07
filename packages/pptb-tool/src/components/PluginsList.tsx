import { useMemo } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
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
  groupHeader: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
  },
  pluginRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    borderRadius: tokens.borderRadiusMedium,
  },
  pluginName: {
    flex: 1,
    fontWeight: tokens.fontWeightSemibold,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  rankBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  imageIndicator: {
    fontSize: tokens.fontSizeBase200,
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
  groupBy = 'message',
  onPluginClick,
}: PluginsListProps) {
  const styles = useStyles();

  // Filter plugins by entity if specified
  const filteredPlugins = useMemo(() => {
    if (!entityLogicalName) return plugins;
    return plugins.filter((p) => p.entity.toLowerCase() === entityLogicalName.toLowerCase());
  }, [plugins, entityLogicalName]);

  // Group plugins
  const groupedPlugins = useMemo(() => {
    const groups = new Map<string, PluginStep[]>();

    for (const plugin of filteredPlugins) {
      let groupKey: string;
      switch (groupBy) {
        case 'message':
          groupKey = plugin.message;
          break;
        case 'stage':
          groupKey = plugin.stageName;
          break;
        case 'assembly':
          groupKey = plugin.assemblyName;
          break;
        case 'none':
          groupKey = 'all';
          break;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(plugin);
    }

    // Sort plugins within each group by stage and rank
    for (const [, groupPlugins] of groups) {
      groupPlugins.sort((a, b) => {
        if (a.stage !== b.stage) return a.stage - b.stage;
        return a.rank - b.rank;
      });
    }

    return groups;
  }, [filteredPlugins, groupBy]);

  const getStageBadgeColor = (stage: number): string => {
    const stageColors: Record<number, string> = {
      10: '#0078D4', // PreValidation - Blue
      20: '#2B579A', // PreOperation - Navy
      40: '#107C10', // PostOperation - Green
      50: '#5C2D91', // Asynchronous - Purple
    };
    return stageColors[stage] || tokens.colorNeutralForeground3;
  };

  const renderPlugin = (plugin: PluginStep) => (
    <div
      key={plugin.id}
      className={styles.pluginRow}
      onClick={() => onPluginClick?.(plugin)}
    >
      <div className={styles.rankBadge}>{plugin.rank}</div>
      <div className={styles.pluginName}>
        <Text weight="semibold">{plugin.name}</Text>
      </div>
      <div className={styles.badgeGroup}>
        <Badge
          appearance="filled"
          style={{
            backgroundColor: getStageBadgeColor(plugin.stage),
            color: 'white',
          }}
        >
          {plugin.stageName}
        </Badge>
        <Badge appearance={plugin.mode === 0 ? 'outline' : 'filled'} color={plugin.mode === 0 ? 'brand' : 'important'}>
          {plugin.modeName}
        </Badge>
        {groupBy !== 'message' && <Badge appearance="outline">{plugin.message}</Badge>}
        {!entityLogicalName && <Badge appearance="outline" color="subtle">{plugin.entity}</Badge>}
        {plugin.filteringAttributes.length > 0 && (
          <Badge appearance="tint" color="warning" size="small">
            {plugin.filteringAttributes.length} filter{plugin.filteringAttributes.length > 1 ? 's' : ''}
          </Badge>
        )}
        {plugin.preImage && <Text className={styles.imageIndicator}>📷 Pre</Text>}
        {plugin.postImage && <Text className={styles.imageIndicator}>📷 Post</Text>}
      </div>
    </div>
  );

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

  // Render grouped plugins
  if (groupBy === 'none') {
    return (
      <div className={styles.container}>
        {filteredPlugins.map((plugin) => renderPlugin(plugin))}
      </div>
    );
  }

  return (
    <Accordion multiple collapsible>
      {Array.from(groupedPlugins.entries()).map(([groupKey, groupPlugins]) => (
        <AccordionItem key={groupKey} value={groupKey}>
          <AccordionHeader>
            <Text className={styles.groupHeader}>
              {groupKey} ({groupPlugins.length} plugin{groupPlugins.length > 1 ? 's' : ''})
            </Text>
          </AccordionHeader>
          <AccordionPanel>
            <div className={styles.container}>
              {groupPlugins.map((plugin) => renderPlugin(plugin))}
            </div>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
