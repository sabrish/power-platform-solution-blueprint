import { Text, Badge, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { OperationBadge } from './OperationBadge';
import { MessagePipelineSteps } from './MessagePipelineSteps';
import type { EntityAutomationPipeline, CrossEntityAnalysisResult } from '../../core';

const useStyles = makeStyles({
  entityRow: { display: 'flex', flexDirection: 'column', marginBottom: '2px' },
  entityHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    cursor: 'pointer',
    borderLeft: '4px solid transparent',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  entityHeaderOpen: {
    borderRadius: `${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0 0`,
    borderBottom: 'none',
  },
  entityInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  entityNameRow: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, flexWrap: 'wrap' },
  entityLogicalName: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    padding: `0 ${tokens.spacingHorizontalXXS}`,
  },
  entityHeaderCount: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  entityBody: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM} ${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderLeft: '4px solid transparent',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
  },
  traceSubHeader: {
    padding: `${tokens.spacingVerticalXXS} 0`,
    marginBottom: tokens.spacingVerticalXXS,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  traceDivider: {
    borderTop: `1px dashed ${tokens.colorNeutralStroke2}`,
    margin: `${tokens.spacingVerticalS} 0`,
  },
});

export function EntityMessagePipelineRow({
  pipeline,
  color,
  expanded,
  onToggle,
  analysis,
}: {
  pipeline: EntityAutomationPipeline;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  analysis: CrossEntityAnalysisResult;
}): JSX.Element {
  const styles = useStyles();
  const totalSteps = pipeline.messagePipelines.reduce((sum, mp) => sum + mp.steps.length, 0);

  return (
    <div className={styles.entityRow}>
      <div
        className={mergeClasses(styles.entityHeader, expanded && styles.entityHeaderOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className={styles.entityInfo}>
          <div className={styles.entityNameRow}>
            <Text weight="semibold">{pipeline.entityDisplayName}</Text>
            <Text className={styles.entityLogicalName}>
              {pipeline.entityLogicalName}
            </Text>
            {pipeline.messagePipelines.map(mp => (
              <OperationBadge key={mp.message} operation={mp.message} />
            ))}
            {pipeline.hasCrossEntityOutput && (
              <Badge appearance="tint" shape="rounded" color="informative">&rarr; cross-entity</Badge>
            )}
            {pipeline.hasExternalInteraction && (
              <Badge appearance="tint" shape="rounded" color="brand">&#8627; External calls</Badge>
            )}
          </div>

        </div>

        <Text className={styles.entityHeaderCount}>
          {expanded ? '▲' : '▼'} {totalSteps}
        </Text>
      </div>

      {expanded && (
        <div className={styles.entityBody} style={{ borderLeft: `4px solid ${color}40` }}>
          {pipeline.messagePipelines.map((mp, mpi) => (
            <div key={mp.message}>
              {pipeline.messagePipelines.length > 1 && (
                <div className={styles.traceSubHeader}>
                  <OperationBadge operation={mp.message} /> pipeline
                </div>
              )}
              <MessagePipelineSteps mp={mp} analysis={analysis} color={color} entityDisplayName={pipeline.entityDisplayName} />
              {mpi < pipeline.messagePipelines.length - 1 && (
                <div className={styles.traceDivider} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
