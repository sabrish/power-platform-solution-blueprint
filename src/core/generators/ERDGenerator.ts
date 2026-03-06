import type { EntityBlueprint, ERDDefinition, ERDDiagram, PublisherLegend, EntityQuickLink } from '../types/blueprint.js';
import type { Publisher } from '../types.js';
import { getPublisherColors } from '../utils/ColorGenerator.js';
import { isSystemEntity, isSystemRelationship } from '../../utils/systemFilters.js';

/**
 * Generates Entity Relationship Diagrams (ERD) using Mermaid Class Diagram syntax
 * Class diagrams provide better layout control and cleaner hierarchical views
 */
export class ERDGenerator {
  private readonly direction: 'TB' | 'LR' = 'TB'; // Top-to-bottom layout (configurable)

  /**
   * Generate Mermaid Class Diagram ERD with publisher-based color coding
   * Creates a single diagram containing all entities
   */
  generateMermaidERD(entities: EntityBlueprint[], publishers: Publisher[]): ERDDefinition {
    // Filter out system entities from diagram generation
    const filteredEntities = entities.filter(bp =>
      !isSystemEntity(bp.entity.LogicalName)
    );

    // Build publisher map (entity prefix -> publisher info)
    const publisherMap = this.buildPublisherMap(filteredEntities, publishers);

    // Generate entity quick links with stats
    const entityQuickLinks = this.generateEntityQuickLinks(filteredEntities, publisherMap);

    // Generate a single diagram with all entities
    const diagrams: ERDDiagram[] = [];

    if (filteredEntities.length > 0) {
      const allEntitiesDiagram = this.generateClassDiagramForEntities(
        filteredEntities,
        publisherMap,
        'all-entities',
        'All Entities',
        `${filteredEntities.length} entities with relationships colour-coded by publisher`
      );
      diagrams.push(allEntitiesDiagram);
    }

    // Generate legend
    const legend = this.generateLegend(publisherMap);

    // Count total relationships
    const totalRelationships = this.countTotalRelationships(filteredEntities);

    return {
      diagrams,
      legend,
      entityQuickLinks,
      totalEntities: filteredEntities.length,
      totalRelationships,
    };
  }

  /**
   * Build publisher map from entity schema names and publisher prefixes
   */
  private buildPublisherMap(
    entities: EntityBlueprint[],
    publishers: Publisher[]
  ): Map<string, { prefix: string; name: string; color: string; entities: string[] }> {
    const publisherMap = new Map<string, { prefix: string; name: string; color: string; entities: string[] }>();

    // Create a lookup map of prefix -> publisher
    const prefixToPublisher = new Map<string, Publisher>();
    for (const publisher of publishers) {
      if (publisher.customizationprefix) {
        prefixToPublisher.set(publisher.customizationprefix.toLowerCase(), publisher);
      }
    }

    // Map each entity to its publisher
    for (const { entity } of entities) {
      const prefix = this.extractPublisherPrefix(entity.SchemaName);
      const normalizedPrefix = prefix.toLowerCase();

      // Get publisher info
      const publisher = prefixToPublisher.get(normalizedPrefix);
      const publisherName = publisher?.friendlyname || (prefix ? `${prefix} (Custom)` : 'Microsoft');

      // Get or create publisher entry
      if (!publisherMap.has(normalizedPrefix)) {
        const colors = getPublisherColors(prefix);
        publisherMap.set(normalizedPrefix, {
          prefix,
          name: publisherName,
          color: colors.fill,
          entities: [],
        });
      }

      publisherMap.get(normalizedPrefix)!.entities.push(entity.LogicalName);
    }

    return publisherMap;
  }

  /**
   * Extract publisher prefix from schema name
   * E.g., "new_Account" -> "new", "Account" -> ""
   */
  private extractPublisherPrefix(schemaName: string): string {
    const match = schemaName.match(/^([a-z]+)_/i);
    return match ? match[1] : '';
  }


