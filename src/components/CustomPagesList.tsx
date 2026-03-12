import { useMemo, useState, useCallback } from 'react';
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
import type { CustomPage } from '../core';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

const useStyles = makeStyles({
  row: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) auto`,
    gap: tokens.spacingHorizontalM,
  },
});

interface CustomPagesListProps {
  customPages: CustomPage[];
}

export function CustomPagesList({ customPages }: CustomPagesListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = useMemo(() => {
    return [...customPages].sort((a, b) =>
      (a.displayName || a.name).localeCompare(b.displayName || b.name)
    );
  }, [customPages]);

  const searched = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sorted;
    return sorted.filter((p) =>
      p.displayName.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const toggleExpand = useCallback((id: string) => setExpandedId((prev) => (prev === id ? null : id)), []);

  const renderDetail = (page: CustomPage): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>Custom Page Details</Title3>

        <div className={`${shared.detailsGrid} ${shared.section}`}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Logical Name</Text>
            <Text className={`${shared.codeText} ${shared.detailValue}`}>{page.name}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Display Name</Text>
            <Text className={shared.detailValue}>{page.displayName}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Managed</Text>
            <Text className={shared.detailValue}>{page.isManaged ? 'Yes' : 'No'}</Text>
          </div>
        </div>

        {page.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.detailValue}>{page.description}</Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (customPages.length === 0) {
    return (
      <EmptyState
        type="generic"
        title="No Custom Pages Found"
        message="No custom pages were found in the selected solution(s)."
      />
    );
  }

  return (
    <div className={shared.container} style={{ marginTop: tokens.spacingVerticalL }}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search custom pages..."
        filteredCount={searched.length}
        totalCount={sorted.length}
        itemLabel="custom pages"
      />
      {searched.length === 0 && sorted.length > 0 && (
        <EmptyState type="search" />
      )}
      {searched.map((page) => {
        const isExpanded = expandedId === page.id;
        return (
          <div key={page.id}>
            <div
              className={`${shared.cardRow} ${styles.row} ${isExpanded ? shared.cardRowExpanded : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onClick={() => toggleExpand(page.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(page.id); } }}
            >
              <div className={shared.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={shared.nameColumn}>
                <Text weight="semibold">{page.displayName || page.name}</Text>
                <Text className={shared.codeText}>{page.name}</Text>
              </div>
              <Badge
                appearance="filled"
                shape="rounded"
                color={page.isManaged ? 'warning' : 'success'}
                size="small"
              >
                {page.isManaged ? 'Managed' : 'Unmanaged'}
              </Badge>
            </div>
            {isExpanded && renderDetail(page)}
          </div>
        );
      })}
    </div>
  );
}
