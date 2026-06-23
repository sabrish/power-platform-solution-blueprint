import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { PcfControl } from '../../types/pcfControl.js';
import { PcfControlDiscovery } from '../../discovery/PcfControlDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processPcfControls(
  client: IDataverseClient,
  controlIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<PcfControl[]> {
  if (controlIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: controlIds.length,
      message: `Documenting ${controlIds.length} PCF Control(s)...`,
    });
    const discovery = new PcfControlDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting PCF Controls (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const controls = await discovery.getControlsByIds(controlIds);
    checkForPartialFailures('PCF Controls', logWatermark, logger, stepWarnings);
    return controls;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'PCF Controls', message: msg, partial: false });
    return [];
  }
}
