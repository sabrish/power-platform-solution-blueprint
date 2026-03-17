import { useState } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { OperationBadge } from './OperationBadge';
import { TracePipeline } from './TracePipeline';
import type { CrossEntityEntityView, CrossEntityTrace, CrossEntityAnalysisResult } from '../../core';

// No tokens exist for these values; named constants keep them findable and self-documenting.
// CHILD_SECTION_INDENT is the visual depth step per nested entity level.
const CHILD_SECTION_INDENT = '24px';
// CHILD_SECTION_TOP_NUDGE is a small optical alignment offset between the connector arrow and section header.
const CHILD_SECTION_TOP_NUDGE = '3px';

const useStyles = makeStyles({
  childSection: { marginLeft: CHILD_SECTION_INDENT, marginTop: CHILD_SECTION_TOP_NUDGE, marginBottom: tokens.spacingVerticalXS },
  childHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderLeft: `3px solid transparent`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  childSteps: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS} ${tokens.spacingVerticalS}`,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderTop: 'none',
    borderLeft: '3px solid transparent',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  returnMarker: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM} ${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalL}`,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    borderLeft: '2px solid transparent',
    marginTop: '-1px',
  },
  childArrow: { fontSize: tokens.fontSizeBase100 },
  childEntityName: { fontSize: tokens.fontSizeBase300 },
  childLogicalName: { fontFamily: 'monospace', fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },
  childStepCount: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },
});

export function ChildEntitySection({
  entityView,
  trace,
  analysis,
  depth,
  accentColor,
  parentDisplayName,
}: {
  entityView: CrossEntityEntityView;
  trace: CrossEntityTrace;
  analysis: CrossEntityAnalysisResult;
  depth: number;
  accentColor: string;
  parentDisplayName: string;
}): JSX.Element {
  const styles = useStyles();
  const [open, setOpen] = useState(true);

  const willFire = trace.activations.filter(a => a.firingStatus !== 'WontFire');
  const stepCount = trace.activations.length;

  return (
    <div className={styles.childSection}>
      <div
        className={styles.childHeader}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        style={{ borderLeft: `3px solid ${accentColor}`, borderColor: `${accentColor}` }}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}
      >
        <span className={styles.childArrow} style={{ color: accentColor }}>&#8627;</span>
        <Text weight="semibold" className={styles.childEntityName}>{entityView.entityDisplayName}</Text>
        <Text className={styles.childLogicalName}>
          {entityView.entityLogicalName}
        </Text>
        <OperationBadge operation={trace.entryPoint.operation} />
        <Text className={styles.childStepCount}>
          {willFire.length} step{willFire.length !== 1 ? 's' : ''} &bull; {open ? '▲' : `▶ expand (${stepCount})`}
        </Text>
      </div>

      {open && (
        <div className={styles.childSteps} style={{ borderLeft: `3px solid ${accentColor}40` }}>
          <TracePipeline
            trace={trace}
            analysis={analysis}
            depth={depth}
            parentEntityDisplayName={entityView.entityDisplayName}
          />
        </div>
      )}

      <div className={styles.returnMarker} style={{ borderLeft: `2px solid ${accentColor}40` }}>
        &#8617; back to {parentDisplayName}
      </div>
    </div>
  );
}
