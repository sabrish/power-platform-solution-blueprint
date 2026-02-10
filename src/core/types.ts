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
  DisplayName: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
  MetadataId: string;
  EntitySetName: string;
  PrimaryIdAttribute: string;
  PrimaryNameAttribute: string;
  IsCustomEntity: boolean;
  IsCustomizable: {
    Value: boolean;
  };
  IsManaged: boolean;
  Description?: {
    UserLocalizedLabel?: {
      Label: string;
    };
  };
}

/**
 * Represents a plugin step image (pre or post)
 */
export interface ImageDefinition {
  id: string;
  name: string;
  imageType: 'PreImage' | 'PostImage';
  attributes: string[];
  messagePropertyName: string;
}

/**
 * Represents a complete plugin step with all metadata
 */
export interface PluginStep {
  id: string;
  name: string;
  stage: number;
  stageName: string;
  mode: number;
  modeName: string;
  rank: number;
  message: string;
  entity: string;
  assemblyName: string;
  typeName: string;
  pluginTypeId: string;
  filteringAttributes: string[];
  description: string | null;
  asyncAutoDelete: boolean;
  configuration: string | null;
  customConfiguration: string | null;
  preImage: ImageDefinition | null;
  postImage: ImageDefinition | null;
  impersonatingUserId: string | null;
  impersonatingUserName: string | null;
}

/**
 * Stage color constants for plugin visualization
 */
export const STAGE_COLORS = {
  10: '#0078D4', // PreValidation - Blue
  20: '#2B579A', // PreOperation - Navy
  40: '#107C10', // PostOperation - Green
  50: '#5C2D91', // Asynchronous - Purple
} as const;
