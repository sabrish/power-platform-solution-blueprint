import { useEffect, useRef } from 'react';
import {
  Text,
  Title2,
  Button,
  ProgressBar,
  Spinner,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircle16Regular,
  ErrorCircle16Regular,
  ArrowCounterclockwise16Regular,
  ArrowDown16Regular,
  Record16Regular,
  Beaker16Regular,
} from '@fluentui/react-icons';
import type { ProgressInfo, FetchLogEntry } from '../core';
import { Footer } from './Footer';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXXL,
    width: '95%',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    boxSizing: 'border-box',
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
  fetchFeed: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '180px',
    overflowY: 'auto',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  fetchHint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center' as const,
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
  recentFetches?: FetchLogEntry[];
  onCancel: () => void;
  isCancelling?: boolean;
}

export function ProcessingScreen({ progress, recentFetches = [], onCancel, isCancelling = false }: ProcessingScreenProps) {
  const styles = useStyles();
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the fetch feed to the bottom as new entries arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [recentFetches]);

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

  const failedCount = recentFetches.filter(e => e.status === 'failed').length;
  const retriedCount = recentFetches.filter(e => e.status === 'retried' || e.status === 'batch-reduced').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title2>Generating Solution Blueprint</Title2>
      </div>

      <div className={styles.progressSection}>
        <ProgressBar value={percentage / 100} />
        <Text className={styles.progressText}>
          {progress.current} of {progress.total} {componentLabel} processed ({Math.round(percentage)}%)
        </Text>
      </div>

      {isCancelling && (
        <div className={styles.currentActivity}>
          <Spinner size="small" />
          <Text weight="semibold">Cancelling, please wait...</Text>
        </div>
      )}

      {!isCancelling && progress.phase !== 'discovering' && (
        <div className={styles.currentActivity}>
          <Spinner size="tiny" />
          <Text weight="semibold">{progress.message}</Text>
        </div>
      )}

      {!isCancelling && progress.phase === 'discovering' && (
        <div className={styles.currentActivity}>
          <Spinner size="small" />
          <Text weight="semibold">{progress.message}</Text>
        </div>
      )}

      {recentFetches.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
              API Calls
            </Text>
            {failedCount > 0 && <Badge color="danger" shape="rounded" size="small">{failedCount} failed</Badge>}
            {retriedCount > 0 && failedCount === 0 && <Badge color="warning" shape="rounded" size="small">{retriedCount} retried</Badge>}
          </div>
          <div className={styles.fetchFeed} ref={feedRef}>
            {recentFetches.slice(-20).map(entry => {
              const isError = entry.status === 'failed';
              const isWarning = entry.status === 'retried' || entry.status === 'batch-reduced';
              const StatusIcon = entry.status === 'success' ? CheckmarkCircle16Regular
                : entry.status === 'failed' ? ErrorCircle16Regular
                : entry.status === 'retried' ? ArrowCounterclockwise16Regular
                : entry.status === 'batch-reduced' ? ArrowDown16Regular
                : Record16Regular;
              const batchLabel = entry.batchTotal > 0
                ? `[${entry.batchIndex + 1}/${entry.batchTotal}]`
                : `#${entry.batchIndex + 1}`;
              const suffix = entry.resultCount !== undefined
                ? ` — ${entry.durationMs}ms, ${entry.resultCount} records`
                : ` — ${entry.durationMs}ms`;

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '14px 130px 1fr auto',
                    gap: '6px',
                    alignItems: 'baseline',
                    padding: '1px 0',
                    fontFamily: 'var(--fontFamilyMonospace, monospace)',
                    fontSize: tokens.fontSizeBase200,
                    lineHeight: '1.5',
                    color: isError
                      ? 'var(--colorStatusDangerForeground1)'
                      : isWarning
                      ? 'var(--colorStatusWarningForeground1)'
                      : 'var(--colorNeutralForeground2)',
                  }}
                >
                  <StatusIcon style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ color: 'var(--colorNeutralForeground3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.step}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.filterSummary && entry.filterSummary !== entry.entitySet
                      ? entry.filterSummary
                      : entry.entitySet}
                    {entry.errorMessage && ` — ${entry.errorMessage}`}
                  </span>
                  <span style={{ color: 'var(--colorNeutralForeground3)', whiteSpace: 'nowrap' }}>
                    {batchLabel}{suffix}
                  </span>
                </div>
              );
            })}
          </div>
          <Text className={styles.fetchHint}>
            <Beaker16Regular style={{ verticalAlign: 'middle', marginRight: tokens.spacingHorizontalXS }} />
            Full API call log available in the <strong>Fetch Log</strong> tab once generation completes.
          </Text>
        </>
      )}

      <div className={styles.buttonContainer}>
        <Button appearance="secondary" onClick={onCancel} disabled={isCancelling}>
          Cancel
        </Button>
      </div>

      <Footer />
    </div>
  );
}
