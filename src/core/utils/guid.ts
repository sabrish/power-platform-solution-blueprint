/**
 * Normalises a Dataverse GUID: lowercase + strip surrounding braces.
 * Use this everywhere instead of inline `.toLowerCase().replace(/[{}]/g, '')`.
 */
export function normalizeGuid(guid: string): string {
  return guid.toLowerCase().replace(/[{}]/g, '');
}

export function normalizeBatch(ids: string[]): string[] {
  return ids.map(normalizeGuid);
}
