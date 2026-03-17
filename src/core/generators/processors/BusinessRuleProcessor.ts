import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning, BusinessRule } from '../../types/blueprint.js';
import { BusinessRuleDiscovery } from '../../discovery/BusinessRuleDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processBusinessRules(
  client: IDataverseClient,
  businessRuleIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<BusinessRule[]> {
  if (businessRuleIds.length === 0) {
    return [];
  }

  try {
    // Report progress
    onProgress({
      phase: 'business-rules',
      entityName: '',
      current: 0,
      total: businessRuleIds.length,
      message: `Documenting ${businessRuleIds.length} business rule${businessRuleIds.length > 1 ? 's' : ''}...`,
    });

    const discovery: import('../../discovery/IDiscoverer.js').IDiscoverer<BusinessRule> = new BusinessRuleDiscovery(client, (current, total) => {
      onProgress({
        phase: 'business-rules',
        entityName: '',
        current,
        total,
        message: `Documenting business rules (${current}/${total})...`,
      });
    }, logger);
    const brLogWatermark = logger.getEntries().length;
    const businessRules = await discovery.discoverByIds(businessRuleIds);
    checkForPartialFailures('Business Rules', brLogWatermark, logger, stepWarnings);

    // Report completion
    onProgress({
      phase: 'business-rules',
      entityName: '',
      current: businessRules.length,
      total: businessRules.length,
      message: 'Business rules documented',
    });

    return businessRules;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Business Rules', message: msg, partial: false });
    return [];
  }
}
