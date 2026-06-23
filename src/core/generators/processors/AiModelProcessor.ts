import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { AiModel } from '../../types/aiModel.js';
import { AiModelDiscovery } from '../../discovery/AiModelDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processAiModels(
  client: IDataverseClient,
  aiModelIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<AiModel[]> {
  if (aiModelIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: aiModelIds.length,
      message: `Documenting ${aiModelIds.length} AI Model(s)...`,
    });
    const discovery = new AiModelDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting AI Models (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    try {
      const aiModels = await discovery.discoverByIds(aiModelIds);
      checkForPartialFailures('AI Models', logWatermark, logger, stepWarnings);
      return aiModels;
    } catch (innerError) {
      const msg = innerError instanceof Error ? innerError.message : 'Unknown error';
      stepWarnings.push({ step: 'AI Models', message: msg, partial: false });
      return [];
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'AI Models', message: msg, partial: false });
    return [];
  }
}
