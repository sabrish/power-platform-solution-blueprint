/**
 * Custom API types
 */

/**
 * Custom API definition
 */
export interface CustomAPI {
  id: string;
  uniqueName: string;
  displayName: string;
  description: string | null;
  bindingType: 'Global' | 'Entity' | 'EntityCollection';
  boundEntityLogicalName: string | null;
  isFunction: boolean; // true = Function, false = Action
  isPrivate: boolean;
  isManaged: boolean;
  allowedCustomProcessingStepType: 'None' | 'AsyncOnly' | 'SyncAndAsync';
  executionPrivilege: 'None' | 'Basic' | 'Local' | 'Deep' | 'Global';
  requestParameters: CustomAPIParameter[];
  responseProperties: CustomAPIParameter[];
  owner: string;
  ownerId: string;
  modifiedBy: string;
  modifiedOn: string;
  createdOn: string;
}

/**
 * Custom API request parameter or response property
 */
export interface CustomAPIParameter {
  id: string;
  uniqueName: string;
  displayName: string;
  description: string | null;
  type: CustomAPIParameterType;
  typeName: string;
  isOptional: boolean;
  logicalEntityName: string | null; // For EntityReference types
}

/**
 * Custom API parameter types
 */
export type CustomAPIParameterType =
  | 'Boolean'
  | 'DateTime'
  | 'Decimal'
  | 'Entity'
  | 'EntityCollection'
  | 'EntityReference'
  | 'Float'
  | 'Integer'
  | 'Money'
  | 'Picklist'
  | 'String'
  | 'StringArray'
  | 'Guid';

/**
 * Custom API binding type colors for UI
 */
export const CUSTOM_API_BINDING_COLORS = {
  Global: '#0078D4', // Blue
  Entity: '#107C10', // Green
  EntityCollection: '#E3008C', // Magenta
} as const;

/**
 * Custom API type colors for UI
 */
export const CUSTOM_API_TYPE_COLORS = {
  Function: '#0078D4', // Blue - Functions are read-only
  Action: '#E3008C', // Magenta - Actions can modify data
} as const;
