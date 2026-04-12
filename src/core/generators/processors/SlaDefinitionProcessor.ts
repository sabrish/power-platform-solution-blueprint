import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { SlaDefinition } from '../../types/slaDefinition.js';
import { SlaDefinitionDiscovery } from '../../discovery/SlaDefinitionDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processSlaDefinitions(
  client: IDataverseClient,
  slaIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<SlaDefinition[]> {
  if (slaIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: slaIds.length,
      message: `Documenting ${slaIds.length} SLA Definition(s)...`,
    });
    const discovery = new SlaDefinitionDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting SLA Definitions (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const slaDefinitions = await discovery.discoverByIds(slaIds);
    checkForPartialFailures('SLA Definitions', logWatermark, logger, stepWarnings);
    return slaDefinitions;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'SLA Definitions', message: msg, partial: false });
    return [];
  }
}
