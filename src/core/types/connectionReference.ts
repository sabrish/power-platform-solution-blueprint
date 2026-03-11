/**
 * Connection Reference types
 */

export interface ConnectionReference {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  connectionId: string | null;
  connectorId: string | null;
  connectorDisplayName: string | null;
  isManaged: boolean;
  isCustomizable: boolean;
  statecode: number;
  statuscode: number;
  owner: string;
  ownerId: string;
  modifiedBy: string;
  modifiedOn: string;
  createdOn: string;
}
