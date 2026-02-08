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
  ownerid?: { fullname: string; ownerid: string };
  modifiedby?: { fullname: string };
}

export class ConnectionReferenceDiscovery {
  private readonly client: IDataverseClient;

  constructor(client: IDataverseClient) {
    this.client = client;
  }

  async getConnectionReferencesByIds(ids: string[]): Promise<ConnectionReference[]> {
    if (ids.length === 0) return [];

    try {
      const filter = ids.map(id => `connectionreferenceid eq ${id.replace(/[{}]/g, '')}`).join(' or ');
      console.log('🔗 Querying Connection References:', ids.length);

      const result = await this.client.query<RawConnectionReference>('connectionreferences', {
        select: ['connectionreferenceid', 'connectionreferencelogicalname', 'connectionreferencedisplayname',
          'description', 'connectionid', 'connectorid', 'ismanaged', 'iscustomizable',
          'statecode', 'statuscode', 'createdon', 'modifiedon'],
        filter,
        expand: 'ownerid($select=fullname,ownerid),modifiedby($select=fullname)',
        orderBy: ['connectionreferencelogicalname asc'],
      });

      console.log(`🔗 Retrieved ${result.value.length} Connection References`);
      return result.value.map(raw => this.mapToConnectionReference(raw));
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
      owner: raw.ownerid?.fullname || 'Unknown',
      ownerId: raw.ownerid?.ownerid || '',
      modifiedBy: raw.modifiedby?.fullname || 'Unknown',
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
