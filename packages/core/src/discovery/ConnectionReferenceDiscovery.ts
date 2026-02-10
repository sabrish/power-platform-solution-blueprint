import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { ConnectionReference } from '../types/connectionReference.js';

interface RawConnectionReference {
  connectionreferenceid: string;
  connectionreferencelogicalname: string;
  connectionreferencedisplayname: string | null;
  description: string | null;
  connectionid: string | null;
  connectorid: string | null;
  ismanaged: boolean;
  iscustomizable: { Value: boolean };
  statecode: number;
  statuscode: number;
  createdon: string;
  modifiedon: string;
  _ownerid_value?: string;
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;
}

export class ConnectionReferenceDiscovery {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;

  constructor(client: IDataverseClient, onProgress?: (current: number, total: number) => void) {
    this.client = client;
    this.onProgress = onProgress;
  }

  async getConnectionReferencesByIds(ids: string[]): Promise<ConnectionReference[]> {
    if (ids.length === 0) return [];

    try {
      const batchSize = 20;
      const allResults: RawConnectionReference[] = [];

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const filterClauses = batch.map(id => `connectionreferenceid eq ${id.replace(/[{}]/g, '')}`);
        const filter = filterClauses.join(' or ');

        const result = await this.client.query<RawConnectionReference>('connectionreferences', {
          select: ['connectionreferenceid', 'connectionreferencelogicalname', 'connectionreferencedisplayname',
            'description', 'connectionid', 'connectorid', 'ismanaged', 'iscustomizable',
            'statecode', 'statuscode', 'createdon', 'modifiedon', '_ownerid_value'],
          filter,
          orderBy: ['connectionreferencelogicalname asc'],
        });

        allResults.push(...result.value);

        // Report progress after each batch
        if (this.onProgress) {
          this.onProgress(allResults.length, ids.length);
        }
      }

      return allResults.map(raw => this.mapToConnectionReference(raw));
    } catch (error) {
      throw new Error(`Failed to retrieve Connection References: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapToConnectionReference(raw: RawConnectionReference): ConnectionReference {
    return {
      id: raw.connectionreferenceid,
      name: raw.connectionreferencelogicalname,
      displayName: raw.connectionreferencedisplayname || raw.connectionreferencelogicalname,
      description: raw.description,
      connectionId: raw.connectionid,
      connectorId: raw.connectorid,
      connectorDisplayName: raw.connectorid ? this.getConnectorDisplayName(raw.connectorid) : null,
      isManaged: raw.ismanaged,
      isCustomizable: raw.iscustomizable?.Value ?? true,
      statecode: raw.statecode,
      statuscode: raw.statuscode,
      owner: raw['_ownerid_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      ownerId: raw._ownerid_value || '',
      modifiedBy: raw['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] || 'Unknown',
      modifiedOn: raw.modifiedon,
      createdOn: raw.createdon,
    };
  }

  private getConnectorDisplayName(connectorId: string): string {
    // Extract connector name from connector ID (format: /providers/Microsoft.PowerApps/apis/{name})
    const match = connectorId.match(/\/apis\/([^/]+)/);
    return match ? match[1] : connectorId;
  }
}
