import { useState } from 'react';
import {
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
import type { BlueprintResult, ClassicWorkflow, BusinessProcessFlow, CustomAPI, EnvironmentVariable, ConnectionReference, CustomConnector } from '@ppsb/core';
import type { ScopeSelection } from '../types/scope';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import { PluginsList } from './PluginsList';
import { EntityList } from './EntityList';
import { FlowsList } from './FlowsList';
import { BusinessRulesList } from './BusinessRulesList';
import { WebResourcesList } from './WebResourcesList';
import { ClassicWorkflowsList } from './ClassicWorkflowsList';
import { ClassicWorkflowDetailView } from './ClassicWorkflowDetailView';
import { BusinessProcessFlowsList } from './BusinessProcessFlowsList';
import { BusinessProcessFlowDetailView } from './BusinessProcessFlowDetailView';
import { CustomAPIsList } from './CustomAPIsList';
import { CustomAPIDetailView } from './CustomAPIDetailView';
import { EnvironmentVariablesList } from './EnvironmentVariablesList';
import { EnvironmentVariableDetailView } from './EnvironmentVariableDetailView';
import { ConnectionReferencesList } from './ConnectionReferencesList';
import { ConnectionReferenceDetailView } from './ConnectionReferenceDetailView';
import { GlobalChoicesList } from './GlobalChoicesList';
import { CustomConnectorsList } from './CustomConnectorsList';
import { CustomConnectorDetailView } from './CustomConnectorDetailView';
import { ERDView } from './ERDView';
import { CrossEntityMapView } from './CrossEntityMapView';
import { ExternalDependenciesView } from './ExternalDependenciesView';
import { SolutionDistributionView } from './SolutionDistributionView';
import { ExportDialog } from './ExportDialog';
import { SecurityRolesView } from './SecurityRolesView';
import { FieldSecurityProfilesView } from './FieldSecurityProfilesView';
import { Footer } from './Footer';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXXL,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  backButton: {
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
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: tokens.spacingHorizontalXS,
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
  browserSection: {
    marginTop: tokens.spacingVerticalXL,
  },
  emptyState: {
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
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
  const [mainTab, setMainTab] = useState<string>('dashboard');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('entities');
  const [selectedClassicWorkflow, setSelectedClassicWorkflow] = useState<ClassicWorkflow | null>(null);
  const [selectedBPF, setSelectedBPF] = useState<BusinessProcessFlow | null>(null);
  const [selectedCustomAPI, setSelectedCustomAPI] = useState<CustomAPI | null>(null);
  const [selectedEnvVar, setSelectedEnvVar] = useState<EnvironmentVariable | null>(null);
  const [selectedConnRef, setSelectedConnRef] = useState<ConnectionReference | null>(null);
  const [selectedCustomConnector, setSelectedCustomConnector] = useState<CustomConnector | null>(null);

  // Check what architecture features are available
  const hasERD = !!result.erd;
  const hasCrossEntity = !!(result.crossEntityLinks && result.crossEntityLinks.length > 0);
  const hasExternalDeps = !!(result.externalEndpoints && result.externalEndpoints.length > 0);
  const hasSolutionDist = !!(result.solutionDistribution && result.solutionDistribution.length > 0);

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
        return result.summary.totalPluginPackages > 0;
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
        return result.summary.totalPluginPackages;
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
    { key: 'entities', label: 'Entities', icon: '📊' },
    { key: 'plugins', label: 'Plugins', icon: '🔌' },
    { key: 'pluginPackages', label: 'Plugin Packages', icon: '📦' },
    { key: 'flows', label: 'Flows', icon: '🌊' },
    { key: 'businessRules', label: 'Business Rules', icon: '📋' },
    { key: 'classicWorkflows', label: 'Classic Workflows', icon: '⚠️' },
    { key: 'businessProcessFlows', label: 'Business Process Flows', icon: '🔄' },
    { key: 'customAPIs', label: 'Custom APIs', icon: '🔧' },
    { key: 'environmentVariables', label: 'Environment Variables', icon: '⚙️' },
    { key: 'connectionReferences', label: 'Connection References', icon: '🔗' },
    { key: 'globalChoices', label: 'Global Choices', icon: '🎯' },
    { key: 'customConnectors', label: 'Custom Connectors', icon: '🔀' },
    { key: 'webResources', label: 'Web Resources', icon: '🌐' },
    { key: 'securityRoles', label: 'Security Roles', icon: '🔒' },
    { key: 'fieldSecurityProfiles', label: 'Field Security Profiles', icon: '🛡️' },
    { key: 'customPages', label: 'Custom Pages', icon: '📄' },
  ];


  return (
    <div className={styles.container}>
      {/* Back Button */}
      <Button
        className={styles.backButton}
        appearance="subtle"
        icon={<ArrowLeft24Regular />}
        onClick={onStartOver}
      >
        Generate New Blueprint
      </Button>

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

      {/* Main Tabs */}
      <div className={styles.mainTabsSection}>
        <TabList
          selectedValue={mainTab}
          onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
            setMainTab(data.value as string);
          }}
        >
          <Tab value="dashboard">📊 Dashboard</Tab>

          {hasERD && (
            <Tab value="erd">📐 Entity Relationship Diagram</Tab>
          )}

          {hasCrossEntity && (
            <Tab value="crossEntity">🔗 Cross-Entity Automation</Tab>
          )}

          {hasExternalDeps && (
            <Tab value="externalDeps">🌐 External Dependencies</Tab>
          )}

          {hasSolutionDist && (
            <Tab value="solutionDist">📦 Solution Distribution</Tab>
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

                  return (
                    <Card
                      key={type.key}
                      className={hasData ? styles.summaryCard : styles.summaryCardDisabled}
                      appearance={hasData ? 'filled' : 'outline'}
                    >
                      <div className={styles.summaryCardContent}>
                        <Text style={{ fontSize: '18px' }}>{type.icon}</Text>
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
      <div className={styles.browserSection}>
        <Card>
          <Title3>Component Browser</Title3>
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
              setSelectedTab(data.value as string);
            }}
            size="small"
            style={{
              flexWrap: 'wrap',
              gap: tokens.spacingHorizontalS
            }}
          >
            {/* Entities Tab - Always shown */}
            <Tab value="entities">{`📊 Entities (${result.summary.totalEntities})`}</Tab>

            {/* Conditional Tabs */}
            {hasResults('plugins') && (
              <Tab value="plugins">{`🔌 Plugins (${result.summary.totalPlugins})`}</Tab>
            )}

            {hasResults('flows') && (
              <Tab value="flows">{`🌊 Flows (${result.summary.totalFlows})`}</Tab>
            )}

            {hasResults('businessRules') && (
              <Tab value="businessRules">{`📋 Business Rules (${result.summary.totalBusinessRules})`}</Tab>
            )}

            {hasResults('classicWorkflows') && (
              <Tab value="classicWorkflows">{`⚠️ Classic Workflows (${result.summary.totalClassicWorkflows})`}</Tab>
            )}

            {hasResults('businessProcessFlows') && (
              <Tab value="businessProcessFlows">{`🔄 Business Process Flows (${result.summary.totalBusinessProcessFlows})`}</Tab>
            )}

            {hasResults('customAPIs') && (
              <Tab value="customAPIs">{`🔧 Custom APIs (${result.summary.totalCustomAPIs})`}</Tab>
            )}

            {hasResults('environmentVariables') && (
              <Tab value="environmentVariables">{`⚙️ Environment Variables (${result.summary.totalEnvironmentVariables})`}</Tab>
            )}

            {hasResults('connectionReferences') && (
              <Tab value="connectionReferences">{`🔗 Connection References (${result.summary.totalConnectionReferences})`}</Tab>
            )}

            {hasResults('globalChoices') && (
              <Tab value="globalChoices">{`🎯 Global Choices (${result.summary.totalGlobalChoices})`}</Tab>
            )}

            {hasResults('customConnectors') && (
              <Tab value="customConnectors">{`🔀 Custom Connectors (${result.summary.totalCustomConnectors})`}</Tab>
            )}

            {hasResults('webResources') && (
              <Tab value="webResources">{`🌐 Web Resources (${result.summary.totalWebResources})`}</Tab>
            )}

            {hasResults('securityRoles') && (
              <Tab value="securityRoles">{`🔒 Security Roles (${getCount('securityRoles')})`}</Tab>
            )}

            {hasResults('fieldSecurityProfiles') && (
              <Tab value="fieldSecurityProfiles">{`🛡️ Field Security Profiles (${getCount('fieldSecurityProfiles')})`}</Tab>
            )}

            {hasResults('customPages') && (
              <Tab value="customPages">{`📄 Custom Pages (${result.summary.totalCustomPages})`}</Tab>
            )}
          </TabList>

          {/* Tab Content */}
          <div style={{ marginTop: tokens.spacingVerticalL }}>
            {selectedTab === 'entities' && (
              <div style={{ display: 'flex', width: '100%', height: '600px' }}>
                <EntityList blueprints={result.entities} classicWorkflows={result.classicWorkflows} />
              </div>
            )}

            {selectedTab === 'plugins' && hasResults('plugins') && (
              <PluginsList plugins={result.plugins} />
            )}

            {selectedTab === 'flows' && hasResults('flows') && (
              <FlowsList flows={result.flows} />
            )}

            {selectedTab === 'businessRules' && hasResults('businessRules') && (
              <BusinessRulesList businessRules={result.businessRules} />
            )}

            {selectedTab === 'classicWorkflows' && hasResults('classicWorkflows') && (
              <div>
                {selectedClassicWorkflow ? (
                  <div>
                    <Button
                      appearance="secondary"
                      onClick={() => setSelectedClassicWorkflow(null)}
                      style={{ marginBottom: '16px' }}
                    >
                      ← Back to List
                    </Button>
                    <ClassicWorkflowDetailView workflow={selectedClassicWorkflow} />
                  </div>
                ) : (
                  <ClassicWorkflowsList
                    workflows={result.classicWorkflows}
                    onSelectWorkflow={setSelectedClassicWorkflow}
                  />
                )}
              </div>
            )}

            {selectedTab === 'businessProcessFlows' && hasResults('businessProcessFlows') && (
              <div>
                {selectedBPF ? (
                  <div>
                    <Button
                      appearance="secondary"
                      onClick={() => setSelectedBPF(null)}
                      style={{ marginBottom: '16px' }}
                    >
                      ← Back to List
                    </Button>
                    <BusinessProcessFlowDetailView bpf={selectedBPF} />
                  </div>
                ) : (
                  <BusinessProcessFlowsList
                    businessProcessFlows={result.businessProcessFlows}
                    onSelectBPF={setSelectedBPF}
                  />
                )}
              </div>
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
              <div>
                {selectedEnvVar ? (
                  <div>
                    <Button
                      appearance="secondary"
                      onClick={() => setSelectedEnvVar(null)}
                      style={{ marginBottom: '16px' }}
                    >
                      ← Back to List
                    </Button>
                    <EnvironmentVariableDetailView envVar={selectedEnvVar} />
                  </div>
                ) : (
                  <EnvironmentVariablesList
                    environmentVariables={result.environmentVariables}
                    onSelectVariable={setSelectedEnvVar}
                  />
                )}
              </div>
            )}

            {selectedTab === 'connectionReferences' && hasResults('connectionReferences') && (
              <div>
                {selectedConnRef ? (
                  <div>
                    <Button
                      appearance="secondary"
                      onClick={() => setSelectedConnRef(null)}
                      style={{ marginBottom: '16px' }}
                    >
                      ← Back to List
                    </Button>
                    <ConnectionReferenceDetailView connectionRef={selectedConnRef} />
                  </div>
                ) : (
                  <ConnectionReferencesList
                    connectionReferences={result.connectionReferences}
                    onSelectReference={setSelectedConnRef}
                  />
                )}
              </div>
            )}

            {selectedTab === 'globalChoices' && hasResults('globalChoices') && (
              <GlobalChoicesList
                globalChoices={result.globalChoices}
                onSelectChoice={() => {}} // Unused - list handles expansion internally
              />
            )}

            {selectedTab === 'customConnectors' && hasResults('customConnectors') && (
              <div>
                {selectedCustomConnector ? (
                  <div>
                    <Button
                      appearance="secondary"
                      onClick={() => setSelectedCustomConnector(null)}
                      style={{ marginBottom: '16px' }}
                    >
                      ← Back to List
                    </Button>
                    <CustomConnectorDetailView customConnector={selectedCustomConnector} />
                  </div>
                ) : (
                  <CustomConnectorsList
                    customConnectors={result.customConnectors}
                    onSelectConnector={setSelectedCustomConnector}
                  />
                )}
              </div>
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
              <div className={styles.emptyState}>
                <Text style={{ fontSize: '48px' }}>📄</Text>
                <Title3>Custom Pages</Title3>
                <Text>Custom pages browser coming soon...</Text>
              </div>
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

      {/* Cross-Entity Automation Tab Content */}
      {mainTab === 'crossEntity' && hasCrossEntity && (
        <div className={styles.tabContent}>
          <CrossEntityMapView links={result.crossEntityLinks!} />
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
