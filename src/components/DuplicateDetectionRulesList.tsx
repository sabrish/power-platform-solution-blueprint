import { useMemo } from 'react';
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
import { useExpandable } from '../hooks/useExpandable';
import { useListFilter } from '../hooks/useListFilter';
import { formatDate } from '../utils/dateFormat';
import type { DuplicateDetectionRule } from '../core';

const useStyles = makeStyles({
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto auto auto`,
    alignItems: 'start',
  },
});

const FILTER_SPECS = [] as const;

interface Props { duplicateDetectionRules: DuplicateDetectionRule[]; }

export function DuplicateDetectionRulesList({ duplicateDetectionRules }: Props): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const { expandedId, toggleExpand } = useExpandable();

  const sorted = useMemo(
    () => [...duplicateDetectionRules].sort((a, b) => a.name.localeCompare(b.name)),
    [duplicateDetectionRules]
  );

  const { filteredItems, searchQuery, setSearchQuery } = useListFilter(
    sorted,
    (r, q) => r.name.toLowerCase().includes(q) || r.baseEntityName.toLowerCase().includes(q) || r.matchingEntityName.toLowerCase().includes(q),
    FILTER_SPECS
  );

  if (duplicateDetectionRules.length === 0) {
    return <EmptyState type="generic" title="No Duplicate Detection Rules Found" message="No duplicate detection rules were found in the selected solution(s)." />;
  }

  return (
    <div className={mergeClasses(shared.container)}>
      <FilterBar searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Search rules..." filteredCount={filteredItems.length} totalCount={sorted.length} itemLabel="rules" />
      {filteredItems.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filteredItems.map(rule => {
        const isExpanded = expandedId === rule.id;
        return (
          <div key={rule.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button" tabIndex={0} aria-expanded={isExpanded}
              onClick={() => toggleExpand(rule.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(rule.id); } }}
            >
              <div className={shared.chevron}>{isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}</div>
              <div className={shared.nameColumn}><Text weight="semibold">{rule.name}</Text></div>
              <Badge appearance="outline" shape="rounded" size="small">{rule.baseEntityName}</Badge>
              <Badge appearance="outline" shape="rounded" size="small">{rule.matchingEntityName}</Badge>
              <Badge appearance="filled" color={rule.status === 'Active' ? 'success' : 'warning'} shape="rounded" size="small">{rule.status}</Badge>
              <Badge appearance="filled" color={rule.isManaged ? 'warning' : 'success'} shape="rounded" size="small">{rule.isManaged ? 'Managed' : 'Unmanaged'}</Badge>
            </div>
            {isExpanded && (
              <div className={shared.expandedDetails}>
                <Card>
                  <Title3>Duplicate Detection Rule Details</Title3>
                  <div className={mergeClasses(shared.detailsGrid, shared.section)}>
                    <div className={shared.detailItem}><Text className={shared.detailLabel}>Base Entity</Text><Text className={shared.detailValue}>{rule.baseEntityName}</Text></div>
                    <div className={shared.detailItem}><Text className={shared.detailLabel}>Matching Entity</Text><Text className={shared.detailValue}>{rule.matchingEntityName}</Text></div>
                    <div className={shared.detailItem}><Text className={shared.detailLabel}>Created</Text><Text className={shared.detailValue}>{formatDate(rule.createdOn)}</Text></div>
                    <div className={shared.detailItem}><Text className={shared.detailLabel}>Last Modified</Text><Text className={shared.detailValue}>{formatDate(rule.modifiedOn)}</Text></div>
                  </div>
                  {rule.description && <div className={shared.section}><Text className={shared.detailLabel}>Description</Text><Text className={shared.detailValue}>{rule.description}</Text></div>}
                </Card>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
