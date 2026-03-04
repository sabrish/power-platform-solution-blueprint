import { useState, useMemo } from 'react';
import {
  SearchBox,
  Text,
  Badge,
  Button,
  Tooltip,
  ToggleButton,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Database24Regular, ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { EntityBlueprint, ClassicWorkflow, BusinessProcessFlow } from '../core';
import { SchemaView } from './SchemaView';
import { filterDescription } from '../utils/descriptionFilter';
import { TruncatedText } from './TruncatedText';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    gap: tokens.spacingVerticalM,
    minHeight: 0,
  },
  searchHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flexShrink: 0,
  },
  searchBox: {
    maxWidth: '400px',
  },
  countBadge: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  entityRow: {
    display: 'flex',
    alignItems: 'start',
    gap: tokens.spacingHorizontalM,
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
  entityRowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  entityIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  entityInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  entityName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
    minWidth: 0,
    maxWidth: '250px',
    flexShrink: 0,
  },
  entityLogicalName: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    fontFamily: 'Consolas, Monaco, monospace',
    minWidth: 0,
    maxWidth: '200px',
    flexShrink: 0,
  },
  entityDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    flex: 1,
    minWidth: 0,
  },
  entityFlags: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    alignItems: 'center',
    flexShrink: 0,
  },
  entityStats: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  filterBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginRight: tokens.spacingHorizontalXS,
    flexShrink: 0,
  },
  filterButton: {
    minWidth: 'unset',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    height: '22px',
    fontSize: tokens.fontSizeBase100,
  },
  statBadge: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  attributeCount: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
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
    marginBottom: tokens.spacingVerticalL,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
  },
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
  },
  tableContainer: {
    marginTop: tokens.spacingVerticalM,
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalM,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
  },
});

// Flag types for filtering
type FlagType = 'plugins' | 'forms' | 'businessRules' | 'flows' | 'classicWorkflows' | 'bpfs';

interface FlagConfig {
  key: FlagType;
  label: string;
  color: 'brand' | 'success' | 'warning' | 'informative' | 'severe';
  tooltip: string;
}

const FLAG_CONFIGS: FlagConfig[] = [
  { key: 'plugins', label: 'Plugin', color: 'brand', tooltip: 'Has Plugins' },
  { key: 'forms', label: 'Form', color: 'success', tooltip: 'Has Forms' },
  { key: 'businessRules', label: 'Rule', color: 'warning', tooltip: 'Has Business Rules' },
  { key: 'flows', label: 'Flow', color: 'informative', tooltip: 'Has Flows' },
  { key: 'classicWorkflows', label: 'Workflow', color: 'severe', tooltip: 'Has Classic Workflows' },
  { key: 'bpfs', label: 'BPF', color: 'success', tooltip: 'Has Business Process Flows' },
];

export interface EntityListProps {
  blueprints: EntityBlueprint[];
  classicWorkflows?: ClassicWorkflow[];
  businessProcessFlows?: BusinessProcessFlow[];
}

