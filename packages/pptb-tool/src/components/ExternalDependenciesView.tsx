import { useState, useMemo } from 'react';
import {
  Text,
  Title3,
  Card,
  Badge,
  SearchBox,
  Dropdown,
  Option,
  Button,
  makeStyles,
  tokens,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ChevronRight20Regular,
  Shield24Regular,
  ShieldError24Regular,
  ShieldCheckmark24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import type { ExternalEndpoint } from '@ppsb/core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  summaryCard: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  controls: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    minWidth: '300px',
  },
  dropdown: {
    minWidth: '200px',
  },
  tableContainer: {
    maxHeight: '600px',
    overflowY: 'auto',
  },
  expandedRow: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
  },
  riskFactorsSection: {
    marginTop: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  riskFactorCard: {
    padding: tokens.spacingVerticalS,
    borderLeft: `4px solid ${tokens.colorNeutralStroke1}`,
  },
  riskFactorCritical: {
    borderLeftColor: tokens.colorPaletteRedBorder1,
  },
  riskFactorHigh: {
    borderLeftColor: tokens.colorPaletteDarkOrangeBorder1,
  },
  riskFactorMedium: {
    borderLeftColor: tokens.colorPaletteYellowBorder1,
  },
  riskFactorLow: {
    borderLeftColor: tokens.colorPaletteGreenBorder1,
  },
  sourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  sourceCard: {
    padding: tokens.spacingVerticalS,
  },
  domainCell: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
  },
  wrapText: {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
});

export interface ExternalDependenciesViewProps {
  endpoints: ExternalEndpoint[];
}

