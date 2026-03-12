import { useMemo, useState, useCallback } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  mergeClasses,
  tokens,
  Card,
  Title3,
  Checkbox,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
} from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { FilterBar, FilterGroup } from './FilterBar';
import type { GlobalChoice, GlobalChoiceOption } from '../core';
import { EmptyState } from './EmptyState';
import { useCardRowStyles } from '../hooks/useCardRowStyles';

const useStyles = makeStyles({
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  choiceRow: {
    display: 'grid',
    gridTemplateColumns: `${tokens.spacingHorizontalXXL} minmax(200px, 2fr) minmax(100px, 1fr) auto auto`,
  },
});

interface GlobalChoicesListProps {
  globalChoices: GlobalChoice[];
}

export function GlobalChoicesList({ globalChoices }: GlobalChoicesListProps) {
  const styles = useStyles();
  const shared = useCardRowStyles();
  const [expandedChoiceId, setExpandedChoiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showManagedOnly, setShowManagedOnly] = useState(false);

  // Filter and search global choices
  const filteredChoices = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    let filtered = globalChoices;

    // Managed filter
    if (showManagedOnly) {
      filtered = filtered.filter((c) => c.isManaged);
    }

    // Search
    if (query) {
      filtered = filtered.filter((c) => {
        return (
          c.name.toLowerCase().includes(query) ||
          c.displayName.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query)) ||
          c.options.some(
            (opt) =>
              opt.label.toLowerCase().includes(query) ||
              String(opt.value).includes(query) ||
              (opt.description && opt.description.toLowerCase().includes(query))
          )
        );
      });
    }

    // Sort by display name
    return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [globalChoices, searchQuery, showManagedOnly]);

  const toggleExpand = useCallback((choiceId: string) => {
    setExpandedChoiceId((prev) => (prev === choiceId ? null : choiceId));
  }, []);

  const renderChoiceDetails = (choice: GlobalChoice): JSX.Element => (
    <div className={shared.expandedDetails}>
      <Card>
        <Title3>{choice.displayName}</Title3>

        <div className={shared.detailsGrid}>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Logical Name</Text>
            <Text className={mergeClasses(shared.detailValue, shared.codeText)}>{choice.name}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Options</Text>
            <Text className={shared.detailValue}>{choice.totalOptions} options</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Status</Text>
            <Badge appearance="filled" shape="rounded" color={choice.isManaged ? 'warning' : 'success'}>
              {choice.isManaged ? 'Managed' : 'Unmanaged'}
            </Badge>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Customizable</Text>
            <Text className={shared.detailValue}>{choice.isCustomizable ? 'Yes' : 'No'}</Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Last Modified</Text>
            <Text className={shared.detailValue}>
              {new Date(choice.modifiedOn).toLocaleString()}
            </Text>
          </div>
          <div className={shared.detailItem}>
            <Text className={shared.detailLabel}>Modified By</Text>
            <Text className={shared.detailValue}>{choice.modifiedBy}</Text>
          </div>
        </div>

        {choice.description && (
          <div className={shared.section}>
            <Text className={shared.detailLabel}>Description</Text>
            <Text className={shared.wrapText}>{choice.description}</Text>
          </div>
        )}

        {/* Options Table */}
        {choice.options.length > 0 && (
          <div className={shared.section}>
            <Title3>Options ({choice.options.length})</Title3>
            <Table aria-label="Global Choice Options" size="small" style={{ marginTop: tokens.spacingVerticalM }}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Value</TableHeaderCell>
                  <TableHeaderCell>Label</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>Color</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {choice.options.map((option: GlobalChoiceOption) => (
                  <TableRow key={option.value}>
                    <TableCell>
                      <TableCellLayout>
                        <Badge appearance="tint" shape="rounded" size="small">
                          {option.value}
                        </Badge>
                      </TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <TableCellLayout>
                        <span style={{ fontWeight: tokens.fontWeightSemibold }}>{option.label}</span>
                      </TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <TableCellLayout>
                        {option.description || (
                          <span style={{ color: tokens.colorNeutralForeground3 }}>-</span>
                        )}
                      </TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <TableCellLayout>
                        {option.color ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                            <div
                              style={{
                                width: tokens.spacingHorizontalM,
                                height: tokens.spacingHorizontalM,
                                backgroundColor: option.color,
                                border: `1px solid ${tokens.colorNeutralStroke1}`,
                                borderRadius: tokens.borderRadiusSmall,
                              }}
                            />
                            <span style={{ fontFamily: 'monospace', fontSize: tokens.fontSizeBase200 }}>
                              {option.color}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: tokens.colorNeutralForeground3 }}>-</span>
                        )}
                      </TableCellLayout>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );

  // Empty state
  if (globalChoices.length === 0) {
    return <EmptyState type="globalchoices" />;
  }

  return (
    <div className={shared.container}>
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search global choices..."
        filteredCount={filteredChoices.length}
        totalCount={globalChoices.length}
        itemLabel="global choices"
      >
        <FilterGroup
          label="Show:"
          hasActiveFilters={showManagedOnly}
          onClear={() => setShowManagedOnly(false)}
        >
          <Checkbox
            label="Show managed only"
            checked={showManagedOnly}
            onChange={(_, data) => setShowManagedOnly(data.checked === true)}
          />
        </FilterGroup>
      </FilterBar>

      {/* Global Choices List */}
      <div className={styles.listContainer}>
        {filteredChoices.length === 0 ? (
          <EmptyState type="search" />
        ) : (
          filteredChoices.map((choice) => {
            const isExpanded = expandedChoiceId === choice.id;

            return (
              <div key={choice.id}>
                <div
                  className={mergeClasses(shared.cardRow, styles.choiceRow, isExpanded && shared.cardRowExpanded)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpand(choice.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(choice.id); } }}
                >
                  <div className={shared.chevron}>
                    {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                  </div>
                  <div className={shared.nameColumn}>
                    <Text weight="semibold">{choice.displayName}</Text>
                    <Text className={shared.codeText}>{choice.name}</Text>
                  </div>
                  <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                    {choice.totalOptions} options
                  </Text>
                  <Badge appearance="filled" shape="rounded" color={choice.isManaged ? 'warning' : 'success'} size="small">
                    {choice.isManaged ? 'Managed' : 'Unmanaged'}
                  </Badge>
                  {!choice.isCustomizable && (
                    <Badge appearance="outline" shape="rounded" color="important" size="small">
                      Not Customizable
                    </Badge>
                  )}
                </div>
                {isExpanded && renderChoiceDetails(choice)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
