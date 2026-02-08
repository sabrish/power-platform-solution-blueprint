import {
  makeStyles,
  tokens,
  Text,
  Button,
  Title3,
} from '@fluentui/react-components';
import { ErrorCircle24Regular, ArrowClockwise24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    gap: tokens.spacingVerticalL,
    textAlign: 'center',
    minHeight: '300px',
  },
  icon: {
    color: tokens.colorPaletteRedBackground3,
    fontSize: '64px',
  },
  title: {
    color: tokens.colorNeutralForeground1,
  },
  message: {
    color: tokens.colorNeutralForeground3,
    maxWidth: '500px',
  },
  details: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    maxWidth: '600px',
    overflowX: 'auto',
    wordBreak: 'break-word',
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
});

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data. Please try again.',
  error,
  onRetry,
  showDetails = false,
}: ErrorStateProps) {
  const styles = useStyles();

  const errorDetails = error
    ? typeof error === 'string'
      ? error
      : error.message || String(error)
    : null;

  return (
    <div className={styles.container}>
      <ErrorCircle24Regular className={styles.icon} />
      <Title3 className={styles.title}>{title}</Title3>
      <Text className={styles.message}>{message}</Text>

      {showDetails && errorDetails && (
        <div className={styles.details}>
          <strong>Error details:</strong>
          <br />
          {errorDetails}
        </div>
      )}

      {onRetry && (
        <div className={styles.actions}>
          <Button
            appearance="primary"
            icon={<ArrowClockwise24Regular />}
            onClick={onRetry}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
