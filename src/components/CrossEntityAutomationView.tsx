import { useState } from 'react';
import {
  Text,
  Title3,
  Card,
  Badge,
  makeStyles,
  mergeClasses,
  tokens,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  Tooltip,
  Input,
  Checkbox,
} from '@fluentui/react-components';
import type { CheckboxOnChangeData } from '@fluentui/react-components';
import {
  ArrowRight24Regular,
  Warning24Regular,
  Lightbulb24Regular,
  CheckmarkCircle16Regular,
  ErrorCircle16Regular,
  Info16Regular,
  Search20Regular,
} from '@fluentui/react-icons';
import type {
  CrossEntityAnalysisResult,
  CrossEntityTrace,
  AutomationActivation,
  CrossEntityEntityView,
  EntityAutomationPipeline,
  MessagePipeline,
  PipelineStep,
} from '../core';
import type { EntityBlueprint } from '../core';

/* ─────────────────────────────────────────────────────────────────────────
   Entity accent colour palette — cycles per entity in display order.
   Intentional hardcoded values: Fluent UI tokens do not provide a cycling
   multi-entity palette. Values match Fluent UI brand colours:
   blue=colorBrandBackground, green=colorPaletteGreenBackground2,
   orange=colorPaletteMarigoldBackground2, purple=colorPaletteVioletBackground2,
   teal=colorPaletteTealBackground2, pink=colorPaletteMagentaBackground2,
   hot pink=colorPaletteHotPinkBackground2, dark teal=colorPaletteDarkGreenBackground2
───────────────────────────────────────────────────────────────────────── */
const ENTITY_COLORS = [
  '#0078d4', '#107c10', '#ca5010', '#8764b8',
  '#038387', '#c239b3', '#e3008c', '#004b50',
];
function entityColor(index: number) { return ENTITY_COLORS[index % ENTITY_COLORS.length]; }

