import { Badge, Text, makeStyles, tokens } from '@fluentui/react-components';
import { Warning24Regular, ErrorCircle24Regular } from '@fluentui/react-icons';
import type { BlueprintResult } from '../../core';

const useStyles = makeStyles({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorStatusWarningBorderActive}`,
    backgroundColor: tokens.colorStatusWarningBackground1,
  },
  panelError: {
    border: `1px solid ${tokens.colorStatusDangerBorderActive}`,
    backgroundColor: tokens.colorStatusDangerBackground1,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  warningRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
  },
  warningStep: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    minWidth: '110px',
    fontWeight: tokens.fontWeightSemibold,
  },
  warningMessage: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  hint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export interface StepWarningsPanelProps {
  stepWarnings: NonNullable<BlueprintResult['stepWarnings']>;
}

export function StepWarningsPanel({ stepWarnings }: StepWarningsPanelProps): JSX.Element {
  const styles = useStyles();
  const hasFullFailures = stepWarnings.some((w) => !w.partial);

  return (
    <div className={`${styles.panel}${hasFullFailures ? ` ${styles.panelError}` : ''}`}>
      <div className={styles.headerRow}>
        {hasFullFailures ? (
          <ErrorCircle24Regular style={{ color: tokens.colorStatusDangerForeground1, flexShrink: 0 }} />
        ) : (
          <Warning24Regular style={{ color: tokens.colorStatusWarningForeground1, flexShrink: 0 }} />
        )}
        <Text
          weight="semibold"
          style={{
            color: hasFullFailures
              ? tokens.colorStatusDangerForeground1
              : tokens.colorStatusWarningForeground1,
          }}
        >
          {hasFullFailures ? 'Some components could not be loaded' : 'Some data may be incomplete'}
        </Text>
        <Badge color="danger" shape="rounded" size="small" style={{ marginLeft: 'auto' }}>
          {stepWarnings.length} {stepWarnings.length === 1 ? 'issue' : 'issues'}
        </Badge>
      </div>

      {stepWarnings.map((w, i) => (
        <div key={i} className={styles.warningRow}>
          <Text className={styles.warningStep}>{w.step}</Text>
          <Text className={styles.warningMessage}>{w.message}</Text>
        </div>
      ))}

      <Text className={styles.hint}>
        Open the <strong>Fetch Log</strong> tab for full API call details.
      </Text>
    </div>
  );
}
