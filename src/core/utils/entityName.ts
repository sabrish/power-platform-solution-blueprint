/**
 * Normalises a raw Dataverse entity name value.
 * Returns null for: null, undefined, empty string, 'none' (any case), whitespace-only.
 * Use this everywhere instead of inline `entity && entity !== 'none'` guards.
 */
export function resolveEntityName(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'none') return null;
  return trimmed;
}

/**
 * Extracts the publisher prefix from a schema name (e.g. "new_Account" -> "new").
 * Returns an empty string when no prefix pattern is found.
 */
export function extractPublisherPrefix(schemaName: string): string {
  const match = schemaName.match(/^([a-z]+)_/i);
  return match ? match[1] : '';
}
