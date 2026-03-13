import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import { FieldSecurityProfileDiscovery, type FieldSecurityProfile, type EntityFieldSecurity } from '../../discovery/FieldSecurityProfileDiscovery.js';
import { normalizeGuid } from '../../utils/guid.js';

export async function processFieldSecurityProfiles(
  client: IDataverseClient,
  profileIds: string[],
  entityNames: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<{
  profiles: FieldSecurityProfile[];
  fieldSecurityByEntity: Map<string, EntityFieldSecurity>;
}> {
  if (profileIds.length === 0) {
    return {
      profiles: [],
      fieldSecurityByEntity: new Map(),
    };
  }

  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: profileIds.length,
      message: `Documenting ${profileIds.length} field security profile(s)...`,
    });

    const fieldSecurityDiscovery = new FieldSecurityProfileDiscovery(client, logger);

    // Get all profiles
    const allProfiles = await fieldSecurityDiscovery.getFieldSecurityProfiles();

    // Filter to only profiles in the solution
    const profilesInSolution = allProfiles.filter(profile =>
      profileIds.some(id =>
        normalizeGuid(id) === normalizeGuid(profile.fieldsecurityprofileid)
      )
    );

    // Get field security for all entities
    const fieldSecurityByEntity = await fieldSecurityDiscovery.getEntitiesFieldSecurity(entityNames);

    onProgress({
      phase: 'discovering',
      entityName: '',
      current: profileIds.length,
      total: profileIds.length,
      message: `Documented ${profilesInSolution.length} field security profile(s)`,
    });

    return {
      profiles: profilesInSolution,
      fieldSecurityByEntity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Field Security Profiles', message: msg, partial: false });
    return { profiles: [], fieldSecurityByEntity: new Map() };
  }
}
