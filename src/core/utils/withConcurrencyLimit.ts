/**
 * Runs tasks with a maximum concurrency limit.
 * Uses Promise.allSettled semantics — one failure does not cancel others.
 *
 * @param limit   Maximum number of concurrent tasks
 * @param tasks   Array of async task factories
 * @returns       Array of PromiseSettledResult<T> in input order
 */
export async function withConcurrencyLimit<T>(
  limit: number,
  tasks: Array<() => Promise<T>>
): Promise<PromiseSettledResult<T>[]> {
  if (tasks.length === 0) return [];

  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  const executing = new Set<Promise<void>>();
  let index = 0;

  function launchNext(): Promise<void> {
    const i = index++;
    if (i >= tasks.length) return Promise.resolve();

    const p: Promise<void> = tasks[i]()
      .then(
        value  => { results[i] = { status: 'fulfilled', value }; },
        reason => { results[i] = { status: 'rejected', reason }; }
      )
      .finally(() => {
        executing.delete(p);
      });

    executing.add(p);
    return p;
  }

  // Seed the initial pool
  const cap = Math.min(limit, tasks.length);
  for (let i = 0; i < cap; i++) {
    // Chain: when one finishes, launch the next
    const start = launchNext();
    // Each worker loops until there are no more tasks
    void start.then(function loop(): void | Promise<void> {
      if (index < tasks.length) return launchNext().then(loop);
    });
  }

  // Wait for all executing promises to drain
  while (executing.size > 0) {
    await Promise.race(executing);
  }

  return results;
}