  /**
   * Generate Mermaid Class Diagram for a specific set of entities
   * Uses class diagram syntax with namespace grouping for cleaner hierarchical layout
   */
  private generateClassDiagramForEntities(
    entities: EntityBlueprint[],
    publisherMap: Map<string, { prefix: string; name: string; color: string; entities: string[] }>,
    id: string,
    title: string,
    description: string
  ): ERDDiagram {
    const lines: string[] = [];

    // Mermaid Class Diagram header
    lines.push('classDiagram');
    lines.push(`    direction ${this.direction}`);
    lines.push('');

    // Create set of entity logical names in this diagram for filtering
    const entityLogicalNames = new Set(entities.map(bp => bp.entity.LogicalName.toLowerCase()));

    // Build map of entity -> set of attribute names (to validate relationships)
    const entityAttributes = new Map<string, Set<string>>();
    for (const { entity } of entities) {
      const attributes = new Set<string>();
      for (const attr of entity.Attributes || []) {
        attributes.add(attr.LogicalName.toLowerCase());
      }
      entityAttributes.set(entity.LogicalName.toLowerCase(), attributes);
    }

    // Track processed relationships to avoid duplicates
    const processedRelationships = new Set<string>();
    let relationshipCount = 0;

    // STEP 1: Define relationships FIRST (reduces line crossing)
    const relationshipLines: string[] = [];

    for (const { entity } of entities) {
      // Add relationships (ONLY if both entities are in this diagram)
      // OneToMany (this entity is parent): Parent "1" --> "*" Child
      if (entity.OneToManyRelationships) {
        for (const rel of entity.OneToManyRelationships) {
          // Skip system relationships (createdby, modifiedby, currency, etc.)
          if (isSystemRelationship(
            rel.SchemaName,
            rel.ReferencingAttribute,
            rel.ReferencedEntity,
            rel.ReferencingEntity
          )) {
            continue;
          }

          // Only include if child entity is also in this diagram
          if (!entityLogicalNames.has(rel.ReferencingEntity.toLowerCase())) {
            continue;
          }

          // Skip if either attribute doesn't exist in the entity definition
          const referencingAttrs = entityAttributes.get(rel.ReferencingEntity.toLowerCase());
          const referencedAttrs = entityAttributes.get(rel.ReferencedEntity.toLowerCase());
          if (!referencingAttrs?.has(rel.ReferencingAttribute.toLowerCase()) ||
              !referencedAttrs?.has(rel.ReferencedAttribute.toLowerCase())) {
            continue;
          }

          const relationshipKey = `${entity.LogicalName}->${rel.ReferencingEntity}:${rel.SchemaName}`;
          if (!processedRelationships.has(relationshipKey)) {
            processedRelationships.add(relationshipKey);

            const parentEntity = this.sanitizeEntityName(entity.LogicalName);
            const childEntity = this.sanitizeEntityName(rel.ReferencingEntity);

            relationshipLines.push(`    ${parentEntity} "1" --> "*" ${childEntity}`);
            relationshipCount++;
          }
        }
      }

      // ManyToMany relationships: Entity1 "*" --> "*" Entity2
      if (entity.ManyToManyRelationships) {
        for (const rel of entity.ManyToManyRelationships) {
          // Skip system relationships (createdby, modifiedby, currency, etc.)
          if (isSystemRelationship(
            rel.SchemaName,
            undefined,
            rel.Entity1LogicalName,
            rel.Entity2LogicalName
          )) {
            continue;
          }

          // Only include if both entities are in this diagram
          if (!entityLogicalNames.has(rel.Entity1LogicalName.toLowerCase()) ||
              !entityLogicalNames.has(rel.Entity2LogicalName.toLowerCase())) {
            continue;
          }

          const relationshipKey = `${rel.Entity1LogicalName}<->${rel.Entity2LogicalName}:${rel.SchemaName}`;
          const reverseKey = `${rel.Entity2LogicalName}<->${rel.Entity1LogicalName}:${rel.SchemaName}`;

          // Only add if not already processed (avoid duplicates)
          if (!processedRelationships.has(relationshipKey) && !processedRelationships.has(reverseKey)) {
            processedRelationships.add(relationshipKey);

            const entity1 = this.sanitizeEntityName(rel.Entity1LogicalName);
            const entity2 = this.sanitizeEntityName(rel.Entity2LogicalName);

            relationshipLines.push(`    ${entity1} "*" --> "*" ${entity2}`);
            relationshipCount++;
          }
        }
      }
    }

    // Add relationship lines to diagram
    lines.push(...relationshipLines);
    lines.push('');

    // STEP 2: Define entity classes (simple, no grouping)
    for (const { entity } of entities) {
      const entityName = this.sanitizeEntityName(entity.LogicalName);
      lines.push(`    class ${entityName}`);
    }

    lines.push('');

    // STEP 3: Apply publisher color styling
    lines.push('    %% Publisher color coding');
    for (const [, info] of publisherMap) {
      const colors = getPublisherColors(info.prefix);

      // Find all entities belonging to this publisher
      const publisherEntities = entities
        .filter(bp => {
          const entityPrefix = this.extractPublisherPrefix(bp.entity.SchemaName);
          return entityPrefix.toLowerCase() === info.prefix.toLowerCase();
        })
        .map(bp => this.sanitizeEntityName(bp.entity.LogicalName));

      // Apply style to each entity
      for (const entityName of publisherEntities) {
        lines.push(`    style ${entityName} fill:${colors.fill},stroke:${colors.stroke},color:${colors.text}`);
      }
    }

    return {
      id,
      title,
      description,
      mermaidDiagram: lines.join('\n'),
      diagramType: 'mermaid-class',
      direction: this.direction,
      entityCount: entities.length,
      relationshipCount,
    };
  }

