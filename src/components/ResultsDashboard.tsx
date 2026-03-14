import { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Title2,
  Title3,
  Text,
  Card,
  Tab,
  TabList,
  Tooltip,
  makeStyles,
  tokens,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  ArrowDownload24Regular,
  ArrowLeft24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
} from '@fluentui/react-icons';
import {
  DashboardIcon,
  ErdIcon,
  ExternalDependenciesIcon,
  SolutionDistributionIcon,
  CrossEntityAutomationIcon,
  FetchLogIcon,
} from './componentIcons';
import type { BlueprintResult } from '../core';
import type { ScopeSelection } from '../types/scope';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import { ERDView } from './ERDView';
import { CrossEntityAutomationView } from './CrossEntityAutomationView';
import { ExternalDependenciesView } from './ExternalDependenciesView';
import { SolutionDistributionView } from './SolutionDistributionView';
import { ExportDialog } from './ExportDialog';
import { FetchDiagnosticsView } from './FetchDiagnosticsView';
import { Footer } from './Footer';
import { COMPONENT_TABS, getDefaultTabKey } from './ComponentTabRegistry';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXXL,
    width: '95%',
    maxWidth: '1800px',
    margin: '0 auto',
    minHeight: '100vh',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    '@media (min-width: 1920px)': {
      width: '90%',
      maxWidth: '2200px',
    },
    '@media (min-width: 3840px)': {
      width: '85%',
      maxWidth: '3200px',
    },
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
  },
  backButton: {},
  header: {
    marginBottom: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  titleContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  checkIcon: {
    color: tokens.colorPaletteGreenForeground1,
  },
  metadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground3,
  },
  mainTabsSection: {
    marginTop: tokens.spacingVerticalXL,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalL,
  },
  section: {
    marginBottom: tokens.spacingVerticalL,
  },
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
  warningsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  warningsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorStatusWarningBorderActive}`,
    backgroundColor: tokens.colorStatusWarningBackground1,
  },
  warningsPanelError: {
    border: `1px solid ${tokens.colorStatusDangerBorderActive}`,
    backgroundColor: tokens.colorStatusDangerBackground1,
  },
  warningRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
  },
  warningStep: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    minWidth: '110px',
    fontWeight: tokens.fontWeightSemibold,
  },
  warningMessage: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  browserSection: {
    marginTop: tokens.spacingVerticalXL,
  },
});

export interface ResultsDashboardProps {
  result: BlueprintResult;
  scope: ScopeSelection;
  onStartOver: () => void;
}

export function ResultsDashboard({ result, scope, onStartOver }: ResultsDashboardProps) {
  const styles = useStyles();

  const defaultSelectedKey = getDefaultTabKey(result);

  const [mainTab, setMainTab] = useState<string>('dashboard');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>(defaultSelectedKey);
  const [selectedCard, setSelectedCard] = useState<string | null>(defaultSelectedKey);
  const browserSectionRef = useRef<HTMLDivElement>(null);

  const hasERD = !!result.erd;
  const hasExternalDeps = !!(result.externalEndpoints && result.externalEndpoints.length > 0);
  const hasSolutionDist = !!(result.solutionDistribution && result.solutionDistribution.length > 0);

  const formattedDate = formatDate(result.metadata.generatedAt);
  const formattedTime = formatDateTime(result.metadata.generatedAt).split(' ')[1];

  const scopeDescription = (): string => {
    if (scope.type === 'publisher') {
      const prefixes = scope.publisherPrefixes.join(', ');
      const names = scope.publisherNames.join(', ');
      return `Publishers: ${names} (${prefixes})`;
    } else {
      const count = scope.solutionNames.length;
      return `Solutions: ${scope.solutionNames.join(', ')} (${count} solution${count > 1 ? 's' : ''})`;
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Button
          className={styles.backButton}
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={onStartOver}
        >
          Generate New Blueprint
        </Button>
      </div>

      {/* SECTION 1: Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleContent}>
            <CheckmarkCircle24Regular className={styles.checkIcon} />
            <Title2>Solution Blueprint Generated</Title2>
          </div>
          <Button
            appearance="primary"
            icon={<ArrowDownload24Regular />}
            onClick={() => setShowExportDialog(true)}
          >
            Export
          </Button>
        </div>

        <div className={styles.metadata}>
          <Text style={{ fontSize: tokens.fontSizeBase200 }}>
            {formattedDate} at {formattedTime} • {scopeDescription()}
          </Text>
        </div>
      </div>

      {/* Step warnings */}
      {result.stepWarnings && result.stepWarnings.length > 0 && (() => {
        const hasFullFailures = result.stepWarnings!.some(w => !w.partial);
        return (
          <div className={`${styles.warningsPanel}${hasFullFailures ? ` ${styles.warningsPanelError}` : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              {hasFullFailures
                ? <ErrorCircle24Regular style={{ color: tokens.colorStatusDangerForeground1, flexShrink: 0 }} />
                : <Warning24Regular style={{ color: tokens.colorStatusWarningForeground1, flexShrink: 0 }} />
              }
              <Text weight="semibold" style={{ color: hasFullFailures ? tokens.colorStatusDangerForeground1 : tokens.colorStatusWarningForeground1 }}>
                {hasFullFailures ? 'Some components could not be loaded' : 'Some data may be incomplete'}
              </Text>
              <Badge color="danger" shape="rounded" size="small" style={{ marginLeft: 'auto' }}>
                {result.stepWarnings!.length} {result.stepWarnings!.length === 1 ? 'issue' : 'issues'}
              </Badge>
            </div>
            {result.stepWarnings!.map((w, i) => (
              <div key={i} className={styles.warningRow}>
                <Text className={styles.warningStep}>{w.step}</Text>
                <Text className={styles.warningMessage}>{w.message}</Text>
              </div>
            ))}
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
              Open the <strong>Fetch Log</strong> tab for full API call details.
            </Text>
          </div>
        );
      })()}

      {/* Main Tabs */}
      <div className={styles.mainTabsSection}>
        <TabList
          selectedValue={mainTab}
          onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
            setMainTab(data.value as string);
          }}
        >
          <Tab value="dashboard" icon={<DashboardIcon />}>Dashboard</Tab>

          {hasERD && (
            <Tab value="erd" icon={<ErdIcon />}>Entity Relationship Diagram</Tab>
          )}

          {hasExternalDeps && (
            <Tab value="externalDeps" icon={<ExternalDependenciesIcon />}>External Dependencies</Tab>
          )}

          {hasSolutionDist && (
            <Tab value="solutionDist" icon={<SolutionDistributionIcon />}>Solution Distribution</Tab>
          )}

          <Tab value="crossEntity" icon={<CrossEntityAutomationIcon />}>
            Cross-Entity Automation
            <Badge appearance="filled" shape="rounded" color="warning" size="small" style={{ marginLeft: tokens.spacingHorizontalXXS }}>Preview</Badge>
          </Tab>

          {(result.fetchLog && result.fetchLog.length > 0) && (
            <Tab value="fetchLog" icon={<FetchLogIcon />}>
              Fetch Log
              {result.fetchLog.some(e => e.status === 'failed') && (
                <Badge color="danger" shape="circular" size="small" style={{ marginLeft: tokens.spacingHorizontalXXS }}>
                  {result.fetchLog.filter(e => e.status === 'failed').length}
                </Badge>
              )}
            </Tab>
          )}
        </TabList>
      </div>

      {/* Dashboard Tab Content */}
      {mainTab === 'dashboard' && (
        <>
          {/* SECTION 2: Discovery Summary */}
          <div className={styles.section}>
            <Card>
              <Title3>Component Summary</Title3>
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
                      onClick={
                        hasData
                          ? () => {
                              setSelectedCard(tab.key);
                              setSelectedTab(tab.key);
                              browserSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }
                          : undefined
                      }
                      style={hasData ? { cursor: 'pointer' } : undefined}
                    >
                      <div className={styles.summaryCardContent}>
                        <span style={{ color: hasData ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground4, lineHeight: 1 }}>{tab.icon}</span>
                        <Text className={styles.summaryCount}>{count}</Text>
                        <Text className={styles.summaryLabel}>{tab.label}</Text>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* SECTION 3: Component Browser (Tabbed Interface) */}
          <div className={styles.browserSection} ref={browserSectionRef}>
            <Card>
              <Title3>Component Browser</Title3>
              <TabList
                selectedValue={selectedTab}
                onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
                  setSelectedTab(data.value as string);
                  setSelectedCard(data.value as string);
                }}
                size="small"
                style={{
                  flexWrap: 'wrap',
                  gap: tokens.spacingHorizontalS,
                }}
              >
                {COMPONENT_TABS.map((tab) => {
                  if (tab.hidden?.(result)) return null;
                  const count = tab.count(result);
                  const isSelected = selectedTab === tab.key;
                  return (
                    <Tooltip key={tab.key} content={tab.label} relationship="label">
                      <Tab value={tab.key} icon={tab.icon}>
                        {isSelected ? `${tab.label} (${count})` : `${count}`}
                      </Tab>
                    </Tooltip>
                  );
                })}
              </TabList>

              {/* Tab Content — driven by registry */}
              <div style={{ marginTop: tokens.spacingVerticalL }}>
                {COMPONENT_TABS.map((tab) => {
                  if (selectedTab !== tab.key) return null;
                  if (tab.hidden?.(result)) return null;
                  return <div key={tab.key}>{tab.render(result)}</div>;
                })}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ERD Tab Content */}
      {mainTab === 'erd' && hasERD && (
        <div className={styles.tabContent}>
          <ERDView erd={result.erd!} blueprintResult={result} />
        </div>
      )}

      {/* External Dependencies Tab Content */}
      {mainTab === 'externalDeps' && hasExternalDeps && (
        <div className={styles.tabContent}>
          <ExternalDependenciesView endpoints={result.externalEndpoints!} />
        </div>
      )}

      {/* Solution Distribution Tab Content */}
      {mainTab === 'solutionDist' && hasSolutionDist && (
        <div className={styles.tabContent}>
          <SolutionDistributionView distributions={result.solutionDistribution!} />
        </div>
      )}

      {/* Cross-Entity Automation Tab Content */}
      {mainTab === 'crossEntity' && (
        <div className={styles.tabContent}>
          <CrossEntityAutomationView
            analysis={result.crossEntityAnalysis}
            blueprints={result.entities}
          />
        </div>
      )}

      {/* Fetch Log Tab Content */}
      {mainTab === 'fetchLog' && (
        <div className={styles.tabContent}>
          <FetchDiagnosticsView entries={result.fetchLog ?? []} />
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        result={result}
        onClose={() => setShowExportDialog(false)}
      />

      <Footer />
    </div>
  );
}
