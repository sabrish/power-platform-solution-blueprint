import { Text, Card, makeStyles, tokens } from '@fluentui/react-components';
import type { CrossEntityAnalysisResult } from '../../core';

const useStyles = makeStyles({
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  statsCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  statsSubtext: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export interface SummaryStatsGridProps {
  analysis: CrossEntityAnalysisResult;
}

export function SummaryStatsGrid({ analysis }: SummaryStatsGridProps): JSX.Element {
  const styles = useStyles();
  const highRisksCount = analysis.risks.filter((r) => r.severity === 'High').length;
  const flowEntryPointCount = analysis.chainLinks.filter((l) => l.automationType === 'Flow').length;

  return (
    <div className={styles.statsGrid}>
      <Card className={styles.statsCard}>
        <Text weight="semibold">Entities w/ Automation</Text>
        <Text style={{ fontSize: tokens.fontSizeHero700 }}>{analysis.allEntityPipelines.size}</Text>
        <Text className={styles.statsSubtext}>In pipeline view</Text>
      </Card>

      <Card className={styles.statsCard}>
        <Text weight="semibold">Cross-Entity Writes</Text>
        <Text style={{ fontSize: tokens.fontSizeHero700 }}>{analysis.totalBranches}</Text>
        <Text className={styles.statsSubtext}>Discovered branches</Text>
      </Card>

      <Card className={styles.statsCard}>
        <Text weight="semibold">Target Entities</Text>
        <Text style={{ fontSize: tokens.fontSizeHero700 }}>{analysis.entityViews.size}</Text>
        <Text className={styles.statsSubtext}>Receive external writes</Text>
      </Card>

      <Card className={styles.statsCard}>
        <Text
          weight="semibold"
          style={{
            color:
              analysis.noFilterPluginCount > 0
                ? tokens.colorPaletteRedForeground1
                : undefined,
          }}
        >
          No-Filter Plugins
        </Text>
        <Text
          style={{
            fontSize: tokens.fontSizeHero700,
            color:
              analysis.noFilterPluginCount > 0
                ? tokens.colorPaletteRedForeground1
                : undefined,
          }}
        >
          {analysis.noFilterPluginCount}
        </Text>
        <Text className={styles.statsSubtext}>Fire on ALL updates</Text>
      </Card>

      <Card className={styles.statsCard}>
        <Text
          weight="semibold"
          style={{
            color: highRisksCount > 0 ? tokens.colorPaletteRedForeground1 : undefined,
          }}
        >
          High Risks
        </Text>
        <Text
          style={{
            fontSize: tokens.fontSizeHero700,
            color: highRisksCount > 0 ? tokens.colorPaletteRedForeground1 : undefined,
          }}
        >
          {highRisksCount}
        </Text>
      </Card>

      <Card className={styles.statsCard}>
        <Text weight="semibold">{flowEntryPointCount}</Text>
        <Text className={styles.statsSubtext}>Flow Entry Points</Text>
      </Card>
    </div>
  );
}
