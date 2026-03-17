import { Fragment, useState } from 'react';
import { Text, Card, Badge, ToggleButton, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowRight24Regular } from '@fluentui/react-icons';
import { FilterBar, FilterGroup } from '../FilterBar';
import { EmptyState } from '../EmptyState';
import { OperationBadge } from '../CrossEntityAutomation';
import type { CrossEntityAnalysisResult } from '../../core';

const useStyles = makeStyles({
  chainMapContainer: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  filterButton: {
    minWidth: 'unset',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
  },
  chainTable: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr auto auto auto',
    gap: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM}`,
    alignItems: 'center',
  },
  chainTableHeader: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    paddingBottom: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalXS,
  },
  chainAutoCell: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS },
  chainAutoBadge: { width: 'fit-content' },
  monoText: { fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase200 },
});

export interface GlobalChainMapPanelProps {
  analysis: CrossEntityAnalysisResult;
}

export function GlobalChainMapPanel({ analysis }: GlobalChainMapPanelProps): JSX.Element {
  const styles = useStyles();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOperation, setFilterOperation] = useState<string>('all');
  const [chainSearch, setChainSearch] = useState('');

  const filteredLinks = analysis.chainLinks
    .filter((link) => {
      const typeMatch = filterType === 'all' || link.automationType === filterType;
      const opMatch = filterOperation === 'all' || link.operation === filterOperation;
      return typeMatch && opMatch;
    })
    .filter((link) => {
      if (!chainSearch.trim()) return true;
      const q = chainSearch.toLowerCase();
      return (
        link.sourceEntityDisplayName.toLowerCase().includes(q) ||
        link.sourceEntity.toLowerCase().includes(q) ||
        link.targetEntityDisplayName.toLowerCase().includes(q) ||
        link.targetEntity.toLowerCase().includes(q) ||
        link.automationName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.sourceEntityDisplayName.localeCompare(b.sourceEntityDisplayName));

  return (
    <div className={styles.chainMapContainer}>
      <FilterBar
        searchValue={chainSearch}
        onSearchChange={setChainSearch}
        searchPlaceholder="Search source, target, or automation name..."
        filteredCount={filteredLinks.length}
        totalCount={analysis.chainLinks.length}
        itemLabel="links"
      >
        <FilterGroup
          label="Type:"
          hasActiveFilters={filterType !== 'all'}
          onClear={() => setFilterType('all')}
        >
          {(['all', 'Flow', 'ClassicWorkflow'] as const).map((t) => (
            <ToggleButton
              key={t}
              appearance="outline"
              className={styles.filterButton}
              size="small"
              checked={filterType === t}
              onClick={() => setFilterType(filterType === t && t !== 'all' ? 'all' : t)}
            >
              {t === 'all' ? 'All Types' : t}
            </ToggleButton>
          ))}
        </FilterGroup>
        <FilterGroup
          label="Operation:"
          hasActiveFilters={filterOperation !== 'all'}
          onClear={() => setFilterOperation('all')}
        >
          {(['all', 'Create', 'Update', 'Delete', 'Action'] as const).map((op) => (
            <ToggleButton
              key={op}
              appearance="outline"
              className={styles.filterButton}
              size="small"
              checked={filterOperation === op}
              onClick={() =>
                setFilterOperation(filterOperation === op && op !== 'all' ? 'all' : op)
              }
            >
              {op === 'all' ? 'All Ops' : op === 'Action' ? 'Custom Action' : op}
            </ToggleButton>
          ))}
        </FilterGroup>
      </FilterBar>

      {filteredLinks.length === 0 ? (
        <EmptyState type="search" />
      ) : (
        <Card>
          <div className={styles.chainTable}>
            <Text className={styles.chainTableHeader}>Source Entity</Text>
            <span />
            <Text className={styles.chainTableHeader}>Target Entity</Text>
            <Text className={styles.chainTableHeader}>Automation</Text>
            <Text className={styles.chainTableHeader}>Operation</Text>
            <Text className={styles.chainTableHeader}>Mode</Text>
            {filteredLinks.map((link, i) => (
              <Fragment key={i}>
                <div>
                  <Text weight="semibold">{link.sourceEntityDisplayName}</Text>
                  <br />
                  <Text
                    className={styles.monoText}
                    style={{ color: tokens.colorNeutralForeground3 }}
                  >
                    {link.sourceEntity}
                  </Text>
                </div>
                <ArrowRight24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                <div>
                  <Text weight="semibold">{link.targetEntityDisplayName}</Text>
                  {link.targetEntity !== '(unbound)' && (
                    <>
                      <br />
                      <Text
                        className={styles.monoText}
                        style={{ color: tokens.colorNeutralForeground3 }}
                      >
                        {link.targetEntity}
                      </Text>
                    </>
                  )}
                  {link.targetEntity === '(unbound)' && (
                    <>
                      <br />
                      <Text
                        className={styles.monoText}
                        style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}
                      >
                        No entity target — effects not traceable
                      </Text>
                    </>
                  )}
                </div>
                <div className={styles.chainAutoCell}>
                  <Text style={{ wordBreak: 'break-word' }}>{link.automationName}</Text>
                  <Badge
                    appearance="outline"
                    shape="rounded"
                    color={link.automationType === 'Flow' ? 'success' : 'important'}
                    className={styles.chainAutoBadge}
                  >
                    {link.automationType}
                  </Badge>
                </div>
                <div>
                  <OperationBadge operation={link.operation} />
                  {link.operation === 'Action' && link.customActionApiName && (
                    <Text
                      className={styles.monoText}
                      style={{
                        color: tokens.colorNeutralForeground3,
                        display: 'block',
                        fontSize: tokens.fontSizeBase100,
                      }}
                    >
                      {link.customActionApiName}
                    </Text>
                  )}
                </div>
                <Badge
                  appearance="tint"
                  shape="rounded"
                  color={link.isAsynchronous ? 'success' : 'warning'}
                >
                  {link.isAsynchronous ? 'Async' : 'Sync'}
                </Badge>
              </Fragment>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