export function EntityList({ blueprints, classicWorkflows = [], businessProcessFlows = [] }: EntityListProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FlagType>>(new Set());

  // Get list of all entity logical names in scope
  const entitiesInScope = useMemo(() => {
    return blueprints.map(bp => bp.entity.LogicalName);
  }, [blueprints]);

  // Precompute per-entity counts for classicWorkflows and BPFs once (O(n))
  // so getEntityFlagCounts can do O(1) map lookups instead of O(n) filters per entity.
  const classicWorkflowCountByEntity = useMemo(() => {
    const map = new Map<string, number>();
    for (const wf of classicWorkflows) {
      map.set(wf.entity, (map.get(wf.entity) ?? 0) + 1);
    }
    return map;
  }, [classicWorkflows]);

  const bpfCountByEntity = useMemo(() => {
    const map = new Map<string, number>();
    for (const bpf of businessProcessFlows) {
      map.set(bpf.primaryEntity, (map.get(bpf.primaryEntity) ?? 0) + 1);
    }
    return map;
  }, [businessProcessFlows]);

  // Compute entity flag counts per blueprint (Map<FlagType, count>)
  const getEntityFlagCounts = useMemo(() => {
    return (blueprint: EntityBlueprint): Map<FlagType, number> => {
      const counts = new Map<FlagType, number>();
      if (blueprint.plugins.length > 0) counts.set('plugins', blueprint.plugins.length);
      if (blueprint.forms.length > 0) counts.set('forms', blueprint.forms.length);
      if (blueprint.businessRules.length > 0) counts.set('businessRules', blueprint.businessRules.length);
      if (blueprint.flows.length > 0) counts.set('flows', blueprint.flows.length);
      const cwCount = classicWorkflowCountByEntity.get(blueprint.entity.LogicalName) ?? 0;
      if (cwCount > 0) counts.set('classicWorkflows', cwCount);
      const bpfCount = bpfCountByEntity.get(blueprint.entity.LogicalName) ?? 0;
      if (bpfCount > 0) counts.set('bpfs', bpfCount);
      return counts;
    };
  }, [classicWorkflowCountByEntity, bpfCountByEntity]);

  // Which flag types are present in at least one entity (for filter bar)
  const availableFlags = useMemo<FlagType[]>(() => {
    const present = new Set<FlagType>();
    for (const bp of blueprints) {
      getEntityFlagCounts(bp).forEach((_, k) => present.add(k));
    }
    return FLAG_CONFIGS.map(c => c.key).filter(k => present.has(k));
  }, [blueprints, getEntityFlagCounts]);

  const toggleFilter = (flag: FlagType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  };

  // Filter and sort blueprints
  const filteredBlueprints = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered = blueprints;

    if (query) {
      filtered = blueprints.filter((blueprint) => {
        const entity = blueprint.entity;
        const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || '';
        const logicalName = entity.LogicalName || '';
        return (
          displayName.toLowerCase().includes(query) ||
          logicalName.toLowerCase().includes(query)
        );
      });
    }

    // Apply flag filters (AND logic — entity must have ALL selected flags)
    if (activeFilters.size > 0) {
      filtered = filtered.filter(bp => {
        const counts = getEntityFlagCounts(bp);
        for (const f of activeFilters) {
          if (!counts.has(f)) return false;
        }
        return true;
      });
    }

    // Sort alphabetically by display name
    return filtered.sort((a, b) => {
      const nameA = a.entity.DisplayName?.UserLocalizedLabel?.Label || a.entity.LogicalName;
      const nameB = b.entity.DisplayName?.UserLocalizedLabel?.Label || b.entity.LogicalName;
      return nameA.localeCompare(nameB);
    });
  }, [blueprints, searchQuery, activeFilters, getEntityFlagCounts]);

  const toggleExpand = (entityId: string) => {
    setExpandedEntityId(expandedEntityId === entityId ? null : entityId);
  };

  const renderEntityDetails = (blueprint: EntityBlueprint) => {
    return (
      <div className={styles.expandedDetails}>
        <SchemaView blueprint={blueprint} classicWorkflows={classicWorkflows} entitiesInScope={entitiesInScope} />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchHeader}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search entities..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value || '')}
        />
        {availableFlags.length > 0 && (
          <div className={styles.filterBar}>
            <Text className={styles.filterLabel}>Has all of:</Text>
            {availableFlags.map(flagKey => {
              const cfg = FLAG_CONFIGS.find(c => c.key === flagKey)!;
              return (
                <ToggleButton
                  key={flagKey}
                  size="small"
                  className={styles.filterButton}
                  checked={activeFilters.has(flagKey)}
                  onClick={() => toggleFilter(flagKey)}
                  appearance={activeFilters.has(flagKey) ? 'primary' : 'outline'}
                >
                  {cfg.label}
                </ToggleButton>
              );
            })}
            {activeFilters.size > 0 && (
              <Button
                size="small"
                className={styles.filterButton}
                appearance="subtle"
                onClick={() => setActiveFilters(new Set())}
              >
                Clear
              </Button>
            )}
          </div>
        )}
        <Text className={styles.countBadge}>
          {searchQuery || activeFilters.size > 0
            ? `Showing ${filteredBlueprints.length} of ${blueprints.length} entities`
            : `${blueprints.length} ${blueprints.length === 1 ? 'entity' : 'entities'} found`}
        </Text>
      </div>

      <div className={styles.listContainer}>
        {filteredBlueprints.length === 0 ? (
          <div className={styles.emptyState}>
            <Database24Regular />
            <Text>
              {searchQuery
                ? 'No entities found matching your search'
                : 'No entities found for this selection'}
            </Text>
          </div>
        ) : (
          filteredBlueprints.map((blueprint) => {
            const entity = blueprint.entity;
            const isExpanded = expandedEntityId === entity.MetadataId;
            const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName || 'Unknown Entity';
            const description = filterDescription(entity.Description?.UserLocalizedLabel?.Label);
            const attributeCount = entity.Attributes?.length || 0;
            const entityFlagCounts = getEntityFlagCounts(blueprint);

            return (
              <div key={entity.MetadataId}>
                <div
                  className={`${styles.entityRow} ${isExpanded ? styles.entityRowExpanded : ''}`}
                  onClick={() => toggleExpand(entity.MetadataId)}
                >
                  <div className={styles.chevron}>
                    {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                  </div>
                  <Database24Regular className={styles.entityIcon} />
                  <div className={styles.entityInfo}>
                    <Text className={styles.entityName}>
                      <TruncatedText text={displayName} />
                    </Text>
                    <Text className={styles.entityLogicalName}>
                      <TruncatedText text={entity.LogicalName} />
                    </Text>
                    {description && (
                      <Text className={styles.entityDescription}>
                        <TruncatedText text={description} />
                      </Text>
                    )}
                  </div>
                  {entityFlagCounts.size > 0 && (
                    <div className={styles.entityFlags}>
                      {FLAG_CONFIGS.filter(cfg => entityFlagCounts.has(cfg.key)).map(cfg => {
                        const count = entityFlagCounts.get(cfg.key)!;
                        return (
                          <Tooltip key={cfg.key} content={`${count} ${cfg.tooltip}`} relationship="label">
                            <Badge size="small" color={cfg.color} appearance="tint">
                              {count} {cfg.label}
                            </Badge>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                  <div className={styles.entityStats}>
                    <Text className={styles.attributeCount}>
                      {attributeCount} attr{attributeCount !== 1 ? 's' : ''}
                    </Text>
                    {entity.IsCustomEntity && (
                      <Text className={styles.statBadge}>Custom</Text>
                    )}
                    {entity.IsManaged && (
                      <Text className={styles.statBadge}>Managed</Text>
                    )}
                  </div>
                </div>
                {isExpanded && renderEntityDetails(blueprint)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
