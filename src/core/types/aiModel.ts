/**
 * AI Model (msdyn_aimodel) types
 */

/**
 * An AI Builder model.
 * Component type codes: 400 (AI Project Type), 401 (AI Project), 402 (AI Configuration)
 * all route to aiModelIds — queried against msdyn_aimodels.
 * Table may not exist in all environments.
 */
export interface AiModel {
  id: string;
  name: string;
  templateId: string | null;
  modelCreationContext: string | null;
  status: 'Active' | 'Inactive' | 'Unknown';
  statusCode: number;
  isManaged: boolean;
  createdOn: string;
  modifiedOn: string;
}
