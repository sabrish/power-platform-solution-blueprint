/**
 * Determines if an error is transient and worth retrying.
 *
 * Retries on: rate limiting (429), server errors (5xx), network failures,
 * TCP-level connection errors (ETIMEDOUT, ECONNRESET, ECONNREFUSED, ECONNABORTED, EPIPE).
 *
 * Does NOT retry on: 400 bad request, 401 unauthorized, 403 forbidden, 404 not found.
 */
function isTransientError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();

    // HTTP status codes surfaced in the message
    if (
      msg.includes('429') || msg.includes('rate limit') ||
      msg.includes('503') || msg.includes('502') || msg.includes('500') ||
      msg.includes('504') || msg.includes('gateway')
    ) return true;

    // Generic network / fetch failure strings
    if (
      msg.includes('timeout') || msg.includes('etimedout') ||
      msg.includes('econnreset') || msg.includes('econnrefused') ||
      msg.includes('econnaborted') || msg.includes('epipe') ||
      msg.includes('network') ||
      msg.includes('fetch failed') || msg.includes('failed to fetch')
    ) return true;

    // Node.js errno codes surfaced on the error object itself
    const code = (err as { code?: string }).code?.toLowerCase() ?? '';
    if (
      code === 'etimedout' || code === 'econnreset' ||
      code === 'econnrefused' || code === 'econnaborted' || code === 'epipe'
    ) return true;
  }
  return false;
}

export interface RetryOptions {
  /** Maximum number of attempts (default: 4) */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseDelayMs?: number;
  /** Custom predicate to decide if an error is retryable (default: isTransientError) */
  shouldRetry?: (err: unknown) => boolean;
  /** AbortSignal — if aborted, stops retrying immediately */
  signal?: AbortSignal;
  /**
   * Called before each retry (not the first attempt).
   * attempt = the retry number (1 = first retry, 2 = second retry, …)
   */
  onRetry?: (attempt: number, err: unknown) => void;
}

/**
 * Runs `fn` with exponential-backoff retry on transient errors.
 *
 * Delays include ±25 % random jitter to avoid thundering-herd retry storms.
 * Base delays (default): 1 s → 2 s → 4 s (attempt 1, 2, 3 of 4 total).
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 4,
    baseDelayMs = 1000,
    shouldRetry = isTransientError,
    signal,
    onRetry,
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
        onRetry?.(attempt, err);
        const base = baseDelayMs * Math.pow(2, attempt - 1);
        // ±25 % jitter
        const jitter = base * (0.75 + Math.random() * 0.5);
        await new Promise<void>(resolve => setTimeout(resolve, Math.round(jitter)));
      }
    }
  }

  throw lastError;
}
