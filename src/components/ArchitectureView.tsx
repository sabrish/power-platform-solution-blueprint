import { useState } from 'react';
import {
  Button,
  Title1,
  Title2,
  Text,
  Tab,
  TabList,
  makeStyles,
  tokens,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import type { BlueprintResult } from '../core';
import { ERDView } from './ERDView';
import { CrossEntityMapView } from './CrossEntityMapView';
import { ExternalDependenciesView } from './ExternalDependenciesView';
import { SolutionDistributionView } from './SolutionDistributionView';

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
  backButton: {
    marginBottom: tokens.spacingVerticalM,
  },
  tabsSection: {
    marginTop: tokens.spacingVerticalL,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
  },
});

export interface ArchitectureViewProps {
  result: BlueprintResult;
  onBack: () => void;
}

export function ArchitectureView({ result, onBack }: ArchitectureViewProps) {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState('erd');

  // Check what features are available
  const hasERD = !!result.erd;
  const hasCrossEntity = !!(result.crossEntityLinks && result.crossEntityLinks.length > 0);
  const hasExternalDeps = !!(result.externalEndpoints && result.externalEndpoints.length > 0);
  const hasSolutionDist = !!(result.solutionDistribution && result.solutionDistribution.length > 0);

  // If nothing is available, show empty state
  if (!hasERD && !hasCrossEntity && !hasExternalDeps && !hasSolutionDist) {
    return (
      <div className={styles.container}>
        <Button
          className={styles.backButton}
          appearance="secondary"
          icon={<ArrowLeft24Regular />}
          onClick={onBack}
        >
          Back to Dashboard
        </Button>

        <div className={styles.emptyState}>
          <Text style={{ fontSize: '48px' }}>📊</Text>
          <Title2>No Architecture Analysis Available</Title2>
          <Text>
            Architecture analysis features are not available for this blueprint.
            This may happen if no entities were found or the scope is too limited.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button
          className={styles.backButton}
          appearance="secondary"
          icon={<ArrowLeft24Regular />}
          onClick={onBack}
        >
          Back to Dashboard
        </Button>

        <Title1>System Architecture Analysis</Title1>
        <Text>
          Comprehensive architectural insights including entity relationships, cross-entity automation,
          external dependencies, and solution distribution.
        </Text>
      </div>

      {/* Tabs */}
      <div className={styles.tabsSection}>
        <TabList
          selectedValue={selectedTab}
          onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
            setSelectedTab(data.value as string);
          }}
        >
          {hasERD && (
            <Tab value="erd">
              Entity Relationship Diagram
            </Tab>
          )}

          {hasCrossEntity && (
            <Tab value="crossEntity">
              Cross-Entity Automation ({result.crossEntityLinks!.length})
            </Tab>
          )}

          {hasExternalDeps && (
            <Tab value="externalDeps">
              External Dependencies ({result.externalEndpoints!.length})
            </Tab>
          )}

          {hasSolutionDist && (
            <Tab value="solutionDist">
              Solution Distribution ({result.solutionDistribution!.length})
            </Tab>
          )}
        </TabList>

        {/* Tab Content */}
        <div style={{ marginTop: tokens.spacingVerticalL }}>
          {selectedTab === 'erd' && hasERD && (
            <ERDView erd={result.erd!} blueprintResult={result} />
          )}

          {selectedTab === 'crossEntity' && hasCrossEntity && (
            <CrossEntityMapView links={result.crossEntityLinks!} />
          )}

          {selectedTab === 'externalDeps' && hasExternalDeps && (
            <ExternalDependenciesView endpoints={result.externalEndpoints!} />
          )}

          {selectedTab === 'solutionDist' && hasSolutionDist && (
            <SolutionDistributionView distributions={result.solutionDistribution!} />
          )}
        </div>
      </div>
    </div>
  );
}
