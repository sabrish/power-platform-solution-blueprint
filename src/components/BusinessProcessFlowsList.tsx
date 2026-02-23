import { useMemo, useState } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
  Title3,
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ChevronRight20Regular,
  Flowchart20Regular,
  Layer20Regular,
  ArrowDown20Regular,
} from '@fluentui/react-icons';
import type { BusinessProcessFlow, BPFStage } from '../core';
import { formatDate } from '../utils/dateFormat';
import { TruncatedText } from './TruncatedText';

const useStyles = makeStyles({
  container: {
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
    minWidth: 0,
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailValue: {
    fontWeight: tokens.fontWeightSemibold,
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  },
  section: {
    marginTop: tokens.spacingVerticalM,
  },
  badgeGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalXS,
  },
  stagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  stageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  stageNumber: {
    minWidth: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  stageArrow: {
    display: 'flex',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
  },
});

interface BusinessProcessFlowsListProps {
  businessProcessFlows: BusinessProcessFlow[];
}

export function BusinessProcessFlowsList({ businessProcessFlows }: BusinessProcessFlowsListProps) {
  const styles = useStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...businessProcessFlows].sort((a, b) => a.name.localeCompare(b.name));
  }, [businessProcessFlows]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const renderDetail = (bpf: BusinessProcessFlow) => (
    <div className={styles.expandedDetails}>
      <Card>
        <Title3>Business Process Flow Details</Title3>

        <div className={`${styles.detailsGrid} ${styles.section}`}>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Unique Name</Text>
            <Text className={styles.codeText} style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{bpf.uniqueName}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Primary Entity</Text>
            <Text className={styles.detailValue}>
              {bpf.primaryEntityDisplayName || bpf.primaryEntity}
            </Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Total Stages</Text>
            <Text className={styles.detailValue}>{bpf.definition.stages.length}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Total Steps</Text>
            <Text className={styles.detailValue}>{bpf.definition.totalSteps}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Owner</Text>
            <Text className={styles.detailValue}>{bpf.owner}</Text>
          </div>
          <div className={styles.detailItem}>
            <Text className={styles.detailLabel}>Last Modified</Text>
            <Text className={styles.detailValue}>
              {formatDate(bpf.modifiedOn)} by {bpf.modifiedBy}
            </Text>
          </div>
        </div>

        {bpf.description && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Description</Text>
            <Text>{bpf.description}</Text>
          </div>
        )}

        {bpf.definition.crossEntityFlow && bpf.definition.entities.length > 0 && (
          <div className={styles.section}>
            <Text className={styles.detailLabel}>Entities Involved</Text>
            <div className={styles.badgeGroup}>
              {bpf.definition.entities.map((entity) => (
                <Badge key={entity} appearance="outline" shape="rounded">{entity}</Badge>
              ))}
            </div>
            <Text
              style={{
                fontSize: tokens.fontSizeBase200,
                color: tokens.colorNeutralForeground3,
                marginTop: tokens.spacingVerticalXS,
                display: 'block',
              }}
            >
              This is a cross-entity flow that spans multiple entity forms.
            </Text>
          </div>
        )}

        {bpf.definition.stages.length > 0 && (
          <div className={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Layer20Regular style={{ color: tokens.colorNeutralForeground3 }} />
              <Text weight="semibold">Process Stages</Text>
            </div>
            <div className={styles.stagesList}>
              {bpf.definition.stages.map((stage: BPFStage, index: number) => (
                <div key={stage.id}>
                  <div className={styles.stageItem}>
                    <div className={styles.stageNumber}>{stage.order + 1}</div>
                    <div>
                      <Text weight="semibold">{stage.name}</Text>
                      <Text
                        style={{
                          display: 'block',
                          fontSize: tokens.fontSizeBase200,
                          color: tokens.colorNeutralForeground3,
                        }}
                      >
                        Entity: {stage.entity}
                        {stage.steps.length > 0 && ` • ${stage.steps.length} steps`}
                      </Text>
                    </div>
                  </div>
                  {index < bpf.definition.stages.length - 1 && (
                    <div className={styles.stageArrow}>
                      <ArrowDown20Regular />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {bpf.definition.parseError && (
          <div className={styles.section}>
            <Text style={{ color: tokens.colorPaletteRedForeground1, fontSize: tokens.fontSizeBase200 }}>
              Parse warning: {bpf.definition.parseError}
            </Text>
          </div>
        )}
      </Card>
    </div>
  );

  if (businessProcessFlows.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Flowchart20Regular style={{ fontSize: '48px' }} />
        <Text size={500} weight="semibold">No Business Process Flows Found</Text>
        <Text>No business process flows were found in the selected solution(s).</Text>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ marginTop: '16px' }}>
      {sorted.map((bpf) => {
        const isExpanded = expandedId === bpf.id;
        return (
          <div key={bpf.id}>
            <div
              className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
              onClick={() => toggleExpand(bpf.id)}
            >
              <div className={styles.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={styles.nameColumn}>
                <Text weight="semibold">
                  <TruncatedText text={bpf.name} />
                </Text>
                <Text className={styles.codeText}>
                  <TruncatedText text={bpf.uniqueName} />
                </Text>
              </div>
              <Badge appearance="outline" shape="rounded" size="small">
                {bpf.primaryEntityDisplayName || bpf.primaryEntity}
              </Badge>
              <Badge appearance="tint" shape="rounded" color="brand" size="small">
                {bpf.definition.stages.length} stages
              </Badge>
              {bpf.definition.crossEntityFlow && (
                <Badge appearance="filled" shape="rounded" color="important" size="small">
                  Cross-Entity
                </Badge>
              )}
              <Badge
                appearance="filled"
                shape="rounded"
                color={bpf.state === 'Active' ? 'success' : 'warning'}
                size="small"
              >
                {bpf.state}
              </Badge>
            </div>
            {isExpanded && renderDetail(bpf)}
          </div>
        );
      })}
    </div>
  );
}