  /**
   * Sanitize entity name for Mermaid (remove special characters)
   */
  private sanitizeEntityName(logicalName: string): string {
    return logicalName.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Generate legend mapping publishers to colors
   */
  private generateLegend(
    publisherMap: Map<string, { prefix: string; name: string; color: string; entities: string[] }>
  ): PublisherLegend[] {
    const legend: PublisherLegend[] = [];

    for (const [, info] of publisherMap) {
      legend.push({
        publisherPrefix: info.prefix || 'Microsoft',
        publisherName: info.name,
        color: info.color,
        entityCount: info.entities.length,
        entities: info.entities.sort(),
      });
    }

    // Sort by entity count (descending)
    return legend.sort((a, b) => b.entityCount - a.entityCount);
  }

  /**
   * Generate entity quick links with summary stats
   */
  private generateEntityQuickLinks(
    entities: EntityBlueprint[],
    _publisherMap: Map<string, { prefix: string; name: string; color: string; entities: string[] }>
  ): EntityQuickLink[] {
    return entities.map(({ entity, plugins, flows, businessRules }) => {
      const prefix = this.extractPublisherPrefix(entity.SchemaName);
      const fieldCount = entity.Attributes?.length || 0;
      const pluginCount = plugins.length;
      const flowCount = flows.length;
      const businessRuleCount = businessRules.length;

      // Calculate complexity
      const totalAutomation = pluginCount + flowCount + businessRuleCount;
      let complexity: 'High' | 'Medium' | 'Low' = 'Low';
      if (totalAutomation >= 10 || fieldCount >= 100) {
        complexity = 'High';
      } else if (totalAutomation >= 5 || fieldCount >= 50) {
        complexity = 'Medium';
      }

      return {
        logicalName: entity.LogicalName,
        displayName: entity.DisplayName?.UserLocalizedLabel?.Label || entity.LogicalName,
        publisherPrefix: prefix || 'Microsoft',
        fieldCount,
        pluginCount,
        flowCount,
        businessRuleCount,
        complexity,
      };
    }).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  /**
   * Count total relationships across all entities
   */
  private countTotalRelationships(entities: EntityBlueprint[]): number {
    let count = 0;
    const processedManyToMany = new Set<string>();

    for (const { entity } of entities) {
      // Count OneToMany (each parent->child relationship)
      count += entity.OneToManyRelationships?.length || 0;

      // Count ManyToMany (avoid double-counting)
      if (entity.ManyToManyRelationships) {
        for (const rel of entity.ManyToManyRelationships) {
          const key1 = `${rel.Entity1LogicalName}<->${rel.Entity2LogicalName}:${rel.SchemaName}`;
          const key2 = `${rel.Entity2LogicalName}<->${rel.Entity1LogicalName}:${rel.SchemaName}`;

          if (!processedManyToMany.has(key1) && !processedManyToMany.has(key2)) {
            processedManyToMany.add(key1);
            count++;
          }
        }
      }
    }

    return count;
  }
}
