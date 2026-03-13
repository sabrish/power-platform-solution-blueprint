import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { PluginDiscovery } from '../../discovery/PluginDiscovery.js';
import type { PluginStep } from '../../types.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processPlugins(
  client: IDataverseClient,
  pluginIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<PluginStep[]> {
  if (pluginIds.length === 0) {
    return [];
  }

  try {
    // Report progress
    onProgress({
      phase: 'plugins',
      entityName: '',
      current: 0,
      total: pluginIds.length,
      message: `Documenting ${pluginIds.length} plugin${pluginIds.length > 1 ? 's' : ''}...`,
    });

    const pluginDiscovery = new PluginDiscovery(client, (current, total) => {
      onProgress({
        phase: 'plugins',
        entityName: '',
        current,
        total,
        message: `Documenting plugins (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const plugins = await pluginDiscovery.getPluginsByIds(pluginIds);
    checkForPartialFailures('Plugins', logWatermark, logger, stepWarnings);

    onProgress({
      phase: 'plugins',
      entityName: '',
      current: plugins.length,
      total: plugins.length,
      message: 'Plugins documented',
    });

    return plugins;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Plugins', message: msg, partial: false });
    return [];
  }
}
