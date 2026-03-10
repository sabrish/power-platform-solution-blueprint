import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
} from '@fluentui/react-components';
import { FilterBar } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { CustomConnector } from '../core';
import { formatDate } from '../utils/dateFormat';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

const useStyles = makeStyles({
  row: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto',
  },
});

interface CustomConnectorsListProps {
  customConnectors: CustomConnector[];
}

export function CustomConnectorsList({ customConnectors }: CustomConnectorsListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(() => {
    return [...customConnectors].sort((a, b) => a.name.localeCompare(b.name));
  }, [customConnectors]);

  const searchedConnectors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter((c) =>
      c.displayName.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const renderDetail = (connector: CustomConnector) => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Custom Connector Details</Title3>

        <div className={`${shared.detailsGrid} ${shared.section}`}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Logical Name</Text>
            <Text className={shared.codeText}>{connector.name}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Display Name</Text>
            <Text className={shared.detailValue}>{connector.displayName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Connector Type</Text>
            <Text className={shared.detailValue}>{connector.connectorType}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(connector.modifiedOn)}</Text>
          </div>
        </div>

        {connector.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text>{connector.description}</Text>
          </div>
        )}

        {connector.capabilities.length > 0 && (
          <div className={shared.section}>
            <Title3>Capabilities</Title3>
            <div className={shared.badgeGroup}>
              {connector.capabilities.map((cap, i) => (
                <Badge key={i} appearance="outline" shape="rounded">{cap}</Badge>
              ))}
            </div>
          </div>
        )}

        {connector.connectionParameters.length > 0 && (
          <div className={shared.section}>
            <Title3>Connection Parameters</Title3>
            <div className={shared.badgeGroup}>
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
      <EmptyState
        type="generic"
        title="No Custom Connectors Found"
        message="No custom connectors were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={shared.container} style={{ marginTop: tokens.spacingVerticalL }}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search custom connectors..."
        filteredCount={searchedConnectors.length}
        totalCount={sorted.length}
        itemLabel="connectors"
      />
      {searchedConnectors.length === 0 && sorted.length > 0 && (
        <EmptyState type="search" />
      )}
      {searchedConnectors.map((connector) => {
        const isExpanded = expandedId === connector.id;
        return (
          <div key={connector.id}>
            <div
              className={`${shared.cardRow} ${styles.row} ${isExpanded ? shared.cardRowExpanded : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(connector.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(connector.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{connector.displayName}</Text>
                <Text className={shared.codeText}>{connector.name}</Text>
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
