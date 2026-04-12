import { useCallback, useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  mergeClasses,
  tokens,
  Card,
  Title3,
} from '@fluentui/react-components';
import { FilterBar } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { ServiceEndpoint, ServiceEndpointContract } from '../core';
import { formatDate } from '../utils/dateFormat';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

const useStyles = makeStyles({
  listContainer: {
    marginTop: tokens.spacingVerticalL,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto auto`,
    alignItems: 'start',
  },
});

const CONTRACT_COLORS: Record<ServiceEndpointContract, 'brand' | 'informative' | 'warning' | 'success' | 'important' | 'severe'> = {
  Webhook:         'brand',
  EventHub:        'informative',
  Queue:           'warning',
  OneWay:          'success',
  SendAndReceive:  'success',
  Unknown:         'important',
};

interface ServiceEndpointsListProps {
  serviceEndpoints: ServiceEndpoint[];
}

export function ServiceEndpointsList({ serviceEndpoints }: ServiceEndpointsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...serviceEndpoints].sort((a, b) => a.name.localeCompare(b.name)),
    [serviceEndpoints]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        e.contract.toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (endpoint: ServiceEndpoint): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Service Endpoint Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Contract</Text>
            <Text className={shared.detailValue}>{endpoint.contract}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Connection Mode</Text>
            <Text className={shared.detailValue}>{endpoint.connectionMode}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Message Format</Text>
            <Text className={shared.detailValue}>{endpoint.messageFormat}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Registered Steps</Text>
            <Text className={shared.detailValue}>{endpoint.registeredStepCount}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(endpoint.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(endpoint.modifiedOn)}</Text>
          </div>
        </div>
        {endpoint.url && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>URL</Text>
            <Text className={shared.codeText}>{endpoint.url}</Text>
          </div>
        )}
        {endpoint.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text>{endpoint.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (serviceEndpoints.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Service Endpoints Found"
        message="No service endpoints were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search service endpoints..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="endpoints"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(endpoint => {
        const isExpanded = expandedId === endpoint.id;
        return (
          <div key={endpoint.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(endpoint.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(endpoint.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{endpoint.name}</Text>
              </div>
              <Badge
                appearance="tint"
                shape="rounded"
                color={CONTRACT_COLORS[endpoint.contract]}
                size="small"
              >
                {endpoint.contract}
              </Badge>
              {endpoint.registeredStepCount > 0 && (
                <Badge appearance="outline" shape="rounded" size="small">
                  {endpoint.registeredStepCount} step{endpoint.registeredStepCount !== 1 ? 's' : ''}
                </Badge>
              )}
              <Badge
                appearance="filled"
                shape="rounded"
                color={endpoint.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {endpoint.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(endpoint)}
          </div>
        );
      })}
    </div>
  );
}
