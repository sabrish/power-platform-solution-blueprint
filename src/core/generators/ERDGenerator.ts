import type { EntityBlueprint, ERDDefinition, ERDDiagram, PublisherLegend, EntityQuickLink } from '../types/blueprint.js';
import type { Publisher } from '../types.js';
import { getPublisherColors } from '../utils/ColorGenerator.js';
import { isSystemEntity, isSystemRelationship } from '../../utils/systemFilters.js';

type PublisherInfo = {
  prefix: string;
  name: string;
  color: string;
  entities: string[];
};

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
  ): Map<string, PublisherInfo> {
    const publisherMap = new Map<string, PublisherInfo>();

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
    publisherMap: Map<string, PublisherInfo>,
    id: string,
    title: string,
    description: string
  ): ERDDiagram {
    const lines: string[] = [];
    const sortedEntities = [...entities].sort((a, b) =>
      a.entity.LogicalName.localeCompare(b.entity.LogicalName)
    );

    // Mermaid Class Diagram header
    lines.push('classDiagram');
    lines.push(`    direction ${this.direction}`);
    lines.push('');

    const relationshipInfo = this.collectRelationshipLines(sortedEntities);

    // Add relationship lines to diagram
    lines.push(...relationshipInfo.lines);
    lines.push('');

    // STEP 2: Define entity classes grouped by publisher
    // Apply classDef using Mermaid's explicit ":::className" syntax on each entity.
    const publisherGroups = new Map<string, EntityBlueprint[]>();
    for (const entityBlueprint of sortedEntities) {
      const prefix = this.extractPublisherPrefix(entityBlueprint.entity.SchemaName).toLowerCase();
      if (!publisherGroups.has(prefix)) {
        publisherGroups.set(prefix, []);
      }
      publisherGroups.get(prefix)!.push(entityBlueprint);
    }

    const sortedPrefixes = Array.from(publisherGroups.keys()).sort((a, b) => {
      if (!a) return -1;
      if (!b) return 1;
      return a.localeCompare(b);
    });

    for (const prefix of sortedPrefixes) {
      const info = publisherMap.get(prefix);
      const namespaceName = this.sanitizeMermaidIdentifier(info?.name || (prefix || 'Microsoft'));
      const classDefName = this.sanitizeClassDefName(`pub_${prefix || 'microsoft'}`);
      lines.push(`    namespace ${namespaceName} {`);
      for (const entityBlueprint of publisherGroups.get(prefix) || []) {
        const entityName = this.sanitizeEntityName(entityBlueprint.entity.LogicalName);
        lines.push(`        class ${entityName}:::${classDefName} {`);
        const columnLines = this.getEntityColumnLines(entityBlueprint);
        for (const columnLine of columnLines) {
          lines.push(`            ${columnLine}`);
        }
        lines.push('        }');
      }
      lines.push('    }');
      lines.push('');
    }

    // STEP 3: Apply publisher colour styling
    lines.push('    %% Publisher color coding');
    for (const [prefix, info] of publisherMap) {
      const colors = getPublisherColors(info.prefix);
      const classDefName = this.sanitizeClassDefName(`pub_${prefix || 'microsoft'}`);
      lines.push(`    classDef ${classDefName} fill:${colors.fill},stroke:${colors.stroke},color:${colors.text},stroke-width:1px`);

    }

    return {
      id,
      title,
      description,
      mermaidDiagram: lines.join('\n'),
      diagramType: 'mermaid-class',
      direction: this.direction,
      entityCount: sortedEntities.length,
      relationshipCount: relationshipInfo.count,
    };
  }

  /**
   * Sanitize entity name for Mermaid (remove special characters)
   */
  private sanitizeEntityName(logicalName: string): string {
    const sanitized = logicalName.replace(/[^a-zA-Z0-9_]/g, '_');
    return /^[0-9]/.test(sanitized) ? `Entity_${sanitized}` : sanitized;
  }

  /**
   * Sanitize generic Mermaid identifiers.
   */
  private sanitizeMermaidIdentifier(value: string): string {
    const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '_');
    return /^[0-9]/.test(sanitized) ? `M_${sanitized}` : sanitized || 'M_Default';
  }

  /**
   * Sanitize class definition identifier.
   */
  private sanitizeClassDefName(value: string): string {
    return this.sanitizeMermaidIdentifier(value);
  }

  /**
   * Collect relationship lines with filtering and deduplication.
   */
  private collectRelationshipLines(entities: EntityBlueprint[]): { lines: string[]; count: number } {
    const entityLogicalNames = new Set(entities.map(bp => bp.entity.LogicalName.toLowerCase()));
    const entityNameMap = new Map(
      entities.map(bp => [bp.entity.LogicalName.toLowerCase(), this.sanitizeEntityName(bp.entity.LogicalName)])
    );
    const processedRelationships = new Set<string>();
    const relationshipLines: string[] = [];

    for (const { entity } of entities) {
      if (entity.OneToManyRelationships) {
        for (const rel of entity.OneToManyRelationships) {
          if (
            isSystemRelationship(
              rel.SchemaName,
              rel.ReferencingAttribute,
              rel.ReferencedEntity,
              rel.ReferencingEntity
            )
          ) {
            continue;
          }

          if (
            !entityLogicalNames.has(rel.ReferencedEntity.toLowerCase()) ||
            !entityLogicalNames.has(rel.ReferencingEntity.toLowerCase())
          ) {
            continue;
          }

          const relationshipKey = [
            rel.ReferencedEntity.toLowerCase(),
            rel.ReferencingEntity.toLowerCase(),
            rel.SchemaName.toLowerCase(),
          ].join('|');

          if (processedRelationships.has(relationshipKey)) {
            continue;
          }
          processedRelationships.add(relationshipKey);

          const parentEntity = entityNameMap.get(rel.ReferencedEntity.toLowerCase()) || this.sanitizeEntityName(rel.ReferencedEntity);
          const childEntity = entityNameMap.get(rel.ReferencingEntity.toLowerCase()) || this.sanitizeEntityName(rel.ReferencingEntity);
          relationshipLines.push(`    ${parentEntity} "1" --> "*" ${childEntity} : ${this.sanitizeRelationshipLabel(rel.SchemaName)}`);
        }
      }

      if (entity.ManyToManyRelationships) {
        for (const rel of entity.ManyToManyRelationships) {
          if (
            isSystemRelationship(
              rel.SchemaName,
              undefined,
              rel.Entity1LogicalName,
              rel.Entity2LogicalName
            )
          ) {
            continue;
          }

          if (
            !entityLogicalNames.has(rel.Entity1LogicalName.toLowerCase()) ||
            !entityLogicalNames.has(rel.Entity2LogicalName.toLowerCase())
          ) {
            continue;
          }

          const entityA = rel.Entity1LogicalName.toLowerCase();
          const entityB = rel.Entity2LogicalName.toLowerCase();
          const orderedPair = [entityA, entityB].sort();
          const relationshipKey = `${orderedPair[0]}|${orderedPair[1]}|${rel.SchemaName.toLowerCase()}`;

          if (processedRelationships.has(relationshipKey)) {
            continue;
          }
          processedRelationships.add(relationshipKey);

          const leftEntity = entityNameMap.get(orderedPair[0]) || this.sanitizeEntityName(orderedPair[0]);
          const rightEntity = entityNameMap.get(orderedPair[1]) || this.sanitizeEntityName(orderedPair[1]);
          relationshipLines.push(`    ${leftEntity} "*" --> "*" ${rightEntity} : ${this.sanitizeRelationshipLabel(rel.SchemaName)}`);
        }
      }
    }

    relationshipLines.sort((a, b) => a.localeCompare(b));

    return {
      lines: relationshipLines,
      count: relationshipLines.length,
    };
  }

  /**
   * Build class members (up to 10 columns) for an entity.
   * Always includes primary key and marks it explicitly.
   */
  private getEntityColumnLines(entityBlueprint: EntityBlueprint): string[] {
    const entity = entityBlueprint.entity;
    const primaryId = (entity.PrimaryIdAttribute || '').toLowerCase();
    const attributes = entity.Attributes || [];
    const attributeByName = new Map(attributes.map(attr => [attr.LogicalName.toLowerCase(), attr]));
    const selected = new Set<string>();
    const lines: string[] = [];

    const primaryIdAttribute = attributeByName.get(primaryId);
    const primaryIdType = this.getMermaidFieldType(primaryIdAttribute?.AttributeType || 'Uniqueidentifier');
    if (primaryId) {
      selected.add(primaryId);
      lines.push(`+${primaryIdType} ${primaryId} <<PK>>`);
    }

    const priorityNames = [
      entity.PrimaryNameAttribute?.toLowerCase() || '',
    ].filter(Boolean);

    for (const attributeName of priorityNames) {
      if (selected.has(attributeName)) continue;
      const attribute = attributeByName.get(attributeName);
      if (!attribute) continue;
      lines.push(`+${this.getMermaidFieldType(attribute.AttributeType)} ${attribute.LogicalName.toLowerCase()}`);
      selected.add(attributeName);
      if (lines.length >= 10) return lines;
    }

    const remaining = attributes
      .filter(attr => !selected.has(attr.LogicalName.toLowerCase()))
      .sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));

    for (const attribute of remaining) {
      lines.push(`+${this.getMermaidFieldType(attribute.AttributeType)} ${attribute.LogicalName.toLowerCase()}`);
      selected.add(attribute.LogicalName.toLowerCase());
      if (lines.length >= 10) break;
    }

    return lines;
  }

  /**
   * Normalise Dataverse types for Mermaid field rendering.
   */
  private getMermaidFieldType(attributeType: string): string {
    const normalized = (attributeType || '').toLowerCase();
    switch (normalized) {
      case 'uniqueidentifier':
      case 'guid':
        return 'guid';
      case 'string':
      case 'memo':
        return 'string';
      case 'integer':
      case 'bigint':
      case 'int':
        return 'int';
      case 'double':
      case 'decimal':
      case 'money':
        return 'decimal';
      case 'boolean':
      case 'bit':
        return 'bool';
      case 'datetime':
        return 'datetime';
      case 'lookup':
      case 'owner':
      case 'customer':
        return 'lookup';
      case 'picklist':
      case 'state':
      case 'status':
        return 'option';
      default:
        return normalized || 'string';
    }
  }

  /**
   * Sanitise relationship label text for Mermaid edge labels.
   */
  private sanitizeRelationshipLabel(schemaName: string): string {
    return (schemaName || 'relationship').replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Generate legend mapping publishers to colors
   */
  private generateLegend(
    publisherMap: Map<string, PublisherInfo>
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
    _publisherMap: Map<string, PublisherInfo>
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
    return this.collectRelationshipLines(entities).count;
  }
}
