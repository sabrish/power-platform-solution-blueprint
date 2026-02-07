import { useState, useMemo } from 'react';
import {
  SearchBox,
  Text,
  Badge,
  Card,
  Title3,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Database24Regular, ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { DetailedEntityMetadata, AttributeMetadata } from '@ppsb/core';

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
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
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
  entities: DetailedEntityMetadata[];
}

export function EntityList({ entities }: EntityListProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);

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

  const toggleExpand = (entityId: string) => {
    setExpandedEntityId(expandedEntityId === entityId ? null : entityId);
  };

  const getRequiredLevelBadge = (requiredLevel: string) => {
    switch (requiredLevel) {
      case 'ApplicationRequired':
      case 'SystemRequired':
        return <Badge appearance="filled" color="danger" size="small">Required</Badge>;
      case 'Recommended':
        return <Badge appearance="filled" color="warning" size="small">Recommended</Badge>;
      default:
        return <Badge appearance="outline" color="subtle" size="small">Optional</Badge>;
    }
  };

  const renderEntityDetails = (entity: DetailedEntityMetadata) => {
    const attributes = entity.Attributes || [];

    const columns: TableColumnDefinition<AttributeMetadata>[] = [
      createTableColumn<AttributeMetadata>({
        columnId: 'displayName',
        renderHeaderCell: () => 'Attribute',
        renderCell: (item) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Text weight="semibold">
              {item.DisplayName?.UserLocalizedLabel?.Label || item.LogicalName}
            </Text>
            <Text className={styles.codeText} style={{ color: tokens.colorNeutralForeground3 }}>
              {item.LogicalName}
            </Text>
          </div>
        ),
      }),
      createTableColumn<AttributeMetadata>({
        columnId: 'type',
        renderHeaderCell: () => 'Type',
        renderCell: (item) => <Text>{item.AttributeType}</Text>,
      }),
      createTableColumn<AttributeMetadata>({
        columnId: 'required',
        renderHeaderCell: () => 'Required',
        renderCell: (item) => getRequiredLevelBadge(item.RequiredLevel?.Value || 'None'),
      }),
      createTableColumn<AttributeMetadata>({
        columnId: 'audit',
        renderHeaderCell: () => <div style={{ textAlign: 'center' }}>Audit</div>,
        renderCell: (item) => {
          const isAudited = item.IsAuditEnabled?.Value === true;
          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {isAudited ? (
                <Badge appearance="filled" color="success" size="small">On</Badge>
              ) : (
                <Badge appearance="outline" color="subtle" size="small">Off</Badge>
              )}
            </div>
          );
        },
      }),
      createTableColumn<AttributeMetadata>({
        columnId: 'searchable',
        renderHeaderCell: () => <div style={{ textAlign: 'center' }}>Searchable</div>,
        renderCell: (item) => {
          const isSearchable = item.IsValidForAdvancedFind?.Value === true;
          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {isSearchable ? (
                <Badge appearance="filled" color="brand" size="small">Yes</Badge>
              ) : (
                <Badge appearance="outline" color="subtle" size="small">No</Badge>
              )}
            </div>
          );
        },
      }),
    ];

    return (
      <div className={styles.expandedDetails}>
        <Card>
          <Title3>{entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName}</Title3>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Schema Name</Text>
              <Text className={`${styles.detailValue} ${styles.codeText}`}>{entity.SchemaName}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Logical Name</Text>
              <Text className={`${styles.detailValue} ${styles.codeText}`}>{entity.LogicalName}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Entity Set Name</Text>
              <Text className={`${styles.detailValue} ${styles.codeText}`}>{entity.EntitySetName || 'N/A'}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Primary ID</Text>
              <Text className={`${styles.detailValue} ${styles.codeText}`}>{entity.PrimaryIdAttribute || 'N/A'}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Primary Name</Text>
              <Text className={`${styles.detailValue} ${styles.codeText}`}>{entity.PrimaryNameAttribute || 'N/A'}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Attributes</Text>
              <Text className={styles.detailValue}>{attributes.length}</Text>
            </div>
          </div>

          <div className={styles.badges}>
            {entity.IsCustomEntity && (
              <Badge appearance="filled" color="brand">Custom Entity</Badge>
            )}
            {entity.IsManaged && (
              <Badge appearance="filled" color="warning">Managed</Badge>
            )}
            {entity.IsCustomizable?.Value === false && (
              <Badge appearance="outline" color="subtle">Not Customizable</Badge>
            )}
          </div>

          {attributes.length > 0 && (
            <>
              <Title3 style={{ marginTop: tokens.spacingVerticalL }}>
                Attributes ({attributes.length})
              </Title3>
              <div className={styles.tableContainer}>
                <DataGrid
                  items={attributes}
                  columns={columns}
                  sortable
                  focusMode="composite"
                  size="small"
                >
                  <DataGridHeader>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  <DataGridBody<AttributeMetadata>>
                    {({ item, rowId }) => (
                      <DataGridRow<AttributeMetadata> key={rowId}>
                        {({ renderCell }) => (
                          <DataGridCell>{renderCell(item)}</DataGridCell>
                        )}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                </DataGrid>
              </div>
            </>
          )}
        </Card>
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
            const isExpanded = expandedEntityId === entity.MetadataId;
            const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName || 'Unknown Entity';
            const description = entity.Description?.UserLocalizedLabel?.Label;
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
                {isExpanded && renderEntityDetails(entity)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
