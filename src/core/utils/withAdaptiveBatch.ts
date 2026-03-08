/**
 * Adaptive batch fetcher.
 *
 * Splits a list of IDs into batches and fetches them via `fetchFn`.
 * Each batch is wrapped in `withRetry` for transient-error recovery.
 * If withRetry exhausts all attempts, the batch is split in half and
 * retried at the smaller size — degrading all the way down to single-item
 * fetches before marking an item as permanently failed.
 *
 * Once a batch size is reduced it stays reduced for all subsequent batches
 * in the same call, preventing repeated oscillation.
 */
import { withRetry } from './withRetry.js';
import type { RetryOptions } from './withRetry.js';
import type { FetchLogger } from './FetchLogger.js';

export interface AdaptiveBatchOptions<TId> {
  /** Starting batch size (default: 20) */
  initialBatchSize?: number;
  /** Smallest allowed batch size — permanently fails if still erroring at this size (default: 1) */
  minBatchSize?: number;
  /** Multiplier applied to batch size on failure, e.g. 0.5 = halve (default: 0.5) */
  reductionFactor?: number;
  /** Passed through to withRetry for each batch attempt */
  retryOptions?: RetryOptions;
  /** Step name surfaced in FetchLogger entries, e.g. "Flow Discovery" */
  step?: string;
  /** OData entity set surfaced in FetchLogger entries, e.g. "workflows" */
  entitySet?: string;
  /** Logger instance — when supplied, every batch outcome is recorded */
  logger?: FetchLogger;
  /** Called after each successfully processed batch */
  onProgress?: (completed: number, total: number) => void;
  /** Called when batch size is reduced, before the retry */
  onBatchSizeReduced?: (from: number, to: number) => void;
  /** Called when a single-item batch permanently fails */
  onItemFailed?: (ids: TId[], err: unknown) => void;
  /**
   * Produce a human-readable label for the batch — shown as filterSummary in the fetch log.
   * If omitted, defaults to "items X–Y of Z".
   */
  getBatchLabel?: (batch: TId[]) => string;
}

export interface AdaptiveBatchResult<TResult, TId> {
  results: TResult[];
  failedIds: TId[];
  /** The batch size that proved stable for the rest of the run */
  finalBatchSize: number;
}

export async function withAdaptiveBatch<TId, TResult>(
  ids: TId[],
  fetchFn: (batch: TId[]) => Promise<TResult[]>,
  options: AdaptiveBatchOptions<TId> = {}
): Promise<AdaptiveBatchResult<TResult, TId>> {
  const {
    initialBatchSize = 20,
    minBatchSize = 1,
    reductionFactor = 0.5,
    retryOptions,
    step = '',
    entitySet = '',
    logger,
    onProgress,
    onBatchSizeReduced,
    onItemFailed,
    getBatchLabel,
  } = options;

  // When no getBatchLabel is supplied, filterSummary is intentionally empty —
  // the Batch column in the fetch log already shows position (batchIndex/batchTotal).
  const batchLabelFor = (batch: TId[]) => getBatchLabel ? getBatchLabel(batch) : '';

  if (ids.length === 0) return { results: [], failedIds: [], finalBatchSize: initialBatchSize };

  const results: TResult[] = [];
  const failedIds: TId[] = [];
  let cursor = 0;
  let currentBatchSize = Math.max(minBatchSize, initialBatchSize);
  let batchIndex = 0;

  while (cursor < ids.length) {
    const batch = ids.slice(cursor, cursor + currentBatchSize);
    batchIndex++;
    const start = Date.now();
    let attempts = 0;

    try {
      const batchResults = await withRetry(
        () => { attempts++; return fetchFn(batch); },
        {
          ...retryOptions,
          onRetry: (n, err) => {
            attempts = n + 1;
            retryOptions?.onRetry?.(n, err);
          },
        }
      );

      const durationMs = Date.now() - start;
      logger?.log({
        timestamp: new Date(start),
        step,
        entitySet,
        filterSummary: batchLabelFor(batch),
        batchIndex,
        batchTotal: 0,
        batchSize: batch.length,
        status: attempts > 1 ? 'retried' : 'success',
        attempts,
        durationMs,
        resultCount: batchResults.length,
      });

      results.push(...batchResults);
      cursor += batch.length;
      onProgress?.(cursor, ids.length);

    } catch (err) {
      const durationMs = Date.now() - start;

      if (batch.length <= minBatchSize) {
        // Cannot split further — item(s) permanently failed
        const lbl = batchLabelFor(batch);
        logger?.log({
          timestamp: new Date(start),
          step,
          entitySet,
          filterSummary: lbl ? `${lbl} — FAILED` : 'FAILED',
          batchIndex,
          batchTotal: 0,
          batchSize: batch.length,
          status: 'failed',
          attempts,
          durationMs,
          errorMessage: err instanceof Error ? err.message : String(err),
        });

        failedIds.push(...batch);
        onItemFailed?.(batch, err);
        cursor += batch.length;

      } else {
        // Reduce batch size and retry the same position
        const newSize = Math.max(minBatchSize, Math.floor(batch.length * reductionFactor));

        const lbl2 = batchLabelFor(batch);
        logger?.log({
          timestamp: new Date(start),
          step,
          entitySet,
          filterSummary: lbl2 ? `${lbl2} → batch ${currentBatchSize}→${newSize}` : `batch ${currentBatchSize}→${newSize}`,
          batchIndex,
          batchTotal: 0,
          batchSize: batch.length,
          status: 'batch-reduced',
          attempts,
          batchSizeBefore: currentBatchSize,
          durationMs,
          errorMessage: err instanceof Error ? err.message : String(err),
        });

        onBatchSizeReduced?.(currentBatchSize, newSize);
        currentBatchSize = newSize;
        // Do NOT advance cursor — retry same ids at smaller size
      }
    }
  }

  return { results, failedIds, finalBatchSize: currentBatchSize };
}
