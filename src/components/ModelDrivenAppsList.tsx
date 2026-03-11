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
import type { ModelDrivenApp } from '../core';
import { formatDate } from '../utils/dateFormat';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

const useStyles = makeStyles({
  row: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto',
    gap: tokens.spacingHorizontalM,
  },
});

interface ModelDrivenAppsListProps {
  modelDrivenApps: ModelDrivenApp[];
}

export function ModelDrivenAppsList({ modelDrivenApps }: ModelDrivenAppsListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(() => {
    return [...modelDrivenApps].sort((a, b) =>
      (a.displayName || a.name).localeCompare(b.displayName || b.name)
    );
  }, [modelDrivenApps]);

  const searched = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter((app) =>
      app.displayName.toLowerCase().includes(q) ||
      app.name.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const renderDetail = (app: ModelDrivenApp) => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Model-Driven App Details</Title3>

        <div className={`${shared.detailsGrid} ${shared.section}`}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Unique Name</Text>
            <Text className={`${shared.codeText} ${shared.detailValue}`}>{app.name}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Display Name</Text>
            <Text className={shared.detailValue}>{app.displayName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Managed</Text>
            <Text className={shared.detailValue}>{app.isManaged ? 'Yes' : 'No'}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{app.modifiedOn ? formatDate(app.modifiedOn) : '—'}</Text>
          </div>
        </div>

        {app.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.detailValue}>{app.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (modelDrivenApps.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Model-Driven Apps Found"
        message="No model-driven apps were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={shared.container} style={{ marginTop: tokens.spacingVerticalL }}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search model-driven apps..."
        filteredCount={searched.length}
        totalCount={sorted.length}
        itemLabel="model-driven apps"
      />
      {searched.length === 0 && sorted.length > 0 && (
        <EmptyState type="search" />
      )}
      {searched.map((app) => {
        const isExpanded = expandedId === app.id;
        return (
          <div key={app.id}>
            <div
              className={`${shared.cardRow} ${styles.row} ${isExpanded ? shared.cardRowExpanded : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(app.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(app.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{app.displayName || app.name}</Text>
                <Text className={shared.codeText}>{app.name}</Text>
              </div>
              <Badge
                appearance="filled"
                shape="rounded"
                color={app.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {app.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(app)}
          </div>
        );
      })}
    </div>
  );
}
