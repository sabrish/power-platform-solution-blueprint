import { useMemo, useRef, useState } from 'react';
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
  EntitiesIcon,
  PluginsIcon,
  PluginPackagesIcon,
  FlowsIcon,
  BusinessRulesIcon,
  ClassicWorkflowsIcon,
  BusinessProcessFlowsIcon,
  CustomAPIsIcon,
  EnvironmentVariablesIcon,
  ConnectionReferencesIcon,
  WebResourcesIcon,
  GlobalChoicesIcon,
  CustomConnectorsIcon,
  SecurityRolesIcon,
  FieldSecurityProfilesIcon,
  CustomPagesIcon,
  DashboardIcon,
  ErdIcon,
  ExternalDependenciesIcon,
  SolutionDistributionIcon,
  CrossEntityAutomationIcon,
  FetchLogIcon,
} from './componentIcons';
import type { BlueprintResult, CustomAPI } from '../core';
import type { ScopeSelection } from '../types/scope';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import { PluginsList } from './PluginsList';
import { PluginPackagesList } from './PluginPackagesList';
import { EntityList } from './EntityList';
import { FlowsList } from './FlowsList';
import { BusinessRulesList } from './BusinessRulesList';
import { WebResourcesList } from './WebResourcesList';
import { ClassicWorkflowsList } from './ClassicWorkflowsList';
import { BusinessProcessFlowsList } from './BusinessProcessFlowsList';
import { CustomAPIsList } from './CustomAPIsList';
import { CustomAPIDetailView } from './CustomAPIDetailView';
import { EnvironmentVariablesList } from './EnvironmentVariablesList';
import { ConnectionReferencesList } from './ConnectionReferencesList';
import { GlobalChoicesList } from './GlobalChoicesList';
import { CustomConnectorsList } from './CustomConnectorsList';
import { ERDView } from './ERDView';
import { CrossEntityAutomationView } from './CrossEntityAutomationView';
import { ExternalDependenciesView } from './ExternalDependenciesView';
import { SolutionDistributionView } from './SolutionDistributionView';
import { ExportDialog } from './ExportDialog';
import { SecurityRolesView } from './SecurityRolesView';
import { FieldSecurityProfilesView } from './FieldSecurityProfilesView';
import { FetchDiagnosticsView } from './FetchDiagnosticsView';
import { Footer } from './Footer';
import { EmptyState } from './EmptyState';

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
  browserSection: {
    marginTop: tokens.spacingVerticalXL,
  },
});

export interface ResultsDashboardProps {
  result: BlueprintResult;
  scope: ScopeSelection;
  blueprintGenerator: any;
  onStartOver: () => void;
}

