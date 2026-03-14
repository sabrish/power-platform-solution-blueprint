import { useState } from 'react';
import {
  Text,
  Title3,
  makeStyles,
  tokens,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import { DetectionCoverageBanner } from './CrossEntityAutomation';
import type { CrossEntityAnalysisResult } from '../core';
import type { EntityBlueprint } from '../core';
import { SummaryStatsGrid } from './crossEntity/SummaryStatsGrid';
import { RiskWarningsSection } from './crossEntity/RiskWarningsSection';
import { PipelineTracesPanel } from './crossEntity/PipelineTracesPanel';
import { GlobalChainMapPanel } from './crossEntity/GlobalChainMapPanel';

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  emptyState: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
  },
  emptyStateIconLarge: { fontSize: tokens.fontSizeHero900 },
});

export interface CrossEntityAutomationViewProps {
  analysis: CrossEntityAnalysisResult | undefined;
  blueprints: EntityBlueprint[];
}

export function CrossEntityAutomationView({
  analysis,
}: CrossEntityAutomationViewProps): JSX.Element {
  const styles = useStyles();
  const [subView, setSubView] = useState<string>('traces');

  if (!analysis || (analysis.allEntityPipelines.size === 0 && analysis.totalEntryPoints === 0)) {
    return (
      <div className={styles.container}>
        <DetectionCoverageBanner />
        <div className={styles.emptyState}>
          <Info16Regular className={styles.emptyStateIconLarge} />
          <Title3>No Cross-Entity Automation Detected</Title3>
          <Text>
            No flows or classic workflows were found writing to a Dataverse entity.
            Cross-entity automation is detected when a flow action targets any entity,
            or when a classic workflow XAML contains CreateEntity / UpdateEntity steps.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DetectionCoverageBanner />

      <SummaryStatsGrid analysis={analysis} />

      <RiskWarningsSection risks={analysis.risks} />

      <TabList
        selectedValue={subView}
        onTabSelect={(_e: SelectTabEvent, d: SelectTabData) => setSubView(d.value as string)}
      >
        <Tab value="traces">Pipeline Traces</Tab>
        <Tab value="map">Global Chain Map ({analysis.chainLinks.length})</Tab>
      </TabList>

      {subView === 'traces' && <PipelineTracesPanel analysis={analysis} />}

      {subView === 'map' && <GlobalChainMapPanel analysis={analysis} />}
    </div>
  );
}
