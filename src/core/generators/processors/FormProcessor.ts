import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning, FormDefinition } from '../../types/blueprint.js';
import type { EntityMetadata } from '../../types.js';
import { FormDiscovery } from '../../discovery/FormDiscovery.js';
import { normalizeGuid, normalizeBatch } from '../../utils/guid.js';

export async function processForms(
  client: IDataverseClient,
  entities: EntityMetadata[],
  formIds: string[],
  entitiesWithAllSubcomponents: Set<string>,
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<FormDefinition[]> {
  if (entities.length === 0) {
    return [];
  }

  try {
    const entityNames = entities.map(e => e.LogicalName);
    const formDiscovery = new FormDiscovery(client, logger, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        // When current === total, Pass 1 is done but form XML content fetch may still be running
        message: current < total
          ? `Discovering forms (${current}/${total} entities)...`
          : 'Fetching form XML definitions...',
      });
    });
    const allForms = await formDiscovery.getFormsForEntities(entityNames);

    // Build map of entity logical name to metadata ID
    const entityLogicalNameToId = new Map<string, string>();
    for (const entity of entities) {
      if (entity.MetadataId) {
        entityLogicalNameToId.set(entity.LogicalName.toLowerCase(), normalizeGuid(entity.MetadataId));
      }
    }

    // Filter forms based on rootcomponentbehavior:
    // - If entity has rootcomponentbehavior=0: Include ALL forms for that entity
    // - Otherwise: Only include forms explicitly in solutioncomponents
    const normalizedFormIds = new Set(normalizeBatch(formIds));

    const forms = allForms.filter(form => {
      const normalizedFormId = normalizeGuid(form.id);
      const entityLogicalName = form.entity.toLowerCase();
      const entityMetadataId = entityLogicalNameToId.get(entityLogicalName);

      // Check if this form's entity has rootcomponentbehavior=0 (include all subcomponents)
      const entityIncludesAllSubcomponents = entityMetadataId && entitiesWithAllSubcomponents.has(entityMetadataId);

      if (entityIncludesAllSubcomponents) {
        return true;
      }

      // Otherwise, check if form is explicitly in solutioncomponents
      const inSolution = normalizedFormIds.has(normalizedFormId);
      return inSolution;
    });

    // Report completion
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: entities.length,
      total: entities.length,
      message: `Documented ${forms.length} form(s) across ${entities.length} entities`,
    });

    return forms;
  } catch (error) {
    stepWarnings.push({ step: 'Forms', message: error instanceof Error ? error.message : 'Unknown error', partial: false });
    return [];
  }
}
