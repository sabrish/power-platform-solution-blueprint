import { useState, type ReactElement } from 'react';
import { Text, Button, Badge, makeStyles, tokens } from '@fluentui/react-components';
import { Info16Regular, ArrowRight24Regular } from '@fluentui/react-icons';
import {
  PluginsIcon as BracesVariable24Regular,
  FlowsIcon as CloudFlow24Regular,
  BusinessRulesIcon as ClipboardTaskListLtr24Regular,
  ClassicWorkflowsIcon as ClipboardSettings24Regular,
} from '../componentIcons';
import { StepBlock } from './StepBlock';
import type { CrossEntityTrace, CrossEntityAnalysisResult, AutomationActivation, PipelineStep } from '../../core';

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
  emptyPipelineText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalS,
  },
  wontFireBtnWrapper: {
    width: '100%',
    marginTop: tokens.spacingVerticalXXS,
    display: 'flex',
  },
  wontFireItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
  },
  wontFireItemName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase100,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  wontFireItemStage: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },
  wontFireItemFilter: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tinyBadge: { fontSize: tokens.fontSizeBase100 },
  entryFieldsRow: {
    marginTop: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  entryFieldPill: {
    fontFamily: 'monospace',
    marginRight: tokens.spacingHorizontalXS,
  },
});

export function TracePipeline({
  trace,
  analysis,
  depth,
  parentEntityDisplayName,
}: {
  trace: CrossEntityTrace;
  analysis: CrossEntityAnalysisResult;
  depth: number;
  parentEntityDisplayName: string;
}): JSX.Element {
  const styles = useStyles();
  const [showWontFire, setShowWontFire] = useState(false);

  const willFire = trace.activations.filter(a => a.firingStatus !== 'WontFire');
  const wontFire = trace.activations.filter(a => a.firingStatus === 'WontFire');

  return (
    <div>
      {/* Custom action informational note */}
      {trace.entryPoint.operation === 'Action' && (
        <div className={styles.entryFieldsRow} style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacingHorizontalXS }}>
          <Info16Regular style={{ color: tokens.colorBrandForeground1, flexShrink: 0, marginTop: tokens.spacingVerticalXXS }} />
          <Text size={200} style={{ fontStyle: 'italic' }}>
            This entry point calls a bound custom action
            {trace.entryPoint.customActionApiName ? ` (${trace.entryPoint.customActionApiName})` : ''}.
            The action&apos;s internal effects on this entity are not analysed — plugins registered on the
            action&apos;s message may also fire.
          </Text>
        </div>
      )}

      {/* Numbered steps that will fire */}
      {willFire.map((act, i) => (
        <StepBlock
          key={act.automationId + i}
          stepNum={i + 1}
          activation={act}
          trace={trace}
          analysis={analysis}
          depth={depth}
          parentEntityDisplayName={parentEntityDisplayName}
        />
      ))}

      {willFire.length === 0 && (
        <Text className={styles.emptyPipelineText}>
          {trace.entryPoint.operation === 'Action'
            ? 'No CRUD-registered automations detected for this custom action call. See note above.'
            : 'No automations registered on this entity for this message.'}
        </Text>
      )}

      {/* Won't fire — collapsed section */}
      {wontFire.length > 0 && (
        <>
          <div className={styles.wontFireBtnWrapper}>
            <Button appearance="subtle" size="small" onClick={() => setShowWontFire(s => !s)}>
              {showWontFire ? '▲' : '▼'} {wontFire.length} automation{wontFire.length !== 1 ? 's' : ''} won't fire for this entry point
            </Button>
          </div>
          {showWontFire && wontFire.map((act, i) => (
            <div key={i} className={styles.wontFireItem}>
              <span>{typeIcon(act.automationType)}</span>
              <Badge appearance="outline" shape="rounded" color="informative" className={styles.tinyBadge}>{act.automationType}</Badge>
              <Text className={styles.wontFireItemName}>
                {act.automationName}
              </Text>
              {act.stageName && (
                <Text className={styles.wontFireItemStage}>{act.stageName}</Text>
              )}
              {act.filteringAttributes.length > 0 && (
                <Text className={styles.wontFireItemFilter}>
                  — filter: {act.filteringAttributes.join(', ')} (not in [{trace.entryPoint.fields.join(', ')}])
                </Text>
              )}
            </div>
          ))}
        </>
      )}

      {/* Entry point field context */}
      {trace.entryPoint.fields.length > 0 && (
        <div className={styles.entryFieldsRow}>
          Entry fields: {trace.entryPoint.fields.slice(0, 8).map(f => (
            <span key={f} className={styles.entryFieldPill}>{f}</span>
          ))}
          {trace.entryPoint.fields.length > 8 && <span>+{trace.entryPoint.fields.length - 8} more</span>}
        </div>
      )}
    </div>
  );
}
