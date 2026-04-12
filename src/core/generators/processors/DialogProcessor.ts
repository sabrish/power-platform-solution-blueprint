import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { Dialog } from '../../types/dialog.js';
import { DialogDiscovery } from '../../discovery/DialogDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processDialogs(
  client: IDataverseClient,
  dialogIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<Dialog[]> {
  if (dialogIds.length === 0) return [];
  try {
    // Push deprecation warning before discovery — dialogs are a deprecated feature
    stepWarnings.push({
      step: 'Dialogs',
      message: `${dialogIds.length} deprecated Dialog workflow(s) found — migrate to Model-Driven App forms or Power Automate flows.`,
      partial: false,
    });

    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: dialogIds.length,
      message: `Documenting ${dialogIds.length} Dialog(s)...`,
    });
    const discovery = new DialogDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Dialogs (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const dialogs = await discovery.discoverByIds(dialogIds);
    checkForPartialFailures('Dialogs', logWatermark, logger, stepWarnings);
    return dialogs;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Dialogs', message: msg, partial: false });
    return [];
  }
}
