import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { Publisher } from '../types.js';
import { normalizeGuid } from '../utils/guid.js';

/** Exact shape of each row returned by the solutions expand query */
interface SolutionPublisherRow {
  publisherid: {
    publisherid: string;
    uniquename: string;
    friendlyname: string;
    customizationprefix: string;
  };
}

/**
 * Discovers custom publishers in the Power Platform environment
 */
export class PublisherDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  /**
   * Get all publishers that have at least one solution in the environment.
   * Derives publishers from the solutions table (via expand) so managed-solution
   * publishers are included and unrelated system publishers are excluded.
   * @returns Array of publishers, ordered by friendly name
   */
  async getPublishers(): Promise<Publisher[]> {
    try {
      const result = await this.client.queryAll<SolutionPublisherRow>(
        'solutions',
        {
          select: ['solutionid'],
          filter: 'isvisible eq true',
          expand: 'publisherid($select=publisherid,uniquename,friendlyname,customizationprefix)',
        }
      );

      // Deduplicate by publisherid (normalized — lowercase, no braces per PATTERN-003)
      // and sort by friendlyname
      const seen = new Set<string>();
      const publishers: Publisher[] = [];
      for (const solution of result.value) {
        const pub = solution.publisherid;
        if (!pub?.publisherid) continue;
        const normalizedId = normalizeGuid(pub.publisherid);
        if (seen.has(normalizedId)) continue;
        seen.add(normalizedId);
        publishers.push({ ...pub, publisherid: normalizedId });
      }
      publishers.sort((a, b) => a.friendlyname.localeCompare(b.friendlyname));

      return publishers;
    } catch (error) {
      throw new Error(
        `Failed to retrieve publishers: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
