/**
 * Represents a Power Platform Publisher
 */
export interface Publisher {
  publisherid: string;
  uniquename: string;
  friendlyname: string;
  customizationprefix: string;
}

/**
 * Represents a Power Platform Solution
 */
export interface Solution {
  solutionid: string;
  uniquename: string;
  friendlyname: string;
  version: string;
  ismanaged: boolean;
  publisherid: {
    uniquename: string;
    friendlyname: string;
  };
}

/**
 * Represents Dataverse Entity Metadata
 */
export interface EntityMetadata {
  LogicalName: string;
  SchemaName: string;
  DisplayName: string;
  MetadataId: string;
  EntitySetName: string;
}
