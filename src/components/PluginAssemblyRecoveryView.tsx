import { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  Text,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  PptbDataverseClient,
  PluginAssemblyDiscovery,
  type PluginAssembly,
  type RecoveredPluginAssembly,
} from '../core';
import { extractDotNetAssemblyHintsFromBase64, type DotNetAssemblyHints } from '../utils/dotNetAssemblyHints';

const DEFAULT_DECOMPILER_COMMAND = 'ilspycmd -p -o {outputDir} {assemblyPath}';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
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
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarLeft: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  commandRow: {
    marginTop: tokens.spacingVerticalS,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  commandActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  row: {
    padding: tokens.spacingVerticalM,
  },
  rowHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  rowMain: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  rowName: {
    fontWeight: tokens.fontWeightSemibold,
    wordBreak: 'break-word',
  },
  rowActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  metaGrid: {
    marginTop: tokens.spacingVerticalS,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  metaLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  codeValue: {
    fontFamily: 'Consolas, Monaco, monospace',
    wordBreak: 'break-word',
  },
  typeBadges: {
    marginTop: tokens.spacingVerticalS,
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
  },
  analysisPanel: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  analysisSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
  },
  smallList: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalM,
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
});

type StatusIntent = 'success' | 'warning' | 'error';

interface StatusMessage {
  intent: StatusIntent;
  text: string;
}

interface DecompileIssue {
  assemblyName: string;
  reason: string;
}

export interface PluginAssemblyRecoveryViewProps {
  assemblies: PluginAssembly[];
}

