import type { EntityBlueprint, CrossEntityLink } from '../types/blueprint.js';

/**
 * Maps automation that affects multiple entities (cross-entity operations)
 */
export class CrossEntityMapper {
  /**
   * Map all cross-entity automation links
   */
  mapCrossEntityAutomation(entities: EntityBlueprint[]): CrossEntityLink[] {
    const links: CrossEntityLink[] = [];

    // Build entity lookup map for display names
    const entityMap = new Map<string, string>();
    for (const { entity } of entities) {
      entityMap.set(
        entity.LogicalName.toLowerCase(),
        entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName
      );
    }

    // Process each entity
    for (const blueprint of entities) {
      const sourceEntity = blueprint.entity.LogicalName;
      const sourceDisplayName = blueprint.entity.DisplayName?.UserLocalizedLabel?.Label || sourceEntity;

      // Check flows for cross-entity operations
      for (const flow of blueprint.flows) {
        if (!flow.definition.dataverseActions || flow.definition.dataverseActions.length === 0) {
          continue;
        }

        for (const action of flow.definition.dataverseActions) {
          // Only include if target entity is different from source
          if (action.targetEntity.toLowerCase() !== sourceEntity.toLowerCase()) {
            const targetDisplayName = entityMap.get(action.targetEntity.toLowerCase()) || action.targetEntity;

            links.push({
              sourceEntity,
              sourceEntityDisplayName: sourceDisplayName,
              targetEntity: action.targetEntity,
              targetEntityDisplayName: targetDisplayName,
              automationType: 'Flow',
              automationName: flow.name,
              automationId: flow.id,
              operation: action.operation,
              description: `Flow "${flow.name}" ${action.operation.toLowerCase()}s records in ${action.targetEntity} when ${sourceEntity} is ${this.getTriggerDescription(flow.definition.triggerEvent)}`,
              isAsynchronous: true, // Flows are always async
            });
          }
        }
      }

      // Check business rules for cross-entity references (via lookup fields)
      for (const businessRule of blueprint.businessRules) {
        // Business rules typically don't create/update other entities directly
        // but they can reference related entities via lookups
        // We'll detect this via field references in conditions/actions
        const crossEntityRefs = this.detectBusinessRuleCrossEntityReferences(businessRule, entityMap);
        links.push(...crossEntityRefs.map(ref => ({
          sourceEntity,
          sourceEntityDisplayName: sourceDisplayName,
          targetEntity: ref.targetEntity,
          targetEntityDisplayName: ref.targetDisplayName,
          automationType: 'BusinessRule' as const,
          automationName: businessRule.name,
          automationId: businessRule.id,
          operation: 'Read',
          description: `Business rule "${businessRule.name}" references ${ref.targetEntity} via lookup field`,
          isAsynchronous: false, // Business rules are synchronous
        })));
      }

      // Check classic workflows for cross-entity operations
      // Note: Would need XAML parsing - placeholder for now
      // TODO: Parse XAML for CreateEntity/UpdateEntity steps

      // Check plugins for cross-entity hints (limited - no code access)
      // We can only detect from naming patterns (low confidence)
      for (const plugin of blueprint.plugins) {
        const hints = this.detectPluginCrossEntityHints(plugin, sourceEntity, entityMap);
        links.push(...hints.map(hint => ({
          sourceEntity,
          sourceEntityDisplayName: sourceDisplayName,
          targetEntity: hint.targetEntity,
          targetEntityDisplayName: hint.targetDisplayName,
          automationType: 'Plugin' as const,
          automationName: plugin.name,
          automationId: plugin.id,
          operation: hint.operation,
          description: `Plugin "${plugin.name}" may ${hint.operation.toLowerCase()} ${hint.targetEntity} (detected from naming)`,
          isAsynchronous: plugin.mode === 1, // Mode 1 = async
        })));
      }
    }

    // Sort by source entity, then target entity
    return links.sort((a, b) => {
      const entityCompare = a.sourceEntity.localeCompare(b.sourceEntity);
      if (entityCompare !== 0) return entityCompare;
      return a.targetEntity.localeCompare(b.targetEntity);
    });
  }

  /**
   * Get human-readable trigger description
   */
  private getTriggerDescription(triggerEvent: string): string {
    switch (triggerEvent) {
      case 'Create': return 'created';
      case 'Update': return 'updated';
      case 'Delete': return 'deleted';
      case 'CreateOrUpdate': return 'created or updated';
      default: return 'triggered';
    }
  }

  /**
   * Detect cross-entity references in business rules (via lookup fields)
   */
  private detectBusinessRuleCrossEntityReferences(
    _businessRule: any,
    _entityMap: Map<string, string>
  ): { targetEntity: string; targetDisplayName: string }[] {
    const refs: { targetEntity: string; targetDisplayName: string }[] = [];

    // This is a placeholder - would need to parse XAML to find lookup field references
    // For now, return empty array
    // TODO: Implement XAML parsing for lookup field references

    return refs;
  }

  /**
   * Detect cross-entity hints from plugin naming patterns (low confidence)
   */
  private detectPluginCrossEntityHints(
    plugin: any,
    sourceEntity: string,
    entityMap: Map<string, string>
  ): { targetEntity: string; targetDisplayName: string; operation: string }[] {
    const hints: { targetEntity: string; targetDisplayName: string; operation: string }[] = [];

    // Check plugin name for entity references and operation keywords
    const name = plugin.name?.toLowerCase() || '';
    const description = plugin.description?.toLowerCase() || '';
    const combined = `${name} ${description}`;

    // Keywords for operations
    const operationKeywords = {
      Create: ['create', 'insert', 'add'],
      Update: ['update', 'modify', 'change', 'sync'],
      Delete: ['delete', 'remove'],
    };

    // Look for entity names in the plugin name/description
    for (const [entityLogical, entityDisplay] of entityMap) {
      if (entityLogical === sourceEntity.toLowerCase()) {
        continue; // Skip source entity
      }

      // Check if entity name appears in plugin name/description
      const entityNamePattern = new RegExp(`\\b${entityLogical}\\b`, 'i');
      if (entityNamePattern.test(combined)) {
        // Try to detect operation
        let operation = 'Update'; // Default assumption
        for (const [op, keywords] of Object.entries(operationKeywords)) {
          if (keywords.some(keyword => combined.includes(keyword))) {
            operation = op;
            break;
          }
        }

        hints.push({
          targetEntity: entityLogical,
          targetDisplayName: entityDisplay,
          operation,
        });
      }
    }

    return hints;
  }
}
