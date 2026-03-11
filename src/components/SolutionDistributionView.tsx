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
import type { SolutionDistribution, ComponentCounts, SolutionDependency, SharedComponent } from '../core';

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
    fontSize: tokens.fontSizeBase200,
  },
  detailsSection: {
    marginTop: tokens.spacingVerticalL,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
  },
  sectionHeadingBlock: {
    marginBottom: tokens.spacingVerticalM,
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalXS,
  },
  solutionNameText: {
    fontSize: tokens.fontSizeBase400,
  },
  metaText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  smallText: {
    fontSize: tokens.fontSizeBase200,
  },
  smallTextIndented: {
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalXXS,
  },
  accordionList: {
    marginTop: tokens.spacingVerticalM,
  },
  accordionHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  itemCard: {
    marginTop: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
  },
  sharedItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

export interface SolutionDistributionViewProps {
  distributions: SolutionDistribution[];
}

export function SolutionDistributionView({ distributions }: SolutionDistributionViewProps) {
  const styles = useStyles();

  // Calculate color for component type in bar chart
  // Typed to enforce sync with ComponentCounts — compiler flags unknown keys
  const componentTypeColors: Partial<Record<keyof Omit<ComponentCounts, 'total'>, string>> = {
    entities: tokens.colorPaletteBlueBackground2,
    plugins: tokens.colorPalettePurpleBackground2,
    flows: tokens.colorPaletteGreenBackground2,
    businessRules: tokens.colorPaletteDarkOrangeBackground2,
    classicWorkflows: tokens.colorPaletteRedBackground2,
    bpfs: tokens.colorPaletteTealBackground2,
    webResources: tokens.colorPaletteYellowBackground2,
    customAPIs: tokens.colorPalettePinkBackground2,
    environmentVariables: tokens.colorPaletteSteelBackground2,
    connectionReferences: tokens.colorPaletteCornflowerBackground2,
    globalChoices: tokens.colorPaletteMarigoldBackground2,
    customConnectors: tokens.colorPaletteLavenderBackground2,
    securityRoles: tokens.colorPaletteCranberryBackground2,
    fieldSecurityProfiles: tokens.colorPalettePumpkinBackground2,
    canvasApps: tokens.colorPaletteForestBackground2,
    customPages: tokens.colorPaletteMinkBackground2,
    modelDrivenApps: tokens.colorPalettePlumBackground2,
  };

  // Calculate percentages for bar chart
  const calculatePercentages = (counts: ComponentCounts) => {
    const total = counts.total;
    if (total === 0) return {};

    return Object.fromEntries(
      (Object.keys(componentTypeColors) as (keyof ComponentCounts)[])
        .map(key => [key, ((counts[key] as number) / total) * 100])
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeadingBlock}>
        <Title3 className={styles.sectionTitle}>Solution Distribution Analysis</Title3>
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
                  <Text weight="bold" className={styles.solutionNameText}>
                    {solution.solutionName}
                  </Text>
                  {solution.isManaged && (
                    <Badge appearance="filled" shape="rounded" size="small" color="informative">
                      Managed
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Text className={styles.metaText}>
                  Publisher: {solution.publisher}
                </Text>
              </div>

              <div>
                <Text className={styles.metaText}>
                  Version: {solution.version}
                </Text>
              </div>

              <div className={styles.componentCount}>{solution.componentCounts.total}</div>
              <Text className={styles.smallText}>Total Components</Text>

              {/* Mini bar chart — inline style is intentional: width is dynamic (runtime %) and
                  backgroundColor comes from componentTypeColors (palette Background2 tokens).
                  AUDIT-001 does not apply — these segments contain no text content. */}
              <div className={styles.barChart}>
                {Object.entries(percentages).map(([type, percentage]) => {
                  if (percentage === 0) return null;
                  return (
                    <div
                      key={type}
                      className={styles.barSegment}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: componentTypeColors[type as keyof typeof componentTypeColors] || tokens.colorNeutralBackground3,
                      }}
                      title={`${type}: ${percentage.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Component counts — all types, non-zero only */}
              <div className={styles.countsGrid}>
                {([
                  ['Entities', solution.componentCounts.entities],
                  ['Plugins', solution.componentCounts.plugins],
                  ['Flows', solution.componentCounts.flows],
                  ['Business Rules', solution.componentCounts.businessRules],
                  ['Classic Workflows', solution.componentCounts.classicWorkflows],
                  ['Business Process Flows', solution.componentCounts.bpfs],
                  ['Web Resources', solution.componentCounts.webResources],
                  ['Custom APIs', solution.componentCounts.customAPIs],
                  ['Environment Variables', solution.componentCounts.environmentVariables],
                  ['Connection References', solution.componentCounts.connectionReferences],
                  ['Global Choices', solution.componentCounts.globalChoices],
                  ['Custom Connectors', solution.componentCounts.customConnectors],
                  ['Security Roles', solution.componentCounts.securityRoles],
                  ['Field Security Profiles', solution.componentCounts.fieldSecurityProfiles],
                  ['Canvas Apps', solution.componentCounts.canvasApps],
                  ['Custom Pages', solution.componentCounts.customPages],
                  ['Model-Driven Apps', solution.componentCounts.modelDrivenApps],
                ] as [string, number][]).filter(([, n]) => n > 0).map(([label, n]) => (
                  <div key={label} className={styles.countItem}>
                    <Text>{label}: <Text weight="semibold">{n}</Text></Text>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Solution Details - Only show if there are dependencies or shared components */}
      {!distributions.every(s => s.dependencies.length === 0 && s.sharedComponents.length === 0) && (
        <div className={styles.detailsSection}>
          <div className={styles.sectionHeadingBlock}>
            <Title3 className={styles.sectionTitle}>Solution Dependencies & Shared Components</Title3>
            <Text className={styles.description}>
              View dependencies between solutions and components shared across multiple solutions
            </Text>
          </div>

          <Accordion multiple collapsible className={styles.accordionList}>
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
                  <div className={styles.accordionHeaderRow}>
                    <Text weight="semibold">{solution.solutionName}</Text>
                    {hasDependencies && (
                      <Badge appearance="outline" shape="rounded" size="small" color="warning">
                        {solution.dependencies.length} dependencies
                      </Badge>
                    )}
                    {hasSharedComponents && (
                      <Badge appearance="outline" shape="rounded" size="small" color="informative">
                        {solution.sharedComponents.length} shared
                      </Badge>
                    )}
                  </div>
                </AccordionHeader>
                <AccordionPanel>
                  <div className={styles.panelContent}>
                    {/* Dependencies */}
                    {solution.dependencies.length > 0 && (
                      <div>
                        <Text weight="semibold">Dependencies</Text>
                        {solution.dependencies.map((dep: SolutionDependency, index: number) => (
                          <Card key={index} className={styles.itemCard}>
                            <Text weight="semibold">{dep.dependsOnSolution}</Text>
                            <Text className={styles.metaText}>
                              {dep.reason}
                            </Text>
                            <Text className={styles.smallTextIndented}>
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
                        <Text className={styles.metaText}>
                          Components that appear in multiple solutions
                        </Text>
                        {solution.sharedComponents.map((shared: SharedComponent, index: number) => (
                          <Card key={index} className={styles.itemCard}>
                            <div className={styles.accordionHeaderRow}>
                              <Badge appearance="outline" shape="rounded">{shared.componentType}</Badge>
                              <Text weight="semibold">{shared.componentName}</Text>
                            </div>
                            <Text className={styles.smallTextIndented}>
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
