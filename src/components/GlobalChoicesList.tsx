import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  SearchBox,
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
import type { GlobalChoice, GlobalChoiceOption } from '../core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  filters: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  searchBox: {
    minWidth: '300px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  emptyState: {
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
  },
  choiceRow: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) minmax(100px, 1fr) auto auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: tokens.shadow4,
    },
  },
  choiceRowExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },
  nameColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    wordBreak: 'break-word',
  },
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto',
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  section: {
    marginTop: tokens.spacingVerticalM,
  },
});

interface GlobalChoicesListProps {
  globalChoices: GlobalChoice[];
  onSelectChoice: (choice: GlobalChoice) => void;
}

export function GlobalChoicesList({ globalChoices }: GlobalChoicesListProps) {
  const styles = useStyles();
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
          (c.description && c.description.toLowerCase().includes(query))
        );
      });
    }

    // Sort by display name
    return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [globalChoices, searchQuery, showManagedOnly]);

  const toggleExpand = (choiceId: string) => {
    setExpandedChoiceId(expandedChoiceId === choiceId ? null : choiceId);
  };

  const renderChoiceDetails = (choice: GlobalChoice) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>{choice.displayName}</Title3>

        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Logical Name</Text>
            <Text className={`${styles.detailValue} ${styles.codeText}`}>{choice.name}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Options</Text>
            <Text className={styles.detailValue}>{choice.totalOptions} options</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Status</Text>
            <Badge appearance="filled" color={choice.isManaged ? 'warning' : 'success'}>
              {choice.isManaged ? 'Managed' : 'Unmanaged'}
            </Badge>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Customizable</Text>
            <Text className={styles.detailValue}>{choice.isCustomizable ? 'Yes' : 'No'}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Last Modified</Text>
            <Text className={styles.detailValue}>
              {new Date(choice.modifiedOn).toLocaleString()}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Modified By</Text>
            <Text className={styles.detailValue}>{choice.modifiedBy}</Text>
          </div>
        </div>

        {choice.description && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Description</Text>
            <Text className={styles.wrapText}>{choice.description}</Text>
          </div>
        )}

        {/* Options Table */}
        {choice.options.length > 0 && (
          <div className={styles.section}>
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
                        <Badge appearance="tint" size="small">
                          {option.value}
                        </Badge>
                      </TableCellLayout>
                    </TableCell>
                    <TableCell>
                      <TableCellLayout>
                        <span style={{ fontWeight: 500 }}>{option.label}</span>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: option.color,
                                border: '1px solid ' + tokens.colorNeutralStroke1,
                                borderRadius: '4px',
                              }}
                            />
                            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
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
    return (
      <div className={styles.emptyState}>
        <Text style={{ fontSize: '48px' }}>🎯</Text>
        <Text size={500} weight="semibold">
          No Global Choices Found
        </Text>
        <Text>No global choices were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search global choices..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value || '')}
        />
        <Checkbox
          label="Managed only"
          checked={showManagedOnly}
          onChange={(_, data) => setShowManagedOnly(data.checked === true)}
        />
        <Text style={{ marginLeft: 'auto', color: tokens.colorNeutralForeground3 }}>
          {filteredChoices.length} of {globalChoices.length} global choices
        </Text>
      </div>

      {/* Global Choices List */}
      <div className={styles.listContainer}>
        {filteredChoices.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No global choices match your filters.</Text>
          </div>
        ) : (
          filteredChoices.map((choice) => {
            const isExpanded = expandedChoiceId === choice.id;

            return (
              <div key={choice.id}>
                <div
                  className={`${styles.choiceRow} ${isExpanded ? styles.choiceRowExpanded : ''}`}
                  onClick={() => toggleExpand(choice.id)}
                >
                  <div className={styles.chevron}>
                    {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                  </div>
                  <div className={styles.nameColumn}>
                    <Text weight="semibold" className={styles.wrapText}>
                      {choice.displayName}
                    </Text>
                    <Text className={`${styles.wrapText} ${styles.codeText}`}>
                      {choice.name}
                    </Text>
                  </div>
                  <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                    {choice.totalOptions} options
                  </Text>
                  <Badge appearance="filled" color={choice.isManaged ? 'warning' : 'success'} size="small">
                    {choice.isManaged ? 'Managed' : 'Unmanaged'}
                  </Badge>
                  {!choice.isCustomizable && (
                    <Badge appearance="outline" color="danger" size="small">
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
