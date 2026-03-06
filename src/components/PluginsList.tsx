import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  ToggleButton,
  Button,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { PluginStep } from '../core';
import { TruncatedText } from './TruncatedText';

// These must exactly match PluginDiscovery.getStageName() output (no hyphens)
const STAGE_VALUES = ['PreValidation', 'PreOperation', 'PostOperation', 'Asynchronous'];
const STATE_VALUES = ['Enabled', 'Disabled'];

/** Convert internal stageName to a human-readable display label */
const formatStageLabel = (stageName: string): string => {
  switch (stageName) {
    case 'PreValidation': return 'Pre-Validation';
    case 'PreOperation': return 'Pre-Operation';
    case 'PostOperation': return 'Post-Operation';
    case 'Asynchronous': return 'Async';
    default: return stageName;
  }
};

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  filterButton: {
    minWidth: 'unset',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    height: '22px',
    fontSize: tokens.fontSizeBase100,
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
  pluginRow: {
    display: 'grid',
    gridTemplateColumns: '24px 40px minmax(200px, 2fr) minmax(100px, 1fr) auto auto auto auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: tokens.shadow4,
    },
  },
  pluginRowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },
  rank: {
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'center',
  },
  nameColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    wordBreak: 'break-word',
  },
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  },
  section: {
    marginTop: tokens.spacingVerticalM,
  },
});

export interface PluginsListProps {
  plugins: PluginStep[];
  entityLogicalName?: string;
}

