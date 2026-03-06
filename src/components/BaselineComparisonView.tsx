import { useMemo, useRef, useState, type ChangeEvent } from 'react';
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
import { ArrowUpload24Regular, DocumentArrowDown24Regular } from '@fluentui/react-icons';
import type {
  BlueprintResult,
  BaselineChange,
  BaselineComparisonResult,
  BlueprintExportLike,
} from '../core';
import {
  compareWithBaseline,
  generateBaselineChangeLogMarkdown,
  parseBaselineBlueprintJson,
} from '../core';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
  summaryRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalS,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  changesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  changeItem: {
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  compareGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  selectorRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  matrixTag: {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
  },
});

export interface BaselineComparisonViewProps {
  result: BlueprintResult;
}

export function BaselineComparisonView({ result }: BaselineComparisonViewProps) {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [baselineFileName, setBaselineFileName] = useState<string>('');
  const [comparison, setComparison] = useState<BaselineComparisonResult | null>(null);
  const [baselineBlueprint, setBaselineBlueprint] = useState<BlueprintExportLike | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [error, setError] = useState<string>('');

  const sortedChanges = useMemo(() => {
    if (!comparison) {
      return [];
    }

    const severityOrder: Record<BaselineChange['severity'], number> = {
      Critical: 0,
      High: 1,
      Medium: 2,
      Low: 3,
    };

    return [...comparison.changes].sort((a, b) => {
      const severityCompare = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityCompare !== 0) {
        return severityCompare;
      }

      if (a.component !== b.component) {
        return a.component.localeCompare(b.component);
      }

      return a.itemName.localeCompare(b.itemName);
    });
  }, [comparison]);

  const changedEntityNames = useMemo(() => {
    if (!comparison) {
      return [];
    }

    const names = new Set<string>();
    for (const change of comparison.changes) {
      if (change.component !== 'Entities') {
        continue;
      }

      const entityName = change.itemName.split(/[.:]/)[0];
      if (entityName) {
        names.add(entityName);
      }
    }

    return [...names].sort((a, b) => a.localeCompare(b));
  }, [comparison]);

  const selectedEntityDetails = useMemo(() => {
    if (!baselineBlueprint || !selectedEntity) {
      return null;
    }

    const baselineEntity = (baselineBlueprint.entities || []).find(
      item => (item.entity?.LogicalName || '').toLowerCase() === selectedEntity.toLowerCase()
    );
    const currentEntity = result.entities.find(
      item => item.entity.LogicalName.toLowerCase() === selectedEntity.toLowerCase()
    );

    if (!baselineEntity && !currentEntity) {
      return null;
    }

    const baselineAttributes = new Set(
      (baselineEntity?.entity?.Attributes || [])
        .map(item => (item.LogicalName || '').toLowerCase())
        .filter(Boolean)
    );
    const currentAttributes = new Set(
      (currentEntity?.entity.Attributes || [])
        .map(item => item.LogicalName.toLowerCase())
        .filter(Boolean)
    );

    const baselineRelationships = collectRelationshipNames(
      baselineEntity?.entity?.OneToManyRelationships,
      baselineEntity?.entity?.ManyToOneRelationships,
      baselineEntity?.entity?.ManyToManyRelationships
    );
    const currentRelationships = collectRelationshipNames(
      currentEntity?.entity.OneToManyRelationships,
      currentEntity?.entity.ManyToOneRelationships,
      currentEntity?.entity.ManyToManyRelationships
    );

    return {
      baselineExists: !!baselineEntity,
      currentExists: !!currentEntity,
      attributes: buildPresenceRows(baselineAttributes, currentAttributes),
      relationships: buildPresenceRows(baselineRelationships, currentRelationships),
      baselineAttributeCount: baselineAttributes.size,
      currentAttributeCount: currentAttributes.size,
      baselineRelationshipCount: baselineRelationships.size,
      currentRelationshipCount: currentRelationships.size,
    };
  }, [baselineBlueprint, result.entities, selectedEntity]);

  const triggerBaselineUpload = () => {
    fileInputRef.current?.click();
  };

  const handleBaselineFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setError('');
      setComparison(null);
      setBaselineBlueprint(null);
      setSelectedEntity('');
      setBaselineFileName(file.name);

      const content = await file.text();
      const baselineBlueprint = parseBaselineBlueprintJson(content);
      const compareResult = compareWithBaseline(result, baselineBlueprint);
      setBaselineBlueprint(baselineBlueprint);
      setComparison(compareResult);
      const defaultEntity = extractDefaultEntity(compareResult);
      if (defaultEntity) {
        setSelectedEntity(defaultEntity);
      }
    } catch (comparisonError) {
      setError(comparisonError instanceof Error ? comparisonError.message : 'Failed to compare baseline file.');
    } finally {
      event.target.value = '';
    }
  };

  const downloadChangeLog = () => {
    if (!comparison) {
      return;
    }

    const markdown = generateBaselineChangeLogMarkdown(comparison);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    anchor.href = url;
    anchor.download = `baseline-change-log-${timestamp}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <Card>
        <Title3 className={styles.sectionTitle}>Baseline Comparison</Title3>
        <Text>
          Load a previous blueprint JSON export to compare against the current discovery snapshot.
        </Text>

        <div className={styles.actions} style={{ marginTop: tokens.spacingVerticalM }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleBaselineFileSelected}
            style={{ display: 'none' }}
          />
          <Button appearance="primary" icon={<ArrowUpload24Regular />} onClick={triggerBaselineUpload}>
            Load Baseline JSON
          </Button>
          <Button
            appearance="secondary"
            icon={<DocumentArrowDown24Regular />}
            onClick={downloadChangeLog}
            disabled={!comparison}
          >
            Download Change Log
          </Button>
          <Text className={styles.muted}>
            {baselineFileName ? `Loaded baseline: ${baselineFileName}` : 'No baseline loaded'}
          </Text>
        </div>
      </Card>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {comparison && (
        <>
          <Card>
            <Title3 className={styles.sectionTitle}>Risk Assessment</Title3>
            <div className={styles.summaryRow}>
              <Badge appearance="filled" color="danger">Critical: {comparison.riskSummary.critical}</Badge>
              <Badge appearance="filled" color="warning">High: {comparison.riskSummary.high}</Badge>
              <Badge appearance="tint" color="warning">Medium: {comparison.riskSummary.medium}</Badge>
              <Badge appearance="tint" color="informative">Low: {comparison.riskSummary.low}</Badge>
            </div>
            <Text className={styles.muted} style={{ marginTop: tokens.spacingVerticalS, display: 'block' }}>
              Baseline: {comparison.baselineEnvironment || 'Unknown'} · Current: {comparison.currentEnvironment || 'Unknown'}
            </Text>
          </Card>

          <Card>
            <Title3 className={styles.sectionTitle}>Side-by-Side Count Comparison</Title3>
            <div className={styles.tableWrap}>
              <Table aria-label="Baseline count comparison">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Component</TableHeaderCell>
                    <TableHeaderCell>Baseline</TableHeaderCell>
                    <TableHeaderCell>Current</TableHeaderCell>
                    <TableHeaderCell>Delta</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.countComparisons.map((row) => (
                    <TableRow key={row.component}>
                      <TableCell><TableCellLayout>{row.component}</TableCellLayout></TableCell>
                      <TableCell>{row.baseline}</TableCell>
                      <TableCell>{row.current}</TableCell>
                      <TableCell>
                        <Badge
                          appearance="tint"
                          color={row.delta > 0 ? 'success' : row.delta < 0 ? 'danger' : 'informative'}
                        >
                          {row.delta > 0 ? `+${row.delta}` : row.delta}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card>
            <Title3 className={styles.sectionTitle}>Entity Detail Comparison</Title3>
            <div className={styles.selectorRow}>
              <Text>Entity:</Text>
              <Select
                value={selectedEntity}
                onChange={(_, data) => setSelectedEntity(data.value)}
                style={{ minWidth: '280px' }}
              >
                {changedEntityNames.length === 0 && (
                  <option value="">No changed entities</option>
                )}
                {changedEntityNames.map((entityName) => (
                  <option key={entityName} value={entityName}>
                    {entityName}
                  </option>
                ))}
              </Select>
              {selectedEntityDetails && (
                <>
                  <Badge appearance="outline" color={selectedEntityDetails.baselineExists ? 'informative' : 'danger'}>
                    Baseline: {selectedEntityDetails.baselineExists ? 'Present' : 'Missing'}
                  </Badge>
                  <Badge appearance="outline" color={selectedEntityDetails.currentExists ? 'informative' : 'danger'}>
                    Current: {selectedEntityDetails.currentExists ? 'Present' : 'Missing'}
                  </Badge>
                </>
              )}
            </div>

            {!selectedEntityDetails && (
              <Text className={styles.muted} style={{ marginTop: tokens.spacingVerticalS, display: 'block' }}>
                Select an entity with detected changes to view side-by-side details.
              </Text>
            )}

            {selectedEntityDetails && (
              <div style={{ marginTop: tokens.spacingVerticalM, display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
                <div className={styles.compareGrid}>
                  <Card>
                    <Text weight="semibold">Attributes</Text>
                    <Text className={styles.muted} size={200}>
                      Baseline: {selectedEntityDetails.baselineAttributeCount} · Current: {selectedEntityDetails.currentAttributeCount}
                    </Text>
                    <div className={styles.tableWrap} style={{ marginTop: tokens.spacingVerticalS }}>
                      <Table aria-label="Entity attribute side-by-side">
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Column</TableHeaderCell>
                            <TableHeaderCell>Baseline</TableHeaderCell>
                            <TableHeaderCell>Current</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedEntityDetails.attributes.slice(0, 200).map((row) => (
                            <TableRow key={`attr-${row.name}`}>
                              <TableCell><span className={styles.matrixTag}>{row.name}</span></TableCell>
                              <TableCell>{row.inBaseline ? 'Yes' : 'No'}</TableCell>
                              <TableCell>{row.inCurrent ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <Card>
                    <Text weight="semibold">Relationships</Text>
                    <Text className={styles.muted} size={200}>
                      Baseline: {selectedEntityDetails.baselineRelationshipCount} · Current: {selectedEntityDetails.currentRelationshipCount}
                    </Text>
                    <div className={styles.tableWrap} style={{ marginTop: tokens.spacingVerticalS }}>
                      <Table aria-label="Entity relationship side-by-side">
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Relationship</TableHeaderCell>
                            <TableHeaderCell>Baseline</TableHeaderCell>
                            <TableHeaderCell>Current</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedEntityDetails.relationships.slice(0, 200).map((row) => (
                            <TableRow key={`rel-${row.name}`}>
                              <TableCell><span className={styles.matrixTag}>{row.name}</span></TableCell>
                              <TableCell>{row.inBaseline ? 'Yes' : 'No'}</TableCell>
                              <TableCell>{row.inCurrent ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <Title3 className={styles.sectionTitle}>Detected Changes ({sortedChanges.length})</Title3>
            {sortedChanges.length === 0 && (
              <Text>No differences detected between baseline and current blueprint.</Text>
            )}

            {sortedChanges.length > 0 && (
              <div className={styles.changesList}>
                {sortedChanges.slice(0, 400).map((change) => (
                  <div key={`${change.component}-${change.itemName}-${change.changeType}`} className={styles.changeItem}>
                    <div className={styles.summaryRow}>
                      <Badge appearance="outline">{change.component}</Badge>
                      <Badge appearance="tint">{change.changeType}</Badge>
                      <Badge
                        appearance="filled"
                        color={
                          change.severity === 'Critical'
                            ? 'danger'
                            : change.severity === 'High'
                            ? 'warning'
                            : change.severity === 'Medium'
                            ? 'warning'
                            : 'informative'
                        }
                      >
                        {change.severity}
                      </Badge>
                    </div>
                    <Text weight="semibold" style={{ display: 'block', marginTop: tokens.spacingVerticalXS }}>
                      {change.itemName}
                    </Text>
                    <Text className={styles.muted} style={{ display: 'block' }}>{change.description}</Text>
                    <Text size={200} style={{ display: 'block', marginTop: tokens.spacingVerticalXXS }}>
                      Recommendation: {change.recommendation}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function extractDefaultEntity(comparison: BaselineComparisonResult): string {
  for (const change of comparison.changes) {
    if (change.component !== 'Entities') {
      continue;
    }

    const entityName = change.itemName.split(/[.:]/)[0];
    if (entityName) {
      return entityName;
    }
  }

  return '';
}

function collectRelationshipNames(
  oneToMany: Array<{ SchemaName?: string }> | undefined,
  manyToOne: Array<{ SchemaName?: string }> | undefined,
  manyToMany: Array<{ SchemaName?: string }> | undefined
): Set<string> {
  const names = new Set<string>();

  for (const rel of oneToMany || []) {
    if (rel.SchemaName) {
      names.add(rel.SchemaName.toLowerCase());
    }
  }
  for (const rel of manyToOne || []) {
    if (rel.SchemaName) {
      names.add(rel.SchemaName.toLowerCase());
    }
  }
  for (const rel of manyToMany || []) {
    if (rel.SchemaName) {
      names.add(rel.SchemaName.toLowerCase());
    }
  }

  return names;
}

function buildPresenceRows(baselineSet: Set<string>, currentSet: Set<string>): Array<{
  name: string;
  inBaseline: boolean;
  inCurrent: boolean;
}> {
  const allNames = new Set<string>([...baselineSet, ...currentSet]);
  const rows = [...allNames].map((name) => ({
    name,
    inBaseline: baselineSet.has(name),
    inCurrent: currentSet.has(name),
  }));

  rows.sort((a, b) => {
    const scoreA = (a.inBaseline ? 1 : 0) + (a.inCurrent ? 1 : 0);
    const scoreB = (b.inBaseline ? 1 : 0) + (b.inCurrent ? 1 : 0);
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }
    return a.name.localeCompare(b.name);
  });

  return rows;
}
