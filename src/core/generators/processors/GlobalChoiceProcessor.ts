import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { GlobalChoiceDiscovery } from '../../discovery/GlobalChoiceDiscovery.js';
import type { GlobalChoice } from '../../types/globalChoice.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processGlobalChoices(
  client: IDataverseClient,
  globalChoiceIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<GlobalChoice[]> {
  if (globalChoiceIds.length === 0) return [];
  try {
    onProgress({ phase: 'discovering', entityName: '', current: 0, total: globalChoiceIds.length,
      message: `Documenting ${globalChoiceIds.length} Global Choice(s)...` });
    const discovery: import('../../discovery/IDiscoverer.js').IDiscoverer<GlobalChoice> = new GlobalChoiceDiscovery(
      client,
      undefined,
      logger
    );
    const gcLogWatermark = logger.getEntries().length;
    const choices = await discovery.discoverByIds(globalChoiceIds);
    checkForPartialFailures('Global Choices', gcLogWatermark, logger, stepWarnings);
    return choices;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Global Choices', message: msg, partial: false });
    return [];
  }
}
