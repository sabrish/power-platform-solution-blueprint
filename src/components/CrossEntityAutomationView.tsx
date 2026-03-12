import { useState, useCallback, Fragment, type ReactElement } from 'react';
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
  Button,
  ToggleButton,
  Checkbox,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import {
  ArrowRight24Regular,
  Warning24Regular,
  Warning20Regular,
  Lightbulb24Regular,
  CheckmarkCircle16Regular,
  ErrorCircle16Regular,
  Info16Regular,
} from '@fluentui/react-icons';
import { EmptyState } from './EmptyState';
import {
  PluginsIcon as BracesVariable24Regular,
  FlowsIcon as CloudFlow24Regular,
  BusinessRulesIcon as ClipboardTaskListLtr24Regular,
  ClassicWorkflowsIcon as ClipboardSettings24Regular,
  WebResourcesIcon as DocumentGlobe24Regular,
} from './componentIcons';
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
function entityColor(index: number) { return ENTITY_COLORS[index % ENTITY_COLORS.length]; }

/* ─────────────────────────────────────────────────────────────────────────
   Type helpers
───────────────────────────────────────────────────────────────────────── */
// tokens.fontSizeBase200 = 12px — used for inline type icon sizing (AUDIT-004 compliant)
const TYPE_ICON_STYLE = { width: tokens.fontSizeBase200, height: tokens.fontSizeBase200, flexShrink: 0, verticalAlign: 'middle' } as const;
function typeIcon(type: AutomationActivation['automationType'] | PipelineStep['automationType']): ReactElement {
  switch (type) {
    case 'Plugin': return <BracesVariable24Regular style={TYPE_ICON_STYLE} />;
    case 'Flow': return <CloudFlow24Regular style={TYPE_ICON_STYLE} />;
    case 'BusinessRule': return <ClipboardTaskListLtr24Regular style={TYPE_ICON_STYLE} />;
    case 'ClassicWorkflow': return <ClipboardSettings24Regular style={TYPE_ICON_STYLE} />;
    default: return <ArrowRight24Regular style={TYPE_ICON_STYLE} />;
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

  entityRow: { display: 'flex', flexDirection: 'column', marginBottom: '2px' /* structural micro-spacing — no token equivalent */ },

  entityHeader: {
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`, cursor: 'pointer',
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
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM} ${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
  },

  /* Trace sub-header (shown when entity has multiple entry points) */
  traceSubHeader: {
    padding: `${tokens.spacingVerticalXXS} 0`,
    marginBottom: tokens.spacingVerticalXXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },

  /* Step rows */
  pipelineStepRow: {
    display: 'flex', gap: 0, alignItems: 'stretch',
    marginBottom: '1px', /* structural 1px separator — no token equivalent */
  },
  stepMain: {
    flex: 1, padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
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
    width: '200px', padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
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
  branchFields: { display: 'flex', gap: tokens.spacingHorizontalXXS, flexWrap: 'wrap', marginTop: tokens.spacingVerticalXXS },
  branchField: {
    fontFamily: 'monospace', fontSize: tokens.fontSizeBase100, padding: `0 ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
  },

  /* Field match verdict block */
  fieldMatchBase: {
    marginTop: tokens.spacingVerticalXXS,
    marginBottom: tokens.spacingVerticalXS,
    marginLeft: tokens.spacingHorizontalXXL,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
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
  matchPills: { display: 'flex', gap: tokens.spacingHorizontalXXS, flexWrap: 'wrap', marginTop: tokens.spacingVerticalXXS },
  mpillHit: {
    fontFamily: 'monospace', fontSize: tokens.fontSizeBase100, padding: `0 ${tokens.spacingHorizontalXS}`, borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground1,
    border: `1px solid ${tokens.colorPaletteGreenBorderActive}`,
    fontWeight: tokens.fontWeightSemibold,
  },
  mpillMiss: {
    fontFamily: 'monospace', fontSize: tokens.fontSizeBase100, padding: `0 ${tokens.spacingHorizontalXS}`, borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },

  /* Child entity inline section — structural micro-spacing; no token equivalent for 3px */
  childSection: { marginLeft: '24px', marginTop: '3px', marginBottom: tokens.spacingVerticalXS },
  childHeader: {
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: `${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium} 0 0`,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderBottom: 'none',
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  childSteps: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS} ${tokens.spacingVerticalS}`,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  returnMarker: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM} ${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalL}`,
    fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3,
    fontStyle: 'italic', marginBottom: tokens.spacingVerticalXXS,
  },

  /* Won't fire section */
  wontFireBtnWrapper: {
    width: '100%', marginTop: tokens.spacingVerticalXXS,
    display: 'flex',
  },
  wontFireItem: {
    display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXXS,
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
  filterButton: {
    minWidth: 'unset',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
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

  /* ── Chain map automation cell ── */
  chainAutoCell: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS },
  chainAutoBadge: { width: 'fit-content' },

  /* ── Trace confidence badge (very small) ── */
  tinyBadge: { fontSize: tokens.fontSizeBase100 },

  /* ── Trace divider (dashed horizontal separator between entry points) ── */
  traceDivider: {
    borderTop: `1px dashed ${tokens.colorNeutralStroke2}`,
    margin: `${tokens.spacingVerticalS} 0`,
  },

  /* ── Step mode badge / no-filter badge (small + flexShrink) ── */
  stepBadge: { fontSize: tokens.fontSizeBase100, flexShrink: 0 },

  /* ── Filtering attributes text shown inside a step row ── */
  stepFilterText: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3, flexShrink: 0 },

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
  wontFireItemStage: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },
  wontFireItemFilter: {
    fontSize: tokens.fontSizeBase100,
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
    padding: `0 ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusSmall,
  },

  /* ── ChildEntitySection header text elements ── */
  childArrow: { fontSize: tokens.fontSizeBase100 },
  childEntityName: { fontSize: tokens.fontSizeBase300 },
  childLogicalName: { fontFamily: 'monospace', fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },
  childStepCount: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },

  /* ── FieldMatchVerdict: "WillFireNoFilter" advisory text ── */
  noFilterAdvisory: { fontSize: tokens.fontSizeBase100, color: tokens.colorPaletteRedForeground1 },

  /* ── FieldPills row layout ── */
  fieldPillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalXXS,
  },
  fieldPillLabel: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 },

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

  /* ── Banner coverage list rows ── */
  bannerListRow: {
    margin: 0, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS,
  },
  bannerListRowSpaced: {
    margin: 0, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXXS,
  },
  bannerListIcon: {
    // tokens.fontSizeBase300 = 14px — banner inline icon sizing (AUDIT-004 compliant)
    width: tokens.fontSizeBase300, height: tokens.fontSizeBase300, flexShrink: 0,
  },

  /* ── Empty-state icons ── */
  emptyStateIconLarge: { fontSize: tokens.fontSizeHero900 },
  emptyStateIconMedium: { fontSize: tokens.fontSizeHero800 },

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

export function CrossEntityAutomationView({ analysis }: CrossEntityAutomationViewProps): JSX.Element {
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

  const toggleEntity = useCallback((name: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);

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
      <DetectionCoverageBanner />

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
                  <Badge appearance="filled" shape="rounded" color={
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
                  <Badge appearance="filled" shape="rounded" color="warning">{risk.type}</Badge>
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
          <FilterBar
            searchValue={pipelineSearch}
            onSearchChange={setPipelineSearch}
            searchPlaceholder="Search entities..."
            filteredCount={
              Array.from(analysis.allEntityPipelines.entries()).filter(([logicalName, p]) => {
                const visible = showAllEntities || p.hasCrossEntityOutput || p.hasCrossEntityInput || p.hasExternalInteraction;
                if (!visible) return false;
                if (!pipelineSearch.trim()) return true;
                const q = pipelineSearch.toLowerCase();
                return p.entityDisplayName.toLowerCase().includes(q) || logicalName.toLowerCase().includes(q);
              }).length
            }
            totalCount={showAllEntities
              ? analysis.allEntityPipelines.size
              : Array.from(analysis.allEntityPipelines.values()).filter(p => p.hasCrossEntityOutput || p.hasCrossEntityInput || p.hasExternalInteraction).length
            }
            itemLabel="entities"
          >
            <FilterGroup
              label="Show:"
              hasActiveFilters={showAllEntities}
              onClear={() => setShowAllEntities(false)}
            >
              <Checkbox
                label="Show all entities with automation"
                checked={showAllEntities}
                onChange={(_e, data) => setShowAllEntities(!!data.checked)}
              />
            </FilterGroup>
          </FilterBar>

          {/* Empty state: no cross-entity links at all and filter is on */}
          {analysis.entityViews.size === 0 && !showAllEntities && (
            <EmptyState type="search" />
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
              // Filter: show entities with cross-entity output, inbound entry points, or external interaction
              // unless showAllEntities is toggled (which shows all entities with any automation)
              .filter(([, p]) => showAllEntities || p.hasCrossEntityOutput || p.hasCrossEntityInput || p.hasExternalInteraction)
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
                  <EmptyState type="search" />
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Sub-view 2: Global Chain Map ── */}
      {subView === 'map' && (
        <div className={styles.chainMapContainer}>
          {/* Filter bar with search + type/operation toggles */}
          <FilterBar
            searchValue={chainSearch}
            onSearchChange={setChainSearch}
            searchPlaceholder="Search source, target, or automation name..."
            filteredCount={filteredLinks.length}
            totalCount={analysis.chainLinks.length}
            itemLabel="links"
          >
            <FilterGroup
              label="Type:"
              hasActiveFilters={filterType !== 'all'}
              onClear={() => setFilterType('all')}
            >
              {(['all', 'Flow', 'ClassicWorkflow'] as const).map(t => (
                <ToggleButton
                  key={t}
                  appearance="outline"
                  className={styles.filterButton}
                  size="small"
                  checked={filterType === t}
                  onClick={() => setFilterType(filterType === t && t !== 'all' ? 'all' : t)}
                >
                  {t === 'all' ? 'All Types' : t}
                </ToggleButton>
              ))}
            </FilterGroup>
            <FilterGroup
              label="Operation:"
              hasActiveFilters={filterOperation !== 'all'}
              onClear={() => setFilterOperation('all')}
            >
              {(['all', 'Create', 'Update', 'Delete', 'Action'] as const).map(op => (
                <ToggleButton
                  key={op}
                  appearance="outline"
                  className={styles.filterButton}
                  size="small"
                  checked={filterOperation === op}
                  onClick={() => setFilterOperation(filterOperation === op && op !== 'all' ? 'all' : op)}
                >
                  {op === 'all' ? 'All Ops' : op === 'Action' ? 'Custom Action' : op}
                </ToggleButton>
              ))}
            </FilterGroup>
          </FilterBar>

          {filteredLinks.length === 0 ? (
            <EmptyState type="search" />
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
                  <Fragment key={i}>
                    <div>
                      <Text weight="semibold">{link.sourceEntityDisplayName}</Text>
                      <br />
                      <Text className={styles.monoText} style={{ color: tokens.colorNeutralForeground3 }}>{link.sourceEntity}</Text>
                    </div>
                    <ArrowRight24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                    <div>
                      <Text weight="semibold">{link.targetEntityDisplayName}</Text>
                      {link.targetEntity !== '(unbound)' && (
                        <>
                          <br />
                          <Text className={styles.monoText} style={{ color: tokens.colorNeutralForeground3 }}>{link.targetEntity}</Text>
                        </>
                      )}
                      {link.targetEntity === '(unbound)' && (
                        <>
                          <br />
                          <Text className={styles.monoText} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
                            No entity target — effects not traceable
                          </Text>
                        </>
                      )}
                    </div>
                    <div className={styles.chainAutoCell}>
                      <Text style={{ wordBreak: 'break-word' }}>{link.automationName}</Text>
                      <Badge appearance="outline" shape="rounded" color={link.automationType === 'Flow' ? 'success' : 'important'} className={styles.chainAutoBadge}>
                        {link.automationType}
                      </Badge>
                    </div>
                    <div>
                      <OperationBadge operation={link.operation} />
                      {link.operation === 'Action' && link.customActionApiName && (
                        <Text className={styles.monoText} style={{ color: tokens.colorNeutralForeground3, display: 'block', fontSize: tokens.fontSizeBase100 }}>
                          {link.customActionApiName}
                        </Text>
                      )}
                    </div>
                    <Badge appearance="tint" shape="rounded" color={link.isAsynchronous ? 'success' : 'warning'}>
                      {link.isAsynchronous ? 'Async' : 'Sync'}
                    </Badge>
                  </Fragment>
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
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
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
              <Badge appearance="tint" shape="rounded" color="informative">{view.traces.length} entry points</Badge>
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
                  {' '}— {trace.entryPoint.sourceEntityDisplayName} &rarr;{' '}
                  <strong>
                    {trace.entryPoint.operation === 'Action' && trace.entryPoint.customActionApiName
                      ? `Calls: ${trace.entryPoint.customActionApiName}`
                      : trace.entryPoint.operation}
                  </strong>
                  {' '}
                  <Badge appearance="tint" shape="rounded" color="informative" className={styles.tinyBadge}>
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
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
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
              <Badge appearance="tint" shape="rounded" color="informative">&rarr; cross-entity</Badge>
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
                <Badge appearance="tint" shape="rounded" color={step.mode === 'Sync' ? 'warning' : 'success'} className={styles.stepBadge}>
                  {step.mode}
                </Badge>
                {step.firesForAllUpdates && (
                  <Tooltip content="No filtering attributes — fires on ALL updates" relationship="description">
                    <Badge appearance="filled" shape="rounded" color="danger" className={styles.stepBadge}>&#9888; No filter</Badge>
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
      {/* Custom action informational note */}
      {trace.entryPoint.operation === 'Action' && (
        <div className={styles.entryFieldsRow} style={{ display: 'flex', alignItems: 'flex-start', gap: tokens.spacingHorizontalXS }}>
          <Info16Regular style={{ color: tokens.colorBrandForeground1, flexShrink: 0, marginTop: '2px' }} />
          <Text size={200} style={{ fontStyle: 'italic' }}>
            This entry point calls a bound custom action
            {trace.entryPoint.customActionApiName ? ` (${trace.entryPoint.customActionApiName})` : ''}.
            The action&apos;s internal effects on this entity are not analysed — plugins registered on the
            action&apos;s message may also fire.
          </Text>
        </div>
      )}

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
          {trace.entryPoint.operation === 'Action'
            ? 'No CRUD-registered automations detected for this custom action call. See note above.'
            : 'No automations registered on this entity for this message.'}
        </Text>
      )}

      {/* Won't fire — collapsed section */}
      {wontFire.length > 0 && (
        <>
          <div className={styles.wontFireBtnWrapper}>
            <Button appearance="subtle" size="small" onClick={() => setShowWontFire(s => !s)}>
              {showWontFire ? '▲' : '▼'} {wontFire.length} automation{wontFire.length !== 1 ? 's' : ''} won't fire for this entry point
            </Button>
          </div>
          {showWontFire && wontFire.map((act, i) => (
            <div key={i} className={styles.wontFireItem}>
              <span>{typeIcon(act.automationType)}</span>
              <Badge appearance="outline" shape="rounded" color="informative" className={styles.tinyBadge}>{act.automationType}</Badge>
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
          <Badge appearance="tint" shape="rounded" color={activation.mode === 'Sync' ? 'warning' : 'success'} className={styles.stepBadge}>
            {activation.mode}
          </Badge>
          {activation.firingStatus === 'WillFireNoFilter' && (
            <Tooltip content="No filtering attributes — fires on ALL updates" relationship="description">
              <Badge appearance="filled" shape="rounded" color="danger" className={styles.stepBadge}>&#9888; No filter</Badge>
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
        role="button"
        tabIndex={0}
        aria-expanded={open}
        style={{ borderLeft: `3px solid ${accentColor}`, borderColor: `${accentColor}` }}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } }}
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
        <div className={styles.matchVerdict} style={{ color: tokens.colorPaletteRedForeground1, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
          <Warning20Regular /> WILL FIRE — no filtering attributes, fires on ALL updates
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
  const showFilter = filterFields.length > 0;

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
function DetectionCoverageBanner(): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.banner}>
      <Lightbulb24Regular className={styles.bannerIcon} />
      <div className={styles.bannerContent}>
        <div className={styles.bannerTitleRow}>
          <Text weight="semibold">Detection Coverage Notice</Text>
          <Badge appearance="filled" shape="rounded" color="warning" size="small">Preview</Badge>
        </div>
        <Text as="p" className={styles.bannerListRow}><CloudFlow24Regular className={styles.bannerListIcon} /> <span><strong>Power Automate flows</strong> — cross-entity writes detected from flow JSON definitions.</span></Text>
        <Text as="p" className={styles.bannerListRow}><ClipboardSettings24Regular className={styles.bannerListIcon} /> <span><strong>Classic Workflows</strong> — cross-entity writes detected from XAML (CreateEntity / UpdateEntity steps).</span></Text>
        <Text as="p" className={styles.bannerListRow}><ClipboardTaskListLtr24Regular className={styles.bannerListIcon} /> <span><strong>Business Rules (server-scoped)</strong> — server-side rules detected from Dataverse workflow records. Form-scoped (client-only) rules are excluded.</span></Text>
        <div style={{ marginTop: tokens.spacingVerticalS, paddingTop: tokens.spacingVerticalS, borderTop: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, marginBottom: tokens.spacingVerticalXXS }}>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>Coming soon</Text>
            <Badge appearance="tint" shape="rounded" color="informative" size="small">Planned</Badge>
          </div>
          <Text as="p" className={styles.bannerListRow}><BracesVariable24Regular className={styles.bannerListIcon} /> <span><strong>Plugins (deep detection)</strong> — currently shows that a plugin fires (stage, filter attributes, firing status), but cannot identify what the plugin code itself writes to other entities. Plugin assembly decompilation is planned.</span></Text>
          <Text as="p" className={styles.bannerListRowSpaced}><DocumentGlobe24Regular className={styles.bannerListIcon} /> <span><strong>JavaScript Web Resources (static analysis)</strong> — currently cannot detect cross-entity Dataverse API calls embedded in custom JavaScript. JS static analysis is planned.</span></Text>
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: AutomationActivation['automationType'] | PipelineStep['automationType'] }): JSX.Element {
  const color = type === 'Plugin' ? 'important'
    : type === 'Flow' ? 'success'
    : type === 'BusinessRule' ? 'brand'
    : 'warning';
  const styles = useStyles();
  return (
    <Badge appearance="outline" shape="rounded" color={color} className={styles.stepBadge}>
      {typeIcon(type)} {type}
    </Badge>
  );
}

function OperationBadge({ operation }: { operation: string }): JSX.Element {
  const styles = useStyles();
  const label = operation === 'Manual' ? 'On-Demand / Manual Trigger'
    : operation === 'Action' ? 'Custom Action'
    : operation;
  const color = operation === 'Create' ? 'success'
    : operation === 'Delete' ? 'danger'
    : operation === 'Manual' ? 'informative'
    : operation === 'Action' ? 'brand'
    : 'warning';
  return (
    <Badge
      appearance="tint"
      shape="rounded"
      color={color}
      className={styles.stepBadge}
    >
      {label}
    </Badge>
  );
}
