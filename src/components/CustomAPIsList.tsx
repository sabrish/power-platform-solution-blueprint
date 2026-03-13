import { useState, useMemo, useCallback } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  ToggleButton,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import {
  ChevronDown20Regular,
  ChevronRight20Regular,
  Code20Regular,
  ArrowSync20Regular,
  ArrowRight20Regular,
} from '@fluentui/react-icons';
import type { CustomAPI } from '../core';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';
import { useListFilter, type FilterSpec } from '../hooks/useListFilter';

const API_TYPE_VALUES = ['Action', 'Function'];
const API_BINDING_VALUES = ['Global', 'Entity', 'EntityCollection'];

const API_FILTER_SPECS: readonly FilterSpec<CustomAPI>[] = [
  { name: 'type',    getKey: (a) => (a.isFunction ? 'Function' : 'Action') },
  { name: 'binding', getKey: (a) => a.bindingType },
];

const useStyles = makeStyles({
  apiRow: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto auto`,
  },
  paramTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  paramRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 1fr) auto minmax(80px, auto)',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
  },
});

interface CustomAPIsListProps {
  customAPIs: CustomAPI[];
}

/**
 * Card-row list of Custom APIs. Each row expands inline to show full details.
 */
export function CustomAPIsList({ customAPIs }: CustomAPIsListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedApiId, setExpandedApiId] = useState<string | null>(null);

  // Sort APIs alphabetically by unique name
  const sortedAPIs = useMemo(() => {
    return [...customAPIs].sort((a, b) => a.uniqueName.localeCompare(b.uniqueName));
  }, [customAPIs]);

  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(API_TYPE_VALUES.map(t => [t, 0]));
    for (const a of sortedAPIs) {
      const key = a.isFunction ? 'Function' : 'Action';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [sortedAPIs]);

  const bindingCounts = useMemo(() => {
    const counts = Object.fromEntries(API_BINDING_VALUES.map(b => [b, 0]));
    for (const a of sortedAPIs) counts[a.bindingType] = (counts[a.bindingType] ?? 0) + 1;
    return counts;
  }, [sortedAPIs]);

  const {
    filteredItems: filteredAPIs,
    searchQuery,
    setSearchQuery,
    toggleKey,
    clearFilter,
    activeFilters,
  } = useListFilter(
    sortedAPIs,
    (a, q) =>
      a.uniqueName.toLowerCase().includes(q) ||
      (a.displayName?.toLowerCase().includes(q) ?? false) ||
      (a.description?.toLowerCase().includes(q) ?? false),
    API_FILTER_SPECS,
  );

  const toggleExpand = useCallback((apiId: string) => {
    setExpandedApiId((prev) => (prev === apiId ? null : apiId));
  }, []);

  const getBindingColor = (bindingType: 'Global' | 'Entity' | 'EntityCollection'): 'brand' | 'success' | 'danger' => {
    switch (bindingType) {
      case 'Global': return 'brand';
      case 'Entity': return 'success';
      case 'EntityCollection': return 'danger';
    }
  };

  const renderApiDetails = (api: CustomAPI) => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Custom API Details</Title3>

        <div className={shared.detailsGrid}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Unique Name</Text>
            <Text className={`${shared.detailValue} ${shared.codeText}`}>{api.uniqueName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Display Name</Text>
            <Text className={shared.detailValue}>{api.displayName || '—'}</Text>
          </div>
          {api.boundEntityLogicalName && (
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Bound Entity</Text>
              <Text className={`${shared.detailValue} ${shared.codeText}`}>{api.boundEntityLogicalName}</Text>
            </div>
          )}
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Execution Privilege</Text>
            <Text className={shared.detailValue}>{api.executionPrivilege}</Text>
          </div>
          {api.allowedCustomProcessingStepType !== undefined && (
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Processing Step Type</Text>
              <Text className={shared.detailValue}>{api.allowedCustomProcessingStepType}</Text>
            </div>
          )}
        </div>

        {api.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text>{api.description}</Text>
          </div>
        )}

        <div className={shared.section}>
          <div className={shared.badgeGroup}>
            <Badge appearance="tint" shape="rounded" color={api.isFunction ? 'brand' : 'danger'}>
              {api.isFunction ? 'Function' : 'Action'}
            </Badge>
            <Badge appearance="tint" shape="rounded" color={getBindingColor(api.bindingType)}>
              {api.bindingType}
            </Badge>
            {api.isPrivate && (
              <Badge appearance="outline" shape="rounded" color="important">Private</Badge>
            )}
            {api.isManaged && (
              <Badge appearance="outline" shape="rounded" color="warning">Managed</Badge>
            )}
          </div>
        </div>

        {api.requestParameters.length > 0 && (
          <div className={shared.section}>
            <Title3>Request Parameters ({api.requestParameters.length})</Title3>
            <div className={styles.paramTable}>
              {api.requestParameters.map((param, idx) => (
                <div key={idx} className={styles.paramRow}>
                  <Text className={shared.codeText}>{param.uniqueName}</Text>
                  <Badge appearance="outline" shape="rounded" size="small">{param.type}</Badge>
                  {param.isOptional && (
                    <Badge appearance="tint" shape="rounded" size="small" color="subtle">Optional</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {api.responseProperties.length > 0 && (
          <div className={shared.section}>
            <Title3>Response Properties ({api.responseProperties.length})</Title3>
            <div className={styles.paramTable}>
              {api.responseProperties.map((prop, idx) => (
                <div key={idx} className={styles.paramRow}>
                  <Text className={shared.codeText}>{prop.uniqueName}</Text>
                  <Badge appearance="tint" shape="rounded" size="small" color="success">{prop.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  if (customAPIs.length === 0) {
    return <EmptyState type="customapis" />;
  }

  return (
    <div className={shared.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search custom APIs..."
        filteredCount={filteredAPIs.length}
        totalCount={sortedAPIs.length}
        itemLabel="APIs"
      >
        <FilterGroup
          label="Type:"
          hasActiveFilters={(activeFilters['type']?.size ?? 0) > 0}
          onClear={() => clearFilter('type')}
        >
          {API_TYPE_VALUES.map(type => (
            <ToggleButton
              key={type}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeFilters['type']?.has(type) ?? false}
              disabled={typeCounts[type] === 0}
              onClick={() => toggleKey('type', type)}
            >
              {type}
            </ToggleButton>
          ))}
        </FilterGroup>
        <FilterGroup
          label="Binding:"
          hasActiveFilters={(activeFilters['binding']?.size ?? 0) > 0}
          onClear={() => clearFilter('binding')}
        >
          {API_BINDING_VALUES.map(binding => (
            <ToggleButton
              key={binding}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeFilters['binding']?.has(binding) ?? false}
              disabled={bindingCounts[binding] === 0}
              onClick={() => toggleKey('binding', binding)}
            >
              {binding}
            </ToggleButton>
          ))}
        </FilterGroup>
      </FilterBar>

      {filteredAPIs.length === 0 && sortedAPIs.length > 0 && (
        <EmptyState type="search" />
      )}

      {filteredAPIs.map(api => {
        const isExpanded = expandedApiId === api.id;
        const apiType = api.isFunction ? 'Function' : 'Action';

        return (
          <div key={api.id}>
            <div
              className={`${shared.cardRow} ${styles.apiRow} ${isExpanded ? shared.cardRowExpanded : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(api.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(api.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                  <Code20Regular style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }} />
                  <Text weight="semibold" className={shared.codeText} style={{ color: tokens.colorNeutralForeground1 }}>
                    {api.uniqueName}
                  </Text>
                </div>
                {api.displayName && api.displayName !== api.uniqueName && (
                  <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                    {api.displayName}
                  </Text>
                )}
              </div>
              <div className={shared.badgeGroup}>
                <Badge
                  appearance="tint"
                  shape="rounded"
                  size="small"
                  color={api.isFunction ? 'brand' : 'danger'}
                >
                  {api.isFunction ? <><ArrowRight20Regular /> {apiType}</> : <><ArrowSync20Regular /> {apiType}</>}
                </Badge>
              </div>
              <Badge appearance="tint" shape="rounded" size="small" color={getBindingColor(api.bindingType)}>
                {api.bindingType}
              </Badge>
              <div className={shared.badgeGroup}>
                <Badge appearance="tint" shape="circular" size="small">
                  {api.requestParameters.length}
                </Badge>
                <Badge appearance="tint" shape="circular" size="small" color="success">
                  {api.responseProperties.length}
                </Badge>
              </div>
            </div>
            {isExpanded && renderApiDetails(api)}
          </div>
        );
      })}
    </div>
  );
}
