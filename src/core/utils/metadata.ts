/**
 * Extracts owner and modifiedBy from a Dataverse OData record using
 * the standard FormattedValue annotation. Use this everywhere instead
 * of inline annotation reads.
 */
export function extractOwnershipMetadata(record: Record<string, unknown>): {
  owner: string;
  ownerId: string;
  modifiedBy: string;
} {
  return {
    owner: (record['_ownerid_value@OData.Community.Display.V1.FormattedValue'] as string) ?? 'Unknown',
    ownerId: (record['_ownerid_value'] as string) ?? '',
    modifiedBy: (record['_modifiedby_value@OData.Community.Display.V1.FormattedValue'] as string) ?? 'Unknown',
  };
}
