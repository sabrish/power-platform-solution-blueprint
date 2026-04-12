import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import type { ServiceEndpoint, ServiceEndpointContract } from '../types/serviceEndpoint.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { buildOrFilter } from '../utils/odata.js';
import { normalizeGuid } from '../utils/guid.js';

interface RawServiceEndpoint {
  serviceendpointid: string;
  name: string;
  description?: string;
  contract?: number;
  connectionmode?: number;
  messageformat?: number;
  url?: string;
  ismanaged?: boolean;
  createdon?: string;
  modifiedon?: string;
}

interface StepCountRecord {
  _serviceendpointid_value: string;
}

/**
 * Discovery service for Service Endpoints (Service Bus, Event Hub, Webhooks).
 * Component type code: 95 (Service Endpoint) — Strategy A.
 */
export class ServiceEndpointDiscovery {
  private readonly client: IDataverseClient;
  private onProgress?: (current: number, total: number) => void;
  private logger?: FetchLogger;

  constructor(
    client: IDataverseClient,
    onProgress?: (current: number, total: number) => void,
    logger?: FetchLogger
  ) {
    this.client = client;
    this.onProgress = onProgress;
    this.logger = logger;
  }

  async getEndpointsByIds(ids: string[]): Promise<ServiceEndpoint[]> {
    if (ids.length === 0) return [];

    // Pass 1 — fetch endpoint metadata
    const { results: rawEndpoints } = await withAdaptiveBatch<string, RawServiceEndpoint>(
      ids,
      async (batch) => {
        const filter = batch
          .map(id => `serviceendpointid eq ${id.replace(/[{}]/g, '')}`)
          .join(' or ');
        const result = await this.client.query<RawServiceEndpoint>('serviceendpoints', {
          select: ['serviceendpointid', 'name', 'description', 'contract', 'connectionmode', 'messageformat', 'url', 'ismanaged', 'createdon', 'modifiedon'],
          filter,
        });
        return result.value;
      },
      {
        initialBatchSize: 20,
        step: 'Service Endpoint Discovery',
        entitySet: 'serviceendpoints',
        logger: this.logger,
        onProgress: (done) => this.onProgress?.(Math.floor(done / 2), ids.length),
      }
    );

    // Pass 2 — count registered plugin steps per endpoint
    const stepCountMap = new Map<string, number>();
    try {
      const { results: stepRecords } = await withAdaptiveBatch<string, StepCountRecord>(
        rawEndpoints.map(e => normalizeGuid(e.serviceendpointid)),
        async (batch) => {
          const filter = buildOrFilter(batch, '_serviceendpointid_value', { guids: true });
          const result = await this.client.query<StepCountRecord>('sdkmessageprocessingsteps', {
            select: ['_serviceendpointid_value'],
            filter,
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Service Endpoint Discovery — Step Counts',
          entitySet: 'sdkmessageprocessingsteps',
          logger: this.logger,
          onProgress: (done) => this.onProgress?.(Math.floor(ids.length / 2) + Math.floor(done / 2), ids.length),
        }
      );
      for (const rec of stepRecords) {
        const endpointId = normalizeGuid(rec._serviceendpointid_value);
        stepCountMap.set(endpointId, (stepCountMap.get(endpointId) ?? 0) + 1);
      }
    } catch {
      // Step count is informational — continue without it
    }

    return rawEndpoints.map(raw => this.mapToServiceEndpoint(raw, stepCountMap));
  }

  private mapContractCode(code: number | undefined): ServiceEndpointContract {
    switch (code) {
      case 1: return 'OneWay';
      case 2: return 'Queue';
      case 3: return 'SendAndReceive';
      case 8: return 'EventHub';
      case 9: return 'Webhook';
      default: return 'Unknown';
    }
  }

  private mapConnectionMode(code: number | undefined): string {
    switch (code) {
      case 1: return 'Normal';
      case 2: return 'Federated';
      default: return 'Unknown';
    }
  }

  private mapMessageFormat(code: number | undefined): string {
    switch (code) {
      case 1: return 'Binary XML';
      case 2: return 'JSON';
      case 3: return 'Text XML';
      default: return 'Unknown';
    }
  }

  private mapToServiceEndpoint(raw: RawServiceEndpoint, stepCountMap: Map<string, number>): ServiceEndpoint {
    const id = normalizeGuid(raw.serviceendpointid);
    return {
      id,
      name: raw.name,
      description: raw.description ?? null,
      contract: this.mapContractCode(raw.contract),
      connectionMode: this.mapConnectionMode(raw.connectionmode),
      messageFormat: this.mapMessageFormat(raw.messageformat),
      url: raw.url ?? null,
      isManaged: raw.ismanaged ?? false,
      createdOn: raw.createdon || new Date().toISOString(),
      modifiedOn: raw.modifiedon || raw.createdon || new Date().toISOString(),
      registeredStepCount: stepCountMap.get(id) ?? 0,
    };
  }
}
