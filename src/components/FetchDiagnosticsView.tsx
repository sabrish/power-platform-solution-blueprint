import { useMemo, useState } from 'react';
import {
  Button,
  Text,
  Title3,
  Badge,
  makeStyles,
  tokens,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import type { FetchLogEntry, FetchStatus } from '../core/utils/FetchLogger.js';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  summaryBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '64px',
  },
  summaryCount: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase500,
  },
  summaryLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  filterRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  th: {
    textAlign: 'left' as const,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'top' as const,
  },
  tableRow: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  errorRow: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    ':hover': {
      backgroundColor: tokens.colorStatusDangerBackground1,
    },
  },
  retriedRow: {
    backgroundColor: tokens.colorStatusWarningBackground1,
    ':hover': {
      backgroundColor: tokens.colorStatusWarningBackground1,
    },
  },
  reducedRow: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    ':hover': {
      backgroundColor: tokens.colorPaletteYellowBackground1,
    },
  },
  errorDetail: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorStatusDangerForeground1,
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: 'pre-wrap' as const,
    marginTop: tokens.spacingVerticalXXS,
  },
  noData: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
  },
  paginationRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalS,
  },
});

const STATUS_LABELS: Record<FetchStatus, string> = {
  success: 'Success',
  retried: 'Retried',
  'batch-reduced': 'Batch Reduced',
  failed: 'Failed',
  skipped: 'Skipped',
};

const STATUS_COLORS: Record<FetchStatus, 'success' | 'warning' | 'danger' | 'informative' | 'subtle'> = {
  success: 'success',
  retried: 'warning',
  'batch-reduced': 'warning',
  failed: 'danger',
  skipped: 'informative',
};

const PAGE_SIZE = 50;

interface Props {
  entries: FetchLogEntry[];
}

