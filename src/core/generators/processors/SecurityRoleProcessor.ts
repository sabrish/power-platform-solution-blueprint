import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { SecurityRoleDiscovery, type SecurityRoleDetail } from '../../discovery/SecurityRoleDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processSecurityRoles(
  client: IDataverseClient,
  securityRoleIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<SecurityRoleDetail[]> {
  if (securityRoleIds.length === 0) {
    return [];
  }

  try {
    const securityRoleDiscovery = new SecurityRoleDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting security roles (${current}/${total})...`,
      });
    }, logger);

    // Batch-fetch only the solution-scoped roles by ID
    const srLogWatermark = logger.getEntries().length;
    const rolesInSolution = await securityRoleDiscovery.getSecurityRoles(securityRoleIds);

    // Bulk 2-pass fetch: roleprivilegescollection → privileges table
    const roleDetails = await securityRoleDiscovery.getRoleDetailsForRoles(rolesInSolution);
    checkForPartialFailures('Security Roles', srLogWatermark, logger, stepWarnings);

    return roleDetails;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Security Roles', message: msg, partial: false });
    return [];
  }
}
