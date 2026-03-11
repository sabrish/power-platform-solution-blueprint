/**
 * Fetch diagnostics logger.
 * Records every batched API call made during blueprint generation —
 * status, duration, retry count, batch-size reductions, and errors.
 * Consumed by FetchDiagnosticsView after (or during) generation.
 */

export type FetchStatus = 'success' | 'retried' | 'batch-reduced' | 'failed' | 'skipped';

export interface FetchLogEntry {
  id: number;
  timestamp: Date;
  /** High-level step name, e.g. "Flow Discovery", "Security Roles" */
  step: string;
  /** OData entity set / metadata path, e.g. "workflows", "privileges" */
  entitySet: string;
  /** Human-readable summary of what was fetched in this call */
  filterSummary: string;
  batchIndex: number;
  /** 0 = unknown / not batched */
  batchTotal: number;
  /** Number of IDs/names in this batch */
  batchSize: number;
  status: FetchStatus;
  /** Total withRetry attempts consumed */
  attempts: number;
  /** Previous batch size (only set when status === 'batch-reduced') */
  batchSizeBefore?: number;
  durationMs: number;
  /** Number of records returned (only on success) */
  resultCount?: number;
  errorMessage?: string;
}

export interface FetchSummary {
  total: number;
  succeeded: number;
  retried: number;
  batchReduced: number;
  failed: number;
  skipped: number;
  totalDurationMs: number;
}

export class FetchLogger {
  private entries: FetchLogEntry[] = [];
  private counter = 0;
  private listeners: Array<(entry: FetchLogEntry) => void> = [];

  log(entry: Omit<FetchLogEntry, 'id'>): FetchLogEntry {
    const full: FetchLogEntry = { id: ++this.counter, ...entry };
    this.entries.push(full);
    for (const fn of this.listeners) {
      try { fn(full); } catch { /* listener errors must not crash the generator */ }
    }
    return full;
  }

  /** Subscribe to live log events. Returns an unsubscribe function. */
  subscribe(fn: (entry: FetchLogEntry) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  clear(): void {
    this.entries = [];
    this.counter = 0;
  }

  getEntries(): FetchLogEntry[] {
    return [...this.entries];
  }

  getSummary(): FetchSummary {
    return {
      total: this.entries.length,
      succeeded: this.entries.filter(e => e.status === 'success').length,
      retried: this.entries.filter(e => e.status === 'retried').length,
      batchReduced: this.entries.filter(e => e.status === 'batch-reduced').length,
      failed: this.entries.filter(e => e.status === 'failed').length,
      skipped: this.entries.filter(e => e.status === 'skipped').length,
      totalDurationMs: this.entries.reduce((sum, e) => sum + e.durationMs, 0),
    };
  }

  get failureCount(): number {
    return this.entries.filter(e => e.status === 'failed').length;
  }
}
