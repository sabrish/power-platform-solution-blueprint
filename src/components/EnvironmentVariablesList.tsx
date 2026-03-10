import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  ToggleButton,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { EnvironmentVariable } from '../core';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';
import { useListFilter, type FilterSpec } from '../hooks/useListFilter';

const ENV_TYPE_VALUES = ['String', 'Number', 'Boolean', 'JSON', 'DataSource'];

const ENV_FILTER_SPECS: readonly FilterSpec<EnvironmentVariable>[] = [
  { name: 'type', getKey: (v) => v.typeName },
];

const useStyles = makeStyles({
  row: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto minmax(100px, 1fr) auto',
  },
  valueBox: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    wordBreak: 'break-all',
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
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...environmentVariables].sort((a, b) => a.schemaName.localeCompare(b.schemaName));
  }, [environmentVariables]);

  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(ENV_TYPE_VALUES.map((t) => [t, 0]));
    for (const v of sorted) counts[v.typeName] = (counts[v.typeName] ?? 0) + 1;
    return counts;
  }, [sorted]);

  const {
    filteredItems: searchedVars,
    searchQuery,
    setSearchQuery,
    toggleKey,
    clearFilter,
    activeFilters,
  } = useListFilter(
    sorted,
    (v, q) =>
      v.displayName.toLowerCase().includes(q) ||
      v.schemaName.toLowerCase().includes(q) ||
      v.typeName.toLowerCase().includes(q),
    ENV_FILTER_SPECS,
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderDetail = (envVar: EnvironmentVariable) => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Environment Variable Details</Title3>

        <div className={shared.section}>
          <Text className={shared.detailLabel}>Current Value</Text>
          <div className={styles.valueBox}>
            {envVar.currentValue ?? <span style={{ color: tokens.colorNeutralForeground3 }}>Not set</span>}
          </div>
        </div>

        <div className={shared.section}>
          <Text className={shared.detailLabel}>Default Value</Text>
          <div className={styles.valueBox}>
            {envVar.defaultValue ?? <span style={{ color: tokens.colorNeutralForeground3 }}>None</span>}
          </div>
        </div>

        {envVar.hint && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Hint</Text>
            <Text>{envVar.hint}</Text>
          </div>
        )}

        {envVar.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text>{envVar.description}</Text>
          </div>
        )}

        <div className={`${shared.detailsGrid} ${shared.section}`}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Type</Text>
            <Text className={shared.detailValue}>{envVar.typeName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Required</Text>
            <Text className={shared.detailValue}>{envVar.isRequired ? 'Yes' : 'No'}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Customizable</Text>
            <Text className={shared.detailValue}>{envVar.isCustomizable ? 'Yes' : 'No'}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Owner</Text>
            <Text className={shared.detailValue}>{envVar.owner}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Modified By</Text>
            <Text className={shared.detailValue}>{envVar.modifiedBy}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Schema Name</Text>
            <Text className={shared.codeText}>{envVar.schemaName}</Text>
          </div>
        </div>
      </Card>
    </div>
  );

  if (environmentVariables.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Environment Variables Found"
        message="No environment variables were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={shared.container} style={{ marginTop: tokens.spacingVerticalL }}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search environment variables..."
        filteredCount={searchedVars.length}
        totalCount={sorted.length}
        itemLabel="variables"
      >
        <FilterGroup
          label="Type:"
          hasActiveFilters={(activeFilters['type']?.size ?? 0) > 0}
          onClear={() => clearFilter('type')}
        >
          {ENV_TYPE_VALUES.map((type) => (
            <ToggleButton
              key={type}
              appearance="outline"
              className={shared.filterButton}
              size="small"
              checked={activeFilters['type']?.has(type) ?? false}
              disabled={typeCounts[type] === 0}
              onClick={() => toggleKey('type', type)}
            >
              {type}
            </ToggleButton>
          ))}
        </FilterGroup>
      </FilterBar>
      {searchedVars.length === 0 && sorted.length > 0 && (
        <EmptyState type="search" />
      )}
      {searchedVars.map((envVar) => {
        const isExpanded = expandedId === envVar.id;
        return (
          <div key={envVar.id}>
            <div
              className={`${shared.cardRow} ${styles.row} ${isExpanded ? shared.cardRowExpanded : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(envVar.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(envVar.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{envVar.displayName}</Text>
                <Text className={shared.codeText}>{envVar.schemaName}</Text>
              </div>
              <Badge appearance="filled" shape="rounded" color={getTypeColor(envVar.typeName)}>
                {envVar.typeName}
              </Badge>
              <div className={shared.badgeGroup}>
                {envVar.currentValue
                  ? <Text className={shared.codeText}>{envVar.currentValue}</Text>
                  : envVar.defaultValue
                    ? <>
                        <Text className={shared.codeText}>{envVar.defaultValue}</Text>
                        <Badge appearance="outline" shape="rounded" size="small">Default</Badge>
                      </>
                    : <Text style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>Not set</Text>
                }
              </div>
              <div className={shared.badgeGroup}>
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
