import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { EntityMetadata } from '../types.js';

/**
 * Solution component for entity lookup
 */
interface SolutionComponent {
  objectid: string;
  componenttype: number;
}

/**
 * Discovers entities in the Power Platform environment
 */
export class EntityDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get all entities that belong to specific publishers
   * @param publisherPrefixes Array of publisher customization prefixes
   * @returns Array of entities owned by the publishers
   */
  async getEntitiesByPublisher(publisherPrefixes: string[]): Promise<EntityMetadata[]> {
    try {
      // NOTE: Metadata API has very limited query support - no startswith(), no orderBy
      // Must fetch all custom entities and filter in memory
      const result = await this.client.queryMetadata<EntityMetadata>('EntityDefinitions', {
        select: [
          'LogicalName',
          'SchemaName',
          'DisplayName',
          'EntitySetName',
          'PrimaryIdAttribute',
          'PrimaryNameAttribute',
          'MetadataId',
          'IsCustomEntity',
          'IsCustomizable',
          'IsManaged',
          'Description',
        ],
        filter: 'IsCustomEntity eq true', // Only basic equality supported
        // Note: orderBy not supported by metadata API - sort in memory instead
      });

      // Filter in memory to match entities that start with any of the prefixes
      const filteredEntities = result.value.filter((entity) => {
        const logicalName = entity.LogicalName.toLowerCase();
        const schemaName = entity.SchemaName.toLowerCase();

        return publisherPrefixes.some((prefix) => {
          const prefixLower = prefix.toLowerCase();
          return logicalName.startsWith(`${prefixLower}_`) || schemaName.startsWith(`${prefixLower}_`);
        });
      });

      // Sort in memory since metadata API doesn't support orderBy
      return filteredEntities.sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));
    } catch (error) {
      throw new Error(
        `Failed to retrieve entities by publisher: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get entities by their metadata IDs
   * @param entityIds Array of entity metadata IDs
   * @returns Array of entity metadata
   */
  async getEntitiesByIds(entityIds: string[]): Promise<EntityMetadata[]> {
    try {
      if (entityIds.length === 0) {
        return [];
      }

      // Fetch all EntityDefinitions and filter in memory by MetadataId
      const result = await this.client.queryMetadata<EntityMetadata>('EntityDefinitions', {
        select: [
          'LogicalName',
          'SchemaName',
          'DisplayName',
          'EntitySetName',
          'PrimaryIdAttribute',
          'PrimaryNameAttribute',
          'MetadataId',
          'IsCustomEntity',
          'IsCustomizable',
          'IsManaged',
          'Description',
        ],
      });

      // Filter to only entities with matching MetadataIds
      const filteredEntities = result.value.filter((entity) =>
        entityIds.includes(entity.MetadataId.toLowerCase())
      );

      // Sort by LogicalName
      return filteredEntities.sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));
    } catch (error) {
      throw new Error(
        `Failed to retrieve entities by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all entities from specified solutions
   * @param solutionIds Array of solution IDs
   * @returns Array of entities from the solutions (deduplicated)
   */
  async getEntitiesBySolutions(solutionIds: string[]): Promise<EntityMetadata[]> {
    try {
      // Step 1: Get all entity components from the solutions
      const entityMetadataIds = new Set<string>();

      for (const solutionId of solutionIds) {
        const result = await this.client.query<SolutionComponent>('solutioncomponents', {
          select: ['objectid', 'componenttype'],
          filter: `_solutionid_value eq ${solutionId} and componenttype eq 1`,
        });

        // Collect unique entity metadata IDs (convert to lowercase for comparison)
        result.value.forEach((component) => {
          entityMetadataIds.add(component.objectid.toLowerCase());
        });
      }

      if (entityMetadataIds.size === 0) {
        return [];
      }

      // Step 2: Get all EntityDefinitions and filter in memory
      // The metadata API doesn't support complex MetadataId filters
      const result = await this.client.queryMetadata<EntityMetadata>('EntityDefinitions', {
        select: [
          'LogicalName',
          'SchemaName',
          'DisplayName',
          'EntitySetName',
          'PrimaryIdAttribute',
          'PrimaryNameAttribute',
          'MetadataId',
          'IsCustomEntity',
          'IsCustomizable',
          'IsManaged',
          'Description',
        ],
      });

      // Filter to only entities that are in our solution components
      const filteredEntities = result.value.filter((entity) =>
        entityMetadataIds.has(entity.MetadataId.toLowerCase())
      );

      // Sort by LogicalName
      return filteredEntities.sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));
    } catch (error) {
      throw new Error(
        `Failed to retrieve entities by solutions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all entities in the environment
   * @param includeSystem Whether to include system-owned entities
   * @param onlyUnmanaged Only include unmanaged entities (for Default Solution)
   * @returns Array of all entities
   */
  async getAllEntities(includeSystem: boolean, onlyUnmanaged: boolean = false): Promise<EntityMetadata[]> {
    try {
      // Only use IsCustomEntity filter in the query - metadata API has limited query parameter support
      const filter = !includeSystem ? 'IsCustomEntity eq true' : undefined;

      const result = await this.client.queryMetadata<EntityMetadata>('EntityDefinitions', {
        select: [
          'LogicalName',
          'SchemaName',
          'DisplayName',
          'EntitySetName',
          'PrimaryIdAttribute',
          'PrimaryNameAttribute',
          'MetadataId',
          'IsCustomEntity',
          'IsCustomizable',
          'IsManaged',
          'Description',
        ],
        filter,
        // Note: orderBy not supported by metadata API - sort in memory instead
      });

      // Filter for unmanaged in memory (metadata API doesn't support IsManaged filter)
      let entities = result.value;
      if (onlyUnmanaged) {
        entities = entities.filter(e => !e.IsManaged);
      }

      // Sort in memory since metadata API doesn't support orderBy
      entities.sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));

      return entities;
    } catch (error) {
      throw new Error(
        `Failed to retrieve all entities: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
