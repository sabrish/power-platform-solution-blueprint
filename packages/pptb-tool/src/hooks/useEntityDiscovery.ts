import { useState, useEffect, useCallback } from 'react';
import {
  PptbDataverseClient,
  EntityDiscovery,
  type EntityMetadata,
} from '@ppsb/core';
import type { ScopeSelection } from '../types/scope';

interface UseEntityDiscoveryResult {
  entities: EntityMetadata[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching entities based on scope selection
 */
export function useEntityDiscovery(scope: ScopeSelection | null): UseEntityDiscoveryResult {
  const [entities, setEntities] = useState<EntityMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEntities = useCallback(async () => {
    if (!scope) {
      setEntities([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!window.toolboxAPI) {
        throw new Error('PPTB Desktop API not available.');
      }

      const client = new PptbDataverseClient(window.toolboxAPI);
      const entityDiscovery = new EntityDiscovery(client);

      let fetchedEntities: EntityMetadata[] = [];

      if (scope.type === 'publisher') {
        if (scope.mode === 'all-solutions') {
          // Get all entities from selected publishers
          fetchedEntities = await entityDiscovery.getEntitiesByPublisher(scope.publisherPrefixes);
        } else if (scope.mode === 'specific-solutions' && scope.solutionIds) {
          // Get entities from specific solutions
          fetchedEntities = await entityDiscovery.getEntitiesBySolutions(scope.solutionIds);
        }
      } else if (scope.type === 'solution') {
        // Get entities from selected solutions
        fetchedEntities = await entityDiscovery.getEntitiesBySolutions(scope.solutionIds);
      }

      // Filter out system entities if includeSystem is false
      if (!scope.includeSystem) {
        fetchedEntities = fetchedEntities.filter((entity) => entity.IsCustomEntity);
      }

      setEntities(fetchedEntities);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch entities');
      setError(error);
      console.error('Error fetching entities:', err);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const refetch = useCallback(() => {
    fetchEntities();
  }, [fetchEntities]);

  return {
    entities,
    loading,
    error,
    refetch,
  };
}
