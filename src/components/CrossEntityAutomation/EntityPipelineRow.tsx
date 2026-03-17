import type { ReactElement } from 'react';
import { Text, Badge, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { Info16Regular, ArrowRight24Regular } from '@fluentui/react-icons';
import {
  PluginsIcon as BracesVariable24Regular,
  FlowsIcon as CloudFlow24Regular,
  BusinessRulesIcon as ClipboardTaskListLtr24Regular,
  ClassicWorkflowsIcon as ClipboardSettings24Regular,
} from '../componentIcons';
import { OperationBadge } from './OperationBadge';
import { MessagePipelineSteps } from './MessagePipelineSteps';
import type {
  CrossEntityEntityView,
  EntityAutomationPipeline,
  CrossEntityAnalysisResult,
  AutomationActivation,
  PipelineStep,
} from '../../core';

const TYPE_ICON_STYLE = { width: tokens.fontSizeBase200, height: tokens.fontSizeBase200, flexShrink: 0, verticalAlign: 'middle' } as const;

function typeIcon(type: AutomationActivation['automationType'] | PipelineStep['automationType']): ReactElement {
  switch (type) {
    case 'Plugin': return <BracesVariable24Regular style={TYPE_ICON_STYLE} />;
    case 'Flow': return <CloudFlow24Regular style={TYPE_ICON_STYLE} />;
    case 'BusinessRule': return <ClipboardTaskListLtr24Regular style={TYPE_ICON_STYLE} />;
    case 'ClassicWorkflow': return <ClipboardSettings24Regular style={TYPE_ICON_STYLE} />;
    default: return <ArrowRight24Regular style={TYPE_ICON_STYLE} />;
  }
}

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
  tinyBadge: { fontSize: tokens.fontSizeBase100 },
  actionInfoCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    padding: tokens.spacingVerticalS,
    paddingInline: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  actionInfoCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  actionInfoCardName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    minWidth: 0,
    wordBreak: 'break-word',
  },
  actionInfoCardSource: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  actionInfoCardApiName: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  actionInfoCardNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXXS,
  },
  actionInfoCardNoteIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
    marginTop: '2px',
  },
  actionInfoCardNoteText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
});

export function EntityPipelineRow({
  logicalName,
  view,
  pipeline,
  color,
  expanded,
  onToggle,
  analysis,
}: {
  logicalName: string;
  view: CrossEntityEntityView;
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
      {/* Header */}
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
            <Text weight="semibold">{view.entityDisplayName}</Text>
            <Text className={styles.entityLogicalName}>
              {logicalName}
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
            {view.traces.length > 1 && (
              <Badge appearance="tint" shape="rounded" color="informative">{view.traces.length} entry points</Badge>
            )}
          </div>


        </div>

        <Text className={styles.entityHeaderCount}>
          {expanded ? '▲' : '▼'} {totalSteps}
        </Text>
      </div>

      {/* Expanded body — pipeline-first: one section per message pipeline, inbound triggers as context */}
      {expanded && (
        <div className={styles.entityBody} style={{ borderLeft: `4px solid ${color}40` }}>
          {pipeline.messagePipelines.map((mp, mpi) => {
            // Inbound entry points from other entities that trigger this message on this entity
            const inboundTraces = view.traces.filter(t => t.entryPoint.operation === mp.message);
            // IDs of steps activated by at least one inbound entry point (WillFire or WillFireNoFilter)
            const triggeredStepIds = new Set(
              inboundTraces.flatMap(t =>
                t.activations
                  .filter(a => a.firingStatus !== 'WontFire')
                  .map(a => a.automationId)
              )
            );
            return (
              <div key={mp.message}>
                {mpi > 0 && <div className={styles.traceDivider} />}
                <div className={styles.traceSubHeader}>
                  <OperationBadge operation={mp.message} /> pipeline
                </div>
                <MessagePipelineSteps
                  mp={mp}
                  analysis={analysis}
                  color={color}
                  entityDisplayName={view.entityDisplayName}
                  triggeredStepIds={triggeredStepIds.size > 0 ? triggeredStepIds : undefined}
                  inboundTraces={inboundTraces.length > 0 ? inboundTraces : undefined}
                />
              </div>
            );
          })}

          {/* Custom Action Triggers — entry points with operation === 'Action' are never matched
              by any MessagePipeline.message ('Create'|'Update'|'Delete'|'Manual'), so they must
              be surfaced in a dedicated section. */}
          {(() => {
            const actionTraces = view.traces.filter(t => t.entryPoint.operation === 'Action');
            if (actionTraces.length === 0) return null;
            return (
              <>
                <div className={styles.traceDivider} />
                <div className={styles.traceSubHeader}>
                  <OperationBadge operation="Action" /> Custom Action triggers
                </div>
                {actionTraces.map((t, i) => (
                  <div key={`action-${i}`} className={styles.actionInfoCard}>
                    <div className={styles.actionInfoCardHeader}>
                      {typeIcon(t.entryPoint.automationType)}
                      <Text className={styles.actionInfoCardName}>{t.entryPoint.automationName}</Text>
                      <Badge appearance="outline" shape="rounded" color="informative" className={styles.tinyBadge}>
                        {t.entryPoint.automationType}
                      </Badge>
                    </div>
                    <Text className={styles.actionInfoCardSource}>
                      Source entity: {t.entryPoint.sourceEntityDisplayName}
                    </Text>
                    {t.entryPoint.customActionApiName && (
                      <Text className={styles.actionInfoCardApiName}>
                        via <code>{t.entryPoint.customActionApiName}</code>
                      </Text>
                    )}
                    <div className={styles.actionInfoCardNote}>
                      <Info16Regular className={styles.actionInfoCardNoteIcon} />
                      <Text className={styles.actionInfoCardNoteText}>
                        Internal effects on this entity&apos;s pipeline are unknown — custom action
                        logic is not statically analysed.
                      </Text>
                    </div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
