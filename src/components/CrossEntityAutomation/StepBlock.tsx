import { Badge, Tooltip, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { TypeBadge } from './TypeBadge';
import { OperationBadge } from './OperationBadge';
import { FieldMatchVerdict } from './FieldMatchVerdict';
import { ChildEntitySection } from './ChildEntitySection';
import type { AutomationActivation, CrossEntityTrace, CrossEntityAnalysisResult } from '../../core';

// Entity accent colour palette — cycles per entity in display order.
// AUDIT-003 exception: intentional hardcoded hex values — Fluent UI tokens
// do not provide a cycling multi-entity palette.
const ENTITY_COLORS = [
  '#0078d4', '#107c10', '#ca5010', '#8764b8',
  '#038387', '#c239b3', '#e3008c', '#004b50',
];
function entityColor(index: number): string { return ENTITY_COLORS[index % ENTITY_COLORS.length]; }

const useStyles = makeStyles({
  pipelineStepRow: {
    display: 'flex',
    gap: 0,
    alignItems: 'stretch',
    marginBottom: '1px',
  },
  stepMain: {
    flex: 1,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    minWidth: 0,
  },
  stepMainHasBranch: {
    borderRight: 'none',
    borderRadius: `${tokens.borderRadiusMedium} 0 0 ${tokens.borderRadiusMedium}`,
  },
  stepNum: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    minWidth: '14px',
    flexShrink: 0,
  },
  stepName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stepStage: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3, flexShrink: 0 },
  stepBadge: { fontSize: tokens.fontSizeBase100, flexShrink: 0 },
  branchBlock: {
    width: '200px',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: tokens.spacingVerticalXXS,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: '3px solid transparent',
    borderRadius: `0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0`,
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'default',
  },
  branchTarget: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  branchFields: { display: 'flex', gap: tokens.spacingHorizontalXXS, flexWrap: 'wrap', marginTop: tokens.spacingVerticalXXS },
  branchField: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    padding: `0 ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground3,
  },
});

export function StepBlock({
  stepNum,
  activation,
  trace,
  analysis,
  depth,
  parentEntityDisplayName,
}: {
  stepNum: number;
  activation: AutomationActivation;
  trace: CrossEntityTrace;
  analysis: CrossEntityAnalysisResult;
  depth: number;
  parentEntityDisplayName: string;
}): JSX.Element {
  const styles = useStyles();
  const hasDownstream = !!activation.downstream;

  // Find downstream entity view and its relevant trace (max depth 2)
  const downstreamView =
    hasDownstream && depth < 2
      ? analysis.entityViews.get(activation.downstream!.targetEntity)
      : null;

  const downstreamTrace = downstreamView
    ? (downstreamView.traces.find(t => t.entryPoint.automationId === activation.automationId) ?? downstreamView.traces[0])
    : null;

  // Downstream entity accent color (cycle from a shifted palette index)
  const downstreamColor = entityColor(
    Array.from(analysis.entityViews.keys()).indexOf(activation.downstream?.targetEntity ?? '') % ENTITY_COLORS.length
  );

  return (
    <div>
      {/* Step row: main block + optional branch */}
      <div className={styles.pipelineStepRow}>
        <div className={mergeClasses(styles.stepMain, hasDownstream ? styles.stepMainHasBranch : undefined)}>
          <span className={styles.stepNum}>{stepNum}</span>
          <TypeBadge type={activation.automationType} />
          <span className={styles.stepName}>{activation.automationName}</span>
          {activation.stageName && (
            <span className={styles.stepStage}>{activation.stageName}</span>
          )}
          {activation.rank !== undefined && (
            <span className={styles.stepStage}>#{activation.rank}</span>
          )}
          <Badge appearance="tint" shape="rounded" color={activation.mode === 'Sync' ? 'warning' : 'success'} className={styles.stepBadge}>
            {activation.mode}
          </Badge>
          {activation.firingStatus === 'WillFireNoFilter' && (
            <Tooltip content="No filtering attributes — fires on ALL updates" relationship="description">
              <Badge appearance="filled" shape="rounded" color="danger" className={styles.stepBadge}>&#9888; No filter</Badge>
            </Tooltip>
          )}
        </div>

        {/* Branch block */}
        {hasDownstream && activation.downstream && (
          <div className={styles.branchBlock} style={{ borderLeftColor: downstreamColor }}>
            <div className={styles.branchTarget} style={{ color: downstreamColor }}>
              &rarr; {activation.downstream.targetEntityDisplayName}
              <OperationBadge operation={activation.downstream.operation} />
            </div>
            {activation.downstream.fields.length > 0 && (
              <div className={styles.branchFields}>
                {activation.downstream.fields.slice(0, 4).map(f => (
                  <span key={f} className={styles.branchField}>{f}</span>
                ))}
                {activation.downstream.fields.length > 4 && (
                  <span className={styles.branchField}>+{activation.downstream.fields.length - 4}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Field match verdict */}
      <FieldMatchVerdict activation={activation} trace={trace} />

      {/* Inline downstream pipeline */}
      {downstreamView && downstreamTrace && depth < 2 && (
        <ChildEntitySection
          entityView={downstreamView}
          trace={downstreamTrace}
          analysis={analysis}
          depth={depth + 1}
          accentColor={downstreamColor}
          parentDisplayName={parentEntityDisplayName}
        />
      )}
    </div>
  );
}