export function PluginAssemblyRecoveryView({ assemblies }: PluginAssemblyRecoveryViewProps) {
  const styles = useStyles();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyAssemblyId, setBusyAssemblyId] = useState<string | null>(null);
  const [isBatchRecovering, setIsBatchRecovering] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDecompiling, setIsDecompiling] = useState(false);
  const [decompileProgress, setDecompileProgress] = useState<{ current: number; total: number } | null>(null);
  const [decompilerCommand, setDecompilerCommand] = useState(DEFAULT_DECOMPILER_COMMAND);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [analysisByAssembly, setAnalysisByAssembly] = useState<Record<string, DotNetAssemblyHints>>({});
  const [analysisLoadingByAssembly, setAnalysisLoadingByAssembly] = useState<Record<string, boolean>>({});
  const recoveredAssemblyCacheRef = useRef<Map<string, RecoveredPluginAssembly>>(new Map());

  const sortedAssemblies = useMemo(
    () => [...assemblies].sort((a, b) => a.name.localeCompare(b.name)),
    [assemblies]
  );

  useEffect(() => {
    setSelectedIds(new Set(sortedAssemblies.map(a => a.id)));
  }, [sortedAssemblies]);

  useEffect(() => {
    let isMounted = true;
    if (!window.toolboxAPI?.settings) {
      return;
    }

    window.toolboxAPI.settings
      .get('pluginDecompilerCommandTemplate')
      .then((value) => {
        if (isMounted && typeof value === 'string' && value.trim()) {
          setDecompilerCommand(value.trim());
        }
      })
      .catch(() => {
        // Best-effort load only.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedCount = selectedIds.size;

  const getDiscoveryService = (): PluginAssemblyDiscovery => {
    if (!window.dataverseAPI) {
      throw new Error('PPTB Dataverse API is not available');
    }

    const client = new PptbDataverseClient(window.dataverseAPI);
    return new PluginAssemblyDiscovery(client);
  };

  const getRecoveredAssembly = async (assemblyId: string): Promise<RecoveredPluginAssembly> => {
    const cached = recoveredAssemblyCacheRef.current.get(assemblyId);
    if (cached) {
      return cached;
    }

    const discovery = getDiscoveryService();
    const recovered = await discovery.getAssemblyContentById(assemblyId);
    recoveredAssemblyCacheRef.current.set(assemblyId, recovered);
    return recovered;
  };

  const toggleSelection = (assemblyId: string, isSelected: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (isSelected) {
        next.add(assemblyId);
      } else {
        next.delete(assemblyId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(sortedAssemblies.map(a => a.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const decodeBase64 = (base64Content: string): Uint8Array => {
    const sanitized = base64Content.replace(/\s/g, '');
    const binary = atob(sanitized);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadSingleAssembly = async (assembly: PluginAssembly) => {
    try {
      setBusyAssemblyId(assembly.id);
      setStatus(null);

      const recovered = await getRecoveredAssembly(assembly.id);
      const payload = decodeBase64(recovered.contentBase64);
      const blobPayload = new Uint8Array(payload);
      const blob = new Blob([blobPayload.buffer], { type: 'application/octet-stream' });

      triggerDownload(blob, recovered.fileName);
      setStatus({ intent: 'success', text: `Recovered ${recovered.fileName}` });
    } catch (error) {
      setStatus({
        intent: 'error',
        text: `Failed to recover ${assembly.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setBusyAssemblyId(null);
    }
  };

  const analyseAssembly = async (assembly: PluginAssembly) => {
    if (analysisByAssembly[assembly.id]) {
      return;
    }

    try {
      setAnalysisLoadingByAssembly(previous => ({ ...previous, [assembly.id]: true }));
      setStatus(null);

      const recovered = await getRecoveredAssembly(assembly.id);
      const hints = extractDotNetAssemblyHintsFromBase64(recovered.contentBase64);
      setAnalysisByAssembly(previous => ({ ...previous, [assembly.id]: hints }));
    } catch (error) {
      setStatus({
        intent: 'error',
        text: `Failed to analyse ${assembly.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setAnalysisLoadingByAssembly(previous => ({ ...previous, [assembly.id]: false }));
    }
  };

  const downloadSelectedAssemblies = async () => {
    if (selectedIds.size === 0) {
      setStatus({ intent: 'warning', text: 'Select at least one assembly to recover.' });
      return;
    }

    try {
      setIsBatchRecovering(true);
      setStatus(null);

      const zip = new JSZip();
      const selectedAssemblies = sortedAssemblies.filter(assembly => selectedIds.has(assembly.id));
      const failedAssemblies: string[] = [];
      let recoveredCount = 0;

      for (let i = 0; i < selectedAssemblies.length; i += 1) {
        const assembly = selectedAssemblies[i];
        setBatchProgress({ current: i + 1, total: selectedAssemblies.length });

        try {
          const recovered = await getRecoveredAssembly(assembly.id);
          const payload = decodeBase64(recovered.contentBase64);
          zip.file(recovered.fileName, payload);
          recoveredCount += 1;
        } catch {
          failedAssemblies.push(assembly.name);
        }
      }

      if (recoveredCount === 0) {
        throw new Error('No assemblies could be recovered from the current selection');
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      triggerDownload(zipBlob, `plugin-assembly-recovery-${timestamp}.zip`);

      if (failedAssemblies.length > 0) {
        setStatus({
          intent: 'warning',
          text: `Recovered ${recoveredCount} assembly files. Failed: ${failedAssemblies.join(', ')}`,
        });
      } else {
        setStatus({
          intent: 'success',
          text: `Recovered ${recoveredCount} assembly files.`,
        });
      }
    } catch (error) {
      setStatus({
        intent: 'error',
        text: `Assembly recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsBatchRecovering(false);
      setBatchProgress(null);
    }
  };

  const isPowerShellShell = (shell: string): boolean => /pwsh|powershell/i.test(shell);

  const quoteForShell = (value: string, shell: string): string => {
    if (isPowerShellShell(shell)) {
      return `'${value.replace(/'/g, "''")}'`;
    }
    return `'${value.replace(/'/g, `'\"'\"'`)}'`;
  };

  const pathSeparatorForRoot = (rootPath: string): string => {
    if (/^[A-Za-z]:\\/.test(rootPath) || rootPath.includes('\\')) {
      return '\\';
    }
    return '/';
  };

  const joinPath = (basePath: string, ...segments: string[]): string => {
    const separator = pathSeparatorForRoot(basePath);
    let result = basePath.replace(/[\\/]+$/g, '');

    for (const segment of segments) {
      const cleaned = segment.replace(/[\\/]+/g, separator).replace(/^[\\/]+/, '');
      result = `${result}${separator}${cleaned}`;
    }

    return result;
  };

  const safeFileName = (name: string): string => name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'assembly';

  const stripDllExtension = (name: string): string => name.replace(/\.dll$/i, '');

  const runTerminalCommand = async (
    terminalId: string,
    command: string
  ): Promise<{ success: boolean; output: string }> => {
    const result = await window.toolboxAPI.terminal.execute(terminalId, command);
    const output = `${result.output || ''}\n${result.error || ''}`.trim();
    const success = typeof result.exitCode === 'number' ? result.exitCode === 0 : !result.error;
    return { success, output };
  };

  const decompileSelectedAssemblies = async () => {
    if (selectedIds.size === 0) {
      setStatus({ intent: 'warning', text: 'Select at least one assembly to decompile.' });
      return;
    }

    if (!window.toolboxAPI?.terminal || !window.toolboxAPI?.fileSystem) {
      setStatus({ intent: 'error', text: 'ToolBox terminal and filesystem APIs are required for decompilation.' });
      return;
    }

    if (!decompilerCommand.trim()) {
      setStatus({ intent: 'warning', text: 'Enter a decompiler command template first.' });
      return;
    }

    let terminalId: string | null = null;
    try {
      setIsDecompiling(true);
      setStatus(null);

      const outputRoot = await window.toolboxAPI.fileSystem.selectPath({
        type: 'folder',
        title: 'Choose decompilation output folder',
      });

      if (!outputRoot) {
        setStatus({ intent: 'warning', text: 'Decompilation cancelled.' });
        return;
      }

      await window.toolboxAPI.settings?.set('pluginDecompilerCommandTemplate', decompilerCommand);

      const terminal = await window.toolboxAPI.terminal.create({
        name: 'PPSB Plugin Decompiler',
        cwd: outputRoot,
        visible: false,
      });
      terminalId = terminal.id;
      const shell = terminal.shell || '';

      const selectedAssemblies = sortedAssemblies.filter(assembly => selectedIds.has(assembly.id));
      const tempRoot = joinPath(outputRoot, '_ppsb_recovery_temp');
      await window.toolboxAPI.fileSystem.createDirectory(tempRoot);

      const decoderScriptPath = joinPath(tempRoot, 'decode-base64-to-dll.js');
      const decoderScript = [
        "const fs = require('fs');",
        'const b64Path = process.argv[2];',
        'const dllPath = process.argv[3];',
        "const base64 = fs.readFileSync(b64Path, 'utf8').replace(/\\s+/g, '');",
        "fs.writeFileSync(dllPath, Buffer.from(base64, 'base64'));",
      ].join('\n');
      await window.toolboxAPI.fileSystem.writeText(decoderScriptPath, decoderScript);

      const failures: DecompileIssue[] = [];
      let decompiledCount = 0;

      for (let i = 0; i < selectedAssemblies.length; i += 1) {
        const assembly = selectedAssemblies[i];
        setDecompileProgress({ current: i + 1, total: selectedAssemblies.length });

        try {
          const recovered = await getRecoveredAssembly(assembly.id);
          const safeName = stripDllExtension(safeFileName(recovered.fileName));
          const b64Path = joinPath(tempRoot, `${safeName}.b64`);
          const dllPath = joinPath(tempRoot, `${safeName}.dll`);
          const assemblyOutputDir = joinPath(outputRoot, safeName);

          await window.toolboxAPI.fileSystem.writeText(b64Path, recovered.contentBase64);
          await window.toolboxAPI.fileSystem.createDirectory(assemblyOutputDir);

          const decodeCommand = [
            'node',
            quoteForShell(decoderScriptPath, shell),
            quoteForShell(b64Path, shell),
            quoteForShell(dllPath, shell),
          ].join(' ');
          const decodeResult = await runTerminalCommand(terminal.id, decodeCommand);
          if (!decodeResult.success) {
            failures.push({
              assemblyName: assembly.name,
              reason: `Failed to create DLL from base64 (${decodeResult.output || 'no terminal output'})`,
            });
            continue;
          }

          const decompileCommand = decompilerCommand
            .split('{assemblyPath}').join(quoteForShell(dllPath, shell))
            .split('{outputDir}').join(quoteForShell(assemblyOutputDir, shell))
            .split('{assemblyName}').join(quoteForShell(safeName, shell));

          const decompileResult = await runTerminalCommand(terminal.id, decompileCommand);
          if (!decompileResult.success) {
            failures.push({
              assemblyName: assembly.name,
              reason: decompileResult.output || 'Decompiler command failed',
            });
            continue;
          }

          decompiledCount += 1;
        } catch (error) {
          failures.push({
            assemblyName: assembly.name,
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      if (decompiledCount === 0) {
        const firstFailure = failures[0]?.reason || 'Unknown error';
        throw new Error(`No assemblies were decompiled. First failure: ${firstFailure}`);
      }

      if (failures.length > 0) {
        setStatus({
          intent: 'warning',
          text: `Decompiled ${decompiledCount}/${selectedAssemblies.length}. Failed: ${failures
            .slice(0, 3)
            .map(item => `${item.assemblyName}`)
            .join(', ')}.`,
        });
      } else {
        setStatus({
          intent: 'success',
          text: `Decompiled ${decompiledCount} ${decompiledCount === 1 ? 'assembly' : 'assemblies'}. Output folder: ${outputRoot}`,
        });
      }
    } catch (error) {
      setStatus({
        intent: 'error',
        text: `Decompilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      if (terminalId) {
        try {
          await window.toolboxAPI.terminal.close(terminalId);
        } catch {
          // Ignore close errors.
        }
      }
      setIsDecompiling(false);
      setDecompileProgress(null);
    }
  };

  if (assemblies.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text style={{ fontSize: '48px' }}>🧩</Text>
        <Text size={500} weight="semibold">No Plugin Assemblies Found</Text>
        <Text>No plugin assemblies were discovered in the selected scope.</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.row}>
        <Title3>Assembly Recovery and Reverse Engineering</Title3>
        <Text>
          Recover plugin assembly binaries, extract optional IL-derived hints, and run local decompilation tools
          such as ILSpy command-line.
        </Text>
      </Card>

      {status && (
        <MessageBar intent={status.intent}>
          <MessageBarBody>{status.text}</MessageBarBody>
        </MessageBar>
      )}

      <Card className={styles.row}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <Button size="small" onClick={selectAll} disabled={isBatchRecovering || isDecompiling}>Select All</Button>
            <Button size="small" onClick={clearSelection} disabled={isBatchRecovering || isDecompiling}>Clear</Button>
            <Text>{selectedCount} selected</Text>
          </div>
          <div className={styles.toolbarRight}>
            <Button
              appearance="primary"
              onClick={downloadSelectedAssemblies}
              disabled={isBatchRecovering || isDecompiling || selectedCount === 0}
            >
              {isBatchRecovering ? 'Recovering...' : 'Recover Selected as ZIP'}
            </Button>
          </div>
        </div>

        {batchProgress && (
          <div style={{ marginTop: tokens.spacingVerticalS }}>
            <Text>{`Recovering ${batchProgress.current}/${batchProgress.total}`}</Text>
            <ProgressBar value={batchProgress.current / batchProgress.total} thickness="medium" />
          </div>
        )}

        <div className={styles.commandRow}>
          <Text className={styles.sectionTitle}>Decompiler Command Template</Text>
          <Input
            value={decompilerCommand}
            onChange={(_, data) => setDecompilerCommand(data.value)}
            placeholder={DEFAULT_DECOMPILER_COMMAND}
          />
          <Text size={200}>
            Use placeholders: <code>{'{assemblyPath}'}</code>, <code>{'{outputDir}'}</code>, <code>{'{assemblyName}'}</code>.
          </Text>
          <div className={styles.commandActions}>
            <Button
              appearance="secondary"
              onClick={() => setDecompilerCommand(DEFAULT_DECOMPILER_COMMAND)}
              disabled={isDecompiling}
            >
              Reset Template
            </Button>
            <Button
              appearance="primary"
              onClick={decompileSelectedAssemblies}
              disabled={isDecompiling || isBatchRecovering || selectedCount === 0}
            >
              {isDecompiling ? 'Decompiling...' : 'Decompile Selected'}
            </Button>
          </div>
          {decompileProgress && (
            <div>
              <Text>{`Decompiling ${decompileProgress.current}/${decompileProgress.total}`}</Text>
              <ProgressBar value={decompileProgress.current / decompileProgress.total} thickness="medium" />
            </div>
          )}
        </div>
      </Card>

      <div className={styles.list}>
        {sortedAssemblies.map((assembly) => {
          const analysis = analysisByAssembly[assembly.id];
          const isAnalysing = !!analysisLoadingByAssembly[assembly.id];

          return (
            <Card key={assembly.id} className={styles.row}>
              <div className={styles.rowHeader}>
                <div className={styles.rowMain}>
                  <Checkbox
                    checked={selectedIds.has(assembly.id)}
                    onChange={(_, data) => toggleSelection(assembly.id, !!data.checked)}
                    disabled={isBatchRecovering || isDecompiling}
                    aria-label={`Select ${assembly.name}`}
                  />
                  <Text className={styles.rowName}>{assembly.name}</Text>
                  <Badge appearance="tint">{assembly.sourceTypeName}</Badge>
                  <Badge appearance="outline">{assembly.isolationModeName}</Badge>
                </div>
                <div className={styles.rowActions}>
                  <Button
                    size="small"
                    onClick={() => analyseAssembly(assembly)}
                    disabled={isAnalysing || isBatchRecovering || isDecompiling}
                  >
                    {analysis ? 'Hints Ready' : isAnalysing ? 'Analysing...' : 'Analyse IL Hints'}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => downloadSingleAssembly(assembly)}
                    disabled={isBatchRecovering || isDecompiling || busyAssemblyId === assembly.id}
                  >
                    {busyAssemblyId === assembly.id ? 'Recovering...' : 'Recover DLL'}
                  </Button>
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <Text className={styles.metaLabel}>Assembly ID</Text>
                  <Text className={styles.codeValue}>{assembly.id}</Text>
                </div>
                <div className={styles.metaItem}>
                  <Text className={styles.metaLabel}>Version</Text>
                  <Text>{assembly.version || 'Unknown'}</Text>
                </div>
                <div className={styles.metaItem}>
                  <Text className={styles.metaLabel}>Culture</Text>
                  <Text>{assembly.culture || 'Neutral'}</Text>
                </div>
                <div className={styles.metaItem}>
                  <Text className={styles.metaLabel}>Public Key Token</Text>
                  <Text className={styles.codeValue}>{assembly.publicKeyToken || 'N/A'}</Text>
                </div>
                <div className={styles.metaItem}>
                  <Text className={styles.metaLabel}>Registered Plugin Steps</Text>
                  <Text>{assembly.pluginStepCount}</Text>
                </div>
                <div className={styles.metaItem}>
                  <Text className={styles.metaLabel}>Last Modified</Text>
                  <Text>{assembly.modifiedOn || 'Unknown'}</Text>
                </div>
              </div>

              {assembly.pluginTypes.length > 0 && (
                <div className={styles.typeBadges}>
                  {assembly.pluginTypes.map((typeName) => (
                    <Badge key={typeName} appearance="tint" color="informative">
                      {typeName}
                    </Badge>
                  ))}
                </div>
              )}

              {analysis && (
                <div className={styles.analysisPanel}>
                  <Text className={styles.sectionTitle}>IL String Extraction and Dependency Hints</Text>

                  {analysis.dependencyHints.length > 0 && (
                    <div className={styles.analysisSection}>
                      <Text className={styles.metaLabel}>Dependency hints</Text>
                      <div className={styles.badgeRow}>
                        {analysis.dependencyHints.map((hint) => (
                          <Badge key={hint} appearance="tint" color="warning">
                            {hint}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.candidateAssemblyReferences.length > 0 && (
                    <div className={styles.analysisSection}>
                      <Text className={styles.metaLabel}>Candidate assembly references</Text>
                      <div className={styles.badgeRow}>
                        {analysis.candidateAssemblyReferences.slice(0, 18).map((reference) => (
                          <Badge key={reference} appearance="outline">
                            {reference}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.externalDomains.length > 0 && (
                    <div className={styles.analysisSection}>
                      <Text className={styles.metaLabel}>Detected external domains</Text>
                      <ul className={styles.smallList}>
                        {analysis.externalDomains.slice(0, 10).map((domain) => (
                          <li key={domain}>
                            <Text>{domain}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.interestingStrings.length > 0 && (
                    <div className={styles.analysisSection}>
                      <Text className={styles.metaLabel}>
                        Interesting strings (showing {analysis.interestingStrings.length} of {analysis.totalStringsScanned})
                      </Text>
                      <ul className={styles.smallList}>
                        {analysis.interestingStrings.slice(0, 12).map((value) => (
                          <li key={value}>
                            <Text className={styles.codeValue}>{value}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
