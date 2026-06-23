import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { Chart } from '../../types/chart.js';
import { ChartDiscovery } from '../../discovery/ChartDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processCharts(
  client: IDataverseClient,
  chartIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<Chart[]> {
  if (chartIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: chartIds.length,
      message: `Documenting ${chartIds.length} Chart(s)...`,
    });
    const discovery = new ChartDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Charts (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const charts = await discovery.discoverByIds(chartIds);
    checkForPartialFailures('Charts', logWatermark, logger, stepWarnings);
    return charts;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Charts', message: msg, partial: false });
    return [];
  }
}
