import { useState, useMemo } from 'react';
import {
  Text,
  Badge,
  SearchBox,
  makeStyles,
  tokens,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Button,
} from '@fluentui/react-components';
import { ArrowSort24Regular, ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { AttributeMetadata } from '@ppsb/core';
import { FieldTypeIcon } from './FieldTypeIcon';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  controls: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    minWidth: '300px',
  },
  tableContainer: {
    maxHeight: '600px',
    overflowY: 'auto',
  },
  expandedRow: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
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
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
});

export interface FieldsTableProps {
  attributes: AttributeMetadata[];
}

export function FieldsTable({ attributes }: FieldsTableProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('LogicalName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedAttributes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered = attributes;

    if (query) {
      filtered = attributes.filter((attr) => {
        const displayName = attr.DisplayName?.UserLocalizedLabel?.Label || '';
        const logicalName = attr.LogicalName || '';
        const description = attr.Description?.UserLocalizedLabel?.Label || '';
        return (
          displayName.toLowerCase().includes(query) ||
          logicalName.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query) ||
          attr.AttributeType.toLowerCase().includes(query)
        );
      });
    }

    return filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case 'DisplayName':
          aVal = a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName;
          bVal = b.DisplayName?.UserLocalizedLabel?.Label || b.LogicalName;
          break;
        case 'AttributeType':
          aVal = a.AttributeType;
          bVal = b.AttributeType;
          break;
        case 'RequiredLevel':
          aVal = a.RequiredLevel.Value;
          bVal = b.RequiredLevel.Value;
          break;
        default:
          aVal = a.LogicalName;
          bVal = b.LogicalName;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [attributes, searchQuery, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleExpand = (fieldId: string) => {
    setExpandedFieldId(expandedFieldId === fieldId ? null : fieldId);
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

  const getTypeDetails = (attr: AttributeMetadata): string => {
    const parts: string[] = [];

    if (attr.MaxLength) parts.push(`Max: ${attr.MaxLength}`);
    if (attr.Precision) parts.push(`Precision: ${attr.Precision}`);
    if (attr.MinValue) {
      const min = typeof attr.MinValue === 'object' ? attr.MinValue.Value : attr.MinValue;
      parts.push(`Min: ${min}`);
    }
    if (attr.MaxValue) {
      const max = typeof attr.MaxValue === 'object' ? attr.MaxValue.Value : attr.MaxValue;
      parts.push(`Max: ${max}`);
    }
    if (attr.Format) parts.push(attr.Format);
    if (attr.Targets && attr.Targets.length > 0) {
      parts.push(`Targets: ${attr.Targets.join(', ')}`);
    }
    if (attr.OptionSet?.Options) {
      parts.push(`${attr.OptionSet.Options.length} options`);
    }

    return parts.length > 0 ? parts.join(' | ') : '';
  };

  const columns: TableColumnDefinition<AttributeMetadata>[] = [
    createTableColumn<AttributeMetadata>({
      columnId: 'displayName',
      renderHeaderCell: () => (
        <Button
          appearance="transparent"
          icon={<ArrowSort24Regular />}
          onClick={() => handleSort('DisplayName')}
        >
          Display Name
        </Button>
      ),
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, cursor: 'pointer' }}
             onClick={() => toggleExpand(item.MetadataId || item.LogicalName)}>
          {expandedFieldId === (item.MetadataId || item.LogicalName) ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
          <FieldTypeIcon attributeType={item.AttributeType} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Text weight="semibold" className={styles.wrapText}>
              {item.DisplayName?.UserLocalizedLabel?.Label || item.LogicalName}
            </Text>
            <Text className={`${styles.codeText} ${styles.wrapText}`} style={{ color: tokens.colorNeutralForeground3 }}>
              {item.LogicalName}
            </Text>
          </div>
        </div>
      ),
    }),
    createTableColumn<AttributeMetadata>({
      columnId: 'type',
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
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Text className={styles.wrapText}>{item.AttributeType}</Text>
          {getTypeDetails(item) && (
            <Text className={styles.wrapText} style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
              {getTypeDetails(item)}
            </Text>
          )}
        </div>
      ),
    }),
    createTableColumn<AttributeMetadata>({
      columnId: 'required',
      renderHeaderCell: () => (
        <Button
          appearance="transparent"
          icon={<ArrowSort24Regular />}
          onClick={() => handleSort('RequiredLevel')}
        >
          Required
        </Button>
      ),
      renderCell: (item) => getRequiredLevelBadge(item.RequiredLevel.Value),
    }),
    createTableColumn<AttributeMetadata>({
      columnId: 'flags',
      renderHeaderCell: () => 'Flags',
      renderCell: (item) => (
        <div className={styles.badges}>
          {item.IsPrimaryId && <Badge appearance="filled" color="brand" size="small">Primary ID</Badge>}
          {item.IsPrimaryName && <Badge appearance="filled" color="success" size="small">Primary Name</Badge>}
          {item.IsAuditEnabled?.Value && <Badge appearance="tint" size="small">Audit</Badge>}
          {item.IsSecured && <Badge appearance="filled" color="warning" size="small">Secured</Badge>}
          {item.IsCustomAttribute && <Badge appearance="outline" size="small">Custom</Badge>}
        </div>
      ),
    }),
    createTableColumn<AttributeMetadata>({
      columnId: 'permissions',
      renderHeaderCell: () => 'Permissions',
      renderCell: (item) => (
        <Text style={{ fontSize: tokens.fontSizeBase200 }}>
          {item.IsValidForCreate ? 'C' : '-'}
          {item.IsValidForUpdate ? 'U' : '-'}
          {item.IsValidForRead ? 'R' : '-'}
        </Text>
      ),
    }),
  ];

  const renderExpandedDetails = (attr: AttributeMetadata) => (
    <div className={styles.expandedRow}>
      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <Text className={styles.detailLabel}>Logical Name</Text>
          <Text className={`${styles.detailValue} ${styles.codeText}`}>{attr.LogicalName}</Text>
        </div>
        <div className={styles.detailItem}>
          <Text className={styles.detailLabel}>Schema Name</Text>
          <Text className={`${styles.detailValue} ${styles.codeText}`}>{attr.SchemaName}</Text>
        </div>
        <div className={styles.detailItem}>
          <Text className={styles.detailLabel}>Attribute Type</Text>
          <Text className={styles.detailValue}>{attr.AttributeType}</Text>
        </div>
        <div className={styles.detailItem}>
          <Text className={styles.detailLabel}>Metadata ID</Text>
          <Text className={`${styles.codeText}`} style={{ fontSize: tokens.fontSizeBase200 }}>{attr.MetadataId}</Text>
        </div>
      </div>

      {attr.Description?.UserLocalizedLabel?.Label && (
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Text className={styles.detailLabel}>Description</Text>
          <Text className={styles.wrapText}>{attr.Description.UserLocalizedLabel.Label}</Text>
        </div>
      )}

      {attr.Targets && attr.Targets.length > 0 && (
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Text className={styles.detailLabel}>Lookup Targets</Text>
          <div className={styles.badges} style={{ marginTop: tokens.spacingVerticalXS }}>
            {attr.Targets.map((target, idx) => (
              <Badge key={idx} appearance="tint" color="brand">
                {target}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {attr.OptionSet?.Options && attr.OptionSet.Options.length > 0 && (
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Text className={styles.detailLabel}>Options ({attr.OptionSet.Options.length})</Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: tokens.spacingHorizontalS, marginTop: tokens.spacingVerticalXS }}>
            {attr.OptionSet.Options.slice(0, 10).map((option, idx) => (
              <>
                <Text key={`v-${idx}`} className={styles.codeText}>{option.Value}</Text>
                <Text key={`l-${idx}`}>{option.Label?.UserLocalizedLabel?.Label || option.Value}</Text>
              </>
            ))}
            {attr.OptionSet.Options.length > 10 && (
              <Text style={{ gridColumn: '1 / -1', color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
                ... and {attr.OptionSet.Options.length - 10} more options
              </Text>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search fields..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value || '')}
        />
        <Text style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>
          {filteredAndSortedAttributes.length} of {attributes.length} fields
        </Text>
      </div>

      <div className={styles.tableContainer}>
        <DataGrid
          items={filteredAndSortedAttributes}
          columns={columns}
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

        {/* Render expanded details outside the grid */}
        {expandedFieldId && filteredAndSortedAttributes.map((attr) => {
          const fieldId = attr.MetadataId || attr.LogicalName;
          if (fieldId === expandedFieldId) {
            return <div key={`expanded-${fieldId}`}>{renderExpandedDetails(attr)}</div>;
          }
          return null;
        })}
      </div>
    </div>
  );
}
