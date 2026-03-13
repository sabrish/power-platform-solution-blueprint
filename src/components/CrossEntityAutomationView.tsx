import { useState, useCallback, Fragment } from 'react';
import {
  Text,
  Title3,
  Card,
  Badge,
  makeStyles,
  tokens,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  ToggleButton,
  Checkbox,
} from '@fluentui/react-components';
import { FilterBar, FilterGroup } from './FilterBar';
import {
  ArrowRight24Regular,
  Warning24Regular,
  Info16Regular,
} from '@fluentui/react-icons';
import { EmptyState } from './EmptyState';
import {
  DetectionCoverageBanner,
  EntityPipelineRow,
  EntityMessagePipelineRow,
  OperationBadge,
} from './CrossEntityAutomation';
import type {
  CrossEntityAnalysisResult,
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
function entityColor(index: number): string { return ENTITY_COLORS[index % ENTITY_COLORS.length]; }

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
  entityEntryPreview: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 },

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

  /* ── Custom Action Triggers section — per-trace info card ── */
  actionInfoCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalXS,
  },
  actionInfoCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  actionInfoCardName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    minWidth: 0,
    wordBreak: 'break-word',
  },
  actionInfoCardSource: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  actionInfoCardApiName: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  actionInfoCardNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXXS,
  },
  actionInfoCardNoteIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
    marginTop: '2px',
  },
  actionInfoCardNoteText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
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
                const visible = showAllEntities || p.hasCrossEntityOutput || p.hasExternalInteraction;
                if (!visible) return false;
                if (!pipelineSearch.trim()) return true;
                const q = pipelineSearch.toLowerCase();
                return p.entityDisplayName.toLowerCase().includes(q) || logicalName.toLowerCase().includes(q);
              }).length
            }
            totalCount={showAllEntities
              ? analysis.allEntityPipelines.size
              : Array.from(analysis.allEntityPipelines.values()).filter(p => p.hasCrossEntityOutput || p.hasExternalInteraction).length
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
          {!showAllEntities && (
            <Text className={styles.entityEntryPreview} style={{ display: 'block', marginTop: tokens.spacingVerticalXS }}>
              Default: entities with cross-entity writes or external API calls.
            </Text>
          )}

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
              // Filter: show entities with cross-entity output or external interaction by default.
              // Entities that are purely inbound targets (hasCrossEntityInput only) are hidden
              // unless showAllEntities is toggled — they appear correctly as nested children already.
              .filter(([, p]) => showAllEntities || p.hasCrossEntityOutput || p.hasExternalInteraction)
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
                      pipeline={pipeline}
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
