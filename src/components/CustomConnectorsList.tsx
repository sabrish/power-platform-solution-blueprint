import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular, PlugDisconnected20Regular } from '@fluentui/react-icons';
import type { CustomConnector } from '../core';
import { formatDate } from '../utils/dateFormat';
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
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto',
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
  section: {
    marginTop: tokens.spacingVerticalM,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
});

interface CustomConnectorsListProps {
  customConnectors: CustomConnector[];
}

export function CustomConnectorsList({ customConnectors }: CustomConnectorsListProps) {
  const styles = useStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...customConnectors].sort((a, b) => a.name.localeCompare(b.name));
  }, [customConnectors]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const renderDetail = (connector: CustomConnector) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>Custom Connector Details</Title3>

        <div className={`${styles.detailsGrid} ${styles.section}`}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Logical Name</Text>
            <Text className={styles.codeText}>{connector.name}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Display Name</Text>
            <Text className={styles.detailValue}>{connector.displayName}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Connector Type</Text>
            <Text className={styles.detailValue}>{connector.connectorType}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Last Modified</Text>
            <Text className={styles.detailValue}>{formatDate(connector.modifiedOn)}</Text>
          </div>
        </div>

        {connector.description && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Description</Text>
            <Text>{connector.description}</Text>
          </div>
        )}

        {connector.capabilities.length > 0 && (
          <div className={styles.section}>
            <Title3>Capabilities</Title3>
            <div className={styles.badgeGroup}>
              {connector.capabilities.map((cap, i) => (
                <Badge key={i} appearance="outline" shape="rounded">{cap}</Badge>
              ))}
            </div>
          </div>
        )}

        {connector.connectionParameters.length > 0 && (
          <div className={styles.section}>
            <Title3>Connection Parameters</Title3>
            <div className={styles.badgeGroup}>
              {connector.connectionParameters.map((param, i) => (
                <Badge key={i} appearance="tint" shape="rounded">{param}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  if (customConnectors.length === 0) {
    return (
      <div className={styles.emptyState}>
        <PlugDisconnected20Regular style={{ fontSize: '48px' }} />
        <Text size={500} weight="semibold">No Custom Connectors Found</Text>
        <Text>No custom connectors were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ marginTop: '16px' }}>
      {sorted.map((connector) => {
        const isExpanded = expandedId === connector.id;
        return (
          <div key={connector.id}>
            <div
              className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
              onClick={() => toggleExpand(connector.id)}
            >
              <div className={styles.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={styles.nameColumn}>
                <Text weight="semibold">
                  <TruncatedText text={connector.displayName} />
                </Text>
                <Text className={styles.codeText}>
                  <TruncatedText text={connector.name} />
                </Text>
              </div>
              <Badge appearance="tint" shape="rounded" size="small">{connector.connectorType}</Badge>
              <Badge appearance="filled" shape="rounded" color={connector.isManaged ? 'warning' : 'success'} size="small">
                {connector.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(connector)}
          </div>
        );
      })}
    </div>
  );
}
