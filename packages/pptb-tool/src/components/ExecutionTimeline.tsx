import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Tooltip,
} from '@fluentui/react-components';
import {
  ArrowRight20Regular,
  CheckmarkCircle20Regular,
  Globe20Regular,
} from '@fluentui/react-icons';
import type { ExecutionPipeline, ExecutionStep } from '@ppsb/core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    paddingBottom: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalXL,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: '80px',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  stepName: {
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stepMeta: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  emptyState: {
    padding: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  stageGroup: {
    marginBottom: tokens.spacingVerticalM,
  },
  stageLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
  },
  connector: {
    width: '2px',
    height: '12px',
    backgroundColor: tokens.colorNeutralStroke2,
    marginLeft: '39px',
  },
});

export interface ExecutionTimelineProps {
  pipeline: ExecutionPipeline;
}

export function ExecutionTimeline({ pipeline }: ExecutionTimelineProps) {
  const styles = useStyles();

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'Plugin':
        return '⚙️';
      case 'Flow':
        return '⚡';
      case 'BusinessRule':
        return '📋';
      case 'JavaScript':
        return '📜';
      default:
        return '•';
    }
  };

  const getStepTypeBadge = (type: string) => {
    switch (type) {
      case 'Plugin':
        return <Badge appearance="tint" color="brand" size="small">Plugin</Badge>;
      case 'Flow':
        return <Badge appearance="tint" color="informative" size="small">Flow</Badge>;
      case 'BusinessRule':
        return <Badge appearance="tint" color="success" size="small">Business Rule</Badge>;
      case 'JavaScript':
        return <Badge appearance="tint" color="warning" size="small">JavaScript</Badge>;
      default:
        return null;
    }
  };

  const getStageLabel = (stage?: number): string => {
    switch (stage) {
      case 10:
        return 'Stage 10';
      case 20:
        return 'Stage 20';
      case 30:
        return 'Stage 30';
      case 40:
        return 'Stage 40';
      default:
        return stage ? `Stage ${stage}` : '';
    }
  };

  const renderStep = (step: ExecutionStep, showStage: boolean = false) => (
    <div key={step.id} className={styles.step}>
      <div className={styles.stepIndicator}>
        <Text size={300} style={{ fontFamily: 'monospace' }}>
          {step.order}.
        </Text>
        <Text size={300}>{getStepTypeIcon(step.type)}</Text>
      </div>

      <div className={styles.stepContent}>
        <Text className={styles.stepName}>{step.name}</Text>
        <div className={styles.stepMeta}>
          {showStage && step.stage && <Text>{getStageLabel(step.stage)}</Text>}
          {step.rank !== undefined && <Text>Rank: {step.rank}</Text>}
          {step.description && (
            <Tooltip content={step.description} relationship="description">
              <Text>ℹ️</Text>
            </Tooltip>
          )}
        </div>
      </div>

      <div className={styles.badges}>
        {getStepTypeBadge(step.type)}
        {step.mode === 'Sync' && <Badge appearance="filled" color="danger" size="small">Sync</Badge>}
        {step.mode === 'Async' && <Badge appearance="filled" color="success" size="small">Async</Badge>}
        {step.hasExternalCall && (
          <Tooltip content={`External: ${step.externalEndpoints?.join(', ')}`} relationship="description">
            <Badge appearance="filled" color="warning" size="small" icon={<Globe20Regular />}>
              External
            </Badge>
          </Tooltip>
        )}
      </div>
    </div>
  );

  const renderSteps = (steps: ExecutionStep[], showStage: boolean = false) => {
    if (steps.length === 0) {
      return <div className={styles.emptyState}>No steps in this stage</div>;
    }

    return (
      <div className={styles.timeline}>
        {steps.map((step) => renderStep(step, showStage))}
      </div>
    );
  };

  const totalSyncSteps =
    pipeline.clientSide.length +
    pipeline.serverSideSync.preValidation.length +
    pipeline.serverSideSync.preOperation.length +
    pipeline.serverSideSync.mainOperation.length +
    pipeline.serverSideSync.postOperation.length;

  return (
    <div className={styles.container}>
      {/* Client-Side Execution */}
      {pipeline.clientSide.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text size={500} weight="semibold">Client-Side Execution</Text>
            <Badge appearance="tint" size="small">{pipeline.clientSide.length} steps</Badge>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              Executes in browser before server request
            </Text>
          </div>
          {renderSteps(pipeline.clientSide)}
        </div>
      )}

      {/* Server-Side Synchronous */}
      {totalSyncSteps > 0 && (
        <>
          {pipeline.clientSide.length > 0 && <div className={styles.connector} />}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Text size={500} weight="semibold">Server-Side Synchronous</Text>
              <Badge appearance="tint" color="danger" size="small">{totalSyncSteps} steps</Badge>
              <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                Blocks user transaction
              </Text>
            </div>

            {/* PreValidation */}
            {pipeline.serverSideSync.preValidation.length > 0 && (
              <div className={styles.stageGroup}>
                <div className={styles.stageLabel}>
                  <ArrowRight20Regular />
                  <Text weight="semibold">PreValidation (Stage 10)</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Before security checks
                  </Text>
                </div>
                {renderSteps(pipeline.serverSideSync.preValidation, true)}
              </div>
            )}

            {/* PreOperation */}
            {pipeline.serverSideSync.preOperation.length > 0 && (
              <div className={styles.stageGroup}>
                <div className={styles.stageLabel}>
                  <ArrowRight20Regular />
                  <Text weight="semibold">PreOperation (Stage 20)</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Before database operation
                  </Text>
                </div>
                {renderSteps(pipeline.serverSideSync.preOperation, true)}
              </div>
            )}

            {/* MainOperation */}
            {pipeline.serverSideSync.mainOperation.length > 0 && (
              <div className={styles.stageGroup}>
                <div className={styles.stageLabel}>
                  <CheckmarkCircle20Regular />
                  <Text weight="semibold">MainOperation (Stage 30)</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Database operation happens here
                  </Text>
                </div>
                {renderSteps(pipeline.serverSideSync.mainOperation, true)}
              </div>
            )}

            {/* PostOperation */}
            {pipeline.serverSideSync.postOperation.length > 0 && (
              <div className={styles.stageGroup}>
                <div className={styles.stageLabel}>
                  <ArrowRight20Regular />
                  <Text weight="semibold">PostOperation (Stage 40)</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    After database operation, in transaction
                  </Text>
                </div>
                {renderSteps(pipeline.serverSideSync.postOperation, true)}
              </div>
            )}
          </div>
        </>
      )}

      {/* Server-Side Asynchronous */}
      {pipeline.serverSideAsync.length > 0 && (
        <>
          {totalSyncSteps > 0 && <div className={styles.connector} />}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Text size={500} weight="semibold">Server-Side Asynchronous</Text>
              <Badge appearance="tint" color="success" size="small">{pipeline.serverSideAsync.length} steps</Badge>
              <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                Executes after transaction completes
              </Text>
            </div>
            {renderSteps(pipeline.serverSideAsync)}
          </div>
        </>
      )}
    </div>
  );
}
