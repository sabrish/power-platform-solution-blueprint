import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { EnvironmentVariableDiscovery } from '../../discovery/EnvironmentVariableDiscovery.js';
import type { EnvironmentVariable } from '../../types/environmentVariable.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processEnvironmentVariables(
  client: IDataverseClient,
  envVarIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<EnvironmentVariable[]> {
  if (envVarIds.length === 0) {
    return [];
  }

  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: envVarIds.length,
      message: `Documenting ${envVarIds.length} Environment Variable(s)...`,
    });

    const envVarDiscovery = new EnvironmentVariableDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Environment Variables (${current}/${total})...`,
      });
    }, logger);
    const evLogWatermark = logger.getEntries().length;
    const envVars = await envVarDiscovery.getEnvironmentVariablesByIds(envVarIds);
    checkForPartialFailures('Environment Variables', evLogWatermark, logger, stepWarnings);

    onProgress({
      phase: 'discovering',
      entityName: '',
      current: envVarIds.length,
      total: envVarIds.length,
      message: `Documented ${envVars.length} Environment Variable(s)`,
    });

    return envVars;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Environment Variables', message: msg, partial: false });
    return [];
  }
}
