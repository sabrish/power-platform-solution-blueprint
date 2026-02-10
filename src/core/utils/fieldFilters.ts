import type { AttributeMetadata } from '../types/blueprint.js';

/**
 * Common system fields that exist on most entities
 */
const SYSTEM_FIELDS = new Set([
  // Creation tracking
  'createdon',
  'createdby',
  'createdbyname',
  'createdbyyominame',
  'createdonbehalfby',
  'createdonbehalfbyname',
  'createdonbehalfbyyominame',

  // Modification tracking
  'modifiedon',
  'modifiedby',
  'modifiedbyname',
  'modifiedbyyominame',
  'modifiedonbehalfby',
  'modifiedonbehalfbyname',
  'modifiedonbehalfbyyominame',

  // Ownership
  'ownerid',
  'owneridname',
  'owneridtype',
  'owneridyominame',
  'owningbusinessunit',
  'owningbusinessunitname',
  'owninguser',
  'owningteam',

  // State/Status
  'statecode',
  'statuscode',

  // Import/Migration
  'importsequencenumber',
  'overriddencreatedon',

  // Timezone
  'timezoneruleversionnumber',
  'utcconversiontimezonecode',

  // Version
  'versionnumber',

  // Exchange
  'exchangerate',

  // Transaction Currency
  'transactioncurrencyid',
  'transactioncurrencyidname',
]);

/**
 * Filter out common system fields from attribute list
 * @param attributes Array of attribute metadata
 * @param exclude Whether to exclude system fields (default: true)
 * @returns Filtered array of attributes
 */
export function filterSystemFields(
  attributes: AttributeMetadata[],
  exclude: boolean = true
): AttributeMetadata[] {
  if (!exclude) {
    return attributes;
  }

  return attributes.filter((attr) => {
    const logicalName = attr.LogicalName?.toLowerCase() || '';
    return !SYSTEM_FIELDS.has(logicalName);
  });
}

/**
 * Check if a field is a system field
 * @param logicalName Field logical name
 * @returns True if it's a system field
 */
export function isSystemField(logicalName: string): boolean {
  return SYSTEM_FIELDS.has(logicalName.toLowerCase());
}
