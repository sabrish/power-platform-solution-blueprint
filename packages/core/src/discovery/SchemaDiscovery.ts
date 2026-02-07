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
   * @returns Detailed entity metadata with attributes
   */
  async getEntitySchema(logicalName: string): Promise<DetailedEntityMetadata> {
    try {
      // Use filter syntax instead of direct query to get consistent array response
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
          ],
          filter: `LogicalName eq '${logicalName}'`,
          expand: 'Attributes($select=LogicalName,SchemaName,MetadataId,DisplayName,AttributeType,IsPrimaryId,IsPrimaryName,IsValidForCreate,IsValidForUpdate,IsValidForRead,IsValidForAdvancedFind,IsAuditEnabled,RequiredLevel,Description),Keys($select=LogicalName,DisplayName,KeyAttributes)',
        }
      );

      if (result.value.length === 0) {
        throw new Error(`Entity '${logicalName}' not found`);
      }

      return result.value[0];
    } catch (error) {
      throw new Error(
        `Failed to retrieve schema for ${logicalName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