export function PluginsList({
  plugins,
  entityLogicalName,
}: PluginsListProps) {
  const styles = useStyles();
  const [expandedPluginId, setExpandedPluginId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageFilters, setActiveStageFilters] = useState<Set<string>>(new Set());
  const [activeStateFilters, setActiveStateFilters] = useState<Set<string>>(new Set());

  // Filter plugins by entity if specified
  const filteredPlugins = useMemo(() => {
    if (!entityLogicalName) return plugins;
    return plugins.filter((p) => p.entity.toLowerCase() === entityLogicalName.toLowerCase());
  }, [plugins, entityLogicalName]);

  // Sort plugins by entity, message, stage, and rank
  const sortedPlugins = useMemo(() => {
    return [...filteredPlugins].sort((a, b) => {
      if (a.entity !== b.entity) return a.entity.localeCompare(b.entity);
      if (a.message !== b.message) return a.message.localeCompare(b.message);
      if (a.stage !== b.stage) return a.stage - b.stage;
      return a.rank - b.rank;
    });
  }, [filteredPlugins]);

  // Count per stage / state in the base dataset (drives disabled state on filter buttons)
  const stageCounts = useMemo(() => {
    const counts = Object.fromEntries(STAGE_VALUES.map((s) => [s, 0]));
    for (const p of sortedPlugins) counts[p.stageName] = (counts[p.stageName] ?? 0) + 1;
    return counts;
  }, [sortedPlugins]);

  const stateCounts = useMemo(() => {
    const counts = Object.fromEntries(STATE_VALUES.map((s) => [s, 0]));
    for (const p of sortedPlugins) counts[p.state] = (counts[p.state] ?? 0) + 1;
    return counts;
  }, [sortedPlugins]);

  // Apply ToggleButton filters then search
  const toggleFilteredPlugins = useMemo(() => {
    let filtered = sortedPlugins;
    if (activeStageFilters.size > 0) {
      filtered = filtered.filter((p) => activeStageFilters.has(p.stageName));
    }
    if (activeStateFilters.size > 0) {
      filtered = filtered.filter((p) => activeStateFilters.has(p.state));
    }
    return filtered;
  }, [sortedPlugins, activeStageFilters, activeStateFilters]);

  // Apply search filter
  const searchedPlugins = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return toggleFilteredPlugins;
    return toggleFilteredPlugins.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.entity.toLowerCase().includes(q) ||
      p.assemblyName.toLowerCase().includes(q) ||
      p.typeName.toLowerCase().includes(q)
    );
  }, [toggleFilteredPlugins, searchQuery]);

  const toggleStageFilter = (stage: string) => {
    setActiveStageFilters((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  };

  const toggleStateFilter = (state: string) => {
    setActiveStateFilters((prev) => {
      const next = new Set(prev);
      if (next.has(state)) {
        next.delete(state);
      } else {
        next.add(state);
      }
      return next;
    });
  };

  const getStageBadgeColor = (stage: number): string => {
    const stageColors: Record<number, string> = {
      10: '#0078D4', // PreValidation - Blue
      20: '#2B579A', // PreOperation - Navy
      40: '#107C10', // PostOperation - Green
      50: '#5C2D91', // Asynchronous - Purple
    };
    return stageColors[stage] || tokens.colorNeutralForeground3;
  };

  const toggleExpand = (pluginId: string) => {
    setExpandedPluginId(expandedPluginId === pluginId ? null : pluginId);
  };

  const renderPluginDetails = (plugin: PluginStep) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>Plugin Step Details</Title3>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Step ID</Text>
            <Text className={`${styles.detailValue} ${styles.codeText}`}>{plugin.id}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Plugin Type</Text>
            <Text className={styles.detailValue}>{plugin.typeName}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Assembly</Text>
            <Text className={styles.detailValue}>{plugin.assemblyName}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Entity</Text>
            <Text className={`${styles.detailValue} ${styles.codeText}`}>{plugin.entity}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Message</Text>
            <Text className={styles.detailValue}>{plugin.message}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Execution Stage</Text>
            <Text className={styles.detailValue}>{plugin.stageName} ({plugin.stage})</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Execution Mode</Text>
            <Text className={styles.detailValue}>{plugin.modeName}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Execution Order</Text>
            <Text className={styles.detailValue}>{plugin.rank}</Text>
          </div>
        </div>

        {plugin.description && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Description</Text>
            <Text>
              <TruncatedText text={plugin.description} />
            </Text>
          </div>
        )}

        {plugin.filteringAttributes.length > 0 && (
          <div className={styles.section}>
            <Title3>Filtering Attributes ({plugin.filteringAttributes.length})</Title3>
            <div className={styles.badgeGroup}>
              {plugin.filteringAttributes.map((attr, idx) => (
                <Badge key={idx} appearance="tint" color="warning">
                  {attr}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(plugin.preImage || plugin.postImage) && (
          <div className={styles.section}>
            <Title3>Entity Images</Title3>
            <div className={styles.detailsGrid}>
              {plugin.preImage && (
                <div className={styles.detailItem}>
                  <Text className={styles.detailLabel}>Pre-Image</Text>
                  <Text className={styles.detailValue}>{plugin.preImage.name}</Text>
                  <Text className={styles.codeText}>Property: {plugin.preImage.messagePropertyName}</Text>
                  <Text className={styles.codeText}>
                    Attributes: {plugin.preImage.attributes?.join(', ') || 'All'}
                  </Text>
                </div>
              )}
              {plugin.postImage && (
                <div className={styles.detailItem}>
                  <Text className={styles.detailLabel}>Post-Image</Text>
                  <Text className={styles.detailValue}>{plugin.postImage.name}</Text>
                  <Text className={styles.codeText}>Property: {plugin.postImage.messagePropertyName}</Text>
                  <Text className={styles.codeText}>
                    Attributes: {plugin.postImage.attributes?.join(', ') || 'All'}
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
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

  return (
    <div className={styles.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search plugins..."
        filteredCount={searchedPlugins.length}
        totalCount={sortedPlugins.length}
        itemLabel="plugins"
      >
        <FilterGroup label="Stage:">
          {STAGE_VALUES.map((stage) => (
            <ToggleButton
              key={stage}
              className={styles.filterButton}
              size="small"
              checked={activeStageFilters.has(stage)}
              disabled={stageCounts[stage] === 0}
              onClick={() => toggleStageFilter(stage)}
            >
              {formatStageLabel(stage)}
            </ToggleButton>
          ))}
          {activeStageFilters.size > 0 && (
            <Button appearance="transparent" size="small" onClick={() => setActiveStageFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
        <FilterGroup label="State:">
          {STATE_VALUES.map((state) => (
            <ToggleButton
              key={state}
              className={styles.filterButton}
              size="small"
              checked={activeStateFilters.has(state)}
              disabled={stateCounts[state] === 0}
              onClick={() => toggleStateFilter(state)}
            >
              {state}
            </ToggleButton>
          ))}
          {activeStateFilters.size > 0 && (
            <Button appearance="transparent" size="small" onClick={() => setActiveStateFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
      </FilterBar>
      {searchedPlugins.length === 0 && sortedPlugins.length > 0 ? (
        <div className={styles.emptyState}>
          <Text>No plugins match your search.</Text>
        </div>
      ) : null}
      {searchedPlugins.map((plugin) => {
        const isExpanded = expandedPluginId === plugin.id;
        return (
          <div key={plugin.id}>
            <div
              className={`${styles.pluginRow} ${isExpanded ? styles.pluginRowExpanded : ''}`}
              onClick={() => toggleExpand(plugin.id)}
            >
              <div className={styles.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <Text className={styles.rank}>{plugin.rank}</Text>
              <div className={styles.nameColumn}>
                <Text weight="semibold">
                  <TruncatedText text={plugin.name} />
                </Text>
                <Text className={styles.codeText}>
                  <TruncatedText text={plugin.assemblyName} />
                </Text>
              </div>
              {!entityLogicalName && (
                <Text className={styles.codeText}>
                  <TruncatedText text={plugin.entity} />
                </Text>
              )}
              <Badge appearance="outline" shape="rounded" size="medium">{plugin.message}</Badge>
              <Badge
                appearance="filled"
                size="medium"
                shape="rounded"
                style={{
                  backgroundColor: getStageBadgeColor(plugin.stage),
                  color: 'white',
                }}
              >
                {plugin.stageName}
              </Badge>
              <Badge appearance={plugin.mode === 0 ? 'outline' : 'filled'} color={plugin.mode === 0 ? 'brand' : 'important'} size="medium" shape="rounded">
                {plugin.modeName}
              </Badge>
              <Badge appearance="filled" shape="rounded" color={plugin.state === 'Enabled' ? 'success' : 'important'} size="medium">
                {plugin.state}
              </Badge>
            </div>
            {isExpanded && renderPluginDetails(plugin)}
          </div>
        );
      })}
    </div>
  );
}
