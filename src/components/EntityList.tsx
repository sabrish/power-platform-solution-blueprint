import { useState, useMemo } from 'react';
import {
  SearchBox,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Database24Regular, ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { EntityBlueprint, ClassicWorkflow } from '../core';
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
    gap: tokens.spacingVerticalXS,
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
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
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
  entityStats: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexShrink: 0,
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
    maxHeight: '400px',
    overflowY: 'auto',
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

export interface EntityListProps {
  blueprints: EntityBlueprint[];
  classicWorkflows?: ClassicWorkflow[];
}

export function EntityList({ blueprints, classicWorkflows = [] }: EntityListProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);

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

    // Sort alphabetically by display name
    return filtered.sort((a, b) => {
      const nameA = a.entity.DisplayName?.UserLocalizedLabel?.Label || a.entity.LogicalName;
      const nameB = b.entity.DisplayName?.UserLocalizedLabel?.Label || b.entity.LogicalName;
      return nameA.localeCompare(nameB);
    });
  }, [blueprints, searchQuery]);

  const toggleExpand = (entityId: string) => {
    setExpandedEntityId(expandedEntityId === entityId ? null : entityId);
  };

  const renderEntityDetails = (blueprint: EntityBlueprint) => {
    return (
      <div className={styles.expandedDetails}>
        <SchemaView blueprint={blueprint} classicWorkflows={classicWorkflows} />
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
        <Text className={styles.countBadge}>
          {searchQuery
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
