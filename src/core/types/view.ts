/**
 * View (Saved Query) types
 */

/**
 * A saved query (view) for a Dataverse entity.
 * Component type code: 26 — Strategy A discovery via solutioncomponents.
 */
export interface View {
  id: string;
  name: string;
  description: string | null;
  returnedTypeCode: string;
  queryType: number;
  queryTypeName: string;
  isDefault: boolean;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
