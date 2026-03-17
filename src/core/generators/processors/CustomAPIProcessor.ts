import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { CustomAPIDiscovery } from '../../discovery/CustomAPIDiscovery.js';
import type { IDiscoverer } from '../../discovery/IDiscoverer.js';
import type { CustomAPI } from '../../types/customApi.js';

export async function processCustomAPIs(
  client: IDataverseClient,
  customApiIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<CustomAPI[]> {
  if (customApiIds.length === 0) {
    return [];
  }

  try {
    // Report progress
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: customApiIds.length,
      message: `Documenting ${customApiIds.length} Custom API(s)...`,
    });

    const discovery: IDiscoverer<CustomAPI> = new CustomAPIDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        // When current === total, Pass 1 is done but request param + response property fetches may still be running
        message: current < total
          ? `Documenting Custom APIs (${current}/${total})...`
          : 'Fetching Custom API parameters and response properties...',
      });
    }, logger);
    const customAPIs = await discovery.discoverByIds(customApiIds);

    // Report completion
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: customApiIds.length,
      total: customApiIds.length,
      message: `Documented ${customAPIs.length} Custom API(s)`,
    });

    return customAPIs;
  } catch (error) {
    stepWarnings.push({ step: 'Custom APIs', message: error instanceof Error ? error.message : 'Unknown error', partial: false });
    return [];
  }
}
