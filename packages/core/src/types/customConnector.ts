/**
 * Custom Connector types
 */

export interface CustomConnector {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  connectorType: string;
  iconUri?: string;
  isManaged: boolean;
  isCustomizable: boolean;
  capabilities: string[];
  connectionParameters: string[];
  owner: string;
  modifiedOn: string;
  modifiedBy: string;
  policy?: string;
  apiDefinition?: string;
}

/**
 * Color mapping for custom connector types
 */
export const CUSTOM_CONNECTOR_TYPE_COLORS = {
  custom: 'brand',
  certified: 'success',
  shared: 'warning',
} as const;
