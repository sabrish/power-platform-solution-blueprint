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
import type { AiModel } from '../core';

const useStyles = makeStyles({
  listContainer: {
    marginTop: tokens.spacingVerticalL,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto`,
    alignItems: 'start',
  },
});

function aiStatusColor(
  status: AiModel['status']
): 'success' | 'warning' | 'informative' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Inactive':
      return 'warning';
    case 'Unknown':
      return 'informative';
  }
}

interface AiModelsListProps {
  aiModels: AiModel[];
}

export function AiModelsList({ aiModels }: AiModelsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...aiModels].sort((a, b) => a.name.localeCompare(b.name)),
    [aiModels]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(m => m.name.toLowerCase().includes(q));
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (model: AiModel): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>AI Model Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Status</Text>
            <Text className={shared.detailValue}>{model.status}</Text>
          </div>
          {model.templateId && (
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Template ID</Text>
              <Text className={shared.codeText}>{model.templateId}</Text>
            </div>
          )}
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(model.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(model.modifiedOn)}</Text>
          </div>
        </div>
      </Card>
    </div>
  );

  if (aiModels.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No AI Models Found"
        message="No AI Builder models were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search AI models..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="AI models"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(model => {
        const isExpanded = expandedId === model.id;
        return (
          <div key={model.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(model.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(model.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{model.name}</Text>
              </div>
              <Badge
                appearance="filled"
                shape="rounded"
                color={aiStatusColor(model.status)}
                size="small"
              >
                {model.status}
              </Badge>
              <Badge
                appearance="filled"
                shape="rounded"
                color={model.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {model.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(model)}
          </div>
        );
      })}
    </div>
  );
}
