import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { Publisher } from '../types.js';

/**
 * Discovers custom publishers in the Power Platform environment
 */
export class PublisherDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get all custom publishers (non-system)
   * @returns Array of custom publishers, ordered by friendly name
   */
  async getPublishers(): Promise<Publisher[]> {
    try {
      const result = await this.client.query<Publisher>('publishers', {
        select: ['publisherid', 'uniquename', 'friendlyname', 'customizationprefix'],
        filter: 'isreadonly eq false',
        orderBy: ['friendlyname'],
      });

      return result.value;
    } catch (error) {
      throw new Error(
        `Failed to retrieve publishers: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
