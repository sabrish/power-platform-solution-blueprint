import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning, WebResource } from '../../types/blueprint.js';
import { WebResourceDiscovery } from '../../discovery/WebResourceDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processWebResources(
  client: IDataverseClient,
  webResourceIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<WebResource[]> {
  if (webResourceIds.length === 0) {
    return [];
  }

  try {
    // Report progress
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: webResourceIds.length,
      message: `Analyzing ${webResourceIds.length} web resource${webResourceIds.length > 1 ? 's' : ''}...`,
    });

    const webResourceDiscovery = new WebResourceDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        // When current === total, Pass 1 is done but Pass 2 (JS content fetch) may still be running
        message: current < total
          ? `Analyzing web resources (${current}/${total})...`
          : 'Fetching JavaScript web resource content...',
      });
    }, logger);
    const wrLogWatermark = logger.getEntries().length;
    const webResources = await webResourceDiscovery.getWebResourcesByIds(webResourceIds);
    checkForPartialFailures('Web Resources', wrLogWatermark, logger, stepWarnings);

    onProgress({
      phase: 'discovering',
      entityName: '',
      current: webResources.length,
      total: webResources.length,
      message: 'Web resources analyzed',
    });

    return webResources;
  } catch (error) {
    stepWarnings.push({ step: 'Web Resources', message: error instanceof Error ? error.message : 'Unknown error', partial: false });
    return [];
  }
}