/* ─────────────────────────────────────────────────────────────────────────
   Type helpers
───────────────────────────────────────────────────────────────────────── */
function typeIcon(type: AutomationActivation['automationType'] | PipelineStep['automationType']): string {
  switch (type) {
    case 'Plugin': return '🔌';
    case 'Flow': return '⚡';
    case 'BusinessRule': return '📋';
    case 'ClassicWorkflow': return '🔄';
    default: return '•';
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────────────────── */
const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },

  banner: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderLeft: `4px solid ${tokens.colorBrandForeground1}`,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'flex-start',
  },
  bannerIcon: { color: tokens.colorBrandForeground1, flexShrink: 0, marginTop: '2px' },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  statsCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS,
  },
  riskCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS,
    borderLeft: `4px solid ${tokens.colorPaletteRedBorderActive}`,
  },
  riskCardMedium: {
    padding: tokens.spacingVerticalM,
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS,
    borderLeft: `4px solid ${tokens.colorPaletteYellowBorderActive}`,
  },
  sectionTitle: { marginTop: tokens.spacingVerticalM, marginBottom: tokens.spacingVerticalXS },

  /* ── Pipeline (accordion) list ── */
  pipelineList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },

  entityRow: { display: 'flex', flexDirection: 'column', marginBottom: '2px' },

  entityHeader: {
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS,
    padding: '8px 12px', cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  entityHeaderHover: { border: `1px solid ${tokens.colorNeutralStroke1}` },
  entityHeaderOpen: {
    borderRadius: `${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0 0`,
    borderBottom: 'none',
  },

  entityInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  entityNameRow: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, flexWrap: 'wrap' },

  entityBody: {
    padding: '6px 12px 10px 28px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
  },

  /* Trace sub-header (shown when entity has multiple entry points) */
  traceSubHeader: {
    padding: '4px 0 2px',
    marginBottom: '4px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },

  /* Step rows */
  pipelineStepRow: {
    display: 'flex', gap: 0, alignItems: 'stretch',
    marginBottom: '1px',
  },
  stepMain: {
    flex: 1, padding: '5px 10px',
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    minWidth: 0,
  },
  stepMainHasBranch: {
    borderRight: 'none',
    borderRadius: `${tokens.borderRadiusMedium} 0 0 ${tokens.borderRadiusMedium}`,
  },
  stepNum: {
    fontFamily: 'monospace', fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground3,
    minWidth: '14px', flexShrink: 0,
  },
  stepName: {
    fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase200,
    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  stepStage: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3, flexShrink: 0 },

  /* Branch block (right of a step with downstream write) */
  branchBlock: {
    width: '200px', padding: '5px 10px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `2px solid ${tokens.colorBrandForeground1}`,
    borderRadius: `0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0`,
    backgroundColor: tokens.colorNeutralBackground4,
    flexShrink: 0,
    cursor: 'default',
  },
  branchTarget: {
    fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, flexWrap: 'wrap',
  },
  branchFields: { display: 'flex', gap: '2px', flexWrap: 'wrap', marginTop: '2px' },
  branchField: {
    fontFamily: 'monospace', fontSize: '9px', padding: '0 3px',
    borderRadius: '2px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
  },

  /* Field match verdict block */
  fieldMatchBase: {
    margin: '2px 0 4px 26px', padding: '4px 8px',
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase100,
    lineHeight: '1.5',
  },
  fieldMatchFires: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    border: `1px solid ${tokens.colorPaletteGreenBorderActive}`,
  },
  fieldMatchNoFire: {
    opacity: 0.55,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  fieldMatchNoFilter: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    border: `1px solid ${tokens.colorPaletteRedBorderActive}`,
  },
  matchVerdict: { fontWeight: tokens.fontWeightSemibold, marginBottom: '2px' },
  matchPills: { display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px' },
  mpillHit: {
    fontFamily: 'monospace', fontSize: '9px', padding: '0 4px', borderRadius: '3px',
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground1,
    border: `1px solid ${tokens.colorPaletteGreenBorderActive}`,
    fontWeight: tokens.fontWeightSemibold,
  },
  mpillMiss: {
    fontFamily: 'monospace', fontSize: '9px', padding: '0 4px', borderRadius: '3px',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },

  /* Child entity inline section */
  childSection: { marginLeft: '24px', marginTop: '3px', marginBottom: '4px' },
  childHeader: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '5px 10px',
    borderRadius: `${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0 0`,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderBottom: 'none',
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  childSteps: {
    padding: '4px 10px 8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  returnMarker: {
    padding: '2px 12px 2px 18px',
    fontSize: '10px', color: tokens.colorNeutralForeground3,
    fontStyle: 'italic', marginBottom: '3px',
  },

  /* Won't fire section */
  wontFireBtn: {
    width: '100%', padding: '4px 10px', marginTop: '4px',
    background: 'none', border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground3, cursor: 'pointer',
    fontSize: tokens.fontSizeBase100, fontWeight: tokens.fontWeightSemibold,
    textAlign: 'left',
    ':hover': { backgroundColor: tokens.colorNeutralBackground3 },
  },
  wontFireItem: {
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS,
    padding: '3px 10px', marginTop: '2px',
    borderRadius: tokens.borderRadiusMedium,
    borderLeft: `3px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
    opacity: 0.6, fontSize: tokens.fontSizeBase100,
  },

  /* Chain map table */
  chainTable: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr auto auto auto',
    gap: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM}`,
    alignItems: 'center',
  },
  chainTableHeader: {
    fontWeight: tokens.fontWeightSemibold, fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    paddingBottom: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalXS,
  },
  filterRow: { display: 'flex', gap: tokens.spacingHorizontalM, alignItems: 'center', flexWrap: 'wrap' },
  filterBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: tokens.spacingVerticalS,
  },
  searchInput: {
    minWidth: '220px',
    flex: 1,
    maxWidth: '400px',
  },
  emptyState: {
    padding: tokens.spacingVerticalXXL, textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: tokens.spacingVerticalM,
  },
  monoText: { fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase200 },

  /* ── Banner inner layout ── */
  bannerContent: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  bannerTitleRow: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },

  /* ── Global Chain Map sub-view container ── */
  chainMapContainer: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },

  /* ── Filter badge row wrappers (two identical divs in chain map) ── */
  filterBadgeRow: { display: 'flex', gap: tokens.spacingHorizontalXS },

  /* ── Clickable badge (cursor override) ── */
  badgeCursor: { cursor: 'pointer' },

  /* ── Chain map automation cell ── */
  chainAutoCell: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS },
  chainAutoBadge: { width: 'fit-content' },

  /* ── Trace confidence badge (very small) ── */
  tinyBadge: { fontSize: '9px' },

  /* ── Trace divider (dashed horizontal separator between entry points) ── */
  traceDivider: {
    borderTop: `1px dashed ${tokens.colorNeutralStroke2}`,
    margin: `${tokens.spacingVerticalS} 0`,
  },

  /* ── Step mode badge / no-filter badge (9px + flexShrink) ── */
  stepBadge: { fontSize: '9px', flexShrink: 0 },

  /* ── Filtering attributes text shown inside a step row ── */
  stepFilterText: { fontSize: '9px', color: tokens.colorNeutralForeground3, flexShrink: 0 },

  /* ── Empty pipeline message (no automations) ── */
  emptyPipelineText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    padding: `${tokens.spacingVerticalXS} 0`,
  },

  /* ── Won't-fire item: overflow-safe name ── */
  wontFireItemName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase100,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  wontFireItemStage: { fontSize: '9px', color: tokens.colorNeutralForeground3 },
  wontFireItemFilter: {
    fontSize: '9px',
    color: tokens.colorNeutralForeground3,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  /* ── Entry-point field context strip ── */
  entryFieldsRow: {
    marginTop: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  entryFieldPill: {
    fontFamily: 'monospace',
    marginRight: tokens.spacingHorizontalXS,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: `0 3px`,
    borderRadius: tokens.borderRadiusSmall,
  },

  /* ── ChildEntitySection header text elements ── */
  childArrow: { fontSize: '10px' },
  childEntityName: { fontSize: tokens.fontSizeBase300 },
  childLogicalName: { fontFamily: 'monospace', fontSize: '10px', color: tokens.colorNeutralForeground3 },
  childStepCount: { fontSize: '9px', color: tokens.colorNeutralForeground3 },

  /* ── FieldMatchVerdict: "WillFireNoFilter" advisory text ── */
  noFilterAdvisory: { fontSize: '9px', color: tokens.colorPaletteRedForeground1 },

  /* ── FieldPills row layout ── */
  fieldPillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalXXS,
  },
  fieldPillLabel: { fontSize: '9px', color: tokens.colorNeutralForeground3 },

  /* ── Entity header: logical name mono text ── */
  entityLogicalName: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },

  /* ── Entity header: entry point preview line ── */
  entityEntryPreview: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },

  /* ── Entity header: right-side count + chevron text ── */
  entityHeaderCount: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
    marginLeft: tokens.spacingHorizontalS,
  },

  /* ── Empty-state icons ── */
  emptyStateIconLarge: { fontSize: '48px' },
  emptyStateIconMedium: { fontSize: '32px' },

  /* ── Stats card subtext (small muted label below a large number) ── */
  statsSubtext: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },

  /* ── Risk card header row ── */
  riskCardHeader: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS },

  /* ── Risk description text ── */
  riskDescription: { fontSize: tokens.fontSizeBase200, wordBreak: 'break-word' },
});

/* ─────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────── */
export interface CrossEntityAutomationViewProps {
  analysis: CrossEntityAnalysisResult | undefined;
  blueprints: EntityBlueprint[];
}

