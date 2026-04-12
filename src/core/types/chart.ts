/**
 * Chart (Saved Query Visualization) types
 */

/**
 * A saved chart visualization for a Dataverse entity.
 * Component type code: 59 — Strategy A discovery via solutioncomponents.
 */
export interface Chart {
  id: string;
  name: string;
  description: string | null;
  primaryEntityTypeCode: string;
  chartType: number | null;
  isDefault: boolean;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
