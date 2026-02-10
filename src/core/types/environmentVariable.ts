/**
 * Environment Variable types
 */

/**
 * Environment Variable Definition with current value
 */
export interface EnvironmentVariable {
  id: string;
  schemaName: string;
  displayName: string;
  description: string | null;
  type: EnvironmentVariableType;
  typeName: string;
  defaultValue: string | null;
  currentValue: string | null;
  currentValueId: string | null;
  isManaged: boolean;
  isRequired: boolean;
  isCustomizable: boolean;
  hint: string | null;
  values: EnvironmentVariableValue[];
  owner: string;
  ownerId: string;
  modifiedBy: string;
  modifiedOn: string;
  createdOn: string;
}

/**
 * Environment Variable Value (can be multiple for different environments)
 */
export interface EnvironmentVariableValue {
  id: string;
  definitionId: string;
  schemaName: string;
  value: string;
  owner: string;
  ownerId: string;
  modifiedBy: string;
  modifiedOn: string;
  createdOn: string;
}

/**
 * Environment Variable types
 */
export type EnvironmentVariableType = 'String' | 'Number' | 'Boolean' | 'JSON' | 'DataSource';

/**
 * Environment Variable type colors for UI
 */
export const ENV_VAR_TYPE_COLORS = {
  String: '#0078D4',
  Number: '#107C10',
  Boolean: '#E3008C',
  JSON: '#FFB900',
  DataSource: '#8764B8',
} as const;
