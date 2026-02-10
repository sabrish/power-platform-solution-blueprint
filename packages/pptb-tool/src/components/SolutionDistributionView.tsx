import {
  Text,
  Title3,
  Card,
  Badge,
  makeStyles,
  tokens,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import type { SolutionDistribution } from '@ppsb/core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  solutionCard: {
    padding: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  solutionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS,
  },
  solutionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  componentCount: {
    fontSize: tokens.fontSizeHero700,
    color: tokens.colorBrandForeground1,
  },
  barChart: {
    display: 'flex',
    height: '20px',
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    marginTop: tokens.spacingVerticalS,
  },
  barSegment: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  countsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalS,
  },
  countItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: tokens.fontSizeBase200,
  },
  detailsSection: {
    marginTop: tokens.spacingVerticalL,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
  },
});

export interface SolutionDistributionViewProps {
  distributions: SolutionDistribution[];
}

export function SolutionDistributionView({ distributions }: SolutionDistributionViewProps) {
  const styles = useStyles();

  // Calculate color for component type in bar chart
  const componentTypeColors: Record<string, string> = {
    entities: tokens.colorPaletteBlueForeground2,
    plugins: tokens.colorPalettePurpleForeground2,
    flows: tokens.colorPaletteGreenForeground1,
    businessRules: tokens.colorPaletteDarkOrangeForeground1,
    classicWorkflows: tokens.colorPaletteRedForeground1,
    bpfs: tokens.colorPaletteTealForeground2,
    webResources: tokens.colorPaletteYellowForeground1,
    customAPIs: tokens.colorPalettePinkForeground2,
  };

  // Calculate percentages for bar chart
  const calculatePercentages = (counts: any) => {
    const total = counts.total;
    if (total === 0) return {};

    return {
      entities: (counts.entities / total) * 100,
      plugins: (counts.plugins / total) * 100,
      flows: (counts.flows / total) * 100,
      businessRules: (counts.businessRules / total) * 100,
      webResources: (counts.webResources / total) * 100,
      customAPIs: (counts.customAPIs / total) * 100,
    };
  };

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: tokens.spacingVerticalM }}>
        <Title3 style={{ marginBottom: tokens.spacingVerticalXS }}>Solution Distribution Analysis</Title3>
        <Text>
          Analyzing {distributions.length} solution{distributions.length !== 1 ? 's' : ''}
        </Text>
      </div>

      {/* Overview Cards */}
      <div className={styles.overviewGrid}>
        {distributions.map((solution) => {
          const percentages = calculatePercentages(solution.componentCounts);

          return (
            <Card key={solution.solutionId} className={styles.solutionCard}>
              <div className={styles.solutionHeader}>
                <div className={styles.solutionTitle}>
                  <Text weight="bold" style={{ fontSize: tokens.fontSizeBase400 }}>
                    {solution.solutionName}
                  </Text>
                  {solution.isManaged && (
                    <Badge appearance="filled" color="informative">
                      Managed
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                  Publisher: {solution.publisher}
                </Text>
              </div>

              <div>
                <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                  Version: {solution.version}
                </Text>
              </div>

              <div className={styles.componentCount}>{solution.componentCounts.total}</div>
              <Text style={{ fontSize: tokens.fontSizeBase200 }}>Total Components</Text>

              {/* Mini bar chart */}
              <div className={styles.barChart}>
                {Object.entries(percentages).map(([type, percentage]) => {
                  if (percentage === 0) return null;
                  return (
                    <div
                      key={type}
                      className={styles.barSegment}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: componentTypeColors[type] || tokens.colorNeutralBackground3,
                      }}
                      title={`${type}: ${percentage.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Top component counts */}
              <div className={styles.countsGrid}>
                {solution.componentCounts.entities > 0 && (
                  <div className={styles.countItem}>
                    <Text>Entities</Text>
                    <Text weight="semibold">{solution.componentCounts.entities}</Text>
                  </div>
                )}
                {solution.componentCounts.plugins > 0 && (
                  <div className={styles.countItem}>
                    <Text>Plugins</Text>
                    <Text weight="semibold">{solution.componentCounts.plugins}</Text>
                  </div>
                )}
                {solution.componentCounts.flows > 0 && (
                  <div className={styles.countItem}>
                    <Text>Flows</Text>
                    <Text weight="semibold">{solution.componentCounts.flows}</Text>
                  </div>
                )}
                {solution.componentCounts.businessRules > 0 && (
                  <div className={styles.countItem}>
                    <Text>Business Rules</Text>
                    <Text weight="semibold">{solution.componentCounts.businessRules}</Text>
                  </div>
                )}
                {solution.componentCounts.webResources > 0 && (
                  <div className={styles.countItem}>
                    <Text>Web Resources</Text>
                    <Text weight="semibold">{solution.componentCounts.webResources}</Text>
                  </div>
                )}
                {solution.componentCounts.customAPIs > 0 && (
                  <div className={styles.countItem}>
                    <Text>Custom APIs</Text>
                    <Text weight="semibold">{solution.componentCounts.customAPIs}</Text>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Solution Details - Only show if there are dependencies or shared components */}
      {!distributions.every(s => s.dependencies.length === 0 && s.sharedComponents.length === 0) && (
        <div className={styles.detailsSection}>
          <div style={{ marginBottom: tokens.spacingVerticalM }}>
            <Title3 style={{ marginBottom: tokens.spacingVerticalXS }}>Solution Dependencies & Shared Components</Title3>
            <Text className={styles.description}>
              View dependencies between solutions and components shared across multiple solutions
            </Text>
          </div>

          <Accordion multiple collapsible style={{ marginTop: tokens.spacingVerticalM }}>
            {distributions.map((solution) => {
              const hasDependencies = solution.dependencies.length > 0;
              const hasSharedComponents = solution.sharedComponents.length > 0;

              // Skip if no dependencies or shared components
              if (!hasDependencies && !hasSharedComponents) {
                return null;
              }

              return (
              <AccordionItem key={solution.solutionId} value={solution.solutionId}>
                <AccordionHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    <Text weight="semibold">{solution.solutionName}</Text>
                    {hasDependencies && (
                      <Badge appearance="outline" color="warning">
                        {solution.dependencies.length} dependencies
                      </Badge>
                    )}
                    {hasSharedComponents && (
                      <Badge appearance="outline" color="informative">
                        {solution.sharedComponents.length} shared
                      </Badge>
                    )}
                  </div>
                </AccordionHeader>
                <AccordionPanel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
                    {/* Dependencies */}
                    {solution.dependencies.length > 0 && (
                      <div>
                        <Text weight="semibold">Dependencies</Text>
                        {solution.dependencies.map((dep: any, index: number) => (
                          <Card key={index} style={{ marginTop: tokens.spacingVerticalS, padding: tokens.spacingVerticalS }}>
                            <Text weight="semibold">{dep.dependsOnSolution}</Text>
                            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                              {dep.reason}
                            </Text>
                            <Text style={{ fontSize: tokens.fontSizeBase200, marginTop: tokens.spacingVerticalXXS }}>
                              References: {dep.componentReferences.join(', ')}
                            </Text>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Shared Components */}
                    {solution.sharedComponents.length > 0 && (
                      <div>
                        <Text weight="semibold">Shared Components</Text>
                        <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                          Components that appear in multiple solutions
                        </Text>
                        {solution.sharedComponents.map((shared: any, index: number) => (
                          <Card key={index} style={{ marginTop: tokens.spacingVerticalS, padding: tokens.spacingVerticalS }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                              <Badge appearance="outline">{shared.componentType}</Badge>
                              <Text weight="semibold">{shared.componentName}</Text>
                            </div>
                            <Text style={{ fontSize: tokens.fontSizeBase200, marginTop: tokens.spacingVerticalXXS }}>
                              Also in: {shared.alsoInSolutions.join(', ')}
                            </Text>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionPanel>
              </AccordionItem>
            );
          })}
          </Accordion>
        </div>
      )}
    </div>
  );
}
