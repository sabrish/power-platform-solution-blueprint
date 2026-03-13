import type { FetchLogger } from '../../utils/FetchLogger.js';
import type { StepWarning } from '../../types/blueprint.js';

/**
 * After a processor step completes, check the fetch log for any new failed entries
 * and push a partial StepWarning so the dashboard can surface them.
 */
export function checkForPartialFailures(
  stepName: string,
  logWatermark: number,
  logger: FetchLogger,
  stepWarnings: StepWarning[]
): void {
  const newFailures = logger.getEntries()
    .slice(logWatermark)
    .filter(e => e.status === 'failed');
  if (newFailures.length > 0) {
    stepWarnings.push({
      step: stepName,
      message: `${newFailures.length} API request(s) failed — results may be incomplete. See Fetch Log for details.`,
      partial: true,
      failedCount: newFailures.length,
    });
  }
}
