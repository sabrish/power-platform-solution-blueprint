import { Text, Card, makeStyles, tokens } from '@fluentui/react-components';
import type { BlueprintResult } from '../../core';
import { COMPONENT_TABS } from '../ComponentTabRegistry';

const useStyles = makeStyles({
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  summaryCard: {
    padding: tokens.spacingVerticalS,
  },
  summaryCardDisabled: {
    padding: tokens.spacingVerticalS,
    opacity: 0.5,
    cursor: 'default',
  },
  summaryCardSelected: {
    padding: tokens.spacingVerticalS,
    borderBottom: `3px solid ${tokens.colorBrandForeground1}`,
  },
  summaryCardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    alignItems: 'center',
    textAlign: 'center',
  },
  summaryCount: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightHero800,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
});

export interface ComponentSummaryCardsProps {
  result: BlueprintResult;
  selectedCard: string | null;
  onCardClick: (key: string) => void;
}

export function ComponentSummaryCards({
  result,
  selectedCard,
  onCardClick,
}: ComponentSummaryCardsProps): JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.summaryGrid}>
      {COMPONENT_TABS.map((tab) => {
        const count = tab.count(result);
        const hasData = count > 0;
        const isSelected = selectedCard === tab.key;

        return (
          <Card
            key={tab.key}
            className={
              !hasData
                ? styles.summaryCardDisabled
                : isSelected
                ? styles.summaryCardSelected
                : styles.summaryCard
            }
            appearance={hasData ? 'filled' : 'outline'}
            onClick={hasData ? () => onCardClick(tab.key) : undefined}
            style={hasData ? { cursor: 'pointer' } : undefined}
          >
            <div className={styles.summaryCardContent}>
              <span
                style={{
                  color: hasData ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground4,
                  lineHeight: 1,
                }}
              >
                {tab.icon}
              </span>
              <Text className={styles.summaryCount}>{count}</Text>
              <Text className={styles.summaryLabel}>{tab.label}</Text>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