export function FetchDiagnosticsView({ entries }: Props) {
  const styles = useStyles();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  const uniqueSteps = useMemo(
    () => [...new Set(entries.map(e => e.step))].sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (stepFilter !== 'all' && e.step !== stepFilter) return false;
      return true;
    });
  }, [entries, statusFilter, stepFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageEntries = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const summary = useMemo(() => ({
    total: entries.length,
    success: entries.filter(e => e.status === 'success').length,
    retried: entries.filter(e => e.status === 'retried').length,
    reduced: entries.filter(e => e.status === 'batch-reduced').length,
    failed: entries.filter(e => e.status === 'failed').length,
    totalMs: entries.reduce((s, e) => s + e.durationMs, 0),
  }), [entries]);

  function exportCsv() {
    const header = ['#', 'Step', 'Entity Set', 'Filter', 'Batch', 'Status', 'Attempts', 'Duration (ms)', 'Results', 'Error'];
    const rows = filtered.map(e => [
      e.id,
      e.step,
      e.entitySet,
      e.filterSummary,
      `${e.batchIndex + 1}/${e.batchTotal || '?'}`,
      e.status,
      e.attempts,
      e.durationMs,
      e.resultCount ?? '',
      e.errorMessage ?? '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fetch-diagnostics.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (entries.length === 0) {
    return (
      <div className={styles.noData}>
        <Text>No fetch log available. Generate a blueprint to see diagnostics.</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Title3>Fetch Diagnostics</Title3>

      {/* Summary bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <Text className={styles.summaryCount}>{summary.total}</Text>
          <Text className={styles.summaryLabel}>Total Calls</Text>
        </div>
        <div className={styles.summaryItem}>
          <Text className={styles.summaryCount} style={{ color: tokens.colorStatusSuccessForeground1 }}>{summary.success}</Text>
          <Text className={styles.summaryLabel}>Success</Text>
        </div>
        <div className={styles.summaryItem}>
          <Text className={styles.summaryCount} style={{ color: tokens.colorStatusWarningForeground1 }}>{summary.retried}</Text>
          <Text className={styles.summaryLabel}>Retried</Text>
        </div>
        <div className={styles.summaryItem}>
          <Text className={styles.summaryCount} style={{ color: tokens.colorPaletteYellowForeground1 }}>{summary.reduced}</Text>
          <Text className={styles.summaryLabel}>Batch Reduced</Text>
        </div>
        <div className={styles.summaryItem}>
          <Text className={styles.summaryCount} style={{ color: tokens.colorStatusDangerForeground1 }}>{summary.failed}</Text>
          <Text className={styles.summaryLabel}>Failed</Text>
        </div>
        <div className={styles.summaryItem}>
          <Text className={styles.summaryCount}>{(summary.totalMs / 1000).toFixed(1)}s</Text>
          <Text className={styles.summaryLabel}>Total Time</Text>
        </div>
      </div>

      {/* Filters + export */}
      <div className={styles.filterRow}>
        <Dropdown
          value={statusFilter === 'all' ? 'All Statuses' : STATUS_LABELS[statusFilter as FetchStatus]}
          selectedOptions={[statusFilter]}
          onOptionSelect={(_e, d) => { setStatusFilter(d.optionValue ?? 'all'); setPage(0); }}
          style={{ minWidth: '150px' }}
        >
          <Option value="all">All Statuses</Option>
          {(['success', 'retried', 'batch-reduced', 'failed', 'skipped'] as FetchStatus[]).map(s => (
            <Option key={s} value={s}>{STATUS_LABELS[s]}</Option>
          ))}
        </Dropdown>

        <Dropdown
          value={stepFilter === 'all' ? 'All Steps' : stepFilter}
          selectedOptions={[stepFilter]}
          onOptionSelect={(_e, d) => { setStepFilter(d.optionValue ?? 'all'); setPage(0); }}
          style={{ minWidth: '180px' }}
        >
          <Option value="all">All Steps</Option>
          {uniqueSteps.map(s => <Option key={s} value={s}>{s}</Option>)}
        </Dropdown>

        <Text style={{ color: tokens.colorNeutralForeground3 }}>
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          {filtered.length !== entries.length && ` (filtered from ${entries.length})`}
        </Text>

        <Button appearance="secondary" size="small" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      {/* Log table */}
      <div style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>#</th>
              <th className={styles.th}>Step</th>
              <th className={styles.th}>Entity Set</th>
              <th className={styles.th}>Filter / Content</th>
              <th className={styles.th}>Batch</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Attempts</th>
              <th className={styles.th}>Duration</th>
              <th className={styles.th}>Results</th>
            </tr>
          </thead>
          <tbody>
            {pageEntries.map(entry => {
              const rowClass = [
                styles.tableRow,
                entry.status === 'failed' ? styles.errorRow :
                entry.status === 'retried' ? styles.retriedRow :
                entry.status === 'batch-reduced' ? styles.reducedRow :
                '',
              ].filter(Boolean).join(' ');
              return (
                <tr key={entry.id} className={rowClass}>
                  <td className={styles.td} style={{ color: tokens.colorNeutralForeground3 }}>{entry.id}</td>
                  <td className={styles.td}>{entry.step}</td>
                  <td className={styles.td} style={{ fontFamily: tokens.fontFamilyMonospace, fontSize: tokens.fontSizeBase100 }}>{entry.entitySet}</td>
                  <td className={styles.td} style={{ maxWidth: '320px', wordBreak: 'break-word' }}>
                    <Text style={{ fontSize: tokens.fontSizeBase100, fontFamily: tokens.fontFamilyMonospace }}>{entry.filterSummary}</Text>
                    {entry.errorMessage && (
                      <div className={styles.errorDetail}>{entry.errorMessage}</div>
                    )}
                    {entry.batchSizeBefore !== undefined && (
                      <Text style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorStatusWarningForeground1 }}>
                        {` Reduced: ${entry.batchSizeBefore} → ${entry.batchSize}`}
                      </Text>
                    )}
                  </td>
                  <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>
                    {entry.batchTotal ? `${entry.batchIndex + 1}/${entry.batchTotal}` : `${entry.batchIndex + 1}`}
                  </td>
                  <td className={styles.td}>
                    <Badge color={STATUS_COLORS[entry.status]} size="small">
                      {STATUS_LABELS[entry.status]}
                    </Badge>
                  </td>
                  <td className={styles.td}>{entry.attempts}</td>
                  <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>{entry.durationMs}ms</td>
                  <td className={styles.td}>{entry.resultCount ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className={styles.paginationRow}>
          <Button size="small" disabled={safePage === 0} onClick={() => setPage(0)}>«</Button>
          <Button size="small" disabled={safePage === 0} onClick={() => setPage(p => p - 1)}>‹</Button>
          <Text style={{ fontSize: tokens.fontSizeBase200 }}>
            Page {safePage + 1} of {pageCount}
          </Text>
          <Button size="small" disabled={safePage >= pageCount - 1} onClick={() => setPage(p => p + 1)}>›</Button>
          <Button size="small" disabled={safePage >= pageCount - 1} onClick={() => setPage(pageCount - 1)}>»</Button>
        </div>
      )}
    </div>
  );
}
