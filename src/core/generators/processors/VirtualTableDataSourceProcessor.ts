import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { VirtualTableDataSource } from '../../types/virtualTableDataSource.js';
import { VirtualTableDataSourceDiscovery } from '../../discovery/VirtualTableDataSourceDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processVirtualTableDataSources(
  client: IDataverseClient,
  dataSourceIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<VirtualTableDataSource[]> {
  if (dataSourceIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: dataSourceIds.length,
      message: `Documenting ${dataSourceIds.length} Virtual Table Data Source(s)...`,
    });
    const discovery = new VirtualTableDataSourceDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Virtual Table Data Sources (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    // connectionDefinition is already null in discovery output — no extra redaction needed
    const dataSources = await discovery.discoverByIds(dataSourceIds);
    checkForPartialFailures('Virtual Table Data Sources', logWatermark, logger, stepWarnings);
    return dataSources;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Virtual Table Data Sources', message: msg, partial: false });
    return [];
  }
}
