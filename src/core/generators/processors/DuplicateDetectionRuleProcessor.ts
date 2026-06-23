import type { IDataverseClient } from '../../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { ProgressInfo, StepWarning } from '../../types/blueprint.js';
import type { DuplicateDetectionRule } from '../../types/duplicateDetectionRule.js';
import { DuplicateDetectionRuleDiscovery } from '../../discovery/DuplicateDetectionRuleDiscovery.js';
import { checkForPartialFailures } from './processorUtils.js';

export async function processDuplicateDetectionRules(
  client: IDataverseClient,
  ruleIds: string[],
  onProgress: (progress: ProgressInfo) => void,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): Promise<DuplicateDetectionRule[]> {
  if (ruleIds.length === 0) return [];
  try {
    onProgress({
      phase: 'discovering',
      entityName: '',
      current: 0,
      total: ruleIds.length,
      message: `Documenting ${ruleIds.length} Duplicate Detection Rule(s)...`,
    });
    const discovery = new DuplicateDetectionRuleDiscovery(client, (current, total) => {
      onProgress({
        phase: 'discovering',
        entityName: '',
        current,
        total,
        message: `Documenting Duplicate Detection Rules (${current}/${total})...`,
      });
    }, logger);
    const logWatermark = logger.getEntries().length;
    const rules = await discovery.discoverByIds(ruleIds);
    checkForPartialFailures('Duplicate Detection Rules', logWatermark, logger, stepWarnings);
    return rules;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    stepWarnings.push({ step: 'Duplicate Detection Rules', message: msg, partial: false });
    return [];
  }
}
