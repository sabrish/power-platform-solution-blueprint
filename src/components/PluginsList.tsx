import React, { useMemo, useState, useCallback } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  mergeClasses,
  tokens,
  Card,
  Title3,
  ToggleButton,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { PluginStep } from '../core';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

// These must exactly match PluginDiscovery.getStageName() output (no hyphens)
// 'Asynchronous' is NOT a stage — it is a mode. Asynchronous plugins use stage 50 (PostOperation).
const STAGE_VALUES = ['PreValidation', 'PreOperation', 'PostOperation'];
const MODE_VALUES = ['Synchronous', 'Asynchronous'];
const PLUGIN_TYPE_DROPDOWN_MIN_WIDTH = '130px'; // fixed dropdown width — no token equivalent
const STATE_VALUES = ['Enabled', 'Disabled'];

/** Convert internal stageName to a human-readable display label */
const formatStageLabel = (stageName: string): string => {
  switch (stageName) {
    case 'PreValidation': return 'Pre-Validation';
    case 'PreOperation': return 'Pre-Operation';
    case 'PostOperation': return 'Post-Operation';
    default: return stageName;
  }
};

const useStyles = makeStyles({
  pluginRow: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} 40px minmax(200px, 2fr) minmax(100px, 1fr) auto auto auto auto`,
  },
  rank: {
    fontWeight: tokens.fontWeightSemibold,
    textAlign: 'center',
  },
  typeDropdown: {
    minWidth: PLUGIN_TYPE_DROPDOWN_MIN_WIDTH, // fixed dropdown width — no token equivalent
  },
});

export interface PluginsListProps {
  plugins: PluginStep[];
  entityLogicalName?: string;
}

export function PluginsList({
  plugins,
  entityLogicalName,
}: PluginsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedPluginId, setExpandedPluginId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageFilters, setActiveStageFilters] = useState<Set<string>>(new Set());
  const [activeModeFilters, setActiveModeFilters] = useState<Set<string>>(new Set());
  const [activeStateFilters, setActiveStateFilters] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<string>('');

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

  // Sorted unique message names in the base dataset (for the message dropdown)
  const availableMessages = useMemo(() => {
    const msgs = new Set<string>();
    for (const p of sortedPlugins) if (p.message) msgs.add(p.message);
    return [...msgs].sort();
  }, [sortedPlugins]);

  // Count per stage / mode / state in the base dataset (drives disabled state on filter buttons)
  const stageCounts = useMemo(() => {
    const counts = Object.fromEntries(STAGE_VALUES.map((s) => [s, 0]));
    for (const p of sortedPlugins) counts[p.stageName] = (counts[p.stageName] ?? 0) + 1;
    return counts;
  }, [sortedPlugins]);

  const modeCounts = useMemo(() => {
    const counts = Object.fromEntries(MODE_VALUES.map((m) => [m, 0]));
    for (const p of sortedPlugins) counts[p.modeName] = (counts[p.modeName] ?? 0) + 1;
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
    if (selectedMessage) {
      filtered = filtered.filter((p) => p.message === selectedMessage);
    }
    if (activeStageFilters.size > 0) {
      filtered = filtered.filter((p) => activeStageFilters.has(p.stageName));
    }
    if (activeModeFilters.size > 0) {
      filtered = filtered.filter((p) => activeModeFilters.has(p.modeName));
    }
    if (activeStateFilters.size > 0) {
      filtered = filtered.filter((p) => activeStateFilters.has(p.state));
    }
    return filtered;
  }, [sortedPlugins, selectedMessage, activeStageFilters, activeModeFilters, activeStateFilters]);

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

  const toggleStageFilter = useCallback((stage: string) => {
    setActiveStageFilters((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  }, []);

  const toggleModeFilter = useCallback((mode: string) => {
    setActiveModeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode); else next.add(mode);
      return next;
    });
  }, []);

  const toggleStateFilter = useCallback((state: string) => {
    setActiveStateFilters((prev) => {
      const next = new Set(prev);
      if (next.has(state)) {
        next.delete(state);
      } else {
        next.add(state);
      }
      return next;
    });
  }, []);

  const getStageBadgeColor = (stageName: string): 'brand' | 'informative' | 'success' | 'severe' => {
    switch (stageName) {
      case 'PreValidation': return 'brand';
      case 'PreOperation': return 'informative';
      case 'PostOperation': return 'success';
      case 'Asynchronous': return 'severe';
      default: return 'brand';
    }
  };

  const toggleExpand = useCallback((pluginId: string) => {
    setExpandedPluginId(prev => prev === pluginId ? null : pluginId);
  }, []);

  const renderPluginDetails = (plugin: PluginStep): React.ReactElement => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Plugin Step Details</Title3>

        <div className={shared.detailsGrid}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Step ID</Text>
            <Text className={mergeClasses(shared.detailValue, shared.codeText)}>{plugin.id}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Plugin Type</Text>
            <Text className={shared.detailValue}>{plugin.typeName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Assembly</Text>
            <Text className={shared.detailValue}>{plugin.assemblyName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Entity</Text>
            <Text className={mergeClasses(shared.detailValue, shared.codeText)}>{plugin.entity}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Message</Text>
            <Text className={shared.detailValue}>{plugin.message}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Execution Stage</Text>
            <Text className={shared.detailValue}>{plugin.stageName} ({plugin.stage})</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Execution Mode</Text>
            <Text className={shared.detailValue}>{plugin.modeName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Execution Order</Text>
            <Text className={shared.detailValue}>{plugin.rank}</Text>
          </div>
        </div>

        {plugin.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.detailValue}>{plugin.description}</Text>
          </div>
        )}

        {plugin.filteringAttributes.length > 0 && (
          <div className={shared.section}>
            <Title3>Filtering Attributes ({plugin.filteringAttributes.length})</Title3>
            <div className={shared.badgeGroup}>
              {plugin.filteringAttributes.map((attr, idx) => (
                <Badge key={idx} appearance="tint" shape="rounded" size="medium" color="warning">
                  {attr}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(plugin.preImage || plugin.postImage) && (
          <div className={shared.section}>
            <Title3>Entity Images</Title3>
            <div className={shared.detailsGrid}>
              {plugin.preImage && (
                <div className={shared.detailItem}>
                  <Text className={shared.detailLabel}>Pre-Image</Text>
                  <Text className={shared.detailValue}>{plugin.preImage.name}</Text>
                  <Text className={shared.codeText}>Property: {plugin.preImage.messagePropertyName}</Text>
                  <Text className={shared.codeText}>
                    Attributes: {plugin.preImage.attributes?.join(', ') || 'All'}
                  </Text>
                </div>
              )}
              {plugin.postImage && (
                <div className={shared.detailItem}>
                  <Text className={shared.detailLabel}>Post-Image</Text>
                  <Text className={shared.detailValue}>{plugin.postImage.name}</Text>
                  <Text className={shared.codeText}>Property: {plugin.postImage.messagePropertyName}</Text>
                  <Text className={shared.codeText}>
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
      <EmptyState
        type="plugins"
        message={
          entityLogicalName
            ? `No plugins registered for the ${entityLogicalName} entity.`
            : 'No plugins are registered in the selected solution(s).'
        }
      />
    );
  }

  return (
    <div className={shared.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search plugins..."
        filteredCount={searchedPlugins.length}
        totalCount={sortedPlugins.length}
        itemLabel="plugins"
      >
        <FilterGroup
          label="Message:"
          hasActiveFilters={selectedMessage !== ''}
          onClear={() => setSelectedMessage('')}
        >
          <Dropdown
            size="small"
            className={styles.typeDropdown}
            aria-label="Filter by message"
            value={selectedMessage || 'All'}
            selectedOptions={selectedMessage ? [selectedMessage] : []}
            onOptionSelect={(_, data) => setSelectedMessage(data.optionValue === '' ? '' : (data.optionValue ?? ''))}
          >
            <Option value="">All</Option>
            {availableMessages.map((msg) => (
              <Option key={msg} value={msg}>{msg}</Option>
            ))}
          </Dropdown>
        </FilterGroup>
        <FilterGroup
          label="Stage:"
          hasActiveFilters={activeStageFilters.size > 0}
          onClear={() => setActiveStageFilters(new Set())}
        >
          {STAGE_VALUES.map((stage) => (
            <ToggleButton
              key={stage}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeStageFilters.has(stage)}
              disabled={stageCounts[stage] === 0}
              onClick={() => toggleStageFilter(stage)}
            >
              {formatStageLabel(stage)}
            </ToggleButton>
          ))}
        </FilterGroup>
        <FilterGroup
          label="Mode:"
          hasActiveFilters={activeModeFilters.size > 0}
          onClear={() => setActiveModeFilters(new Set())}
        >
          {MODE_VALUES.map((mode) => (
            <ToggleButton
              key={mode}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeModeFilters.has(mode)}
              disabled={modeCounts[mode] === 0}
              onClick={() => toggleModeFilter(mode)}
            >
              {mode}
            </ToggleButton>
          ))}
        </FilterGroup>
        <FilterGroup
          label="State:"
          hasActiveFilters={activeStateFilters.size > 0}
          onClear={() => setActiveStateFilters(new Set())}
        >
          {STATE_VALUES.map((state) => (
            <ToggleButton
              key={state}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeStateFilters.has(state)}
              disabled={stateCounts[state] === 0}
              onClick={() => toggleStateFilter(state)}
            >
              {state}
            </ToggleButton>
          ))}
        </FilterGroup>
      </FilterBar>
      {searchedPlugins.length === 0 && sortedPlugins.length > 0 ? (
        <EmptyState type="search" />
      ) : null}
      {searchedPlugins.map((plugin) => {
        const isExpanded = expandedPluginId === plugin.id;
        return (
          <div key={plugin.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.pluginRow, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(plugin.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(plugin.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <Text className={styles.rank}>{plugin.rank}</Text>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{plugin.name}</Text>
                <Text className={shared.codeText}>{plugin.assemblyName}</Text>
              </div>
              {!entityLogicalName && (
                <Text className={shared.codeText}>{plugin.entity}</Text>
              )}
              <Badge appearance="outline" shape="rounded" size="small">{plugin.message}</Badge>
              <Badge
                appearance="tint"
                size="small"
                shape="rounded"
                color={getStageBadgeColor(plugin.stageName)}
              >
                {plugin.stageName}
              </Badge>
              <Badge appearance={plugin.mode === 0 ? 'outline' : 'tint'} color={plugin.mode === 0 ? 'brand' : 'important'} size="small" shape="rounded">
                {plugin.modeName}
              </Badge>
              <Badge appearance="filled" shape="rounded" color={plugin.state === 'Enabled' ? 'success' : 'important'} size="small">
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
