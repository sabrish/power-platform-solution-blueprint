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
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';
import { formatDate } from '../utils/dateFormat';
import type { SlaDefinition } from '../core';

const useStyles = makeStyles({
  listContainer: {
    marginTop: tokens.spacingVerticalL,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto auto auto`,
    alignItems: 'start',
  },
});

function slaStatusColor(
  status: SlaDefinition['status']
): 'success' | 'warning' | 'danger' | 'informative' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Draft':
      return 'informative';
    case 'Expired':
      return 'danger';
    case 'Cancelled':
      return 'warning';
  }
}

interface SlaDefinitionsListProps {
  slaDefinitions: SlaDefinition[];
}

export function SlaDefinitionsList({ slaDefinitions }: SlaDefinitionsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...slaDefinitions].sort((a, b) => a.name.localeCompare(b.name)),
    [slaDefinitions]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(s => s.name.toLowerCase().includes(q));
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (sla: SlaDefinition): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>SLA Definition Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>SLA Type</Text>
            <Text className={shared.detailValue}>{sla.slaType}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Status</Text>
            <Text className={shared.detailValue}>{sla.status}</Text>
          </div>
          {sla.primaryEntityOtc !== null && (
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Primary Entity OTC</Text>
              <Text className={shared.detailValue}>{sla.primaryEntityOtc}</Text>
            </div>
          )}
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(sla.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(sla.modifiedOn)}</Text>
          </div>
        </div>
        {sla.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.detailValue}>{sla.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (slaDefinitions.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No SLA Definitions Found"
        message="No SLA definitions were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search SLA definitions..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="SLA definitions"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(sla => {
        const isExpanded = expandedId === sla.id;
        return (
          <div key={sla.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(sla.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(sla.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{sla.name}</Text>
              </div>
              <Badge appearance="tint" shape="rounded" color="informative" size="small">
                {sla.slaType}
              </Badge>
              <Badge
                appearance="filled"
                shape="rounded"
                color={slaStatusColor(sla.status)}
                size="small"
              >
                {sla.status}
              </Badge>
              <Badge
                appearance="filled"
                shape="rounded"
                color={sla.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {sla.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(sla)}
          </div>
        );
      })}
    </div>
  );
}
