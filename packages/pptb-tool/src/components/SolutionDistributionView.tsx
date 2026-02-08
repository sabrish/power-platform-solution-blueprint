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
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
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

  // Component counts table columns
  const countsColumns: TableColumnDefinition<{ type: string; count: number }>[] = [
    createTableColumn<{ type: string; count: number }>({
      columnId: 'type',
      renderHeaderCell: () => 'Component Type',
      renderCell: (item) => <Text>{item.type}</Text>,
    }),
    createTableColumn<{ type: string; count: number }>({
      columnId: 'count',
      renderHeaderCell: () => 'Count',
      renderCell: (item) => <Badge appearance="tint" color="brand">{item.count}</Badge>,
      compare: (a, b) => b.count - a.count,
    }),
  ];

  return (
    <div className={styles.container}>
      <Title3>Solution Distribution Analysis</Title3>
      <Text>
        Analyzing {distributions.length} solution{distributions.length !== 1 ? 's' : ''}
      </Text>

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

      {/* Detailed Breakdown */}
      <div className={styles.detailsSection}>
        <Title3>Detailed Component Breakdown</Title3>
        <Accordion multiple collapsible>
          {distributions.map((solution) => {
            const componentData = [
              { type: 'Entities', count: solution.componentCounts.entities },
              { type: 'Plugins', count: solution.componentCounts.plugins },
              { type: 'Flows', count: solution.componentCounts.flows },
              { type: 'Business Rules', count: solution.componentCounts.businessRules },
              { type: 'Classic Workflows', count: solution.componentCounts.classicWorkflows },
              { type: 'Business Process Flows', count: solution.componentCounts.bpfs },
              { type: 'Web Resources', count: solution.componentCounts.webResources },
              { type: 'Custom APIs', count: solution.componentCounts.customAPIs },
              { type: 'Environment Variables', count: solution.componentCounts.environmentVariables },
              { type: 'Connection References', count: solution.componentCounts.connectionReferences },
              { type: 'Global Choices', count: solution.componentCounts.globalChoices },
            ].filter((item) => item.count > 0);

            return (
              <AccordionItem key={solution.solutionId} value={solution.solutionId}>
                <AccordionHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                    <Text weight="semibold">{solution.solutionName}</Text>
                    <Badge appearance="outline">{solution.componentCounts.total} components</Badge>
                  </div>
                </AccordionHeader>
                <AccordionPanel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL }}>
                    {/* Component Counts Table */}
                    <div>
                      <Text weight="semibold">Component Counts</Text>
                      <DataGrid
                        items={componentData}
                        columns={countsColumns}
                        sortable
                        style={{ marginTop: tokens.spacingVerticalS }}
                      >
                        <DataGridHeader>
                          <DataGridRow>
                            {({ renderHeaderCell }) => (
                              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                            )}
                          </DataGridRow>
                        </DataGridHeader>
                        <DataGridBody<{ type: string; count: number }>>
                          {({ item, rowId }) => (
                            <DataGridRow<{ type: string; count: number }> key={rowId}>
                              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                            </DataGridRow>
                          )}
                        </DataGridBody>
                      </DataGrid>
                    </div>

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
    </div>
  );
}
