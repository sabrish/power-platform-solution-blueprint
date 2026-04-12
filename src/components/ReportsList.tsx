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
import type { Report } from '../core';

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

interface ReportsListProps {
  reports: Report[];
}

export function ReportsList({ reports }: ReportsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...reports].sort((a, b) => a.name.localeCompare(b.name)),
    [reports]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        (r.fileName ?? '').toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (report: Report): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Report Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Report Type</Text>
            <Text className={shared.detailValue}>{report.reportType}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Custom Report</Text>
            <Text className={shared.detailValue}>{report.isCustomReport ? 'Yes' : 'No'}</Text>
          </div>
          {report.fileName && (
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>File Name</Text>
              <Text className={shared.codeText}>{report.fileName}</Text>
            </div>
          )}
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(report.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(report.modifiedOn)}</Text>
          </div>
        </div>
        {report.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.detailValue}>{report.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (reports.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Reports Found"
        message="No reports were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search reports..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="reports"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(report => {
        const isExpanded = expandedId === report.id;
        return (
          <div key={report.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(report.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(report.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{report.name}</Text>
                {report.fileName && (
                  <Text className={shared.codeText}>{report.fileName}</Text>
                )}
              </div>
              <Badge appearance="outline" shape="rounded" size="small">
                {report.reportType}
              </Badge>
              <Badge
                appearance="filled"
                shape="rounded"
                color={report.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {report.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(report)}
          </div>
        );
      })}
    </div>
  );
}
