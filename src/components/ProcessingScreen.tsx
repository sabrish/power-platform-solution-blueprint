import {
  Text,
  Title2,
  Button,
  ProgressBar,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ArrowClockwise24Regular } from '@fluentui/react-icons';
import type { ProgressInfo } from '../core';
import { Footer } from './Footer';
import { ThemeToggle } from './ThemeToggle';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXXL,
    width: '95%',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    '@media (max-width: 768px)': {
      width: '100%',
      padding: tokens.spacingVerticalL,
    },
  },
  header: {
    textAlign: 'center',
    position: 'relative',
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  currentActivity: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  activityLog: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    maxHeight: '200px',
    overflowY: 'auto',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
  },
  completedIcon: {
    color: tokens.colorPaletteGreenForeground1,
    flexShrink: 0,
  },
  processingIcon: {
    flexShrink: 0,
  },
  progressText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: tokens.spacingVerticalL,
  },
});

export interface ProcessingScreenProps {
  progress: ProgressInfo;
  onCancel: () => void;
}

export function ProcessingScreen({ progress, onCancel }: ProcessingScreenProps) {
  const styles = useStyles();

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  // Get component type label based on phase
  const getComponentLabel = (phase: ProgressInfo['phase']): string => {
    switch (phase) {
      case 'schema':
        return 'entities';
      case 'plugins':
        return 'plugins';
      case 'flows':
        return 'flows';
      case 'business-rules':
        return 'business rules';
      default:
        return 'items';
    }
  };

  const componentLabel = getComponentLabel(progress.phase);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title2>Generating Solution Blueprint</Title2>
        <div className={styles.themeToggleContainer}>
          <ThemeToggle />
        </div>
      </div>

      <div className={styles.progressSection}>
        <ProgressBar value={percentage / 100} />
        <Text className={styles.progressText}>
          {progress.current} of {progress.total} {componentLabel} processed ({Math.round(percentage)}%)
        </Text>
      </div>

      {progress.phase !== 'discovering' && (
        <div className={styles.currentActivity}>
          <ArrowClockwise24Regular className={styles.processingIcon} />
          <Spinner size="tiny" />
          <Text weight="semibold">{progress.message}</Text>
        </div>
      )}

      {progress.phase === 'discovering' && (
        <div className={styles.currentActivity}>
          <Spinner size="small" />
          <Text weight="semibold">{progress.message}</Text>
        </div>
      )}

      <div className={styles.buttonContainer}>
        <Button appearance="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <Footer />
    </div>
  );
}
