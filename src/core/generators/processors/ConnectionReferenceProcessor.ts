import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { ConnectionReferenceDiscovery } from '../../discovery/ConnectionReferenceDiscovery.js';
import type { ConnectionReference } from '../../types/connectionReference.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processConnectionReferences(
  client: IDataverseClient,
  connRefIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<ConnectionReference[]> {
  if (connRefIds.length === 0) return [];
  try {
    onProgress({ phase: 'discovering', entityName: '', current: 0, total: connRefIds.length,
      message: `Documenting ${connRefIds.length} Connection Reference(s)...` });
    const connRefDiscovery = new ConnectionReferenceDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Connection References (${current}/${total})...`,
      });
    }, logger);
    const crLogWatermark = logger.getEntries().length;
    const refs = await connRefDiscovery.getConnectionReferencesByIds(connRefIds);
    checkForPartialFailures('Connection References', crLogWatermark, logger, stepWarnings);
    return refs;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Connection References', message: msg, partial: false });
    return [];
  }
}
