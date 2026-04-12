/**
 * Report types
 */

export type ReportType = 'ReportingServices' | 'Other' | 'Linked';

/**
 * A Dataverse report (SSRS or linked report).
 * Component type code: 31 — Strategy A discovery via solutioncomponents.
 */
export interface Report {
  id: string;
  name: string;
  description: string | null;
  reportType: ReportType;
  isCustomReport: boolean;
  fileName: string | null;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
