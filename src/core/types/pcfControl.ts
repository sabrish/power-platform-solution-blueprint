/**
 * PCF (Power Apps Component Framework) custom control types
 */

/**
 * A custom control built with the Power Apps Component Framework (PCF).
 * Component type code: 66 (Custom Control) — Strategy A discovery via solutioncomponents.
 */
export interface PcfControl {
  id: string;
  name: string;
  displayName: string;
  /** Comma-separated list of compatible Dataverse field types (e.g. "SingleLine.Text,Whole.None") */
  compatibleDataTypes: string;
  version: string;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
