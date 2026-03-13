import { Text, Badge, Tooltip, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { TypeBadge } from './TypeBadge';
import { OperationBadge } from './OperationBadge';
import { ChildEntitySection } from './ChildEntitySection';
import type { MessagePipeline, CrossEntityAnalysisResult, CrossEntityTrace } from '../../core';

// Entity accent colour palette
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
  stepFilterText: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3, flexShrink: 0 },
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
  emptyPipelineText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalS,
  },
});

export function MessagePipelineSteps({
  mp,
  analysis,
  color,
  entityDisplayName,
  triggeredStepIds,
  inboundTraces,
}: {
  mp: MessagePipeline;
  analysis: CrossEntityAnalysisResult;
  color: string;
  entityDisplayName: string;
  /** IDs of steps activated by an inbound cross-entity entry point — shown with ← inbound badge */
  triggeredStepIds?: Set<string>;
  /** Inbound traces for this pipeline — used in tooltip on the ← inbound badge */
  inboundTraces?: CrossEntityTrace[];
}): JSX.Element {
  const styles = useStyles();

  return (
    <div>
      {mp.steps.map((step, i) => {
        const hasDownstream = !!step.downstream;
        const downstreamView = hasDownstream
          ? analysis.entityViews.get(step.downstream!.targetEntity) ?? null
          : null;
        const downstreamColor = hasDownstream
          ? entityColor(Array.from(analysis.allEntityPipelines.keys()).indexOf(step.downstream!.targetEntity))
          : color;

        return (
          <div key={step.automationId + i}>
            <div className={styles.pipelineStepRow}>
              <div className={mergeClasses(styles.stepMain, hasDownstream ? styles.stepMainHasBranch : undefined)}>
                <span className={styles.stepNum}>{i + 1}</span>
                {triggeredStepIds?.has(step.automationId) && (
                  <Tooltip
                    content={(inboundTraces ?? []).map(t => `← ${t.entryPoint.automationName} (from ${t.entryPoint.sourceEntityDisplayName})`).join(' · ')}
                    relationship="description"
                  >
                    <Badge appearance="filled" shape="rounded" color="informative" className={styles.stepBadge}>
                      &larr; inbound
                    </Badge>
                  </Tooltip>
                )}
                <TypeBadge type={step.automationType} />
                <span className={styles.stepName}>{step.automationName}</span>
                {step.stageName && <span className={styles.stepStage}>{step.stageName}</span>}
                {step.rank !== undefined && <span className={styles.stepStage}>#{step.rank}</span>}
                <Badge appearance="tint" shape="rounded" color={step.mode === 'Sync' ? 'warning' : 'success'} className={styles.stepBadge}>
                  {step.mode}
                </Badge>
                {step.firesForAllUpdates && (
                  <Tooltip content="No filtering attributes — fires on ALL updates" relationship="description">
                    <Badge appearance="filled" shape="rounded" color="danger" className={styles.stepBadge}>&#9888; No filter</Badge>
                  </Tooltip>
                )}
                {step.hasExternalCalls && (
                  <Badge appearance="tint" shape="rounded" color="brand" className={styles.stepBadge}>
                    External calls
                  </Badge>
                )}
                {step.filteringAttributes.length > 0 && !step.firesForAllUpdates && mp.message === 'Update' && (
                  <Text className={styles.stepFilterText}>
                    filters: {step.filteringAttributes.slice(0, 3).join(', ')}
                    {step.filteringAttributes.length > 3 && ` +${step.filteringAttributes.length - 3}`}
                  </Text>
                )}
              </div>

              {hasDownstream && step.downstream && (
                <div className={styles.branchBlock} style={{ borderLeftColor: downstreamColor }}>
                  <div className={styles.branchTarget} style={{ color: downstreamColor }}>
                    &rarr; {step.downstream.targetEntityDisplayName}
                    <OperationBadge operation={step.downstream.operation} />
                  </div>
                  {step.downstream.fields.length > 0 && (
                    <div className={styles.branchFields}>
                      {step.downstream.fields.slice(0, 4).map(f => (
                        <span key={f} className={styles.branchField}>{f}</span>
                      ))}
                      {step.downstream.fields.length > 4 && (
                        <span className={styles.branchField}>+{step.downstream.fields.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connectors and external calls for flow steps */}
            {step.connectionReferences && step.connectionReferences.length > 0 && (
              <div className={styles.branchFields} style={{ marginTop: tokens.spacingVerticalXS }}>
                {step.connectionReferences.map((ref, ri) => (
                  <Badge key={ri} appearance="tint" shape="rounded" size="small" color="subtle">
                    {ref}
                  </Badge>
                ))}
              </div>
            )}
            {step.externalCallSummaries && step.externalCallSummaries.length > 0 && (
              <div style={{ marginTop: tokens.spacingVerticalXS, display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS }}>
                {step.externalCallSummaries.map((call, ci) => (
                  <Text key={ci} className={styles.stepFilterText} style={{ wordBreak: 'break-all' }}>
                    {call.method ? `${call.method} ` : ''}{call.url || call.domain}
                  </Text>
                ))}
              </div>
            )}

            {/* Inline child pipeline (depth 0 only for message pipeline rows) */}
            {downstreamView && (
              <ChildEntitySection
                entityView={downstreamView}
                trace={downstreamView.traces[0]}
                analysis={analysis}
                depth={1}
                accentColor={downstreamColor}
                parentDisplayName={entityDisplayName}
              />
            )}
          </div>
        );
      })}

      {mp.steps.length === 0 && (
        <Text className={styles.emptyPipelineText}>
          No automations registered for {mp.message}.
        </Text>
      )}
    </div>
  );
}
