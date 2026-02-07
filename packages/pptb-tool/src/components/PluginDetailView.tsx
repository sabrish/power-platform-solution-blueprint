import {
  Button,
  Title2,
  Title3,
  Text,
  Card,
  Badge,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Dismiss24Regular, Copy24Regular } from '@fluentui/react-icons';
import type { PluginStep } from '@ppsb/core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalXL,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalM,
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  badgeRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  rankBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  infoRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalXS,
  },
  label: {
    minWidth: '150px',
    fontWeight: tokens.fontWeightSemibold,
  },
  value: {
    flex: 1,
  },
  attributeList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  warningBadge: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
    color: tokens.colorPaletteYellowForeground1,
  },
});

export interface PluginDetailViewProps {
  plugin: PluginStep;
  onClose?: () => void;
}

export function PluginDetailView({ plugin, onClose }: PluginDetailViewProps) {
  const styles = useStyles();

  const getStageBadgeColor = (stage: number): string => {
    const stageColors: Record<number, string> = {
      10: '#0078D4',
      20: '#2B579A',
      40: '#107C10',
      50: '#5C2D91',
    };
    return stageColors[stage] || tokens.colorNeutralForeground3;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
            <div className={styles.rankBadge}>{plugin.rank}</div>
            <Title2>{plugin.name}</Title2>
          </div>
          <div className={styles.badgeRow}>
            <Badge
              appearance="filled"
              size="large"
              style={{
                backgroundColor: getStageBadgeColor(plugin.stage),
                color: 'white',
              }}
            >
              {plugin.stageName}
            </Badge>
            <Badge appearance={plugin.mode === 0 ? 'outline' : 'filled'} color={plugin.mode === 0 ? 'brand' : 'important'} size="large">
              {plugin.modeName}
            </Badge>
          </div>
        </div>
        {onClose && (
          <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={onClose} />
        )}
      </div>

      {/* Basic Information */}
      <Card>
        <Title3>Basic Information</Title3>
        <div className={styles.section}>
          <div className={styles.infoRow}>
            <Text className={styles.label}>Message:</Text>
            <Text className={styles.value} weight="semibold">{plugin.message}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text className={styles.label}>Entity:</Text>
            <Text className={styles.value}>{plugin.entity}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text className={styles.label}>Assembly:</Text>
            <Text className={styles.value}>{plugin.assemblyName}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text className={styles.label}>Type:</Text>
            <Text className={styles.value}>{plugin.typeName}</Text>
          </div>
          {plugin.description && (
            <div className={styles.infoRow}>
              <Text className={styles.label}>Description:</Text>
              <Text className={styles.value}>{plugin.description}</Text>
            </div>
          )}
          <div className={styles.infoRow}>
            <Text className={styles.label}>Plugin Type ID:</Text>
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}>
              <Text className={styles.value}>{plugin.pluginTypeId}</Text>
              <Button
                appearance="subtle"
                size="small"
                icon={<Copy24Regular />}
                onClick={() => copyToClipboard(plugin.pluginTypeId)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Execution Details */}
      <Card>
        <Title3>Execution Details</Title3>
        <div className={styles.section}>
          <div className={styles.infoRow}>
            <Text className={styles.label}>Stage:</Text>
            <Text className={styles.value}>{plugin.stageName} ({plugin.stage})</Text>
          </div>
          <div className={styles.infoRow}>
            <Text className={styles.label}>Mode:</Text>
            <Text className={styles.value}>{plugin.modeName}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text className={styles.label}>Execution Rank:</Text>
            <Text className={styles.value}>{plugin.rank}</Text>
          </div>
          <div className={styles.infoRow}>
            <Text className={styles.label}>Async Auto Delete:</Text>
            <Text className={styles.value}>{plugin.asyncAutoDelete ? 'Yes' : 'No'}</Text>
          </div>
        </div>
      </Card>

      {/* Filtering Attributes - Only for Update message */}
      {plugin.message.toLowerCase() === 'update' && (
        <Card>
          <Title3>Filtering Attributes</Title3>
          {plugin.filteringAttributes.length > 0 ? (
            <>
              <Text size={300} style={{ marginBottom: tokens.spacingVerticalS }}>
                Plugin only triggers when these fields change:
              </Text>
              <div className={styles.attributeList}>
                {plugin.filteringAttributes.map((attr) => (
                  <Badge key={attr} appearance="outline" color="brand">
                    {attr}
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <Text>Triggers on any field update</Text>
          )}
        </Card>
      )}

      {/* Pre-Image */}
      {plugin.preImage && (
        <Card>
          <Title3>Pre-Image</Title3>
          <div className={styles.section}>
            <div className={styles.infoRow}>
              <Text className={styles.label}>Image Name:</Text>
              <Text className={styles.value} weight="semibold">{plugin.preImage.name}</Text>
            </div>
            <div className={styles.infoRow}>
              <Text className={styles.label}>Message Property:</Text>
              <Text className={styles.value}>{plugin.preImage.messagePropertyName}</Text>
            </div>
            <Text size={300} style={{ marginTop: tokens.spacingVerticalS }}>
              Attributes in image:
            </Text>
            <div className={styles.attributeList}>
              {plugin.preImage.attributes.map((attr) => (
                <Badge key={attr} appearance="outline" color="informative">
                  {attr}
                </Badge>
              ))}
            </div>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Available in plugin context before database write
            </Text>
          </div>
        </Card>
      )}

      {/* Post-Image */}
      {plugin.postImage && (
        <Card>
          <Title3>Post-Image</Title3>
          <div className={styles.section}>
            <div className={styles.infoRow}>
              <Text className={styles.label}>Image Name:</Text>
              <Text className={styles.value} weight="semibold">{plugin.postImage.name}</Text>
            </div>
            <div className={styles.infoRow}>
              <Text className={styles.label}>Message Property:</Text>
              <Text className={styles.value}>{plugin.postImage.messagePropertyName}</Text>
            </div>
            <Text size={300} style={{ marginTop: tokens.spacingVerticalS }}>
              Attributes in image:
            </Text>
            <div className={styles.attributeList}>
              {plugin.postImage.attributes.map((attr) => (
                <Badge key={attr} appearance="outline" color="success">
                  {attr}
                </Badge>
              ))}
            </div>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Available in plugin context after database write
            </Text>
          </div>
        </Card>
      )}

      {/* Configuration */}
      {plugin.customConfiguration && (
        <Card>
          <Title3>Configuration</Title3>
          <div className={styles.section}>
            <div className={styles.infoRow}>
              <Text className={styles.label}>Unsecure Configuration:</Text>
              <Text className={styles.value}>{plugin.customConfiguration}</Text>
            </div>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalS }}>
              Note: Secure configuration is not accessible via API
            </Text>
          </div>
        </Card>
      )}

      {/* Impersonation */}
      {plugin.impersonatingUserId && (
        <Card>
          <Title3>Impersonation</Title3>
          <div className={styles.section}>
            <Badge appearance="filled" color="warning" className={styles.warningBadge}>
              ⚠️ This plugin runs with elevated permissions
            </Badge>
            <div className={styles.infoRow}>
              <Text className={styles.label}>Runs as:</Text>
              <Text className={styles.value} weight="semibold">{plugin.impersonatingUserName}</Text>
            </div>
            <div className={styles.infoRow}>
              <Text className={styles.label}>User ID:</Text>
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}>
                <Text className={styles.value}>{plugin.impersonatingUserId}</Text>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Copy24Regular />}
                  onClick={() => copyToClipboard(plugin.impersonatingUserId!)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
