/**
 * Site Map types
 */

/**
 * A Dataverse Site Map defining the navigation structure for Model-Driven Apps.
 * Component type code: 62 — Strategy A discovery via solutioncomponents.
 */
export interface SiteMap {
  id: string;
  name: string;
  uniqueName: string;
  isAppAware: boolean;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
