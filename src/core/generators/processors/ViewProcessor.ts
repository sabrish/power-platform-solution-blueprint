import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { View } from '../../types/view.js';
import { ViewDiscovery } from '../../discovery/ViewDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processViews(
  client: IDataverseClient,
  viewIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<View[]> {
  if (viewIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: viewIds.length,
      message: `Documenting ${viewIds.length} View(s)...`,
    });
    const discovery = new ViewDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Views (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const views = await discovery.discoverByIds(viewIds);
    checkForPartialFailures('Views', logWatermark, logger, stepWarnings);
    return views;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Views', message: msg, partial: false });
    return [];
  }
}