export function ExternalDependenciesView({ endpoints }: ExternalDependenciesViewProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Calculate statistics
  const stats = useMemo(() => {
    const trusted = endpoints.filter((e) => e.riskLevel === 'Trusted').length;
    const known = endpoints.filter((e) => e.riskLevel === 'Known').length;
    const unknown = endpoints.filter((e) => e.riskLevel === 'Unknown').length;
    const criticalRisks = endpoints.filter((e) =>
      e.riskFactors.some((f: { severity: string }) => f.severity === 'Critical')
    ).length;

    return {
      total: endpoints.length,
      trusted,
      known,
      unknown,
      criticalRisks,
    };
  }, [endpoints]);

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((endpoint) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          endpoint.domain.toLowerCase().includes(query) ||
          endpoint.url.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Risk level filter
      if (riskLevelFilter !== 'all' && endpoint.riskLevel !== riskLevelFilter) {
        return false;
      }

      return true;
    });
  }, [endpoints, searchQuery, riskLevelFilter]);

  // Toggle row expansion
  const toggleRow = (domain: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(domain)) {
        newSet.delete(domain);
      } else {
        newSet.add(domain);
      }
      return newSet;
    });
  };

  // Table columns
  const columns: TableColumnDefinition<ExternalEndpoint>[] = [
    createTableColumn<ExternalEndpoint>({
      columnId: 'expand',
      renderHeaderCell: () => '',
      renderCell: (item) => (
        <Button
          appearance="subtle"
          size="small"
          icon={expandedRows.has(item.domain) ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
          onClick={() => toggleRow(item.domain)}
        />
      ),
    }),
    createTableColumn<ExternalEndpoint>({
      columnId: 'domain',
      renderHeaderCell: () => 'Domain',
      renderCell: (item) => (
        <div>
          <Text weight="semibold" className={`${styles.domainCell} ${styles.wrapText}`}>{item.domain}</Text>
          <Text className={styles.wrapText} style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
            {item.protocol}://
          </Text>
        </div>
      ),
      compare: (a, b) => a.domain.localeCompare(b.domain),
    }),
    createTableColumn<ExternalEndpoint>({
      columnId: 'riskLevel',
      renderHeaderCell: () => 'Risk Level',
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
          {item.riskLevel === 'Trusted' ? (
            <ShieldCheckmark24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
          ) : item.riskLevel === 'Known' ? (
            <Shield24Regular style={{ color: tokens.colorPaletteBlueForeground2 }} />
          ) : (
            <ShieldError24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
          )}
          <Badge
            appearance="filled"
            color={
              item.riskLevel === 'Trusted'
                ? 'success'
                : item.riskLevel === 'Known'
                ? 'informative'
                : 'danger'
            }
          >
            {item.riskLevel}
          </Badge>
        </div>
      ),
    }),
    createTableColumn<ExternalEndpoint>({
      columnId: 'riskFactors',
      renderHeaderCell: () => 'Risk Factors',
      renderCell: (item) => {
        const criticalCount = item.riskFactors.filter((f: { severity: string }) => f.severity === 'Critical').length;
        const highCount = item.riskFactors.filter((f: { severity: string }) => f.severity === 'High').length;

        return (
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalXS }}>
            {criticalCount > 0 && (
              <Badge appearance="filled" color="danger">
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge appearance="filled" color="warning">
                {highCount} High
              </Badge>
            )}
            {criticalCount === 0 && highCount === 0 && item.riskFactors.length > 0 && (
              <Badge appearance="outline">{item.riskFactors.length} factors</Badge>
            )}
          </div>
        );
      },
    }),
    createTableColumn<ExternalEndpoint>({
      columnId: 'callCount',
      renderHeaderCell: () => 'Called From',
      renderCell: (item) => (
        <Badge appearance="tint" color="brand">
          {item.callCount} component{item.callCount !== 1 ? 's' : ''}
        </Badge>
      ),
      compare: (a, b) => a.callCount - b.callCount,
    }),
  ];

  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card className={styles.summaryCard}>
          <Text weight="semibold">Total Endpoints</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700 }}>{stats.total}</Text>
        </Card>
        <Card className={styles.summaryCard}>
          <Text weight="semibold">Trusted</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: tokens.colorPaletteGreenForeground1 }}>
            {stats.trusted}
          </Text>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
            Microsoft domains
          </Text>
        </Card>
        <Card className={styles.summaryCard}>
          <Text weight="semibold">Known</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: tokens.colorPaletteBlueForeground2 }}>
            {stats.known}
          </Text>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
            Whitelisted services
          </Text>
        </Card>
        <Card className={styles.summaryCard}>
          <Text weight="semibold">Unknown</Text>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: tokens.colorPaletteRedForeground1 }}>
            {stats.unknown}
          </Text>
          <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
            Review required
          </Text>
        </Card>
        <Card className={styles.summaryCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS }}>
            <Warning24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
            <Text weight="semibold">Critical Risks</Text>
          </div>
          <Text style={{ fontSize: tokens.fontSizeHero700, color: tokens.colorPaletteRedForeground1 }}>
            {stats.criticalRisks}
          </Text>
        </Card>
      </div>

      {/* Controls */}
      <Title3>External API Dependencies</Title3>
      <div className={styles.controls}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search domains or URLs..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
        />

        <Dropdown
          className={styles.dropdown}
          placeholder="Risk Level"
          value={
            riskLevelFilter === 'all'
              ? 'All Risk Levels'
              : riskLevelFilter
          }
          onOptionSelect={(_, data) => setRiskLevelFilter(data.optionValue || 'all')}
        >
          <Option value="all">All Risk Levels</Option>
          <Option value="Unknown">Unknown</Option>
          <Option value="Known">Known</Option>
          <Option value="Trusted">Trusted</Option>
        </Dropdown>
      </div>

      <Text>
        Showing {filteredEndpoints.length} of {endpoints.length} endpoints
      </Text>

      {/* Table with Expandable Rows */}
      <div className={styles.tableContainer}>
        {filteredEndpoints.map((endpoint) => (
          <div key={endpoint.domain} style={{ marginBottom: tokens.spacingVerticalS }}>
            <DataGrid items={[endpoint]} columns={columns} resizableColumns>
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<ExternalEndpoint>>
                {({ item, rowId }) => (
                  <DataGridRow<ExternalEndpoint> key={rowId}>
                    {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>

            {/* Expanded Row Details */}
            {expandedRows.has(endpoint.domain) && (
              <div className={styles.expandedRow}>
                {/* Risk Factors */}
                {endpoint.riskFactors.length > 0 && (
                  <div className={styles.riskFactorsSection}>
                    <Text weight="semibold">Risk Factors</Text>
                    {endpoint.riskFactors.map((factor: any, index: number) => (
                      <Card
                        key={index}
                        className={`${styles.riskFactorCard} ${
                          factor.severity === 'Critical'
                            ? styles.riskFactorCritical
                            : factor.severity === 'High'
                            ? styles.riskFactorHigh
                            : factor.severity === 'Medium'
                            ? styles.riskFactorMedium
                            : styles.riskFactorLow
                        }`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                          <Badge
                            appearance="filled"
                            color={
                              factor.severity === 'Critical' || factor.severity === 'High'
                                ? 'danger'
                                : factor.severity === 'Medium'
                                ? 'warning'
                                : 'success'
                            }
                          >
                            {factor.severity}
                          </Badge>
                          <Text weight="semibold" className={styles.wrapText}>{factor.factor}</Text>
                        </div>
                        <Text className={styles.wrapText} style={{ marginTop: tokens.spacingVerticalXS }}>{factor.description}</Text>
                        <Text
                          className={styles.wrapText}
                          style={{
                            marginTop: tokens.spacingVerticalXS,
                            fontSize: tokens.fontSizeBase200,
                            color: tokens.colorNeutralForeground3,
                          }}
                        >
                          💡 {factor.recommendation}
                        </Text>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Sources */}
                <div style={{ marginTop: tokens.spacingVerticalL }}>
                  <Text weight="semibold">Called From ({endpoint.detectedIn.length})</Text>
                  <div className={styles.sourcesGrid}>
                    {endpoint.detectedIn.map((source: any, index: number) => (
                      <Card key={index} className={styles.sourceCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, marginBottom: tokens.spacingVerticalXXS }}>
                          <Badge appearance="outline" color="brand">
                            {source.type}
                          </Badge>
                          <Badge appearance="tint" color={source.mode === 'Sync' ? 'warning' : 'success'}>
                            {source.mode}
                          </Badge>
                        </div>
                        <Text weight="semibold" className={styles.wrapText} style={{ fontSize: tokens.fontSizeBase200 }}>
                          {source.name}
                        </Text>
                        {source.entity && (
                          <Text className={styles.wrapText} style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                            Entity: {source.entity}
                          </Text>
                        )}
                        <Text className={styles.wrapText} style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
                          Confidence: {source.confidence}
                        </Text>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
