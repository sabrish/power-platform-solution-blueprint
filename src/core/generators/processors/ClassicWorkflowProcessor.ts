import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { ClassicWorkflowDiscovery } from '../../discovery/ClassicWorkflowDiscovery.js';
import { WorkflowMigrationAnalyzer } from '../../analyzers/WorkflowMigrationAnalyzer.js';
import type { ClassicWorkflow } from '../../types/classicWorkflow.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processClassicWorkflows(
  client: IDataverseClient,
  workflowIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<ClassicWorkflow[]> {
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
      message: `Documenting ${workflowIds.length} classic workflow(s) (migration recommended)...`,
    });

    const discovery: import('../../discovery/IDiscoverer.js').IDiscoverer<ClassicWorkflow> = new ClassicWorkflowDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting classic workflows (${current}/${total})...`,
      });
    }, logger);
    const cwLogWatermark = logger.getEntries().length;
    const workflows = await discovery.discoverByIds(workflowIds);
    checkForPartialFailures('Classic Workflows', cwLogWatermark, logger, stepWarnings);

    // Analyze each workflow for migration
    const analyzer = new WorkflowMigrationAnalyzer();
    for (const workflow of workflows) {
      workflow.migrationRecommendation = analyzer.analyze(workflow);
    }

    // Report completion
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: workflows.length,
      total: workflows.length,
      message: 'Classic workflows documented with migration recommendations',
    });

    return workflows;
  } catch (error) {
    stepWarnings.push({
      step: 'Classic Workflows',
      message: `Classic workflow discovery failed: ${error instanceof Error ? error.message : String(error)}`,
      partial: false,
    });
    return [];
  }
}
