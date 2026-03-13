import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { CustomConnectorDiscovery } from '../../discovery/CustomConnectorDiscovery.js';
import type { CustomConnector } from '../../types/customConnector.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processCustomConnectors(
  client: IDataverseClient,
  connectorIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<CustomConnector[]> {
  if (connectorIds.length === 0) return [];
  try {
    onProgress({ phase: 'discovering', entityName: '', current: 0, total: connectorIds.length,
      message: `Documenting ${connectorIds.length} Custom Connector(s)...` });
    const ccDiscovery = new CustomConnectorDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Custom Connectors (${current}/${total})...`,
      });
    }, logger);
    const ccLogWatermark = logger.getEntries().length;
    const connectors = await ccDiscovery.getConnectorsByIds(connectorIds);
    checkForPartialFailures('Custom Connectors', ccLogWatermark, logger, stepWarnings);
    return connectors;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Custom Connectors', message: msg, partial: false });
    return [];
  }
}
