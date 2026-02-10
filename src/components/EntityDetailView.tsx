import { useState, useMemo } from 'react';
import {
  Card,
  Title2,
  Title3,
  Text,
  Badge,
  SearchBox,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Database24Regular,
  ArrowSort24Regular,
} from '@fluentui/react-icons';
import type { DetailedEntityMetadata, AttributeMetadata } from '../core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    padding: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  icon: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  logicalName: {
    color: tokens.colorNeutralForeground3,
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  metadataLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  metadataValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalM,
  },
  attributesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  attributesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchBox: {
    maxWidth: '400px',
  },
  countText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  tableContainer: {
    maxHeight: '600px',
    overflowY: 'auto',
  },
  iconCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
  },
});

interface EntityDetailViewProps {
  entity: DetailedEntityMetadata;
}

export function EntityDetailView({ entity }: EntityDetailViewProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof AttributeMetadata>('LogicalName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const displayName = entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName;
  const description = entity.Description?.UserLocalizedLabel?.Label;

  // Filter and sort attributes
  const filteredAttributes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let filtered = entity.Attributes || [];

    if (query) {
      filtered = filtered.filter((attr) => {
        const attrDisplayName = attr.DisplayName?.UserLocalizedLabel?.Label || '';
        const logicalName = attr.LogicalName || '';
        const attrDescription = attr.Description?.UserLocalizedLabel?.Label || '';
        return (
          attrDisplayName.toLowerCase().includes(query) ||
          logicalName.toLowerCase().includes(query) ||
          attrDescription.toLowerCase().includes(query)
        );
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      let aVal: any = a[sortColumn];
      let bVal: any = b[sortColumn];

      // Handle nested properties
      if (sortColumn === 'DisplayName') {
        aVal = a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName;
        bVal = b.DisplayName?.UserLocalizedLabel?.Label || b.LogicalName;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [entity.Attributes, searchQuery, sortColumn, sortDirection]);

  const handleSort = (column: keyof AttributeMetadata) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getTypeIcon = (type: string) => {
    const typeMap: Record<string, string> = {
      'String': 'Aa',
      'Memo': 'Aa',
      'Integer': '123',
      'Decimal': '123',
      'Double': '123',
      'Money': '$',
      'DateTime': '📅',
      'Boolean': '☑',
      'Picklist': '📋',
      'Lookup': '🔗',
      'Owner': '👤',
      'UniqueIdentifier': '🔑',
    };
    return typeMap[type] || '•';
  };

  const getRequiredLevelBadge = (requiredLevel: string) => {
    switch (requiredLevel) {
      case 'ApplicationRequired':
      case 'SystemRequired':
        return <Badge appearance="filled" color="danger">Required</Badge>;
      case 'Recommended':
        return <Badge appearance="filled" color="warning">Recommended</Badge>;
      default:
        return <Badge appearance="outline" color="subtle">Optional</Badge>;
    }
  };

  const columns: TableColumnDefinition<AttributeMetadata>[] = [
    createTableColumn<AttributeMetadata>({
      columnId: 'displayName',
      compare: (a, b) => {
        const aName = a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName;
        const bName = b.DisplayName?.UserLocalizedLabel?.Label || b.LogicalName;
        return aName.localeCompare(bName);
      },
      renderHeaderCell: () => (
        <Button
          appearance="transparent"
          icon={<ArrowSort24Regular />}
          onClick={() => handleSort('DisplayName' as keyof AttributeMetadata)}
        >
          Display Name
        </Button>
      ),
      renderCell: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column', wordBreak: 'break-word' }}>
          <Text weight="semibold" className={styles.wrapText}>
            {item.DisplayName?.UserLocalizedLabel?.Label || item.LogicalName}
          </Text>
          <Text className={styles.wrapText} style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
            {item.LogicalName}
          </Text>
        </div>
      ),
    }),
    createTableColumn<AttributeMetadata>({
      columnId: 'type',
      compare: (a, b) => a.AttributeType.localeCompare(b.AttributeType),
      renderHeaderCell: () => (
        <Button
          appearance="transparent"
          icon={<ArrowSort24Regular />}
          onClick={() => handleSort('AttributeType')}
        >
          Type
        </Button>
      ),
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, wordBreak: 'break-word' }}>
          <Text>{getTypeIcon(item.AttributeType)}</Text>
          <Text className={styles.wrapText}>{item.AttributeType}</Text>
        </div>
      ),
    }),
    createTableColumn<AttributeMetadata>({
      columnId: 'description',
      renderHeaderCell: () => 'Description',
      renderCell: (item) => {
        const desc = item.Description?.UserLocalizedLabel?.Label;
        return desc ? (
          <Text className={styles.wrapText} style={{ fontSize: tokens.fontSizeBase200 }}>
            {desc}
          </Text>
        ) : (
          <Text style={{ color: tokens.colorNeutralForeground4 }}>—</Text>
        );
      },
    }),
    createTableColumn<AttributeMetadata>({
      columnId: 'required',
      renderHeaderCell: () => 'Required',
      renderCell: (item) => getRequiredLevelBadge(item.RequiredLevel?.Value || 'None'),
    }),
    createTableColumn<AttributeMetadata>({
      columnId: 'audit',
      renderHeaderCell: () => (
        <div style={{ textAlign: 'center' }}>Audit</div>
      ),
      renderCell: (item) => {
        const isAudited = item.IsAuditEnabled?.Value === true;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {isAudited ? (
              <Badge appearance="filled" color="success">Enabled</Badge>
            ) : (
              <Badge appearance="outline" color="subtle">Disabled</Badge>
            )}
          </div>
        );
      },
    }),
    createTableColumn<AttributeMetadata>({
      columnId: 'searchable',
      renderHeaderCell: () => (
        <div style={{ textAlign: 'center' }}>Searchable</div>
      ),
      renderCell: (item) => {
        const isSearchable = item.IsValidForAdvancedFind?.Value === true;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {isSearchable ? (
              <Badge appearance="filled" color="brand">Yes</Badge>
            ) : (
              <Badge appearance="outline" color="subtle">No</Badge>
            )}
          </div>
        );
      },
    }),
  ];

  return (
    <div className={styles.container}>
      {/* Entity Header */}
      <Card>
        <div className={styles.header}>
          <Database24Regular className={styles.icon} />
          <div className={styles.headerContent}>
            <Title2>{displayName}</Title2>
            <Text className={styles.logicalName}>
              Logical Name: {entity.LogicalName} | Schema: {entity.SchemaName}
            </Text>
            {description && (
              <Text className={styles.wrapText} style={{ marginTop: tokens.spacingVerticalS }}>{description}</Text>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className={styles.metadataGrid}>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Entity Set Name</Text>
            <Text className={styles.metadataValue}>{entity.EntitySetName || 'N/A'}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Primary ID Attribute</Text>
            <Text className={styles.metadataValue}>{entity.PrimaryIdAttribute || 'N/A'}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Primary Name Attribute</Text>
            <Text className={styles.metadataValue}>{entity.PrimaryNameAttribute || 'N/A'}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Total Attributes</Text>
            <Text className={styles.metadataValue}>{entity.Attributes?.length || 0}</Text>
          </div>
        </div>

        {/* Badges */}
        <div className={styles.badges}>
          {entity.IsCustomEntity && (
            <Badge appearance="filled" color="brand">
              ✨ Custom Entity
            </Badge>
          )}
          {entity.IsManaged && (
            <Badge appearance="filled" color="warning">
              🔒 Managed
            </Badge>
          )}
          {entity.IsCustomizable?.Value === false && (
            <Badge appearance="outline" color="subtle">
              Not Customizable
            </Badge>
          )}
        </div>
      </Card>

      {/* Attributes Table */}
      <Card>
        <div className={styles.attributesSection}>
          <div className={styles.attributesHeader}>
            <Title3>Attributes ({filteredAttributes.length})</Title3>
          </div>

          <SearchBox
            className={styles.searchBox}
            placeholder="Search attributes..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value || '')}
          />

          {searchQuery && (
            <Text className={styles.countText}>
              Showing {filteredAttributes.length} of {entity.Attributes?.length || 0} attributes
            </Text>
          )}

          <div className={styles.tableContainer}>
            <DataGrid
              items={filteredAttributes}
              columns={columns}
              sortable
              focusMode="composite"
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
        </div>
      </Card>
    </div>
  );
}
