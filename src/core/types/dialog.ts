/**
 * Dialog (deprecated classic workflow category 1) types
 */

/**
 * A deprecated Dataverse Dialog workflow.
 * Dialogs are category 1 of ComponentType.Workflow (29).
 * Classified via WorkflowCategory.Dialog = 1 in classifyWorkflows().
 */
export interface Dialog {
  id: string;
  name: string;
  description: string | null;
  status: 'Draft' | 'Active' | 'Suspended';
  statusCode: number;
  primaryEntityName: string | null;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
