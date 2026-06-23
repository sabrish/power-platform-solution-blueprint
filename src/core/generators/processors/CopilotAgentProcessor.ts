import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { CopilotAgent } from '../../types/copilotAgent.js';
import { CopilotAgentDiscovery } from '../../discovery/CopilotAgentDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processCopilotAgents(
  client: IDataverseClient,
  agentIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<CopilotAgent[]> {
  if (agentIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: agentIds.length,
      message: `Documenting ${agentIds.length} Copilot Agent(s)...`,
    });
    const discovery = new CopilotAgentDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Copilot Agents (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const agents = await discovery.getAgentsByIds(agentIds);
    checkForPartialFailures('Copilot Agents', logWatermark, logger, stepWarnings);
    return agents;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Copilot Agents', message: msg, partial: false });
    return [];
  }
}
