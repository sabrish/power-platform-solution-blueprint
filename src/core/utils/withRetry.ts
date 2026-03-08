/**
 * Determines if an error is transient and worth retrying.
 * Retries on: rate limiting, server errors, network failures, timeouts.
 * Does NOT retry on: 400 bad request, 401 unauthorized, 403 forbidden, 404 not found.
 */
function isTransientError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('429') || msg.includes('rate limit') ||
      msg.includes('503') || msg.includes('502') || msg.includes('500') ||
      msg.includes('timeout') || msg.includes('network') ||
      msg.includes('fetch failed') || msg.includes('failed to fetch')
    );
  }
  return false;
}

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelayMs?: number;
  /** Custom predicate to decide if an error is retryable (default: isTransientError) */
  shouldRetry?: (err: unknown) => boolean;
  /** AbortSignal — if aborted, stops retrying immediately */
  signal?: AbortSignal;
}

/**
 * Runs `fn` with exponential-backoff retry on transient errors.
 *
 * Delays: baseDelayMs × 2^(attempt-1) → 1s, 2s, 4s with defaults.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    shouldRetry = isTransientError,
    signal,
  } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) throw new Error('Aborted');
    try {
      return await fn();
    } catch (err) {
      if (!shouldRetry(err)) throw err;
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise<void>(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
