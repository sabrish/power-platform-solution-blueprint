import { Spinner, makeStyles, tokens } from '@fluentui/react-components';
import type { ExportProgress } from '@ppsb/core';

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalXXL,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow64,
    minWidth: '400px',
    textAlign: 'center',
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground1,
  },
  spinnerContainer: {
    marginBottom: tokens.spacingVerticalL,
  },
  phase: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalS,
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    overflow: 'hidden',
    marginBottom: tokens.spacingVerticalM,
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colorBrandBackground,
    transition: 'width 0.3s ease',
  },
  message: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  progressText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
});

export interface ExportProgressOverlayProps {
  progress: ExportProgress;
  onCancel?: () => void;
}

/**
 * Full-screen overlay showing export progress
 */
export function ExportProgressOverlay({ progress, onCancel }: ExportProgressOverlayProps) {
  const styles = useStyles();

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.title}>Exporting Solution Blueprint</div>

        <div className={styles.spinnerContainer}>
          <Spinner size="extra-large" />
        </div>

        <div className={styles.phase}>{progress.phase}</div>

        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>

        <div className={styles.message}>{progress.message}</div>

        {progress.total > 0 && (
          <div className={styles.progressText}>
            {progress.current} of {progress.total}
          </div>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              marginTop: tokens.spacingVerticalL,
              padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
              backgroundColor: 'transparent',
              border: `1px solid ${tokens.colorNeutralStroke1}`,
              borderRadius: tokens.borderRadiusMedium,
              color: tokens.colorNeutralForeground1,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
