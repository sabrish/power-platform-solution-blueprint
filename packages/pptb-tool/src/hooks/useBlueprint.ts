import { useState, useCallback, useRef } from 'react';
import {
  PptbDataverseClient,
  BlueprintGenerator,
  type BlueprintResult,
  type ProgressInfo,
  type BlueprintScope,
} from '@ppsb/core';
import type { ScopeSelection } from '../types/scope';

interface UseBlueprintResult {
  generate: () => Promise<void>;
  result: BlueprintResult | null;
  progress: ProgressInfo | null;
  isGenerating: boolean;
  error: Error | null;
  cancel: () => void;
}

/**
 * Convert UI scope to Blueprint scope
 */
function convertScope(scope: ScopeSelection): BlueprintScope {
  if (scope.type === 'publisher') {
    return {
      type: 'publisher',
      publisherPrefixes: scope.publisherPrefixes,
      includeSystem: scope.includeSystem,
      excludeSystemFields: scope.excludeSystemFields,
    };
  } else {
    return {
      type: 'solution',
      solutionIds: scope.solutionIds,
      includeSystem: scope.includeSystem,
      excludeSystemFields: scope.excludeSystemFields,
    };
  }
}

/**
 * Custom hook for generating Power Platform blueprints
 */
export function useBlueprint(scope: ScopeSelection): UseBlueprintResult {
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setResult(null);
      setProgress(null);

      if (!window.toolboxAPI) {
        throw new Error('PPTB Desktop API not available.');
      }

      // Create abort controller for cancellation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Create client and generator
      const client = new PptbDataverseClient(window.toolboxAPI);
      const blueprintScope = convertScope(scope);

      const generator = new BlueprintGenerator(client, blueprintScope, {
        includeSystemEntities: scope.includeSystem,
        onProgress: (progressInfo) => {
          setProgress(progressInfo);
        },
        signal: abortController.signal,
      });

      // Generate blueprint
      const blueprintResult = await generator.generate();

      setResult(blueprintResult);
      setProgress(null);
    } catch (err) {
      if (err instanceof Error && err.message.includes('cancelled')) {
        // Cancellation is not an error
        setError(null);
      } else {
        const error = err instanceof Error ? err : new Error('Failed to generate blueprint');
        setError(error);
        console.error('Error generating blueprint:', err);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [scope]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    generate,
    result,
    progress,
    isGenerating,
    error,
    cancel,
  };
}
