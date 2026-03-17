import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { BusinessProcessFlowDiscovery } from '../../discovery/BusinessProcessFlowDiscovery.js';
import type { BusinessProcessFlow } from '../../types/businessProcessFlow.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processBusinessProcessFlows(
  client: IDataverseClient,
  workflowIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<BusinessProcessFlow[]> {
  if (workflowIds.length === 0) {
    return [];
  }

  try {
    // Report progress
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: workflowIds.length,
      message: `Documenting ${workflowIds.length} Business Process Flow(s)...`,
    });

    const discovery: import('../../discovery/IDiscoverer.js').IDiscoverer<BusinessProcessFlow> = new BusinessProcessFlowDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Business Process Flows (${current}/${total})...`,
      });
    }, logger);
    const bpfLogWatermark = logger.getEntries().length;
    const bpfs = await discovery.discoverByIds(workflowIds);
    checkForPartialFailures('Business Process Flows', bpfLogWatermark, logger, stepWarnings);

    // Report completion
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: workflowIds.length,
      total: workflowIds.length,
      message: `Documented ${bpfs.length} Business Process Flow(s)`,
    });

    return bpfs;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Business Process Flows', message: msg, partial: false });
    return [];
  }
}
