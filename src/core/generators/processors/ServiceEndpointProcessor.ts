import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { ServiceEndpoint } from '../../types/serviceEndpoint.js';
import { ServiceEndpointDiscovery } from '../../discovery/ServiceEndpointDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processServiceEndpoints(
  client: IDataverseClient,
  endpointIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<ServiceEndpoint[]> {
  if (endpointIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: endpointIds.length,
      message: `Documenting ${endpointIds.length} Service Endpoint(s)...`,
    });
    const discovery = new ServiceEndpointDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Service Endpoints (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const endpoints = await discovery.getEndpointsByIds(endpointIds);
    checkForPartialFailures('Service Endpoints', logWatermark, logger, stepWarnings);
    return endpoints;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Service Endpoints', message: msg, partial: false });
    return [];
  }
}
