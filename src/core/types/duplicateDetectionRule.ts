/**
 * Duplicate Detection Rule types
 */

/**
 * A Duplicate Detection Rule that identifies duplicate records in Dataverse.
 * Component type code: 44 — Strategy A discovery via solutioncomponents.
 */
export interface DuplicateDetectionRule {
  id: string;
  name: string;
  description: string | null;
  baseEntityName: string;
  matchingEntityName: string;
  status: 'Active' | 'Inactive';
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
