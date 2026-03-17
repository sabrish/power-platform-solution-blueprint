import React, { useMemo, useCallback } from 'react';
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
import { useListFilter, type FilterSpec } from '../hooks/useListFilter';
import { useExpandable } from '../hooks/useExpandable';
import { getPluginStageLabel } from '../core/utils/pluginStageLabels';

// These must exactly match PluginDiscovery.getStageName() output (no hyphens)
// 'Asynchronous' is NOT a stage — it is a mode. Asynchronous plugins use stage 50 (PostOperation).
const STAGE_VALUES = ['PreValidation', 'PreOperation', 'PostOperation'];
const MODE_VALUES = ['Synchronous', 'Asynchronous'];
const PLUGIN_TYPE_DROPDOWN_MIN_WIDTH = '130px'; // fixed dropdown width — no token equivalent
const STATE_VALUES = ['Enabled', 'Disabled'];

/**
 * Display-label map for filter buttons: maps canonical stage name → hyphenated UI label.
 * Stage names come from getPluginStageLabel() in src/core/utils/pluginStageLabels.ts.
 */
const STAGE_DISPLAY_LABELS: Record<string, string> = {
  [getPluginStageLabel(10)]: 'Pre-Validation',
  [getPluginStageLabel(20)]: 'Pre-Operation',
  [getPluginStageLabel(40)]: 'Post-Operation',
};

/** Convert internal stageName to a human-readable display label for UI filter buttons */
const formatStageLabel = (stageName: string): string =>
  STAGE_DISPLAY_LABELS[stageName] ?? stageName;

const FILTER_SPECS = [
  { name: 'stage', getKey: (p: PluginStep) => p.stageName },
  { name: 'mode', getKey: (p: PluginStep) => p.modeName },
  { name: 'state', getKey: (p: PluginStep) => p.state },
  { name: 'message', getKey: (p: PluginStep) => p.message },
] satisfies FilterSpec<PluginStep>[];

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
  const { expandedId, toggleExpand } = useExpandable();

  // Filter plugins by entity if specified
  const filteredPlugins = useMemo(() => {
    if (!entityLogicalName) return plugins;
    return plugins.filter((p) => p.entity?.toLowerCase() === entityLogicalName.toLowerCase());
  }, [plugins, entityLogicalName]);

  // Sort plugins by entity, message, stage, and rank
  const sortedPlugins = useMemo(() => {
    return [...filteredPlugins].sort((a, b) => {
      const entityA = a.entity ?? '';
      const entityB = b.entity ?? '';
      if (entityA !== entityB) return entityA.localeCompare(entityB);
      if (a.message !== b.message) return a.message.localeCompare(b.message);
      if (a.stage !== b.stage) return a.stage - b.stage;
      return a.rank - b.rank;
    });
  }, [filteredPlugins]);

  const { filteredItems, searchQuery, setSearchQuery, toggleKey, clearFilter, activeFilters } =
    useListFilter(
      sortedPlugins,
      (p, q) =>
        p.name.toLowerCase().includes(q) ||
        (p.entity?.toLowerCase().includes(q) ?? false) ||
        p.assemblyName.toLowerCase().includes(q) ||
        p.typeName.toLowerCase().includes(q),
      FILTER_SPECS
    );

  // Derive active filter sets from the hook
  const activeStageFilters = activeFilters['stage'] ?? new Set<string>();
  const activeModeFilters = activeFilters['mode'] ?? new Set<string>();
  const activeStateFilters = activeFilters['state'] ?? new Set<string>();
  const activeMessageFilters = activeFilters['message'] ?? new Set<string>();

  // Single-select message dropdown: the active set has at most one key
  const selectedMessage = activeMessageFilters.size === 1 ? [...activeMessageFilters][0] : '';

  const handleMessageSelect = useCallback((_: unknown, data: { optionValue?: string }) => {
    clearFilter('message');
    if (data.optionValue) {
      toggleKey('message', data.optionValue);
    }
  }, [clearFilter, toggleKey]);

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

  const getStageBadgeColor = (stageName: string): 'brand' | 'informative' | 'success' | 'severe' => {
    switch (stageName) {
      case 'PreValidation': return 'brand';
      case 'PreOperation': return 'informative';
      case 'PostOperation': return 'success';
      case 'Asynchronous': return 'severe';
      default: return 'brand';
    }
  };

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
            <Text className={mergeClasses(shared.detailValue, shared.codeText)}>{plugin.entity ?? 'Global'}</Text>
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
        filteredCount={filteredItems.length}
        totalCount={sortedPlugins.length}
        itemLabel="plugins"
      >
        <FilterGroup
          label="Message:"
          hasActiveFilters={selectedMessage !== ''}
          onClear={() => clearFilter('message')}
        >
          <Dropdown
            size="small"
            className={styles.typeDropdown}
            aria-label="Filter by message"
            value={selectedMessage || 'All'}
            selectedOptions={selectedMessage ? [selectedMessage] : []}
            onOptionSelect={handleMessageSelect}
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
          onClear={() => clearFilter('stage')}
        >
          {STAGE_VALUES.map((stage) => (
            <ToggleButton
              key={stage}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeStageFilters.has(stage)}
              disabled={stageCounts[stage] === 0}
              onClick={() => toggleKey('stage', stage)}
            >
              {formatStageLabel(stage)}
            </ToggleButton>
          ))}
        </FilterGroup>
        <FilterGroup
          label="Mode:"
          hasActiveFilters={activeModeFilters.size > 0}
          onClear={() => clearFilter('mode')}
        >
          {MODE_VALUES.map((mode) => (
            <ToggleButton
              key={mode}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeModeFilters.has(mode)}
              disabled={modeCounts[mode] === 0}
              onClick={() => toggleKey('mode', mode)}
            >
              {mode}
            </ToggleButton>
          ))}
        </FilterGroup>
        <FilterGroup
          label="State:"
          hasActiveFilters={activeStateFilters.size > 0}
          onClear={() => clearFilter('state')}
        >
          {STATE_VALUES.map((state) => (
            <ToggleButton
              key={state}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeStateFilters.has(state)}
              disabled={stateCounts[state] === 0}
              onClick={() => toggleKey('state', state)}
            >
              {state}
            </ToggleButton>
          ))}
        </FilterGroup>
      </FilterBar>
      {filteredItems.length === 0 && sortedPlugins.length > 0 ? (
        <EmptyState type="search" />
      ) : null}
      {filteredItems.map((plugin) => {
        const isExpanded = expandedId === plugin.id;
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
                <Text className={shared.codeText}>{plugin.entity ?? 'Global'}</Text>
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
