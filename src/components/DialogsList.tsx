import { useCallback, useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  mergeClasses,
  tokens,
  Card,
  Title3,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';
import { formatDate } from '../utils/dateFormat';
import type { Dialog } from '../core';

const useStyles = makeStyles({
  listContainer: {
    marginTop: tokens.spacingVerticalL,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto auto auto auto`,
    alignItems: 'start',
  },
  deprecationNotice: {
    marginBottom: tokens.spacingVerticalM,
  },
});

function dialogStatusColor(
  status: Dialog['status']
): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Suspended':
      return 'danger';
    case 'Draft':
      return 'warning';
  }
}

interface DialogsListProps {
  dialogs: Dialog[];
}

export function DialogsList({ dialogs }: DialogsListProps): JSX.Element {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(
    () => [...dialogs].sort((a, b) => a.name.localeCompare(b.name)),
    [dialogs]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter(
      d =>
        d.name.toLowerCase().includes(q) ||
        (d.primaryEntityName ?? '').toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(prev => (prev === id ? null : id)),
    []
  );

  const renderDetail = (dialog: Dialog): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Dialog Details</Title3>
        <div className={mergeClasses(shared.detailsGrid, shared.section)}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Status</Text>
            <Text className={shared.detailValue}>{dialog.status}</Text>
          </div>
          {dialog.primaryEntityName && (
            <div className={shared.detailItem}>
              <Text className={shared.detailLabel}>Primary Entity</Text>
              <Text className={shared.codeText}>{dialog.primaryEntityName}</Text>
            </div>
          )}
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Created</Text>
            <Text className={shared.detailValue}>{formatDate(dialog.createdOn)}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>{formatDate(dialog.modifiedOn)}</Text>
          </div>
        </div>
        {dialog.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.detailValue}>{dialog.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (dialogs.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Dialogs Found"
        message="No deprecated dialog workflows were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={mergeClasses(shared.container, styles.listContainer)}>
      <MessageBar intent="warning" className={styles.deprecationNotice}>
        <MessageBarBody>
          Dialogs are deprecated and will be removed in a future Dataverse release. Migrate to
          canvas apps or model-driven app pages.
        </MessageBarBody>
      </MessageBar>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search dialogs..."
        filteredCount={filtered.length}
        totalCount={sorted.length}
        itemLabel="dialogs"
      />
      {filtered.length === 0 && sorted.length > 0 && <EmptyState type="search" />}
      {filtered.map(dialog => {
        const isExpanded = expandedId === dialog.id;
        return (
          <div key={dialog.id}>
            <div
              className={mergeClasses(shared.cardRow, styles.row, isExpanded && shared.cardRowExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(dialog.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(dialog.id);
                }
              }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{dialog.name}</Text>
                {dialog.primaryEntityName && (
                  <Text className={shared.codeText}>{dialog.primaryEntityName}</Text>
                )}
              </div>
              <Badge appearance="filled" shape="rounded" color="severe" size="small">
                Deprecated
              </Badge>
              <Badge
                appearance="filled"
                shape="rounded"
                color={dialogStatusColor(dialog.status)}
                size="small"
              >
                {dialog.status}
              </Badge>
              <Badge
                appearance="filled"
                shape="rounded"
                color={dialog.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {dialog.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(dialog)}
          </div>
        );
      })}
    </div>
  );
}
