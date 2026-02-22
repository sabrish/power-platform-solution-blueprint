import {
  Text,
  Badge,
  makeStyles,
  tokens,
  Card,
} from '@fluentui/react-components';
import {
  ErrorCircle20Regular,
  Warning20Regular,
  Info20Regular,
} from '@fluentui/react-icons';
import type { PerformanceRisk } from '../core';

const useStyles = makeStyles({
  panel: {
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  risks: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  riskCard: {
    padding: tokens.spacingVerticalM,
    borderLeft: `4px solid`,
  },
  critical: {
    borderLeftColor: tokens.colorPaletteRedBorder1,
    backgroundColor: tokens.colorPaletteRedBackground1,
  },
  high: {
    borderLeftColor: tokens.colorPaletteDarkOrangeBorder1,
    backgroundColor: tokens.colorPaletteDarkOrangeBackground1,
  },
  medium: {
    borderLeftColor: tokens.colorPaletteYellowBorder1,
    backgroundColor: tokens.colorPaletteYellowBackground1,
  },
  low: {
    borderLeftColor: tokens.colorPaletteBerryBorder1,
    backgroundColor: tokens.colorPaletteBerryBackground1,
  },
  riskHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  riskContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  stepInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  recommendation: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase300,
  },
  summary: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
  },
});

export interface PerformanceRisksPanelProps {
  risks: PerformanceRisk[];
}

export function PerformanceRisksPanel({ risks }: PerformanceRisksPanelProps) {
  const styles = useStyles();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
      case 'High':
        return <ErrorCircle20Regular />;
      case 'Medium':
        return <Warning20Regular />;
      case 'Low':
        return <Info20Regular />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <Badge appearance="filled" shape="rounded" color="important" size="large">Critical</Badge>;
      case 'High':
        return <Badge appearance="filled" shape="rounded" color="warning" size="large">High</Badge>;
      case 'Medium':
        return <Badge appearance="tint" shape="rounded" color="warning" size="large">Medium</Badge>;
      case 'Low':
        return <Badge appearance="tint" shape="rounded" color="informative" size="large">Low</Badge>;
      default:
        return null;
    }
  };

  const getRiskCardStyle = (severity: string): string => {
    switch (severity) {
      case 'Critical':
        return `${styles.riskCard} ${styles.critical}`;
      case 'High':
        return `${styles.riskCard} ${styles.high}`;
      case 'Medium':
        return `${styles.riskCard} ${styles.medium}`;
      case 'Low':
        return `${styles.riskCard} ${styles.low}`;
      default:
        return styles.riskCard;
    }
  };

  const criticalCount = risks.filter((r) => r.severity === 'Critical').length;
  const highCount = risks.filter((r) => r.severity === 'High').length;
  const mediumCount = risks.filter((r) => r.severity === 'Medium').length;
  const lowCount = risks.filter((r) => r.severity === 'Low').length;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Warning20Regular style={{ fontSize: '24px', color: tokens.colorPaletteDarkOrangeForeground1 }} />
        <Text size={500} weight="semibold">Performance Risks Detected</Text>
        <div className={styles.summary}>
          {criticalCount > 0 && <Badge appearance="filled" shape="rounded" color="important">{criticalCount} Critical</Badge>}
          {highCount > 0 && <Badge appearance="filled" shape="rounded" color="warning">{highCount} High</Badge>}
          {mediumCount > 0 && <Badge appearance="tint" shape="rounded" color="warning">{mediumCount} Medium</Badge>}
          {lowCount > 0 && <Badge appearance="tint" shape="rounded" color="informative">{lowCount} Low</Badge>}
        </div>
      </div>

      <div className={styles.risks}>
        {risks.map((risk, index) => (
          <Card key={index} className={getRiskCardStyle(risk.severity)}>
            <div className={styles.riskHeader}>
              {getSeverityIcon(risk.severity)}
              {getSeverityBadge(risk.severity)}
              <Text weight="semibold">{risk.reason}</Text>
            </div>

            <div className={styles.riskContent}>
              <div className={styles.stepInfo}>
                <Text>Affected step:</Text>
                <Badge appearance="outline" shape="rounded" size="small">{risk.step.type}</Badge>
                <Text weight="semibold">{risk.step.name}</Text>
                {risk.step.stage && <Text>• Stage {risk.step.stage}</Text>}
                {risk.step.mode && <Badge appearance="tint" shape="rounded" size="small">{risk.step.mode}</Badge>}
              </div>

              <div className={styles.recommendation}>
                <Text weight="semibold" size={200} style={{ display: 'block', marginBottom: tokens.spacingVerticalXXS }}>
                  Recommendation:
                </Text>
                <Text size={300}>{risk.recommendation}</Text>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
