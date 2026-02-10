import {
  Card,
  Title2,
  Title3,
  Text,
  Badge,
  makeStyles,
  tokens,
  Button,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import type { Flow } from '../core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flex: 1,
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  metadataLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  metadataValue: {
    fontWeight: tokens.fontWeightSemibold,
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  externalCallItem: {
    padding: tokens.spacingVerticalS,
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  codeText: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
});

interface FlowDetailViewProps {
  flow: Flow;
  onClose?: () => void;
}

export function FlowDetailView({ flow, onClose }: FlowDetailViewProps) {
  const styles = useStyles();

  const getStateBadgeProps = (state: Flow['state']) => {
    switch (state) {
      case 'Active':
        return { appearance: 'filled' as const, color: 'success' as const };
      case 'Draft':
        return { appearance: 'filled' as const, color: 'warning' as const };
      case 'Suspended':
        return { appearance: 'filled' as const, color: 'danger' as const };
      default:
        return { appearance: 'outline' as const, color: 'subtle' as const };
    }
  };

  const stateBadgeProps = getStateBadgeProps(flow.state);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Title2>{flow.name}</Title2>
          {flow.description && (
            <Text className={styles.wrapText} style={{ color: tokens.colorNeutralForeground2 }}>
              {flow.description}
            </Text>
          )}
        </div>
        {onClose && (
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            onClick={onClose}
            aria-label="Close"
          />
        )}
      </div>

      {/* Status Badges */}
      <div className={styles.badges}>
        <Badge {...stateBadgeProps}>{flow.state}</Badge>
        <Badge appearance="tint" color="brand">
          {flow.definition.triggerType}
        </Badge>
        {flow.definition.triggerEvent !== 'Unknown' && flow.definition.triggerEvent !== flow.definition.triggerType && (
          <Badge appearance="outline">
            {flow.definition.triggerEvent}
          </Badge>
        )}
        <Badge appearance="outline">{flow.scopeName}</Badge>
      </div>

      {/* Metadata */}
      <Card>
        <Title3>Flow Details</Title3>
        <div className={styles.metadataGrid}>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Entity</Text>
            <Text className={styles.metadataValue}>
              {flow.entityDisplayName || flow.entity || 'None'}
            </Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Owner</Text>
            <Text className={styles.metadataValue}>{flow.owner}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Modified By</Text>
            <Text className={styles.metadataValue}>{flow.modifiedBy}</Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Modified On</Text>
            <Text className={styles.metadataValue}>
              {new Date(flow.modifiedOn).toLocaleString()}
            </Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Created On</Text>
            <Text className={styles.metadataValue}>
              {new Date(flow.createdOn).toLocaleString()}
            </Text>
          </div>
          <div className={styles.metadataItem}>
            <Text className={styles.metadataLabel}>Actions Count</Text>
            <Text className={styles.metadataValue}>{flow.definition.actionsCount}</Text>
          </div>
        </div>
      </Card>

      {/* Trigger Details */}
      {flow.definition.triggerConditions && (
        <Card>
          <div className={styles.section}>
            <Title3>Trigger Conditions</Title3>
            <div className={styles.externalCallItem}>
              <Text className={styles.codeText}>{flow.definition.triggerConditions}</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Connection References */}
      {flow.definition.connectionReferences.length > 0 && (
        <Card>
          <div className={styles.section}>
            <Title3>Connectors ({flow.definition.connectionReferences.length})</Title3>
            <div className={styles.badges}>
              {flow.definition.connectionReferences.map((ref, idx) => (
                <Badge key={idx} appearance="tint" size="medium">
                  {ref}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* External Calls */}
      {flow.definition.externalCalls.length > 0 && (
        <Card>
          <div className={styles.section}>
            <Title3>External API Calls ({flow.definition.externalCalls.length})</Title3>
            {flow.definition.externalCalls.map((call, idx) => (
              <div key={idx} className={styles.externalCallItem}>
                <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}>
                  <Text weight="semibold">{call.actionName}</Text>
                  <Badge appearance="outline" size="small">
                    {call.method || 'UNKNOWN'}
                  </Badge>
                  <Badge
                    appearance="tint"
                    color={call.confidence === 'High' ? 'success' : call.confidence === 'Medium' ? 'warning' : 'subtle'}
                    size="small"
                  >
                    {call.confidence} confidence
                  </Badge>
                </div>
                <Text className={styles.codeText}>{call.url}</Text>
                <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                  Domain: {call.domain}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Technical Details */}
      <Card>
        <div className={styles.section}>
          <Title3>Technical Details</Title3>
          <div className={styles.metadataGrid}>
            <div className={styles.metadataItem}>
              <Text className={styles.metadataLabel}>Flow ID</Text>
              <Text className={styles.codeText}>{flow.id}</Text>
            </div>
            <div className={styles.metadataItem}>
              <Text className={styles.metadataLabel}>Owner ID</Text>
              <Text className={styles.codeText}>{flow.ownerId}</Text>
            </div>
            <div className={styles.metadataItem}>
              <Text className={styles.metadataLabel}>State Code</Text>
              <Text className={styles.metadataValue}>{flow.stateCode}</Text>
            </div>
            <div className={styles.metadataItem}>
              <Text className={styles.metadataLabel}>Scope Value</Text>
              <Text className={styles.metadataValue}>{flow.scope}</Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
