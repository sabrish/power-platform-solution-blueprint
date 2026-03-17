import type { EntityBlueprint, BlueprintResult } from '../types/blueprint.js';

/**
 * Calculate complexity score for an entity based on automation and schema density.
 */
export function calculateComplexityScore(entity: EntityBlueprint, _result: BlueprintResult): {
  total: number;
  level: 'Low' | 'Medium' | 'High';
  breakdown: {
    attributes: number;
    plugins: number;
    flows: number;
    businessRules: number;
    forms: number;
  };
} {
  const breakdown = {
    attributes: entity.entity.Attributes?.length || 0,
    plugins: entity.plugins.length,
    flows: entity.flows.length,
    businessRules: entity.businessRules.length,
    forms: entity.forms.length,
  };

  const total =
    breakdown.attributes * 1 +
    breakdown.plugins * 5 +
    breakdown.flows * 3 +
    breakdown.businessRules * 2 +
    breakdown.forms * 2;

  let level: 'Low' | 'Medium' | 'High';
  if (total <= 50) {
    level = 'Low';
  } else if (total <= 150) {
    level = 'Medium';
  } else {
    level = 'High';
  }

  return { total, level, breakdown };
}
