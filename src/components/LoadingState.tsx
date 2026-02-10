import {
  makeStyles,
  tokens,
  Text,
  Spinner,
  Skeleton,
  SkeletonItem,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    gap: tokens.spacingVerticalL,
    minHeight: '300px',
  },
  message: {
    color: tokens.colorNeutralForeground3,
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    padding: tokens.spacingVerticalL,
  },
  skeletonRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
  },
});

export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <Spinner size="large" />
      <Text className={styles.message}>{message}</Text>
    </div>
  );
}

export interface SkeletonListProps {
  rows?: number;
}

export function SkeletonList({ rows = 5 }: SkeletonListProps) {
  const styles = useStyles();

  return (
    <div className={styles.skeletonContainer}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={styles.skeletonRow}>
          <Skeleton>
            <SkeletonItem size={32} />
          </Skeleton>
          <Skeleton style={{ flex: 1 }}>
            <SkeletonItem />
          </Skeleton>
        </div>
      ))}
    </div>
  );
}

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  const styles = useStyles();

  return (
    <div className={styles.skeletonContainer}>
      {/* Header */}
      <div className={styles.skeletonRow}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`header-${colIndex}`} style={{ flex: 1 }}>
            <SkeletonItem size={24} />
          </Skeleton>
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={styles.skeletonRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`row-${rowIndex}-col-${colIndex}`} style={{ flex: 1 }}>
              <SkeletonItem size={20} />
            </Skeleton>
          ))}
        </div>
      ))}
    </div>
  );
}
