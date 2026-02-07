import { useState } from 'react';
import {
  Button,
  Title1,
  Title2,
  Title3,
  Text,
  Card,
  Badge,
  MessageBar,
  MessageBarBody,
  MessageBarActions,
  Tab,
  TabList,
  makeStyles,
  tokens,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  Warning24Regular,
  ArrowDownload24Regular,
  ArrowReset24Regular,
} from '@fluentui/react-icons';
import type { BlueprintResult, PluginStep, Flow } from '@ppsb/core';
import type { ScopeSelection } from '../types/scope';
import { PluginsList } from './PluginsList';
import { PluginDetailView } from './PluginDetailView';
import { EntityList } from './EntityList';
import { EntityDetailView } from './EntityDetailView';
import { FlowsList } from './FlowsList';
import { FlowDetailView } from './FlowDetailView';
import type { DetailedEntityMetadata } from '@ppsb/core';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXXL,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: tokens.spacingVerticalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  titleRow: {
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
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  section: {
    marginBottom: tokens.spacingVerticalXXL,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  summaryCard: {
    padding: tokens.spacingVerticalL,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  summaryCardDisabled: {
    padding: tokens.spacingVerticalL,
    opacity: 0.6,
    cursor: 'default',
  },
  summaryCardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    alignItems: 'center',
    textAlign: 'center',
  },
  summaryCount: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    lineHeight: tokens.lineHeightHero800,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase300,
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
  onStartOver: () => void;
  onExport: () => void;
}

export function ResultsDashboard({ result, scope, onStartOver, onExport }: ResultsDashboardProps) {
  const styles = useStyles();
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<string>('entities');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginStep | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<DetailedEntityMetadata | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);

  // Format timestamp
  const formattedDate = result.metadata.generatedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = result.metadata.generatedAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
      case 'flows':
        return result.summary.totalFlows > 0;
      case 'businessRules':
        return result.summary.totalBusinessRules > 0;
      case 'webResources':
        return result.summary.totalWebResources > 0;
      case 'canvasApps':
        return result.summary.totalCanvasApps > 0;
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
      case 'flows':
        return result.summary.totalFlows;
      case 'businessRules':
        return result.summary.totalBusinessRules;
      case 'webResources':
        return result.summary.totalWebResources;
      case 'canvasApps':
        return result.summary.totalCanvasApps;
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
    { key: 'flows', label: 'Flows', icon: '🌊' },
    { key: 'businessRules', label: 'Business Rules', icon: '📋' },
    { key: 'webResources', label: 'Web Resources', icon: '🌐' },
    { key: 'canvasApps', label: 'Canvas Apps', icon: '🎨' },
    { key: 'customPages', label: 'Custom Pages', icon: '📄' },
  ];

  // Generate warnings for missing component types
  const warnings = componentTypes
    .filter((type) => !hasResults(type.key))
    .map((type) => ({
      key: type.key,
      message: `No ${type.label.toLowerCase()} found in selected solution(s)`,
    }));

  const handleDismissWarning = (key: string) => {
    setDismissedWarnings((prev) => new Set(prev).add(key));
  };

  const visibleWarnings = warnings.filter((w) => !dismissedWarnings.has(w.key));

  return (
    <div className={styles.container}>
      {/* SECTION 1: Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <CheckmarkCircle24Regular className={styles.checkIcon} />
          <Title1>System Blueprint Generated Successfully!</Title1>
        </div>

        <div className={styles.metadata}>
          <Text>Generated on {formattedDate} at {formattedTime}</Text>
          <Badge appearance="outline" color="brand" size="large">
            {scopeDescription()}
          </Badge>
        </div>

        <div className={styles.actionButtons}>
          <Button
            appearance="primary"
            icon={<ArrowDownload24Regular />}
            onClick={onExport}
          >
            Export as Markdown
          </Button>
          <Button
            appearance="secondary"
            icon={<ArrowDownload24Regular />}
            onClick={() => alert('JSON export coming soon!')}
          >
            Export as JSON
          </Button>
          <Button
            appearance="secondary"
            icon={<ArrowReset24Regular />}
            onClick={onStartOver}
          >
            Generate New Blueprint
          </Button>
        </div>
      </div>

      {/* SECTION 2: Discovery Summary */}
      <div className={styles.section}>
        <Card>
          <Title2>What We Found</Title2>
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
                    <Text style={{ fontSize: '32px' }}>{type.icon}</Text>
                    <Text className={styles.summaryCount}>{count}</Text>
                    <Text className={styles.summaryLabel}>{type.label}</Text>
                    {hasData ? (
                      <Badge appearance="filled" color="success" size="small">
                        Found
                      </Badge>
                    ) : (
                      <Badge appearance="outline" color="subtle" size="small">
                        Not Found
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>

      {/* SECTION 3: Warnings/Info Messages */}
      {visibleWarnings.length > 0 && (
        <div className={styles.section}>
          <div className={styles.warningsContainer}>
            {visibleWarnings.map((warning) => (
              <MessageBar
                key={warning.key}
                intent="info"
                icon={<Warning24Regular />}
              >
                <MessageBarBody>{warning.message}</MessageBarBody>
                <MessageBarActions>
                  <Button
                    appearance="transparent"
                    size="small"
                    onClick={() => handleDismissWarning(warning.key)}
                  >
                    Dismiss
                  </Button>
                </MessageBarActions>
              </MessageBar>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Entity Browser (Tabbed Interface) */}
      <div className={styles.browserSection}>
        <Card>
          <Title3>Component Browser</Title3>
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
              setSelectedTab(data.value as string);
            }}
          >
            {/* Entities Tab - Always shown */}
            <Tab value="entities">{`Entities (${result.summary.totalEntities})`}</Tab>

            {/* Conditional Tabs */}
            {hasResults('plugins') && (
              <Tab value="plugins">{`Plugins (${result.summary.totalPlugins})`}</Tab>
            )}

            {hasResults('flows') && (
              <Tab value="flows">{`Flows (${result.summary.totalFlows})`}</Tab>
            )}

            {hasResults('businessRules') && (
              <Tab value="businessRules">{`Business Rules (${result.summary.totalBusinessRules})`}</Tab>
            )}

            {hasResults('webResources') && (
              <Tab value="webResources">{`Web Resources (${result.summary.totalWebResources})`}</Tab>
            )}

            {hasResults('canvasApps') && (
              <Tab value="canvasApps">{`Canvas Apps (${result.summary.totalCanvasApps})`}</Tab>
            )}

            {hasResults('customPages') && (
              <Tab value="customPages">{`Custom Pages (${result.summary.totalCustomPages})`}</Tab>
            )}
          </TabList>

          {/* Tab Content */}
          <div style={{ marginTop: tokens.spacingVerticalL }}>
            {selectedTab === 'entities' && (
              <>
                {result.summary.totalEntities > 0 ? (
                  selectedEntity ? (
                    <div>
                      <Button
                        appearance="secondary"
                        onClick={() => setSelectedEntity(null)}
                        style={{ marginBottom: tokens.spacingVerticalM }}
                      >
                        ← Back to Entity List
                      </Button>
                      <EntityDetailView entity={selectedEntity} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', width: '100%', height: '600px' }}>
                      <EntityList
                        entities={result.entities.map((bp) => bp.entity)}
                        onEntitySelect={setSelectedEntity}
                        selectedEntity={selectedEntity}
                      />
                    </div>
                  )
                ) : (
                  <div className={styles.emptyState}>
                    <Text style={{ fontSize: '48px' }}>📊</Text>
                    <Title3>No Entities Found</Title3>
                    <Text>No entities were found in the selected solution(s).</Text>
                  </div>
                )}
              </>
            )}

            {selectedTab === 'plugins' && hasResults('plugins') && (
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalL }}>
                <div style={{ flex: selectedPlugin ? 1 : 'auto', minWidth: 0 }}>
                  <PluginsList
                    plugins={result.plugins}
                    groupBy="message"
                    onPluginClick={setSelectedPlugin}
                  />
                </div>
                {selectedPlugin && (
                  <div style={{ flex: 1, minWidth: '400px', maxWidth: '600px', overflowY: 'auto' }}>
                    <Card>
                      <PluginDetailView
                        plugin={selectedPlugin}
                        onClose={() => setSelectedPlugin(null)}
                      />
                    </Card>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'flows' && hasResults('flows') && (
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalL }}>
                <div style={{ flex: selectedFlow ? 1 : 'auto', minWidth: 0 }}>
                  <FlowsList
                    flows={result.flows}
                    onFlowClick={setSelectedFlow}
                  />
                </div>
                {selectedFlow && (
                  <div style={{ flex: 1, minWidth: '400px', maxWidth: '600px', overflowY: 'auto' }}>
                    <Card>
                      <FlowDetailView
                        flow={selectedFlow}
                        onClose={() => setSelectedFlow(null)}
                      />
                    </Card>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'businessRules' && hasResults('businessRules') && (
              <div className={styles.emptyState}>
                <Text style={{ fontSize: '48px' }}>📋</Text>
                <Title3>Business Rules</Title3>
                <Text>Business rules browser coming soon...</Text>
              </div>
            )}

            {selectedTab === 'webResources' && hasResults('webResources') && (
              <div className={styles.emptyState}>
                <Text style={{ fontSize: '48px' }}>🌐</Text>
                <Title3>Web Resources</Title3>
                <Text>Web resources browser coming soon...</Text>
              </div>
            )}

            {selectedTab === 'canvasApps' && hasResults('canvasApps') && (
              <div className={styles.emptyState}>
                <Text style={{ fontSize: '48px' }}>🎨</Text>
                <Title3>Canvas Apps</Title3>
                <Text>Canvas apps browser coming soon...</Text>
              </div>
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
    </div>
  );
}
