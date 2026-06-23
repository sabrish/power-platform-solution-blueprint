import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { Report } from '../../types/report.js';
import { ReportDiscovery } from '../../discovery/ReportDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processReports(
  client: IDataverseClient,
  reportIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<Report[]> {
  if (reportIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: reportIds.length,
      message: `Documenting ${reportIds.length} Report(s)...`,
    });
    const discovery = new ReportDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Reports (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const reports = await discovery.discoverByIds(reportIds);
    checkForPartialFailures('Reports', logWatermark, logger, stepWarnings);
    return reports;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Reports', message: msg, partial: false });
    return [];
  }
}
