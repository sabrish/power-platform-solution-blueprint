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
