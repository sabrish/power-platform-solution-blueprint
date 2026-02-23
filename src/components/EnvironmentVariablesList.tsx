import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular, Settings20Regular } from '@fluentui/react-icons';
import type { EnvironmentVariable } from '../core';
import { TruncatedText } from './TruncatedText';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
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
  row: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto minmax(100px, 1fr) auto',
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
  rowExpanded: {
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
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
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
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  valueBox: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    wordBreak: 'break-all',
  },
  section: {
    marginTop: tokens.spacingVerticalM,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});

interface EnvironmentVariablesListProps {
  environmentVariables: EnvironmentVariable[];
}

const getTypeColor = (type: string): 'brand' | 'success' | 'danger' | 'warning' | 'severe' => {
  switch (type) {
    case 'String': return 'brand';
    case 'Number': return 'success';
    case 'Boolean': return 'danger';
    case 'JSON': return 'warning';
    case 'DataSource': return 'severe';
    default: return 'brand';
  }
};

export function EnvironmentVariablesList({ environmentVariables }: EnvironmentVariablesListProps) {
  const styles = useStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...environmentVariables].sort((a, b) => a.schemaName.localeCompare(b.schemaName));
  }, [environmentVariables]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderDetail = (envVar: EnvironmentVariable) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>Environment Variable Details</Title3>

        <div className={styles.section}>
          <Text className={styles.detailLabel}>Current Value</Text>
          <div className={styles.valueBox}>
            {envVar.currentValue ?? <span style={{ color: tokens.colorNeutralForeground3 }}>Not set</span>}
          </div>
        </div>

        <div className={styles.section}>
          <Text className={styles.detailLabel}>Default Value</Text>
          <div className={styles.valueBox}>
            {envVar.defaultValue ?? <span style={{ color: tokens.colorNeutralForeground3 }}>None</span>}
          </div>
        </div>

        {envVar.hint && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Hint</Text>
            <Text>{envVar.hint}</Text>
          </div>
        )}

        {envVar.description && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Description</Text>
            <Text>{envVar.description}</Text>
          </div>
        )}

        <div className={`${styles.detailsGrid} ${styles.section}`}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Type</Text>
            <Text className={styles.detailValue}>{envVar.typeName}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Required</Text>
            <Text className={styles.detailValue}>{envVar.isRequired ? 'Yes' : 'No'}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Customizable</Text>
            <Text className={styles.detailValue}>{envVar.isCustomizable ? 'Yes' : 'No'}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Owner</Text>
            <Text className={styles.detailValue}>{envVar.owner}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Modified By</Text>
            <Text className={styles.detailValue}>{envVar.modifiedBy}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Schema Name</Text>
            <Text className={styles.codeText}>{envVar.schemaName}</Text>
          </div>
        </div>
      </Card>
    </div>
  );

  if (environmentVariables.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Settings20Regular style={{ fontSize: '48px' }} />
        <Text size={500} weight="semibold">No Environment Variables Found</Text>
        <Text>No environment variables were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ marginTop: '16px' }}>
      {sorted.map((envVar) => {
        const isExpanded = expandedId === envVar.id;
        return (
          <div key={envVar.id}>
            <div
              className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
              onClick={() => toggleExpand(envVar.id)}
            >
              <div className={styles.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={styles.nameColumn}>
                <Text weight="semibold">
                  <TruncatedText text={envVar.displayName} />
                </Text>
                <Text className={styles.codeText}>
                  <TruncatedText text={envVar.schemaName} />
                </Text>
              </div>
              <Badge appearance="filled" shape="rounded" color={getTypeColor(envVar.typeName)}>
                {envVar.typeName}
              </Badge>
              <Text className={styles.codeText}>
                {envVar.currentValue
                  ? <TruncatedText text={envVar.currentValue} />
                  : <span style={{ color: tokens.colorNeutralForeground3 }}>Not set</span>
                }
              </Text>
              <div className={styles.badgeGroup}>
                {envVar.isRequired && (
                  <Badge appearance="filled" shape="rounded" color="important" size="small">Required</Badge>
                )}
                {envVar.isManaged && (
                  <Badge appearance="outline" shape="rounded" size="small">Managed</Badge>
                )}
              </div>
            </div>
            {isExpanded && renderDetail(envVar)}
          </div>
        );
      })}
    </div>
  );
}
