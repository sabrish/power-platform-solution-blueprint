import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
  Link,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ChevronRight20Regular,
  Warning20Regular,
  FlashFlow20Regular,
  Cloud20Regular,
} from '@fluentui/react-icons';
import type { ClassicWorkflow } from '../core';
import { formatDate } from '../utils/dateFormat';
import { TruncatedText } from './TruncatedText';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  warning: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    borderLeft: `4px solid ${tokens.colorPaletteYellowForeground1}`,
    marginBottom: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
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
  row: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto auto auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
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
  rowExpanded: {
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
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
  featureItem: {
    padding: tokens.spacingVerticalS,
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalS,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
});

interface ClassicWorkflowsListProps {
  workflows: ClassicWorkflow[];
}

const complexityColor = (c: string | undefined): 'success' | 'warning' | 'danger' | 'severe' => {
  switch (c) {
    case 'Critical': return 'severe';
    case 'High': return 'danger';
    case 'Medium': return 'warning';
    default: return 'success';
  }
};

export function ClassicWorkflowsList({ workflows }: ClassicWorkflowsListProps) {
  const styles = useStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return [...workflows].sort((a, b) => {
      const ac = a.migrationRecommendation?.complexity || 'Low';
      const bc = b.migrationRecommendation?.complexity || 'Low';
      return (order[ac] ?? 3) - (order[bc] ?? 3);
    });
  }, [workflows]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const getTriggers = (w: ClassicWorkflow): string => {
    const t: string[] = [];
    if (w.triggerOnCreate) t.push('Create');
    if (w.triggerOnUpdate) t.push('Update');
    if (w.triggerOnDelete) t.push('Delete');
    if (w.onDemand) t.push('On-Demand');
    return t.join(', ') || 'None';
  };

  const renderDetail = (workflow: ClassicWorkflow) => {
    const rec = workflow.migrationRecommendation;
    return (
      <div className={styles.expandedDetails}>
        <Card>
          <Title3>Classic Workflow Details</Title3>

          {rec?.advisory && (
            <div className={styles.section}>
              <MessageBar intent={workflow.mode === 1 ? 'warning' : 'info'}>
                <MessageBarBody>{rec.advisory}</MessageBarBody>
              </MessageBar>
            </div>
          )}

          <div className={`${styles.detailsGrid} ${styles.section}`}>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Entity</Text>
              <Text className={styles.detailValue}>{workflow.entityDisplayName || workflow.entity}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Type</Text>
              <Text className={styles.detailValue}>{workflow.typeName}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Scope</Text>
              <Text className={styles.detailValue}>{workflow.scopeName}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Triggers</Text>
              <Text className={styles.detailValue}>{getTriggers(workflow)}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Owner</Text>
              <Text className={styles.detailValue}>{workflow.owner}</Text>
            </div>
            <div className={styles.detailItem}>
              <Text className={styles.detailLabel}>Last Modified</Text>
              <Text className={styles.detailValue}>
                {formatDate(workflow.modifiedOn)} by {workflow.modifiedBy}
              </Text>
            </div>
          </div>

        </Card>
      </div>
    );
  };

  if (workflows.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Warning20Regular style={{ fontSize: '48px' }} />
        <Text size={500} weight="semibold">No Classic Workflows Found</Text>
        <Text>No classic workflows were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div className={styles.warning}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Warning20Regular style={{ color: tokens.colorPaletteYellowForeground1 }} />
          <Text weight="semibold">Classic Workflows Detected</Text>
        </div>
        <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 }}>
          Classic workflows are legacy technology. Microsoft recommends migrating to Power Automate cloud flows.{' '}
          <Link href="https://learn.microsoft.com/en-us/power-automate/replace-workflows-with-flows" target="_blank" rel="noopener noreferrer">
            Learn more
          </Link>
          . Click a row to see detailed migration guidance.
        </Text>
      </div>

      <div className={styles.container}>
        {sorted.map((workflow) => {
          const isExpanded = expandedId === workflow.id;
          const complexity = workflow.migrationRecommendation?.complexity || 'Low';
          return (
            <div key={workflow.id}>
              <div
                className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
                onClick={() => toggleExpand(workflow.id)}
              >
                <div className={styles.chevron}>
                  {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
                </div>
                <div className={styles.nameColumn}>
                  <Text weight="semibold">
                    <TruncatedText text={workflow.name} />
                  </Text>
                  {workflow.description && (
                    <Text className={styles.codeText}>
                      <TruncatedText text={workflow.description} />
                    </Text>
                  )}
                </div>
                <Text className={styles.codeText}>
                  <TruncatedText text={workflow.entityDisplayName || workflow.entity} />
                </Text>
                <Badge appearance="filled" shape="rounded" color={workflow.mode === 1 ? 'warning' : 'informative'} size="small">
                  {workflow.mode === 1 ? <><FlashFlow20Regular /> RealTime</> : <><Cloud20Regular /> Background</>}
                </Badge>
                <Badge appearance="filled" shape="rounded"
                  color={workflow.state === 'Active' ? 'success' : workflow.state === 'Draft' ? 'warning' : 'danger'}
                  size="small"
                >
                  {workflow.state}
                </Badge>
                <Badge appearance="filled" shape="rounded" color={complexityColor(complexity)} size="small">
                  {complexity}
                </Badge>
              </div>
              {isExpanded && renderDetail(workflow)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
