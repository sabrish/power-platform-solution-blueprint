import { Fragment, useState } from 'react';
import { Text, Card, Badge, ToggleButton, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowRight24Regular } from '@fluentui/react-icons';
import { FilterBar, FilterGroup } from '../FilterBar';
import { EmptyState } from '../EmptyState';
import { OperationBadge } from '../CrossEntityAutomation';
import type { CrossEntityAnalysisResult, CrossEntityChainLink } from '../../core';

const useStyles = makeStyles({
  chainMapContainer: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  filterButton: {
    minWidth: 'unset',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
  },
  chainTable: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto auto auto 1fr auto',
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
  monoMuted: { fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground2 },
  monoTextMuted: { fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  monoTextMutedItalic: { fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, fontStyle: 'italic' },
  monoActionApiName: { fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3, display: 'block' },
  mutedItalic: { color: tokens.colorNeutralForeground3, fontStyle: 'italic' },
  breakWord: { wordBreak: 'break-word' },
  iconMuted: { color: tokens.colorNeutralForeground3 },
});

function triggerOperationLabel(op: CrossEntityChainLink['triggerOperation']): string {
  switch (op) {
    case 'Create': return 'Create';
    case 'Update': return 'Update';
    case 'Delete': return 'Delete';
    case 'CreateOrUpdate': return 'Create or Update';
    case 'Assign': return 'Assign';
    case 'Grant': return 'Grant Access';
    case 'Revoke': return 'Revoke Access';
    case 'StatusChange': return 'Status Change';
    case 'Manual': return 'Manual';
    case 'Scheduled': return 'Scheduled';
    case 'Action': return 'Custom Action';
    default: return '—';
  }
}

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
    .sort((a, b) => {
      // 1. Source Trigger — real entities first, then pseudo-buckets
      const aIsReal = !a.sourceEntity.startsWith('(');
      const bIsReal = !b.sourceEntity.startsWith('(');
      if (aIsReal !== bIsReal) return aIsReal ? -1 : 1;
      const srcCmp = a.sourceEntityDisplayName.localeCompare(b.sourceEntityDisplayName);
      if (srcCmp !== 0) return srcCmp;
      // 2. Automation name
      const autoCmp = a.automationName.localeCompare(b.automationName);
      if (autoCmp !== 0) return autoCmp;
      // 3. Trigger operation
      const triggerOrder = ['Create', 'Update', 'Delete', 'CreateOrUpdate', 'Action', 'Manual', 'Scheduled', 'Unknown'];
      const tA = triggerOrder.indexOf(a.triggerOperation);
      const tB = triggerOrder.indexOf(b.triggerOperation);
      if (tA !== tB) return tA - tB;
      // 4. Mode (Sync before Async)
      if (a.isAsynchronous !== b.isAsynchronous) return a.isAsynchronous ? 1 : -1;
      // 5. Target entity
      const tgtCmp = a.targetEntityDisplayName.localeCompare(b.targetEntityDisplayName);
      if (tgtCmp !== 0) return tgtCmp;
      // 6. Target operation
      const opOrder = ['Create', 'Update', 'Delete', 'Action'];
      return opOrder.indexOf(a.operation) - opOrder.indexOf(b.operation);
    });

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
          label="Target Operation:"
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
            {/* Headers: Source Trigger | Automation | Trigger Operation | Mode | → | Target Entity | Target Operation */}
            <Text className={styles.chainTableHeader}>Source Trigger</Text>
            <Text className={styles.chainTableHeader}>Automation</Text>
            <Text className={styles.chainTableHeader}>Trigger Operation</Text>
            <Text className={styles.chainTableHeader}>Mode</Text>
            <span />
            <Text className={styles.chainTableHeader}>Target Entity</Text>
            <Text className={styles.chainTableHeader}>Target Operation</Text>

            {filteredLinks.map((link, i) => (
              <Fragment key={i}>
                {/* Source Trigger */}
                <div>
                  {link.sourceEntity === '(custom-action)' ? (
                    <>
                      <Text weight="semibold">Custom Action</Text>
                      <br />
                      <Text className={styles.monoTextMuted}>
                        {link.sourceEntityDisplayName.replace('Custom Action: ', '')}
                      </Text>
                    </>
                  ) : link.sourceEntity.startsWith('(') ? (
                    <Text className={styles.mutedItalic}>
                      (unbound)
                    </Text>
                  ) : (
                    <>
                      <Text weight="semibold">{link.sourceEntityDisplayName}</Text>
                      <br />
                      <Text className={styles.monoTextMuted}>
                        {link.sourceEntity}
                      </Text>
                    </>
                  )}
                </div>

                {/* Automation */}
                <div className={styles.chainAutoCell}>
                  <Text className={styles.breakWord}>{link.automationName}</Text>
                  <Badge
                    appearance="outline"
                    shape="rounded"
                    color={link.automationType === 'Flow' ? 'success' : 'important'}
                    className={styles.chainAutoBadge}
                  >
                    {link.automationType}
                  </Badge>
                </div>

                {/* Trigger Operation */}
                <div>
                  <Text>{triggerOperationLabel(link.triggerOperation)}</Text>
                  {link.triggerOperation === 'Action' && link.triggerCustomActionName && (
                    <>
                      <br />
                      <Text className={styles.monoMuted}>{link.triggerCustomActionName}</Text>
                    </>
                  )}
                </div>

                {/* Mode */}
                <Badge
                  appearance="tint"
                  shape="rounded"
                  color={link.isAsynchronous ? 'success' : 'warning'}
                >
                  {link.isAsynchronous ? 'Async' : 'Sync'}
                </Badge>

                {/* Arrow */}
                <ArrowRight24Regular className={styles.iconMuted} />

                {/* Target Entity */}
                <div>
                  <Text weight="semibold">{link.targetEntityDisplayName}</Text>
                  {link.targetEntity !== '(unbound)' && (
                    <>
                      <br />
                      <Text className={styles.monoTextMuted}>
                        {link.targetEntity}
                      </Text>
                    </>
                  )}
                  {link.targetEntity === '(unbound)' && (
                    <>
                      <br />
                      <Text className={styles.monoTextMutedItalic}>
                        No entity target — effects not traceable
                      </Text>
                    </>
                  )}
                </div>

                {/* Target Operation */}
                <div>
                  <OperationBadge operation={link.operation} />
                  {link.operation === 'Action' && link.customActionApiName && (
                    <Text className={styles.monoActionApiName}>
                      {link.customActionApiName}
                    </Text>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
