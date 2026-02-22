import { useState, useMemo } from 'react';
import {
  Text,
  Badge,
  SearchBox,
  makeStyles,
  tokens,
  Button,
} from '@fluentui/react-components';
import { ArrowSort24Regular, ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { AttributeMetadata } from '../core';
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
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: 'minmax(250px, 2fr) minmax(150px, 1fr) auto auto',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(250px, 2fr) minmax(150px, 1fr) auto auto',
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
  tableRowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  cellContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
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
        return <Badge appearance="filled" shape="rounded" color="important" size="small">Required</Badge>;
      case 'Recommended':
        return <Badge appearance="filled" shape="rounded" color="warning" size="small">Recommended</Badge>;
      default:
        return <Badge appearance="outline" shape="rounded" color="subtle" size="small">Optional</Badge>;
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
        {/* Table Header */}
        <div className={styles.tableHeader}>
          <div className={styles.cellContent}>
            <Button
              appearance="transparent"
              icon={<ArrowSort24Regular />}
              onClick={() => handleSort('DisplayName')}
              size="small"
            >
              Display Name
            </Button>
          </div>
          <div className={styles.cellContent}>
            <Button
              appearance="transparent"
              icon={<ArrowSort24Regular />}
              onClick={() => handleSort('AttributeType')}
              size="small"
            >
              Type
            </Button>
          </div>
          <div className={styles.cellContent}>
            <Button
              appearance="transparent"
              icon={<ArrowSort24Regular />}
              onClick={() => handleSort('RequiredLevel')}
              size="small"
            >
              Required
            </Button>
          </div>
          <div>Flags</div>
        </div>

        {/* Table Rows */}
        {filteredAndSortedAttributes.map((attr) => {
          const fieldId = attr.MetadataId || attr.LogicalName;
          const isExpanded = expandedFieldId === fieldId;

          return (
            <div key={fieldId}>
              <div
                className={`${styles.tableRow} ${isExpanded ? styles.tableRowExpanded : ''}`}
                onClick={() => toggleExpand(fieldId)}
              >
                <div className={styles.cellContent}>
                  {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                  <FieldTypeIcon attributeType={attr.AttributeType} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Text weight="semibold" className={styles.wrapText}>
                      {attr.DisplayName?.UserLocalizedLabel?.Label || attr.LogicalName}
                    </Text>
                    <Text className={`${styles.codeText} ${styles.wrapText}`} style={{ color: tokens.colorNeutralForeground3 }}>
                      {attr.LogicalName}
                    </Text>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <Text className={styles.wrapText}>{attr.AttributeType}</Text>
                  {getTypeDetails(attr) && (
                    <Text className={styles.wrapText} style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                      {getTypeDetails(attr)}
                    </Text>
                  )}
                </div>

                <div>{getRequiredLevelBadge(attr.RequiredLevel.Value)}</div>

                <div className={styles.badges}>
                  {attr.IsPrimaryId && <Badge appearance="filled" shape="rounded" color="brand" size="small">Primary ID</Badge>}
                  {attr.IsPrimaryName && <Badge appearance="filled" shape="rounded" color="success" size="small">Primary Name</Badge>}
                  {attr.IsAuditEnabled?.Value && <Badge appearance="tint" shape="rounded" size="small">Audit</Badge>}
                  {attr.IsSecured && <Badge appearance="filled" shape="rounded" color="warning" size="small">Secured</Badge>}
                  {attr.IsCustomAttribute && <Badge appearance="outline" shape="rounded" size="small">Custom</Badge>}
                </div>
              </div>
              {isExpanded && renderExpandedDetails(attr)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