export function ResultsDashboard({ result, scope, blueprintGenerator, onStartOver }: ResultsDashboardProps) {
  const styles = useStyles();

  // Compute default selected card — first component type with data (evaluated once before hooks)
  const defaultSelectedKey = (() => {
    const s = result.summary;
    if (s.totalEntities > 0) return 'entities';
    if (s.totalPlugins > 0) return 'plugins';
    if (s.totalPluginPackages > 0) return 'pluginPackages';
    if (s.totalFlows > 0) return 'flows';
    if (s.totalBusinessRules > 0) return 'businessRules';
    if (s.totalClassicWorkflows > 0) return 'classicWorkflows';
    if (s.totalBusinessProcessFlows > 0) return 'businessProcessFlows';
    if (s.totalCustomAPIs > 0) return 'customAPIs';
    if (s.totalEnvironmentVariables > 0) return 'environmentVariables';
    if (s.totalConnectionReferences > 0) return 'connectionReferences';
    if (s.totalGlobalChoices > 0) return 'globalChoices';
    if (s.totalCustomConnectors > 0) return 'customConnectors';
    if (s.totalWebResources > 0) return 'webResources';
    if ((result.securityRoles?.length ?? 0) > 0) return 'securityRoles';
    if ((result.fieldSecurityProfiles?.length ?? 0) > 0) return 'fieldSecurityProfiles';
    if (s.totalCustomPages > 0) return 'customPages';
    return 'entities';
  })();

  const [mainTab, setMainTab] = useState<string>('dashboard');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>(defaultSelectedKey);
  const [selectedCard, setSelectedCard] = useState<string | null>(defaultSelectedKey);
  const [selectedCustomAPI, setSelectedCustomAPI] = useState<CustomAPI | null>(null);
  const browserSectionRef = useRef<HTMLDivElement>(null);

  // Check what architecture features are available
  const hasERD = !!result.erd;
  const hasExternalDeps = !!(result.externalEndpoints && result.externalEndpoints.length > 0);
  const hasSolutionDist = !!(result.solutionDistribution && result.solutionDistribution.length > 0);

  // Derive plugin package count from unique assembly names in the plugin steps array.
  // totalPluginPackages counts inventory components and can differ from unique assemblies
  // that actually have steps, causing mismatched counts/empty states in PluginPackagesList.
  const uniquePluginPackageCount = useMemo(
    () => new Set(result.plugins.map((p) => p.assemblyName).filter(Boolean)).size,
    [result.plugins]
  );

  // Format timestamp
  const formattedDate = formatDate(result.metadata.generatedAt);
  const formattedTime = formatDateTime(result.metadata.generatedAt).split(' ')[1]; // Extract time portion

  // Build scope description
  const scopeDescription = () => {
    if (scope.type === 'publisher') {
      const prefixes = scope.publisherPrefixes.join(', ');
      const names = scope.publisherNames.join(', ');
      return `Publishers: ${names} (${prefixes})`;
    } else {
      const count = scope.solutionNames.length;
      return `Solutions: ${scope.solutionNames.join(', ')} (${count} solution${count > 1 ? 's' : ''})`;
    }
  };

  // Check if a component type has results
  const hasResults = (type: string): boolean => {
    switch (type) {
      case 'entities':
        return result.summary.totalEntities > 0;
      case 'plugins':
        return result.summary.totalPlugins > 0;
      case 'pluginPackages':
        return uniquePluginPackageCount > 0;
      case 'flows':
        return result.summary.totalFlows > 0;
      case 'businessRules':
        return result.summary.totalBusinessRules > 0;
      case 'classicWorkflows':
        return result.summary.totalClassicWorkflows > 0;
      case 'businessProcessFlows':
        return result.summary.totalBusinessProcessFlows > 0;
      case 'customAPIs':
        return result.summary.totalCustomAPIs > 0;
      case 'environmentVariables':
        return result.summary.totalEnvironmentVariables > 0;
      case 'connectionReferences':
        return result.summary.totalConnectionReferences > 0;
      case 'globalChoices':
        return result.summary.totalGlobalChoices > 0;
      case 'customConnectors':
        return result.summary.totalCustomConnectors > 0;
      case 'webResources':
        return result.summary.totalWebResources > 0;
      case 'securityRoles':
        return (result.securityRoles?.length ?? 0) > 0;
      case 'fieldSecurityProfiles':
        return (result.fieldSecurityProfiles?.length ?? 0) > 0;
      case 'customPages':
        return result.summary.totalCustomPages > 0;
      default:
        return false;
    }
  };

  // Get count for component type
  const getCount = (type: string): number => {
    switch (type) {
      case 'entities':
        return result.summary.totalEntities;
      case 'plugins':
        return result.summary.totalPlugins;
      case 'pluginPackages':
        return uniquePluginPackageCount;
      case 'flows':
        return result.summary.totalFlows;
      case 'businessRules':
        return result.summary.totalBusinessRules;
      case 'classicWorkflows':
        return result.summary.totalClassicWorkflows;
      case 'businessProcessFlows':
        return result.summary.totalBusinessProcessFlows;
      case 'customAPIs':
        return result.summary.totalCustomAPIs;
      case 'environmentVariables':
        return result.summary.totalEnvironmentVariables;
      case 'connectionReferences':
        return result.summary.totalConnectionReferences;
      case 'globalChoices':
        return result.summary.totalGlobalChoices;
      case 'customConnectors':
        return result.summary.totalCustomConnectors;
      case 'webResources':
        return result.summary.totalWebResources;
      case 'securityRoles':
        return result.securityRoles?.length ?? 0;
      case 'fieldSecurityProfiles':
        return result.fieldSecurityProfiles?.length ?? 0;
      case 'customPages':
        return result.summary.totalCustomPages;
      default:
        return 0;
    }
  };

  // Component types for summary cards
  const componentTypes = [
    { key: 'entities', label: 'Entities', icon: <EntitiesIcon /> },
    { key: 'plugins', label: 'Plugins', icon: <PluginsIcon /> },
    { key: 'pluginPackages', label: 'Plugin Packages', icon: <PluginPackagesIcon /> },
    { key: 'flows', label: 'Flows', icon: <FlowsIcon /> },
    { key: 'businessRules', label: 'Business Rules', icon: <BusinessRulesIcon /> },
    { key: 'classicWorkflows', label: 'Classic Workflows', icon: <ClassicWorkflowsIcon /> },
    { key: 'businessProcessFlows', label: 'Business Process Flows', icon: <BusinessProcessFlowsIcon /> },
    { key: 'customAPIs', label: 'Custom APIs', icon: <CustomAPIsIcon /> },
    { key: 'environmentVariables', label: 'Environment Variables', icon: <EnvironmentVariablesIcon /> },
    { key: 'connectionReferences', label: 'Connection References', icon: <ConnectionReferencesIcon /> },
    { key: 'globalChoices', label: 'Global Choices', icon: <GlobalChoicesIcon /> },
    { key: 'customConnectors', label: 'Custom Connectors', icon: <CustomConnectorsIcon /> },
    { key: 'webResources', label: 'Web Resources', icon: <WebResourcesIcon /> },
    { key: 'securityRoles', label: 'Security Roles', icon: <SecurityRolesIcon /> },
    { key: 'fieldSecurityProfiles', label: 'Field Security Profiles', icon: <FieldSecurityProfilesIcon /> },
    { key: 'customPages', label: 'Custom Pages', icon: <CustomPagesIcon /> },
  ];


  return (
    <div className={styles.container}>
      {/* Top Bar: Back Button and Theme Toggle */}
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

      {/* Step warnings — complete failures and partial failures from batch processing */}
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
                <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2, minWidth: '110px', fontWeight: tokens.fontWeightSemibold }}>
                  {w.step}
                </Text>
                <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 }}>
                  {w.message}
                </Text>
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
                {componentTypes.map((type) => {
                  const count = getCount(type.key);
                  const hasData = count > 0;
                  const isSelected = selectedCard === type.key;

                  return (
                    <Card
                      key={type.key}
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
                              setSelectedCard(type.key);
                              setSelectedTab(type.key);
                              browserSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }
                          : undefined
                      }
                      style={hasData ? { cursor: 'pointer' } : undefined}
                    >
                      <div className={styles.summaryCardContent}>
                        <span style={{ color: hasData ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground4, fontSize: '24px', lineHeight: 1 }}>{type.icon}</span>
                        <Text className={styles.summaryCount}>{count}</Text>
                        <Text className={styles.summaryLabel}>{type.label}</Text>
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
              gap: tokens.spacingHorizontalS
            }}
          >
            {componentTypes.map((type) => {
              // Entities tab is always rendered to maintain a stable default TabList option.
              // All other tabs are hidden when they have no data.
              if (type.key !== 'entities' && !hasResults(type.key)) return null;
              const count = getCount(type.key);
              const isSelected = selectedTab === type.key;
              return (
                <Tooltip key={type.key} content={type.label} relationship="label">
                  <Tab value={type.key} icon={type.icon}>
                    {isSelected ? `${type.label} (${count})` : `${count}`}
                  </Tab>
                </Tooltip>
              );
            })}
          </TabList>

          {/* Tab Content */}
          <div style={{ marginTop: tokens.spacingVerticalL }}>
            {selectedTab === 'entities' && (
              <EntityList blueprints={result.entities} classicWorkflows={result.classicWorkflows} businessProcessFlows={result.businessProcessFlows} />
            )}

            {selectedTab === 'plugins' && hasResults('plugins') && (
              <PluginsList plugins={result.plugins} />
            )}

            {selectedTab === 'pluginPackages' && hasResults('pluginPackages') && (
              <PluginPackagesList plugins={result.plugins} />
            )}

            {selectedTab === 'flows' && hasResults('flows') && (
              <FlowsList flows={result.flows} />
            )}

            {selectedTab === 'businessRules' && hasResults('businessRules') && (
              <BusinessRulesList businessRules={result.businessRules} />
            )}

            {selectedTab === 'classicWorkflows' && hasResults('classicWorkflows') && (
              <ClassicWorkflowsList workflows={result.classicWorkflows} />
            )}

            {selectedTab === 'businessProcessFlows' && hasResults('businessProcessFlows') && (
              <BusinessProcessFlowsList businessProcessFlows={result.businessProcessFlows} />
            )}

            {selectedTab === 'customAPIs' && hasResults('customAPIs') && (
              <div>
                {selectedCustomAPI ? (
                  <div>
                    <Button
                      appearance="secondary"
                      onClick={() => setSelectedCustomAPI(null)}
                      style={{ marginBottom: '16px' }}
                    >
                      ← Back to List
                    </Button>
                    <CustomAPIDetailView api={selectedCustomAPI} />
                  </div>
                ) : (
                  <CustomAPIsList
                    customAPIs={result.customAPIs}
                    onSelectAPI={setSelectedCustomAPI}
                  />
                )}
              </div>
            )}

            {selectedTab === 'environmentVariables' && hasResults('environmentVariables') && (
              <EnvironmentVariablesList environmentVariables={result.environmentVariables} />
            )}

            {selectedTab === 'connectionReferences' && hasResults('connectionReferences') && (
              <ConnectionReferencesList
                connectionReferences={result.connectionReferences}
              />
            )}

            {selectedTab === 'globalChoices' && hasResults('globalChoices') && (
              <GlobalChoicesList
                globalChoices={result.globalChoices}
              />
            )}

            {selectedTab === 'customConnectors' && hasResults('customConnectors') && (
              <CustomConnectorsList customConnectors={result.customConnectors} />
            )}

            {selectedTab === 'webResources' && hasResults('webResources') && (
              <WebResourcesList webResources={result.webResources} />
            )}

            {selectedTab === 'securityRoles' && hasResults('securityRoles') && (
              <SecurityRolesView securityRoles={result.securityRoles || []} />
            )}

            {selectedTab === 'fieldSecurityProfiles' && hasResults('fieldSecurityProfiles') && (
              <FieldSecurityProfilesView
                profiles={result.fieldSecurityProfiles || []}
                attributeMaskingRules={result.attributeMaskingRules}
                columnSecurityProfiles={result.columnSecurityProfiles}
              />
            )}

            {selectedTab === 'customPages' && hasResults('customPages') && (
              <EmptyState
                type="generic"
                title="Custom Pages"
                message="Custom pages browser coming soon..."
              />
            )}
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
        blueprintGenerator={blueprintGenerator}
        onClose={() => setShowExportDialog(false)}
      />

      <Footer />
    </div>
  );
}
