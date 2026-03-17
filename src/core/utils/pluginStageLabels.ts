/**
 * Canonical stage-number-to-label mapping for Dataverse SDK Message Processing Steps.
 * Used by both PluginDiscovery (data layer) and PluginsList (UI layer).
 */
export const PLUGIN_STAGE_LABELS: Record<number, string> = {
  10: 'PreValidation',
  20: 'PreOperation',
  30: 'MainOperation',
  40: 'PostOperation',
  50: 'Asynchronous',
};

export function getPluginStageLabel(stage: number): string {
  return PLUGIN_STAGE_LABELS[stage] ?? 'Unknown';
}
