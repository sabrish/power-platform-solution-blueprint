/**
 * Performance optimization utilities
 */

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load component when it becomes visible
 */
export function useLazyLoad(callback: () => void, rootMargin: string = '50px') {
  const observerCallback: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, {
    rootMargin,
  });

  return {
    observe: (element: Element) => observer.observe(element),
    unobserve: (element: Element) => observer.unobserve(element),
    disconnect: () => observer.disconnect(),
  };
}

/**
 * Measure and log performance metrics
 */
export function measurePerformance(name: string, fn: () => void): void {
  const startTime = performance.now();
  fn();
  const endTime = performance.now();
  console.log(`Performance: ${name} took ${(endTime - startTime).toFixed(2)}ms`);
}

/**
 * Memoize expensive function results
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch multiple state updates
 */
export function batchUpdates(updates: (() => void)[]): void {
  // Use requestAnimationFrame to batch DOM updates
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Virtual scrolling helper
 */
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  totalItems: number;
  overscan?: number;
}

export function calculateVisibleRange(
  scrollTop: number,
  config: VirtualScrollConfig
): { start: number; end: number } {
  const { itemHeight, containerHeight, totalItems, overscan = 3 } = config;

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
}

/**
 * Prefetch data for next view
 */
export function prefetchData<T>(
  dataLoader: () => Promise<T>,
  delay: number = 100
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      dataLoader().then(resolve);
    }, delay);
  });
}

/**
 * Optimize large list rendering
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Request idle callback polyfill
 */
export function requestIdleCallback(callback: () => void, options?: { timeout?: number }): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Web Worker helper for heavy computations
 */
export function runInWorker<TData, TResult>(
  workerFn: (data: TData) => TResult,
  data: TData
): Promise<TResult> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      self.onmessage = function(e) {
        const result = (${workerFn.toString()})(e.data);
        self.postMessage(result);
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage(data);
  });
}
