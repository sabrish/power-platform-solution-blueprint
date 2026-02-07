import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { DetailedEntityMetadata } from '../types/blueprint.js';

/**
 * Discovers entity schema and metadata
 */
export class SchemaDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get detailed schema for a specific entity
   * @param logicalName Entity logical name
   * @returns Detailed entity metadata with attributes, relationships, and keys
   */
  async getEntitySchema(logicalName: string): Promise<DetailedEntityMetadata> {
    try {
      // Fetch comprehensive entity metadata with all expansions
      const result = await this.client.queryMetadata<DetailedEntityMetadata>(
        'EntityDefinitions',
        {
          select: [
            'LogicalName',
            'SchemaName',
            'DisplayName',
            'MetadataId',
            'EntitySetName',
            'PrimaryIdAttribute',
            'PrimaryNameAttribute',
            'Description',
            'OwnershipType',
            'IsAuditEnabled',
            'ChangeTrackingEnabled',
            'IsActivity',
            'IsActivityParty',
            'IsCustomEntity',
            'IsCustomizable',
            'IsManaged',
            'ObjectTypeCode',
          ],
          filter: `LogicalName eq '${logicalName}'`,
          expand: [
            // Attributes - only select properties on base AttributeMetadata
            // Type-specific properties (MaxLength, Targets, etc.) are included automatically
            'Attributes($select=LogicalName,SchemaName,MetadataId,DisplayName,AttributeType,IsPrimaryId,IsPrimaryName,IsValidForCreate,IsValidForUpdate,IsValidForRead,IsValidForAdvancedFind,IsAuditEnabled,IsSecured,RequiredLevel,Description,IsCustomAttribute,IsManaged)',
            // Relationships
            'ManyToOneRelationships($select=SchemaName,MetadataId,ReferencingEntity,ReferencedEntity,ReferencingAttribute,ReferencedAttribute,CascadeConfiguration,IsCustomRelationship,IsManaged)',
            'OneToManyRelationships($select=SchemaName,MetadataId,ReferencingEntity,ReferencedEntity,ReferencingAttribute,ReferencedAttribute,CascadeConfiguration,IsCustomRelationship,IsManaged)',
            'ManyToManyRelationships($select=SchemaName,MetadataId,Entity1LogicalName,Entity2LogicalName,IntersectEntityName,Entity1IntersectAttribute,Entity2IntersectAttribute,IsCustomRelationship,IsManaged)',
            // Alternate Keys
            'Keys($select=LogicalName,DisplayName,KeyAttributes,EntityKeyIndexStatus)',
          ].join(','),
        }
      );

      if (result.value.length === 0) {
        throw new Error(`Entity '${logicalName}' not found`);
      }

      const entity = result.value[0];

      // Compute ownership type name
      entity.OwnershipTypeName = this.getOwnershipTypeName(entity.OwnershipType);

      return entity;
    } catch (error) {
      throw new Error(
        `Failed to retrieve schema for ${logicalName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get human-readable ownership type name
   */
  private getOwnershipTypeName(ownershipType?: number): string {
    switch (ownershipType) {
      case 1:
        return 'User or Team Owned';
      case 2:
        return 'Team Owned';
      case 4:
        return 'Organization Owned';
      case 8:
        return 'Business Owned';
      default:
        return 'Unknown';
    }
  }
}
