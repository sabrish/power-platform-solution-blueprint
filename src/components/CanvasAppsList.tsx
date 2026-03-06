import { useRef, useState, type ChangeEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Select,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ArrowUpload24Regular } from '@fluentui/react-icons';
import type { CanvasApp } from '../core';
import { formatDate } from '../utils/dateFormat';
import { analyzeMsAppFile, type MsAppAnalysisResult } from '../utils/msappAnalyzer';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  summary: {
    color: tokens.colorNeutralForeground3,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  code: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
  },
  emptyState: {
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground3,
  },
  analysisSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  controls: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metricsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  list: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalM,
  },
});

export interface CanvasAppsListProps {
  canvasApps: CanvasApp[];
}

export function CanvasAppsList({ canvasApps }: CanvasAppsListProps) {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAppId, setSelectedAppId] = useState(canvasApps[0]?.id || '');
  const [analysis, setAnalysis] = useState<MsAppAnalysisResult | null>(null);
  const [analysisFileName, setAnalysisFileName] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  if (canvasApps.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text style={{ fontSize: '40px' }}>🖼️</Text>
        <Title3>No Canvas Apps Found</Title3>
        <Text>No canvas apps were discovered in the selected scope.</Text>
      </div>
    );
  }

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsAnalysing(true);
      setAnalysisError('');
      setAnalysis(null);
      setAnalysisFileName(file.name);

      const result = await analyzeMsAppFile(file);
      setAnalysis(result);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyse .msapp file.');
    } finally {
      setIsAnalysing(false);
      event.target.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <Text className={styles.summary}>
        {canvasApps.length} canvas app{canvasApps.length === 1 ? '' : 's'} in selected scope.
      </Text>

      <Card>
        <div className={styles.tableWrap}>
          <Table aria-label="Canvas Apps">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Display Name</TableHeaderCell>
                <TableHeaderCell>Internal Name</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Owner</TableHeaderCell>
                <TableHeaderCell>Modified</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {canvasApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <TableCellLayout>{app.displayName}</TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <span className={styles.code}>{app.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge appearance="tint" color={app.state?.toLowerCase() === 'active' ? 'success' : 'informative'}>
                      {app.state || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>{app.ownerName || 'Unknown'}</TableCell>
                  <TableCell>{app.modifiedOn ? formatDate(app.modifiedOn) : 'Unknown'}</TableCell>
                  <TableCell>{app.createdOn ? formatDate(app.createdOn) : 'Unknown'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className={styles.analysisSection}>
        <Title3>.msapp Deep Analysis (Phase 3 Beta)</Title3>
        <Text className={styles.summary}>
          Upload a Canvas App package to extract screen inventory, complexity signals, per-screen data source usage, and accessibility checks.
        </Text>

        <div className={styles.controls}>
          <Text>App context:</Text>
          <Select value={selectedAppId} onChange={(_, data) => setSelectedAppId(data.value)} style={{ minWidth: '240px' }}>
            {canvasApps.map((app) => (
              <option key={app.id} value={app.id}>{app.displayName}</option>
            ))}
          </Select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".msapp"
            onChange={handleFileSelected}
            style={{ display: 'none' }}
          />
          <Button appearance="primary" icon={<ArrowUpload24Regular />} onClick={triggerUpload} disabled={isAnalysing}>
            {isAnalysing ? 'Analysing...' : 'Upload .msapp'}
          </Button>

          <Text className={styles.summary}>{analysisFileName ? `File: ${analysisFileName}` : 'No file uploaded'}</Text>
        </div>

        {analysisError && (
          <MessageBar intent="error">
            <MessageBarBody>{analysisError}</MessageBarBody>
          </MessageBar>
        )}

        {analysis && (
          <>
            <div className={styles.metricsRow}>
              <Badge appearance="filled" color="informative">Files: {analysis.fileCount}</Badge>
              <Badge appearance="filled" color="informative">Screens: {analysis.screenNames.length}</Badge>
              <Badge appearance="filled" color="informative">Control Types: {analysis.controlTypes.length}</Badge>
              <Badge appearance="filled" color="informative">Data Source Hints: {analysis.dataSourceHints.length}</Badge>
              <Badge appearance="filled" color={analysis.accessibilityIssues.length > 0 ? 'warning' : 'success'}>
                Accessibility Issues: {analysis.accessibilityIssues.length}
              </Badge>
            </div>

            <div className={styles.splitGrid}>
              <Card>
                <Text weight="semibold">Screens</Text>
                {analysis.screenNames.length === 0 ? (
                  <Text className={styles.summary}>No screens detected from file structure.</Text>
                ) : (
                  <ul className={styles.list}>
                    {analysis.screenNames.slice(0, 30).map((name) => (
                      <li key={name}><Text>{name}</Text></li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <Text weight="semibold">Navigation Targets</Text>
                {analysis.navigationTargets.length === 0 ? (
                  <Text className={styles.summary}>No Navigate() targets detected.</Text>
                ) : (
                  <ul className={styles.list}>
                    {analysis.navigationTargets.slice(0, 30).map((name) => (
                      <li key={name}><Text>{name}</Text></li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card>
              <Text weight="semibold" style={{ display: 'block', marginBottom: tokens.spacingVerticalS }}>Control Type Summary</Text>
              <div className={styles.tableWrap}>
                <Table aria-label="Canvas App control summary">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Control Type</TableHeaderCell>
                      <TableHeaderCell>Count</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.controlTypes.slice(0, 40).map((item) => (
                      <TableRow key={item.controlType}>
                        <TableCell><span className={styles.code}>{item.controlType}</span></TableCell>
                        <TableCell>{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card>
              <Text weight="semibold" style={{ display: 'block', marginBottom: tokens.spacingVerticalS }}>
                Screen Complexity and Data Source Usage
              </Text>
              {analysis.screenAnalysis.length === 0 ? (
                <Text className={styles.summary}>No screen-level analysis could be produced from this package.</Text>
              ) : (
                <div className={styles.tableWrap}>
                  <Table aria-label="Canvas App screen analysis">
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Screen</TableHeaderCell>
                        <TableHeaderCell>Complexity</TableHeaderCell>
                        <TableHeaderCell>Score</TableHeaderCell>
                        <TableHeaderCell>Controls</TableHeaderCell>
                        <TableHeaderCell>Formulas</TableHeaderCell>
                        <TableHeaderCell>Data Sources</TableHeaderCell>
                        <TableHeaderCell>Accessibility</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.screenAnalysis.slice(0, 50).map((screen) => (
                        <TableRow key={screen.screenName}>
                          <TableCell><span className={styles.code}>{screen.screenName}</span></TableCell>
                          <TableCell>
                            <Badge
                              appearance="tint"
                              color={
                                screen.complexityBand === 'High'
                                  ? 'danger'
                                  : screen.complexityBand === 'Medium'
                                    ? 'warning'
                                    : 'success'
                              }
                            >
                              {screen.complexityBand}
                            </Badge>
                          </TableCell>
                          <TableCell>{screen.formulaComplexityScore}</TableCell>
                          <TableCell>{screen.controlCount} ({screen.distinctControlTypes} types)</TableCell>
                          <TableCell>{screen.formulaCount}</TableCell>
                          <TableCell>
                            {screen.dataSourceHints.length === 0
                              ? 'None'
                              : screen.dataSourceHints.slice(0, 4).join(', ')}
                          </TableCell>
                          <TableCell>
                            <Badge appearance="tint" color={screen.accessibilityIssueCount > 0 ? 'warning' : 'success'}>
                              {screen.accessibilityIssueCount}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            <Card>
              <Text weight="semibold">Data Source Hints</Text>
              {analysis.dataSourceHints.length === 0 ? (
                <Text className={styles.summary}>No data source hints detected.</Text>
              ) : (
                <div className={styles.metricsRow}>
                  {analysis.dataSourceHints.slice(0, 30).map((hint) => (
                    <Badge key={hint} appearance="tint" color="warning">{hint}</Badge>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <Text weight="semibold" style={{ display: 'block', marginBottom: tokens.spacingVerticalS }}>
                Accessibility Findings
              </Text>
              {analysis.accessibilityIssues.length === 0 ? (
                <Text className={styles.summary}>No accessibility issues were detected by current heuristics.</Text>
              ) : (
                <div className={styles.tableWrap}>
                  <Table aria-label="Canvas App accessibility findings">
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Screen</TableHeaderCell>
                        <TableHeaderCell>Severity</TableHeaderCell>
                        <TableHeaderCell>Issue</TableHeaderCell>
                        <TableHeaderCell>Recommendation</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.accessibilityIssues.slice(0, 80).map((item, index) => (
                        <TableRow key={`${item.screenName}-${item.issue}-${index}`}>
                          <TableCell><span className={styles.code}>{item.screenName}</span></TableCell>
                          <TableCell>
                            <Badge
                              appearance="tint"
                              color={
                                item.severity === 'High'
                                  ? 'danger'
                                  : item.severity === 'Medium'
                                    ? 'warning'
                                    : 'informative'
                              }
                            >
                              {item.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.issue}</TableCell>
                          <TableCell>{item.recommendation}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            {analysis.warnings.length > 0 && (
              <Card>
                <Text weight="semibold">Analysis Warnings</Text>
                <ul className={styles.list}>
                  {analysis.warnings.slice(0, 10).map((warning) => (
                    <li key={warning}><Text>{warning}</Text></li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
