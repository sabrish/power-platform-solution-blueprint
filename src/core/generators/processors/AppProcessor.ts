import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { AppDiscovery } from '../../discovery/AppDiscovery.js';
import type { CanvasApp } from '../../types/canvasApp.js';
import type { CustomPage } from '../../types/customPage.js';
import type { ModelDrivenApp } from '../../types/modelDrivenApp.js';

export async function processApps(
  client: IDataverseClient,
  canvasAppIds: string[],
  appModuleIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<{
  canvasApps: CanvasApp[];
  customPages: CustomPage[];
  modelDrivenApps: ModelDrivenApp[];
}> {
  let canvasApps: CanvasApp[] = [];
  let customPages: CustomPage[] = [];
  let modelDrivenApps: ModelDrivenApp[] = [];
  try {
    const appDiscovery = new AppDiscovery(
      client,
      (current, total) => onProgress({ phase: 'apps', entityName: '', current, total, message: 'Fetching app records...' }),
      logger
    );
    const [appsResult, mdApps] = await Promise.all([
      canvasAppIds.length > 0
        ? appDiscovery.getAppsAndPagesByIds(canvasAppIds)
        : Promise.resolve({ canvasApps: [], customPages: [] }),
      appModuleIds.length > 0
        ? appDiscovery.getModelDrivenAppsByIds(appModuleIds)
        : Promise.resolve([]),
    ]);
    canvasApps = appsResult.canvasApps;
    customPages = appsResult.customPages;
    modelDrivenApps = mdApps;
  } catch (err) {
    stepWarnings.push({
      step: 'Apps',
      message: err instanceof Error ? err.message : 'Unknown error',
      partial: false,
    });
  }
  return { canvasApps, customPages, modelDrivenApps };
}
