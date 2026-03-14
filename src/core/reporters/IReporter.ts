import type { BlueprintResult } from '../types/blueprint.js';

/**
 * Common interface for all blueprint reporters.
 * Each reporter transforms a BlueprintResult into its target output format.
 *
 * Naming convention: IReporter uses the I-prefix as it is a true interface contract
 * used in dependency inversion (see CONTRIBUTING.md for convention rules).
 */
export interface IReporter<TOutput> {
  generate(result: BlueprintResult): TOutput;
}
