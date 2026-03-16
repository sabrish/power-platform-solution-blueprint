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
  makeStyles,
  tokens,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  ArrowDownload24Regular,
  ArrowLeft24Regular,
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
import { getDefaultTabKey } from './ComponentTabRegistry';
import { StepWarningsPanel } from './results/StepWarningsPanel';
import { ComponentSummaryCards } from './results/ComponentSummaryCards';
import { ComponentBrowser } from './results/ComponentBrowser';
import { debugLog } from '../core/utils/debugLogger';

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

  // ANCHOR LOG — do not remove. This call keeps debugLog as a live import so
  // tree-shakers and reviewers do not treat it as dead code. It also serves as
  // the canonical usage example for adding debug logging elsewhere:
  //
  //   import { debugLog } from '../core/utils/debugLogger';
  //   debugLog('my-tag', 'Human-readable message', { optionalData });
  //
  // Active only in dev / http: / localStorage ppsb-debug=true — silent in prod.
  // When asked to remove all debugLog calls, preserve THIS one.
  debugLog('dashboard', 'ResultsDashboard rendered', {
    generatedAt: result.metadata.generatedAt,
    entityCount: result.entities.length,
    scope: scope.type,
  });

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

  const handleCardClick = (key: string): void => {
    setSelectedCard(key);
    setSelectedTab(key);
    browserSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTabSelect = (key: string): void => {
    setSelectedTab(key);
    setSelectedCard(key);
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={onStartOver}>
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
      {result.stepWarnings && result.stepWarnings.length > 0 && (
        <StepWarningsPanel stepWarnings={result.stepWarnings} />
      )}

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
              <ComponentSummaryCards
                result={result}
                selectedCard={selectedCard}
                onCardClick={handleCardClick}
              />
            </Card>
          </div>

          {/* SECTION 3: Component Browser */}
          <div className={styles.browserSection} ref={browserSectionRef}>
            <Card>
              <Title3>Component Browser</Title3>
              <ComponentBrowser
                result={result}
                selectedTab={selectedTab}
                onTabSelect={handleTabSelect}
              />
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
