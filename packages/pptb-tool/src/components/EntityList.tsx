import { useState, useMemo } from 'react';
import {
  SearchBox,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Database24Regular } from '@fluentui/react-icons';
import type { DetailedEntityMetadata } from '@ppsb/core';

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
    gap: tokens.spacingVerticalXS,
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    paddingRight: tokens.spacingHorizontalS,
  },
  entityCard: {
    cursor: 'pointer',
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalS,
    transition: 'all 0.2s ease',
    borderLeft: `4px solid transparent`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderLeftColor: tokens.colorBrandForeground1,
      transform: 'translateX(4px)',
      boxShadow: tokens.shadow8,
    },
  },
  entityCardSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    borderLeftColor: tokens.colorBrandForeground1,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  entityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    width: '100%',
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
    flexShrink: 0,
  },
  entityLogicalName: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
    fontFamily: 'Consolas, Monaco, monospace',
    flexShrink: 0,
  },
  entityDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  entities: DetailedEntityMetadata[];
  onEntitySelect?: (entity: DetailedEntityMetadata) => void;
  selectedEntity?: DetailedEntityMetadata | null;
}

export function EntityList({ entities, onEntitySelect, selectedEntity }: EntityListProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered = entities;

    if (query) {
      filtered = entities.filter((entity) => {
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
      const nameA = a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName;
      const nameB = b.DisplayName?.UserLocalizedLabel?.Label || b.LogicalName;
      return nameA.localeCompare(nameB);
    });
  }, [entities, searchQuery]);

  const handleEntityClick = (entity: DetailedEntityMetadata) => {
    if (onEntitySelect) {
      onEntitySelect(entity);
    }
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
            ? `Showing ${filteredEntities.length} of ${entities.length} entities`
            : `${entities.length} ${entities.length === 1 ? 'entity' : 'entities'} found`}
        </Text>
      </div>

      <div className={styles.listContainer}>
        {filteredEntities.length === 0 ? (
          <div className={styles.emptyState}>
            <Database24Regular />
            <Text>
              {searchQuery
                ? 'No entities found matching your search'
                : 'No entities found for this selection'}
            </Text>
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const isSelected = selectedEntity?.MetadataId === entity.MetadataId;
            const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName || 'Unknown Entity';
            const description = entity.Description?.UserLocalizedLabel?.Label;
            const attributeCount = entity.Attributes?.length || 0;

            return (
              <div
                key={entity.MetadataId}
                className={`${styles.entityCard} ${isSelected ? styles.entityCardSelected : ''}`}
                onClick={() => handleEntityClick(entity)}
                style={{
                  backgroundColor: isSelected ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1,
                  border: `1px solid ${tokens.colorNeutralStroke1}`,
                  borderRadius: tokens.borderRadiusMedium,
                }}
              >
                <div className={styles.entityItem}>
                  <Database24Regular className={styles.entityIcon} />
                  <div className={styles.entityInfo}>
                    <Text className={styles.entityName}>{displayName}</Text>
                    <Text className={styles.entityLogicalName}>
                      {entity.LogicalName}
                    </Text>
                    {description && (
                      <Text className={styles.entityDescription}>
                        {description}
                      </Text>
                    )}
                    <div className={styles.entityStats}>
                      <Text className={styles.statBadge}>
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
