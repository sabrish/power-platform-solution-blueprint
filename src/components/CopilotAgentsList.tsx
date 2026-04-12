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
import type { CopilotAgent } from '../core';
import { formatDate } from '../utils/dateFormat';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

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

interface CopilotAgentsListProps {
  copilotAgents: CopilotAgent[];
}

export function CopilotAgentsList({ copilotAgents }: CopilotAgentsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...copilotAgents].sort((a, b) => a.name.localeCompare(b.name)),
    [copilotAgents]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        a.schemaName.toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (agent: CopilotAgent): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Agent Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Schema Name</Text>
            <Text className={shared.codeText}>{agent.schemaName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Kind</Text>
            <Text className={shared.detailValue}>{agent.kind}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Components</Text>
            <Text className={shared.detailValue}>{agent.componentCount}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Status</Text>
            <Text className={shared.detailValue}>{agent.isActive ? 'Active' : 'Inactive'}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(agent.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(agent.modifiedOn)}</Text>
          </div>
        </div>
        {agent.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text>{agent.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (copilotAgents.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Copilot Agents Found"
        message="No Copilot Studio agents were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search agents..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="agents"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(agent => {
        const isExpanded = expandedId === agent.id;
        return (
          <div key={agent.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(agent.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(agent.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{agent.name}</Text>
                <Text className={shared.codeText}>{agent.schemaName}</Text>
              </div>
              <Badge
                appearance="tint"
                shape="rounded"
                color={agent.kind === 'CopilotAgent' ? 'brand' : agent.kind === 'ClassicBot' ? 'warning' : 'subtle'}
                size="small"
              >
                {agent.kind === 'Unknown' ? 'Agent' : agent.kind === 'CopilotAgent' ? 'Copilot Agent' : 'Classic Bot'}
              </Badge>
              <Badge
                appearance="filled"
                shape="rounded"
                color={agent.isActive ? 'success' : 'danger'}
                size="small"
              >
                {agent.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {agent.componentCount > 0 && (
                <Badge appearance="outline" shape="rounded" size="small">
                  {agent.componentCount} component{agent.componentCount !== 1 ? 's' : ''}
                </Badge>
              )}
              <Badge
                appearance="filled"
                shape="rounded"
                color={agent.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {agent.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(agent)}
          </div>
        );
      })}
    </div>
  );
}
