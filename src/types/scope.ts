/**
 * Scope selection types for PPSB
 */

export type ScopeType = 'publisher' | 'solution';

/**
 * Publisher scope mode - all solutions or specific ones
 */
export type PublisherScopeMode = 'all-solutions' | 'specific-solutions';

/**
 * Publisher scope selection
 */
export interface PublisherScope {
  type: 'publisher';
  publisherIds: string[];
  publisherNames: string[];
  publisherPrefixes: string[];
  mode: PublisherScopeMode;
  solutionIds: string[]; // Always present - filtered by publisher or user-selected
  solutionNames: string[];
  includeSystem: boolean;
  excludeSystemFields: boolean;
}

/**
 * Solution scope selection
 */
export interface SolutionScope {
  type: 'solution';
  solutionIds: string[];
  solutionNames: string[];
  includeSystem: boolean;
  excludeSystemFields: boolean;
}

/**
 * Discriminated union of all scope types
 */
export type ScopeSelection = PublisherScope | SolutionScope;