export function CrossEntityAutomationView({ analysis }: CrossEntityAutomationViewProps) {
  const styles = useStyles();
  const [subView, setSubView] = useState<string>('traces');
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(() => {
    if (!analysis) return new Set();
    const first = Array.from(analysis.entityViews.keys())[0];
    return first ? new Set([first]) : new Set();
  });
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOperation, setFilterOperation] = useState<string>('all');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [showAllEntities, setShowAllEntities] = useState(false);
  const [chainSearch, setChainSearch] = useState('');

  if (!analysis || (analysis.allEntityPipelines.size === 0 && analysis.totalEntryPoints === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.banner}>
          <Lightbulb24Regular className={styles.bannerIcon} />
          <div className={styles.bannerContent}>
            <div className={styles.bannerTitleRow}>
            <Text weight="semibold">Detection Coverage Notice</Text>
            <Badge appearance="filled" color="warning" size="small">Preview</Badge>
          </div>
            <Text as="p" style={{ margin: 0 }}>⚡ <strong>Power Automate flows</strong> — cross-entity writes detected from flow JSON definitions.</Text>
            <Text as="p" style={{ margin: 0 }}>🔄 <strong>Classic Workflows</strong> — cross-entity writes detected from XAML (CreateEntity / UpdateEntity steps).</Text>
            <Text as="p" style={{ margin: 0 }}>🔌 <strong>Plugins</strong> — firing-status shown based on registered filtering attributes; deep cross-entity detection via plugin decompilation is planned for a future release.</Text>
            <Text as="p" style={{ margin: 0 }}>📜 <strong>JavaScript Web Resources</strong> — cross-entity call detection via JS static analysis is planned for a future release.</Text>
          </div>
        </div>
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

  const toggleEntity = (name: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const highRisks = analysis.risks.filter(r => r.severity === 'High');
  const mediumRisks = analysis.risks.filter(r => r.severity === 'Medium');

  const filteredLinks = analysis.chainLinks
    .filter(link => {
      const typeMatch = filterType === 'all' || link.automationType === filterType;
      const opMatch = filterOperation === 'all' || link.operation === filterOperation;
      return typeMatch && opMatch;
    })
    .filter(link => {
      if (!chainSearch.trim()) return true;
      const q = chainSearch.toLowerCase();
      return (
        link.sourceEntityDisplayName.toLowerCase().includes(q) ||
        link.sourceEntity.toLowerCase().includes(q) ||
        link.targetEntityDisplayName.toLowerCase().includes(q) ||
        link.targetEntity.toLowerCase().includes(q) ||
        link.automationName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.sourceEntityDisplayName.localeCompare(b.sourceEntityDisplayName));

  return (
    <div className={styles.container}>
      {/* Banner */}
      <div className={styles.banner}>
        <Lightbulb24Regular className={styles.bannerIcon} />
        <div className={styles.bannerContent}>
          <div className={styles.bannerTitleRow}>
            <Text weight="semibold">Detection Coverage Notice</Text>
            <Badge appearance="filled" color="warning" size="small">Preview</Badge>
          </div>
          <Text as="p" style={{ margin: 0 }}>⚡ <strong>Power Automate flows</strong> — cross-entity writes detected from flow JSON definitions.</Text>
          <Text as="p" style={{ margin: 0 }}>🔄 <strong>Classic Workflows</strong> — cross-entity writes detected from XAML (CreateEntity / UpdateEntity steps).</Text>
          <Text as="p" style={{ margin: 0 }}>🔌 <strong>Plugins</strong> — firing-status shown based on registered filtering attributes; deep cross-entity detection via plugin decompilation is planned for a future release.</Text>
          <Text as="p" style={{ margin: 0 }}>📜 <strong>JavaScript Web Resources</strong> — cross-entity call detection via JS static analysis is planned for a future release.</Text>
        </div>
      </div>

      {/* Summary stats */}
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
          <Text weight="semibold" style={{ color: analysis.noFilterPluginCount > 0 ? tokens.colorPaletteRedForeground1 : undefined }}>
            No-Filter Plugins
          </Text>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: analysis.noFilterPluginCount > 0 ? tokens.colorPaletteRedForeground1 : undefined }}>
            {analysis.noFilterPluginCount}
          </Text>
          <Text className={styles.statsSubtext}>Fire on ALL updates</Text>
        </Card>
        <Card className={styles.statsCard}>
          <Text weight="semibold" style={{ color: highRisks.length > 0 ? tokens.colorPaletteRedForeground1 : undefined }}>
            High Risks
          </Text>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: highRisks.length > 0 ? tokens.colorPaletteRedForeground1 : undefined }}>
            {highRisks.length}
          </Text>
        </Card>
        <Card className={styles.statsCard}>
          <Text weight="semibold">{analysis.chainLinks.filter(l => l.automationType === 'Flow').length}</Text>
          <Text className={styles.statsSubtext}>Flow Entry Points</Text>
        </Card>
      </div>

      {/* Risk warnings */}
      {analysis.risks.length > 0 && (
        <div>
          <Title3 className={styles.sectionTitle}>Performance &amp; Risk Warnings</Title3>
          <div className={styles.statsGrid}>
            {highRisks.map((risk, i) => (
              <Card key={i} className={styles.riskCard}>
                <div className={styles.riskCardHeader}>
                  <Warning24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
                  <Badge appearance="filled" color={
                    risk.type === 'ReTrigger' ? 'danger' :
                    risk.type === 'NoFilterAttributes' ? 'danger' :
                    risk.type === 'CircularReference' ? 'danger' :
                    'warning'
                  }>{risk.type}</Badge>
                </div>
                <Text className={styles.riskDescription}>{risk.description}</Text>
              </Card>
            ))}
            {mediumRisks.map((risk, i) => (
              <Card key={i} className={styles.riskCardMedium}>
                <div className={styles.riskCardHeader}>
                  <Warning24Regular style={{ color: tokens.colorPaletteYellowForeground2 }} />
                  <Badge appearance="filled" color="warning">{risk.type}</Badge>
                </div>
                <Text className={styles.riskDescription}>{risk.description}</Text>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sub-view tabs */}
      <TabList
        selectedValue={subView}
        onTabSelect={(_e: SelectTabEvent, d: SelectTabData) => setSubView(d.value as string)}
      >
        <Tab value="traces">Pipeline Traces</Tab>
        <Tab value="map">Global Chain Map ({analysis.chainLinks.length})</Tab>
      </TabList>

      {/* ── Sub-view 1: Pipeline Traces ── */}
      {subView === 'traces' && (
        <div>
          {/* Filter bar */}
          <div className={styles.filterBar}>
            <Input
              className={styles.searchInput}
              placeholder="Search entities..."
              value={pipelineSearch}
              onChange={(_e, data) => setPipelineSearch(data.value)}
              contentBefore={<Search20Regular />}
              size="small"
            />
            <Checkbox
              label="Show all entities with automation"
              checked={showAllEntities}
              onChange={(_e: React.ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => setShowAllEntities(!!data.checked)}
            />
          </div>

          {/* Empty state: no cross-entity links at all and filter is on */}
          {analysis.entityViews.size === 0 && !showAllEntities && (
            <div className={styles.emptyState}>
              <Info16Regular className={styles.emptyStateIconMedium} />
              <Text weight="semibold">No cross-entity automation found</Text>
              <Text style={{ fontSize: tokens.fontSizeBase200 }}>
                Check "Show all entities with automation" to see all entity automation pipelines.
              </Text>
            </div>
          )}

          {/* Entity list */}
          {(analysis.entityViews.size > 0 || showAllEntities) && (() => {
            // Stable colour index map: alphabetical sort of all keys
            const stableColorMap = new Map(
              Array.from(analysis.allEntityPipelines.keys())
                .sort((a, b) => {
                  const pa = analysis.allEntityPipelines.get(a)!;
                  const pb = analysis.allEntityPipelines.get(b)!;
                  return pa.entityDisplayName.localeCompare(pb.entityDisplayName);
                })
                .map((key, i) => [key, i])
            );

            const visibleEntries = Array.from(analysis.allEntityPipelines.entries())
              // Sort alphabetically by display name
              .sort(([, a], [, b]) => a.entityDisplayName.localeCompare(b.entityDisplayName))
              // Filter: source entities (cross-entity output) only unless showAllEntities
              .filter(([, p]) => showAllEntities || p.hasCrossEntityOutput)
              // Filter: search
              .filter(([logicalName, p]) => {
                if (!pipelineSearch.trim()) return true;
                const q = pipelineSearch.toLowerCase();
                return (
                  p.entityDisplayName.toLowerCase().includes(q) ||
                  logicalName.toLowerCase().includes(q)
                );
              });

            return (
              <div className={styles.pipelineList}>
                {visibleEntries.map(([logicalName, pipeline]) => {
                  const entityView = analysis.entityViews.get(logicalName);
                  const color = entityColor(stableColorMap.get(logicalName) ?? 0);
                  return entityView ? (
                    // Entity has inbound entry points — use existing entry-point trace renderer
                    <EntityPipelineRow
                      key={logicalName}
                      logicalName={logicalName}
                      view={entityView}
                      color={color}
                      expanded={expandedEntities.has(logicalName)}
                      onToggle={() => toggleEntity(logicalName)}
                      analysis={analysis}
                    />
                  ) : (
                    // Entity has automation but no inbound entry points — use generic message pipeline renderer
                    <EntityMessagePipelineRow
                      key={logicalName}
                      pipeline={pipeline}
                      color={color}
                      expanded={expandedEntities.has(logicalName)}
                      onToggle={() => toggleEntity(logicalName)}
                      analysis={analysis}
                    />
                  );
                })}

                {/* Empty search result state */}
                {visibleEntries.length === 0 && pipelineSearch.trim() !== '' && (
                  <div className={styles.emptyState}>
                    <Text>No entities match "{pipelineSearch}".</Text>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Sub-view 2: Global Chain Map ── */}
      {subView === 'map' && (
        <div className={styles.chainMapContainer}>
          {/* Search bar */}
          <div className={styles.filterBar}>
            <Input
              className={styles.searchInput}
              placeholder="Search source, target, or automation name..."
              value={chainSearch}
              onChange={(_e, data) => setChainSearch(data.value)}
              contentBefore={<Search20Regular />}
              size="small"
            />
          </div>

          {/* Type and operation filter badges */}
          <div className={styles.filterRow}>
            <Text weight="semibold">Filter:</Text>
            <div className={styles.filterBadgeRow}>
              {['all', 'Flow', 'ClassicWorkflow'].map(t => (
                <Badge
                  key={t}
                  appearance={filterType === t ? 'filled' : 'outline'}
                  color={filterType === t ? 'brand' : 'informative'}
                  className={styles.badgeCursor}
                  onClick={() => setFilterType(t)}
                >
                  {t === 'all' ? 'All Types' : t}
                </Badge>
              ))}
            </div>
            <div className={styles.filterBadgeRow}>
              {['all', 'Create', 'Update', 'Delete'].map(op => (
                <Badge
                  key={op}
                  appearance={filterOperation === op ? 'filled' : 'outline'}
                  color={filterOperation === op ? 'brand' : op === 'Create' ? 'success' : op === 'Delete' ? 'danger' : 'warning'}
                  className={styles.badgeCursor}
                  onClick={() => setFilterOperation(op)}
                >
                  {op === 'all' ? 'All Ops' : op}
                </Badge>
              ))}
            </div>
          </div>

          {filteredLinks.length === 0 ? (
            <div className={styles.emptyState}><Text>No chain links match the current filter.</Text></div>
          ) : (
            <Card>
              <div className={styles.chainTable}>
                <Text className={styles.chainTableHeader}>Source Entity</Text>
                <span />
                <Text className={styles.chainTableHeader}>Target Entity</Text>
                <Text className={styles.chainTableHeader}>Automation</Text>
                <Text className={styles.chainTableHeader}>Operation</Text>
                <Text className={styles.chainTableHeader}>Mode</Text>
                {filteredLinks.map((link, i) => (
                  <>
                    <div key={`src-${i}`}>
                      <Text weight="semibold">{link.sourceEntityDisplayName}</Text>
                      <br />
                      <Text className={styles.monoText} style={{ color: tokens.colorNeutralForeground3 }}>{link.sourceEntity}</Text>
                    </div>
                    <ArrowRight24Regular key={`arr-${i}`} style={{ color: tokens.colorNeutralForeground3 }} />
                    <div key={`tgt-${i}`}>
                      <Text weight="semibold">{link.targetEntityDisplayName}</Text>
                      <br />
                      <Text className={styles.monoText} style={{ color: tokens.colorNeutralForeground3 }}>{link.targetEntity}</Text>
                    </div>
                    <div key={`auto-${i}`} className={styles.chainAutoCell}>
                      <Text style={{ wordBreak: 'break-word' }}>{link.automationName}</Text>
                      <Badge appearance="outline" color={link.automationType === 'Flow' ? 'success' : 'important'} className={styles.chainAutoBadge}>
                        {link.automationType}
                      </Badge>
                    </div>
                    <OperationBadge key={`op-${i}`} operation={link.operation} />
                    <Badge key={`mode-${i}`} appearance="tint" color={link.isAsynchronous ? 'success' : 'warning'}>
                      {link.isAsynchronous ? 'Async' : 'Sync'}
                    </Badge>
                  </>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   EntityPipelineRow — one collapsible row per target entity (with entry points)
───────────────────────────────────────────────────────────────────────── */
function EntityPipelineRow({
  logicalName, view, color, expanded, onToggle, analysis,
}: {
  logicalName: string;
  view: CrossEntityEntityView;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  analysis: CrossEntityAnalysisResult;
}) {
  const styles = useStyles();
  const firstTrace = view.traces[0];
  const willFireCount = view.traces.reduce(
    (sum, t) => sum + t.activations.filter(a => a.firingStatus !== 'WontFire').length, 0
  );

  return (
    <div className={styles.entityRow}>
      {/* Header */}
      <div
        className={mergeClasses(styles.entityHeader, expanded && styles.entityHeaderOpen)}
        onClick={onToggle}
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className={styles.entityInfo}>
          <div className={styles.entityNameRow}>
            <Text weight="semibold">{view.entityDisplayName}</Text>
            <Text className={styles.entityLogicalName}>
              {logicalName}
            </Text>
            {firstTrace && <OperationBadge operation={firstTrace.entryPoint.operation} />}
            {view.traces.length > 1 && (
              <Badge appearance="tint" color="informative">{view.traces.length} entry points</Badge>
            )}
          </div>

          {firstTrace && (
            <Text className={styles.entityEntryPreview}>
              &larr; {typeIcon(firstTrace.entryPoint.automationType === 'ClassicWorkflow' ? 'ClassicWorkflow' : 'Flow')}{' '}
              {firstTrace.entryPoint.automationName}
              {' '}(from {firstTrace.entryPoint.sourceEntityDisplayName})
            </Text>
          )}

        </div>

        <Text className={styles.entityHeaderCount}>
          {expanded ? '▲' : '▼'} {willFireCount}
        </Text>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className={styles.entityBody} style={{ borderLeft: `4px solid ${color}40` }}>
          {view.traces.map((trace, ti) => (
            <div key={ti}>
              {view.traces.length > 1 && (
                <div className={styles.traceSubHeader}>
                  {typeIcon(trace.entryPoint.automationType === 'ClassicWorkflow' ? 'ClassicWorkflow' : 'Flow')}{' '}
                  <strong>{trace.entryPoint.automationName}</strong>
                  {' '}— {trace.entryPoint.sourceEntityDisplayName} &rarr; <strong>{trace.entryPoint.operation}</strong>
                  {' '}
                  <Badge appearance="tint" color="informative" className={styles.tinyBadge}>
                    {trace.entryPoint.confidence}
                  </Badge>
                  {ti < view.traces.length - 1 && (
                    <span style={{ color: tokens.colorNeutralForeground3 }}> (entry point {ti + 1} of {view.traces.length})</span>
                  )}
                </div>
              )}
              <TracePipeline
                trace={trace}
                analysis={analysis}
                depth={0}
                parentEntityDisplayName={view.entityDisplayName}
              />
              {ti < view.traces.length - 1 && (
                <div className={styles.traceDivider} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   EntityMessagePipelineRow — entity with automation but NO inbound entry points
───────────────────────────────────────────────────────────────────────── */
function EntityMessagePipelineRow({
  pipeline, color, expanded, onToggle, analysis,
}: {
  pipeline: EntityAutomationPipeline;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  analysis: CrossEntityAnalysisResult;
}) {
  const styles = useStyles();
  const totalSteps = pipeline.messagePipelines.reduce((sum, mp) => sum + mp.steps.length, 0);

  return (
    <div className={styles.entityRow}>
      <div
        className={mergeClasses(styles.entityHeader, expanded && styles.entityHeaderOpen)}
        onClick={onToggle}
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className={styles.entityInfo}>
          <div className={styles.entityNameRow}>
            <Text weight="semibold">{pipeline.entityDisplayName}</Text>
            <Text className={styles.entityLogicalName}>
              {pipeline.entityLogicalName}
            </Text>
            {pipeline.messagePipelines.map(mp => (
              <OperationBadge key={mp.message} operation={mp.message} />
            ))}
            {pipeline.hasCrossEntityOutput && (
              <Badge appearance="tint" color="informative">&rarr; cross-entity</Badge>
            )}
          </div>

        </div>

        <Text className={styles.entityHeaderCount}>
          {expanded ? '▲' : '▼'} {totalSteps}
        </Text>
      </div>

      {expanded && (
        <div className={styles.entityBody} style={{ borderLeft: `4px solid ${color}40` }}>
          {pipeline.messagePipelines.map((mp, mpi) => (
            <div key={mp.message}>
              {pipeline.messagePipelines.length > 1 && (
                <div className={styles.traceSubHeader}>
                  <OperationBadge operation={mp.message} /> pipeline
                </div>
              )}
              <MessagePipelineSteps mp={mp} analysis={analysis} color={color} entityDisplayName={pipeline.entityDisplayName} />
              {mpi < pipeline.messagePipelines.length - 1 && (
                <div className={styles.traceDivider} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MessagePipelineSteps — steps for a message pipeline without entry-point context
───────────────────────────────────────────────────────────────────────── */
function MessagePipelineSteps({
  mp, analysis, color, entityDisplayName,
}: {
  mp: MessagePipeline;
  analysis: CrossEntityAnalysisResult;
  color: string;
  entityDisplayName: string;
}) {
  const styles = useStyles();

  return (
    <div>
      {mp.steps.map((step, i) => {
        const hasDownstream = !!step.downstream;
        const downstreamView = hasDownstream
          ? analysis.entityViews.get(step.downstream!.targetEntity) ?? null
          : null;
        const downstreamColor = hasDownstream
          ? entityColor(Array.from(analysis.allEntityPipelines.keys()).indexOf(step.downstream!.targetEntity))
          : color;

        return (
          <div key={step.automationId + i}>
            <div className={styles.pipelineStepRow}>
              <div className={mergeClasses(styles.stepMain, hasDownstream ? styles.stepMainHasBranch : undefined)}>
                <span className={styles.stepNum}>{i + 1}</span>
                <TypeBadge type={step.automationType} />
                <span className={styles.stepName}>{step.automationName}</span>
                {step.stageName && <span className={styles.stepStage}>{step.stageName}</span>}
                {step.rank !== undefined && <span className={styles.stepStage}>#{step.rank}</span>}
                <Badge appearance="tint" color={step.mode === 'Sync' ? 'warning' : 'success'} className={styles.stepBadge}>
                  {step.mode}
                </Badge>
                {step.firesForAllUpdates && (
                  <Tooltip content="No filtering attributes — fires on ALL updates" relationship="description">
                    <Badge appearance="filled" color="danger" className={styles.stepBadge}>&#9888; No filter</Badge>
                  </Tooltip>
                )}
                {step.filteringAttributes.length > 0 && !step.firesForAllUpdates && mp.message === 'Update' && (
                  <Text className={styles.stepFilterText}>
                    filters: {step.filteringAttributes.slice(0, 3).join(', ')}
                    {step.filteringAttributes.length > 3 && ` +${step.filteringAttributes.length - 3}`}
                  </Text>
                )}
              </div>

              {hasDownstream && step.downstream && (
                <div className={styles.branchBlock} style={{ borderLeftColor: downstreamColor }}>
                  <div className={styles.branchTarget} style={{ color: downstreamColor }}>
                    &rarr; {step.downstream.targetEntityDisplayName}
                    <OperationBadge operation={step.downstream.operation} />
                  </div>
                  {step.downstream.fields.length > 0 && (
                    <div className={styles.branchFields}>
                      {step.downstream.fields.slice(0, 4).map(f => (
                        <span key={f} className={styles.branchField}>{f}</span>
                      ))}
                      {step.downstream.fields.length > 4 && (
                        <span className={styles.branchField}>+{step.downstream.fields.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Inline child pipeline (depth 0 only for message pipeline rows) */}
            {downstreamView && (
              <ChildEntitySection
                entityView={downstreamView}
                trace={downstreamView.traces[0]}
                analysis={analysis}
                depth={1}
                accentColor={downstreamColor}
                parentDisplayName={entityDisplayName}
              />
            )}
          </div>
        );
      })}

      {mp.steps.length === 0 && (
        <Text className={styles.emptyPipelineText}>
          No automations registered for {mp.message}.
        </Text>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   TracePipeline — the numbered step list for one trace
───────────────────────────────────────────────────────────────────────── */
function TracePipeline({
  trace, analysis, depth, parentEntityDisplayName,
}: {
  trace: CrossEntityTrace;
  analysis: CrossEntityAnalysisResult;
  depth: number;
  parentEntityDisplayName: string;
}) {
  const styles = useStyles();
  const [showWontFire, setShowWontFire] = useState(false);

  const willFire = trace.activations.filter(a => a.firingStatus !== 'WontFire');
  const wontFire = trace.activations.filter(a => a.firingStatus === 'WontFire');

  return (
    <div>
      {/* Numbered steps that will fire */}
      {willFire.map((act, i) => (
        <StepBlock
          key={act.automationId + i}
          stepNum={i + 1}
          activation={act}
          trace={trace}
          analysis={analysis}
          depth={depth}
          parentEntityDisplayName={parentEntityDisplayName}
        />
      ))}

      {willFire.length === 0 && (
        <Text className={styles.emptyPipelineText}>
          No automations registered on this entity for this message.
        </Text>
      )}

      {/* Won't fire — collapsed section */}
      {wontFire.length > 0 && (
        <>
          <button className={styles.wontFireBtn} onClick={() => setShowWontFire(s => !s)}>
            {showWontFire ? '▲' : '▼'} {wontFire.length} automation{wontFire.length !== 1 ? 's' : ''} won't fire for this entry point
          </button>
          {showWontFire && wontFire.map((act, i) => (
            <div key={i} className={styles.wontFireItem}>
              <span>{typeIcon(act.automationType)}</span>
              <Badge appearance="outline" color="informative" className={styles.tinyBadge}>{act.automationType}</Badge>
              <Text className={styles.wontFireItemName}>
                {act.automationName}
              </Text>
              {act.stageName && (
                <Text className={styles.wontFireItemStage}>{act.stageName}</Text>
              )}
              {act.filteringAttributes.length > 0 && (
                <Text className={styles.wontFireItemFilter}>
                  — filter: {act.filteringAttributes.join(', ')} (not in [{trace.entryPoint.fields.join(', ')}])
                </Text>
              )}
            </div>
          ))}
        </>
      )}

      {/* Entry point field context */}
      {trace.entryPoint.fields.length > 0 && (
        <div className={styles.entryFieldsRow}>
          Entry fields: {trace.entryPoint.fields.slice(0, 8).map(f => (
            <span key={f} className={styles.entryFieldPill}>{f}</span>
          ))}
          {trace.entryPoint.fields.length > 8 && <span>+{trace.entryPoint.fields.length - 8} more</span>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   StepBlock — one numbered activation row + field match verdict + optional child pipeline
───────────────────────────────────────────────────────────────────────── */
function StepBlock({
  stepNum, activation, trace, analysis, depth, parentEntityDisplayName,
}: {
  stepNum: number;
  activation: AutomationActivation;
  trace: CrossEntityTrace;
  analysis: CrossEntityAnalysisResult;
  depth: number;
  parentEntityDisplayName: string;
}) {
  const styles = useStyles();
  const hasDownstream = !!activation.downstream;

  // Find downstream entity view and its relevant trace (max depth 2)
  const downstreamView =
    hasDownstream && depth < 2
      ? analysis.entityViews.get(activation.downstream!.targetEntity)
      : null;

  const downstreamTrace = downstreamView
    ? (downstreamView.traces.find(t => t.entryPoint.automationId === activation.automationId) ?? downstreamView.traces[0])
    : null;

  // Downstream entity accent color (cycle from a shifted palette index)
  const downstreamColor = entityColor(
    Array.from(analysis.entityViews.keys()).indexOf(activation.downstream?.targetEntity ?? '') % ENTITY_COLORS.length
  );

  return (
    <div>
      {/* Step row: main block + optional branch */}
      <div className={styles.pipelineStepRow}>
        <div className={mergeClasses(styles.stepMain, hasDownstream ? styles.stepMainHasBranch : undefined)}>
          <span className={styles.stepNum}>{stepNum}</span>
          <TypeBadge type={activation.automationType} />
          <span className={styles.stepName}>{activation.automationName}</span>
          {activation.stageName && (
            <span className={styles.stepStage}>{activation.stageName}</span>
          )}
          {activation.rank !== undefined && (
            <span className={styles.stepStage}>#{activation.rank}</span>
          )}
          <Badge appearance="tint" color={activation.mode === 'Sync' ? 'warning' : 'success'} className={styles.stepBadge}>
            {activation.mode}
          </Badge>
          {activation.firingStatus === 'WillFireNoFilter' && (
            <Tooltip content="No filtering attributes — fires on ALL updates" relationship="description">
              <Badge appearance="filled" color="danger" className={styles.stepBadge}>&#9888; No filter</Badge>
            </Tooltip>
          )}
        </div>

        {/* Branch block */}
        {hasDownstream && activation.downstream && (
          <div className={styles.branchBlock} style={{ borderLeftColor: downstreamColor }}>
            <div className={styles.branchTarget} style={{ color: downstreamColor }}>
              &rarr; {activation.downstream.targetEntityDisplayName}
              <OperationBadge operation={activation.downstream.operation} />
            </div>
            {activation.downstream.fields.length > 0 && (
              <div className={styles.branchFields}>
                {activation.downstream.fields.slice(0, 4).map(f => (
                  <span key={f} className={styles.branchField}>{f}</span>
                ))}
                {activation.downstream.fields.length > 4 && (
                  <span className={styles.branchField}>+{activation.downstream.fields.length - 4}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Field match verdict */}
      <FieldMatchVerdict activation={activation} trace={trace} styles={styles} />

      {/* Inline downstream pipeline */}
      {downstreamView && downstreamTrace && depth < 2 && (
        <ChildEntitySection
          entityView={downstreamView}
          trace={downstreamTrace}
          analysis={analysis}
          depth={depth + 1}
          accentColor={downstreamColor}
          parentDisplayName={parentEntityDisplayName}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ChildEntitySection — indented inline downstream pipeline
───────────────────────────────────────────────────────────────────────── */
function ChildEntitySection({
  entityView, trace, analysis, depth, accentColor, parentDisplayName,
}: {
  entityView: CrossEntityEntityView;
  trace: CrossEntityTrace;
  analysis: CrossEntityAnalysisResult;
  depth: number;
  accentColor: string;
  parentDisplayName: string;
}) {
  const styles = useStyles();
  const [open, setOpen] = useState(true);

  const willFire = trace.activations.filter(a => a.firingStatus !== 'WontFire');
  const stepCount = trace.activations.length;

  return (
    <div className={styles.childSection}>
      <div
        className={styles.childHeader}
        style={{ borderLeft: `3px solid ${accentColor}`, borderColor: `${accentColor}` }}
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.childArrow} style={{ color: accentColor }}>&#8627;</span>
        <Text weight="semibold" className={styles.childEntityName}>{entityView.entityDisplayName}</Text>
        <Text className={styles.childLogicalName}>
          {entityView.entityLogicalName}
        </Text>
        <OperationBadge operation={trace.entryPoint.operation} />
        <Text className={styles.childStepCount}>
          {willFire.length} step{willFire.length !== 1 ? 's' : ''} &bull; {open ? '▲' : `▶ expand (${stepCount})`}
        </Text>
      </div>

      {open && (
        <div className={styles.childSteps} style={{ borderLeft: `3px solid ${accentColor}40` }}>
          <TracePipeline
            trace={trace}
            analysis={analysis}
            depth={depth}
            parentEntityDisplayName={entityView.entityDisplayName}
          />
        </div>
      )}

      <div className={styles.returnMarker} style={{ borderLeft: `2px solid ${accentColor}40` }}>
        &#8617; back to {parentDisplayName}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FieldMatchVerdict — verdict block shown beneath each step
───────────────────────────────────────────────────────────────────────── */
function FieldMatchVerdict({
  activation, trace, styles,
}: {
  activation: AutomationActivation;
  trace: CrossEntityTrace;
  styles: ReturnType<typeof useStyles>;
}) {
  const { firingStatus, matchedFields, filteringAttributes } = activation;
  const isCreateOrDelete = trace.entryPoint.operation === 'Create' || trace.entryPoint.operation === 'Delete';

  if (firingStatus === 'WillFire') {
    if (isCreateOrDelete) {
      return (
        <div className={mergeClasses(styles.fieldMatchBase, styles.fieldMatchFires)}>
          <div className={styles.matchVerdict} style={{ color: tokens.colorPaletteGreenForeground1 }}>
            <CheckmarkCircle16Regular /> FIRES — all {trace.entryPoint.operation} automations fire
          </div>
        </div>
      );
    }
    return (
      <div className={mergeClasses(styles.fieldMatchBase, styles.fieldMatchFires)}>
        <div className={styles.matchVerdict} style={{ color: tokens.colorPaletteGreenForeground1 }}>
          <CheckmarkCircle16Regular /> WILL FIRE
          {filteringAttributes.length > 0 && ' — matched filtering attributes'}
        </div>
        {matchedFields.length > 0 && (
          <FieldPills
            entryFields={trace.entryPoint.fields}
            filterFields={filteringAttributes}
            matchedFields={matchedFields}
            styles={styles}
          />
        )}
      </div>
    );
  }

  if (firingStatus === 'WontFire') {
    return (
      <div className={mergeClasses(styles.fieldMatchBase, styles.fieldMatchNoFire)}>
        <div className={styles.matchVerdict} style={{ color: tokens.colorNeutralForeground3 }}>
          <ErrorCircle16Regular /> WON'T FIRE — no overlap between updated fields and filter
        </div>
        <FieldPills
          entryFields={trace.entryPoint.fields}
          filterFields={filteringAttributes}
          matchedFields={matchedFields}
          styles={styles}
        />
      </div>
    );
  }

  if (firingStatus === 'WillFireNoFilter') {
    return (
      <div className={mergeClasses(styles.fieldMatchBase, styles.fieldMatchNoFilter)}>
        <div className={styles.matchVerdict} style={{ color: tokens.colorPaletteRedForeground1 }}>
          &#9888;&#65039; WILL FIRE — no filtering attributes, fires on ALL updates
        </div>
        <Text className={styles.noFilterAdvisory}>
          Add filtering attributes to this {activation.automationType.toLowerCase()} to improve performance.
        </Text>
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────────────────────────────────
   FieldPills — entry fields vs filter fields with hit/miss highlighting
───────────────────────────────────────────────────────────────────────── */
function FieldPills({
  entryFields, filterFields, matchedFields, styles,
}: {
  entryFields: string[];
  filterFields: string[];
  matchedFields: string[];
  styles: ReturnType<typeof useStyles>;
}) {
  const matchedSet = new Set(matchedFields.map(f => f.toLowerCase()));

  const showEntry = entryFields.length > 0;
  const showFilter = filterFields.length > 0 && filterFields[0] !== filterFields.join(''); // avoid showing when it's just a single label

  return (
    <div>
      {showEntry && (
        <div className={styles.fieldPillRow}>
          <Text className={styles.fieldPillLabel}>Updated:</Text>
          {entryFields.slice(0, 6).map(f => (
            <span key={f} className={matchedSet.has(f.toLowerCase()) ? styles.mpillHit : styles.mpillMiss}>
              {f}{matchedSet.has(f.toLowerCase()) ? ' ✔' : ''}
            </span>
          ))}
          {entryFields.length > 6 && <span className={styles.mpillMiss}>+{entryFields.length - 6}</span>}
        </div>
      )}
      {showFilter && filterFields.length > 0 && (
        <div className={styles.fieldPillRow}>
          <Text className={styles.fieldPillLabel}>Filter:</Text>
          {filterFields.slice(0, 6).map(f => (
            <span key={f} className={matchedSet.has(f.toLowerCase()) ? styles.mpillHit : styles.mpillMiss}>
              {f}{matchedSet.has(f.toLowerCase()) ? ' ✔' : ''}
            </span>
          ))}
          {filterFields.length > 6 && <span className={styles.mpillMiss}>+{filterFields.length - 6}</span>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Shared small components
───────────────────────────────────────────────────────────────────────── */
function TypeBadge({ type }: { type: AutomationActivation['automationType'] | PipelineStep['automationType'] }) {
  const color = type === 'Plugin' ? 'important'
    : type === 'Flow' ? 'success'
    : type === 'BusinessRule' ? 'brand'
    : 'warning';
  const styles = useStyles();
  return (
    <Badge appearance="outline" color={color} className={styles.stepBadge}>
      {typeIcon(type)} {type}
    </Badge>
  );
}

function OperationBadge({ operation }: { operation: string }) {
  const styles = useStyles();
  return (
    <Badge
      appearance="tint"
      color={operation === 'Create' ? 'success' : operation === 'Delete' ? 'danger' : 'warning'}
      className={styles.stepBadge}
    >
      {operation}
    </Badge>
  );
}
