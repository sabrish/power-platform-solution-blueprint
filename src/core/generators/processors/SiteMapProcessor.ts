import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { SiteMap } from '../../types/siteMap.js';
import { SiteMapDiscovery } from '../../discovery/SiteMapDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processSiteMaps(
  client: IDataverseClient,
  siteMapIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<SiteMap[]> {
  if (siteMapIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: siteMapIds.length,
      message: `Documenting ${siteMapIds.length} Site Map(s)...`,
    });
    const discovery = new SiteMapDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Site Maps (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const siteMaps = await discovery.discoverByIds(siteMapIds);
    checkForPartialFailures('Site Maps', logWatermark, logger, stepWarnings);
    return siteMaps;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Site Maps', message: msg, partial: false });
    return [];
  }
}
