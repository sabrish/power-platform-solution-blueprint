import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning, Flow } from '../../types/blueprint.js';
import type { IDiscoverer } from '../../discovery/IDiscoverer.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processFlows(
  discoverer: IDiscoverer<Flow>,
  flowIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<Flow[]> {
  if (flowIds.length === 0) {
    return [];
  }

  try {
    // Report progress
    onProgress({
      phase: 'flows',
      entityName: '',
      current: 0,
      total: flowIds.length,
      message: `Documenting ${flowIds.length} flow${flowIds.length > 1 ? 's' : ''}...`,
    });

    const flowLogWatermark = logger.getEntries().length;
    const flows = await discoverer.discoverByIds(flowIds);
    checkForPartialFailures('Flows', flowLogWatermark, logger, stepWarnings);

    onProgress({
      phase: 'flows',
      entityName: '',
      current: flows.length,
      total: flows.length,
      message: 'Flows documented',
    });

    return flows;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Flows', message: msg, partial: false });
    return [];
  }
}
