import { useState, useEffect } from 'react';
import {
  PptbDataverseClient,
  PublisherDiscovery,
  SolutionDiscovery,
  type Publisher,
  type Solution,
} from '../core';
import type { IDataverseClient } from '../core';

export interface ScopeDataState {
  publishers: Publisher[];
  solutions: Solution[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Fetches publishers and solutions from the Dataverse environment.
 *
 * Accepts an optional pre-built IDataverseClient. When null is passed the hook
 * builds its own client using window.toolboxAPI / window.dataverseAPI (the
 * standard PPTB Desktop pattern).
 */
export function useScopeData(client: IDataverseClient | null = null): ScopeDataState {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        let resolvedClient: IDataverseClient;

        if (client !== null) {
          resolvedClient = client;
        } else {
          if (!window.toolboxAPI || !window.dataverseAPI) {
            throw new Error(
              'PPTB Desktop API not available. Please run this tool inside PPTB Desktop.'
            );
          }

          const toolContext = await window.toolboxAPI.getToolContext();
          const environmentUrl = toolContext?.connectionUrl ?? 'Current Environment';
          resolvedClient = new PptbDataverseClient(window.dataverseAPI, environmentUrl);
        }

        const publisherDiscovery = new PublisherDiscovery(resolvedClient);
        const solutionDiscovery = new SolutionDiscovery(resolvedClient);

        const [publishersData, solutionsData] = await Promise.all([
          publisherDiscovery.getPublishers(),
          solutionDiscovery.getSolutions(),
        ]);

        if (cancelled) return;

        setPublishers(publishersData);
        setSolutions(solutionsData);

        if (publishersData.length === 0 && solutionsData.length === 0) {
          setError('No custom publishers or solutions found in this environment.');
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [client, retryCount]);

  const retry = (): void => setRetryCount((n) => n + 1);

  return { publishers, solutions, isLoading, error, retry };
}
