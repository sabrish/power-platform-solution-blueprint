import { useState, useMemo } from 'react';
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
import {
  ChevronDown20Regular,
  ChevronRight20Regular,
  Code20Regular,
  ArrowSync20Regular,
  ArrowRight20Regular,
} from '@fluentui/react-icons';
import type { CustomAPI } from '../core';

const API_TYPE_VALUES = ['Action', 'Function'];
const API_BINDING_VALUES = ['Global', 'Entity', 'EntityCollection'];

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
  apiRow: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto auto',
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
  apiRowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },
  nameColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    wordBreak: 'break-word',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
  onSelectAPI: (api: CustomAPI) => void;
}

/**
 * Card-row list of Custom APIs. Each row expands inline to show full details.
 */
export function CustomAPIsList({ customAPIs }: CustomAPIsListProps) {
  const styles = useStyles();
  const [expandedApiId, setExpandedApiId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<string>>(new Set());
  const [activeBindingFilters, setActiveBindingFilters] = useState<Set<string>>(new Set());

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

  const toggleTypeFilter = (type: string) => {
    setActiveTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleBindingFilter = (binding: string) => {
    setActiveBindingFilters(prev => {
      const next = new Set(prev);
      if (next.has(binding)) next.delete(binding);
      else next.add(binding);
      return next;
    });
  };

  const filteredAPIs = useMemo(() => {
    let filtered = sortedAPIs;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(a =>
        a.uniqueName.toLowerCase().includes(q) ||
        (a.displayName && a.displayName.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    }
    if (activeTypeFilters.size > 0) {
      filtered = filtered.filter(a => activeTypeFilters.has(a.isFunction ? 'Function' : 'Action'));
    }
    if (activeBindingFilters.size > 0) {
      filtered = filtered.filter(a => activeBindingFilters.has(a.bindingType));
    }
    return filtered;
  }, [sortedAPIs, searchQuery, activeTypeFilters, activeBindingFilters]);

  const toggleExpand = (apiId: string) => {
    setExpandedApiId(prev => prev === apiId ? null : apiId);
  };

  const getBindingColor = (bindingType: 'Global' | 'Entity' | 'EntityCollection'): 'brand' | 'success' | 'danger' => {
    switch (bindingType) {
      case 'Global': return 'brand';
      case 'Entity': return 'success';
      case 'EntityCollection': return 'danger';
    }
  };

  const renderApiDetails = (api: CustomAPI) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>Custom API Details</Title3>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Unique Name</Text>
            <Text className={`${styles.detailValue} ${styles.codeText}`}>{api.uniqueName}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Display Name</Text>
            <Text className={styles.detailValue}>{api.displayName || '—'}</Text>
          </div>
          {api.boundEntityLogicalName && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Bound Entity</Text>
              <Text className={`${styles.detailValue} ${styles.codeText}`}>{api.boundEntityLogicalName}</Text>
            </div>
          )}
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Execution Privilege</Text>
            <Text className={styles.detailValue}>{api.executionPrivilege}</Text>
          </div>
          {api.allowedCustomProcessingStepType !== undefined && (
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Processing Step Type</Text>
              <Text className={styles.detailValue}>{api.allowedCustomProcessingStepType}</Text>
            </div>
          )}
        </div>

        {api.description && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Description</Text>
            <Text>{api.description}</Text>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.badgeGroup}>
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
          <div className={styles.section}>
            <Title3>Request Parameters ({api.requestParameters.length})</Title3>
            <div className={styles.paramTable}>
              {api.requestParameters.map((param, idx) => (
                <div key={idx} className={styles.paramRow}>
                  <Text className={styles.codeText}>{param.uniqueName}</Text>
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
          <div className={styles.section}>
            <Title3>Response Properties ({api.responseProperties.length})</Title3>
            <div className={styles.paramTable}>
              {api.responseProperties.map((prop, idx) => (
                <div key={idx} className={styles.paramRow}>
                  <Text className={styles.codeText}>{prop.uniqueName}</Text>
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
    return (
      <div className={styles.emptyState}>
        <Text size={500} weight="semibold">No Custom APIs Found</Text>
        <Text>No custom APIs were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search custom APIs..."
        filteredCount={filteredAPIs.length}
        totalCount={sortedAPIs.length}
        itemLabel="APIs"
      >
        <FilterGroup label="Type:">
          {API_TYPE_VALUES.map(type => (
            <ToggleButton
              key={type}
              className={styles.filterButton}
              size="small"
              checked={activeTypeFilters.has(type)}
              disabled={typeCounts[type] === 0}
              onClick={() => toggleTypeFilter(type)}
            >
              {type}
            </ToggleButton>
          ))}
          {activeTypeFilters.size > 0 && (
            <Button appearance="transparent" size="small" onClick={() => setActiveTypeFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
        <FilterGroup label="Binding:">
          {API_BINDING_VALUES.map(binding => (
            <ToggleButton
              key={binding}
              className={styles.filterButton}
              size="small"
              checked={activeBindingFilters.has(binding)}
              disabled={bindingCounts[binding] === 0}
              onClick={() => toggleBindingFilter(binding)}
            >
              {binding}
            </ToggleButton>
          ))}
          {activeBindingFilters.size > 0 && (
            <Button appearance="transparent" size="small" onClick={() => setActiveBindingFilters(new Set())}>
              Clear
            </Button>
          )}
        </FilterGroup>
      </FilterBar>

      {filteredAPIs.length === 0 && sortedAPIs.length > 0 && (
        <div className={styles.emptyState}>
          <Text>No APIs match your search.</Text>
        </div>
      )}

      {filteredAPIs.map(api => {
        const isExpanded = expandedApiId === api.id;
        const apiType = api.isFunction ? 'Function' : 'Action';

        return (
          <div key={api.id}>
            <div
              className={`${styles.apiRow} ${isExpanded ? styles.apiRowExpanded : ''}`}
              onClick={() => toggleExpand(api.id)}
            >
              <div className={styles.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={styles.nameColumn}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
                  <Code20Regular style={{ color: tokens.colorNeutralForeground3, flexShrink: 0 }} />
                  <Text weight="semibold" className={styles.codeText} style={{ color: tokens.colorNeutralForeground1 }}>
                    {api.uniqueName}
                  </Text>
                </div>
                {api.displayName && api.displayName !== api.uniqueName && (
                  <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                    {api.displayName}
                  </Text>
                )}
              </div>
              <div className={styles.badgeGroup}>
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
              <div className={styles.badgeGroup}>
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
