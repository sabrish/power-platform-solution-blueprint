import { Text, Card, Badge, Title3, makeStyles, tokens } from '@fluentui/react-components';
import { Warning24Regular } from '@fluentui/react-icons';
import type { CrossEntityRisk } from '../../core';

const useStyles = makeStyles({
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  sectionTitle: {
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXS,
  },
  riskCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    borderLeft: `4px solid ${tokens.colorPaletteRedBorderActive}`,
  },
  riskCardMedium: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    borderLeft: `4px solid ${tokens.colorPaletteYellowBorderActive}`,
  },
  riskCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  riskDescription: {
    fontSize: tokens.fontSizeBase200,
    wordBreak: 'break-word',
  },
});

export interface RiskWarningsSectionProps {
  risks: CrossEntityRisk[];
}

export function RiskWarningsSection({ risks }: RiskWarningsSectionProps): JSX.Element | null {
  const styles = useStyles();
  if (risks.length === 0) return null;

  const highRisks = risks.filter((r) => r.severity === 'High');
  const mediumRisks = risks.filter((r) => r.severity === 'Medium');

  return (
    <div>
      <Title3 className={styles.sectionTitle}>Performance &amp; Risk Warnings</Title3>
      <div className={styles.statsGrid}>
        {highRisks.map((risk, i) => (
          <Card key={i} className={styles.riskCard}>
            <div className={styles.riskCardHeader}>
              <Warning24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
              <Badge
                appearance="filled"
                shape="rounded"
                color={
                  risk.type === 'ReTrigger' ||
                  risk.type === 'NoFilterAttributes' ||
                  risk.type === 'CircularReference'
                    ? 'danger'
                    : 'warning'
                }
              >
                {risk.type}
              </Badge>
            </div>
            <Text className={styles.riskDescription}>{risk.description}</Text>
          </Card>
        ))}
        {mediumRisks.map((risk, i) => (
          <Card key={i} className={styles.riskCardMedium}>
            <div className={styles.riskCardHeader}>
              <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground2 }} />
              <Badge appearance="filled" shape="rounded" color="warning">
                {risk.type}
              </Badge>
            </div>
            <Text className={styles.riskDescription}>{risk.description}</Text>
          </Card>
        ))}
      </div>
    </div>
  );
}
