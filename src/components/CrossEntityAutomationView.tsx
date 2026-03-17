import { useMemo, useState } from 'react';
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

/* ─────────────────────────────────────────────────────────────────────────
   Entity accent colour palette — cycles per entity in display order.
   AUDIT-003 exception: intentional hardcoded hex values — Fluent UI tokens
   do not provide a cycling multi-entity palette. Values match Fluent UI brand
   colours: blue=colorBrandBackground, green=colorPaletteGreenBackground2,
   orange=colorPaletteMarigoldBackground2, purple=colorPaletteVioletBackground2,
   teal=colorPaletteTealBackground2, pink=colorPaletteMagentaBackground2,
   hot pink=colorPaletteHotPinkBackground2, dark teal=colorPaletteDarkGreenBackground2
───────────────────────────────────────────────────────────────────────── */
const ENTITY_COLORS = [
  '#0078d4', '#107c10', '#ca5010', '#8764b8',
  '#038387', '#c239b3', '#e3008c', '#004b50',
];

function buildEntityColorMap(analysis: CrossEntityAnalysisResult): Map<string, string> {
  return new Map(
    Array.from(analysis.allEntityPipelines.keys())
      .sort((a, b) => {
        const pa = analysis.allEntityPipelines.get(a)!;
        const pb = analysis.allEntityPipelines.get(b)!;
        return pa.entityDisplayName.localeCompare(pb.entityDisplayName);
      })
      .map((key, i) => [key, ENTITY_COLORS[i % ENTITY_COLORS.length]])
  );
}

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
  const entityColorMap = useMemo(() => analysis ? buildEntityColorMap(analysis) : new Map<string, string>(), [analysis]);

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

      {subView === 'traces' && <PipelineTracesPanel analysis={analysis} entityColorMap={entityColorMap} />}

      {subView === 'map' && <GlobalChainMapPanel analysis={analysis} />}
    </div>
  );
}
