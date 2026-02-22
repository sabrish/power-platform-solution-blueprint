/**
 * System entity and relationship filters
 * Shared utility to ensure consistent filtering across ERD, dbdiagram exports, and UI views
 */

/**
 * Common system entities that clutter diagrams and should be filtered
 */
const SYSTEM_ENTITY_NAMES = [
  'systemuser',
  'team',
  'businessunit',
  'organization',
  'transactioncurrency',
  'owner',
] as const;

/**
 * Set of system entities for efficient O(1) lookup
 * Typed as Set<string> to allow checking any string value
 */
const SYSTEM_ENTITIES_SET: Set<string> = new Set(SYSTEM_ENTITY_NAMES);

/**
 * Export readonly array for backward compatibility
 */
export const SYSTEM_ENTITIES = SYSTEM_ENTITY_NAMES;

/**
 * Check if an entity is a system entity that should be excluded
 */
export function isSystemEntity(entityLogicalName: string): boolean {
  const lowerName = entityLogicalName.toLowerCase();
  return SYSTEM_ENTITIES_SET.has(lowerName);
}

/**
 * Check if a relationship is a system relationship that should be filtered
 * System relationships like createdby, modifiedby, currency crowd diagrams and views
 */
export function isSystemRelationship(
  schemaName: string,
  referencingAttribute?: string,
  referencedEntity?: string,
  referencingEntity?: string
): boolean {
  const lowerSchemaName = schemaName.toLowerCase();
  const lowerAttribute = referencingAttribute?.toLowerCase() || '';
  const lowerReferencedEntity = referencedEntity?.toLowerCase() || '';
  const lowerReferencingEntity = referencingEntity?.toLowerCase() || '';

  // Filter if relationship involves a system entity (use Set for efficient lookup)
  if (SYSTEM_ENTITIES_SET.has(lowerReferencedEntity) || SYSTEM_ENTITIES_SET.has(lowerReferencingEntity)) {
    return true;
  }

  // Common system relationship patterns
  const systemPatterns = [
    'createdby',
    'modifiedby',
    'createdonbehalfby',
    'modifiedonbehalfby',
    'ownerid',
    'owninguser',
    'owningteam',
    'owningbusinessunit',
    'transactioncurrencyid',
    'transactioncurrency',
    '_transactioncurrency',
  ];

  // Check if schema name or attribute matches any system pattern
  return systemPatterns.some(pattern =>
    lowerSchemaName.includes(pattern) || lowerAttribute.includes(pattern)
  );
}
