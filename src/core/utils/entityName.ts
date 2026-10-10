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

/** Minimal entity shape needed to build an {@link EntityNameResolver}. */
interface EntityNameSource {
  LogicalName: string;
  EntitySetName?: string | null;
}

/**
 * Compares entity references that may be logical names or entity set names.
 * Build one per analysis run with {@link createEntityNameResolver}.
 */
export interface EntityNameResolver {
  /**
   * Lower-cases and trims a name. When it matches an in-scope logical name or
   * entity set name, returns the in-scope logical name. Unknown names are
   * returned lower-cased and trimmed, never guessed.
   */
  resolve(name: string): string;
  /**
   * True when `source` (a logical name) and `target` (a logical name or an
   * entity set name) refer to the same entity.
   */
  isSameEntity(source: string, target: string): boolean;
}

/**
 * Best-effort singular-to-plural conversion following the Dataverse entity set
 * naming convention (account -> accounts, opportunity -> opportunities,
 * address -> addresses). Only used when neither name is in scope.
 */
function pluralize(logicalName: string): string {
  if (/[^aeiou]y$/.test(logicalName)) return `${logicalName.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(logicalName)) return `${logicalName}es`;
  return `${logicalName}s`;
}

/**
 * Builds a resolver from the in-scope entities. Flow connector actions often
 * carry the entity set name (e.g. "accounts") where the analyzer works with
 * logical names (e.g. "account"); the resolver maps between the two without
 * mutating the input or the raw values.
 *
 * Rules:
 * - A name matching an in-scope logical name always resolves to that logical
 *   name, even if another entity uses the same string as its set name.
 * - A name matching an in-scope set name resolves to its logical name.
 * - If neither side of a comparison is known to the in-scope entities, a
 *   one-directional pluralisation heuristic applies: the source is pluralised
 *   and compared to the target. It is never applied in reverse, and never when
 *   either side is in scope.
 */
export function createEntityNameResolver(
  entities: ReadonlyArray<EntityNameSource>
): EntityNameResolver {
  const logicalNames = new Set<string>();
  const logicalBySetName = new Map<string, string>();

  for (const { LogicalName } of entities) {
    logicalNames.add(LogicalName.trim().toLowerCase());
  }
  for (const { LogicalName, EntitySetName } of entities) {
    const setName = EntitySetName?.trim().toLowerCase();
    if (!setName || logicalNames.has(setName) || logicalBySetName.has(setName)) continue;
    logicalBySetName.set(setName, LogicalName.trim().toLowerCase());
  }

  const normalize = (name: string): string => name.trim().toLowerCase();
  const isKnown = (name: string): boolean =>
    logicalNames.has(name) || logicalBySetName.has(name);
  const resolve = (name: string): string => {
    const key = normalize(name);
    return logicalBySetName.get(key) ?? key;
  };

  return {
    resolve,
    isSameEntity(source: string, target: string): boolean {
      const sourceKey = normalize(source);
      const targetKey = normalize(target);
      if (!sourceKey || !targetKey) return false;
      if (resolve(sourceKey) === resolve(targetKey)) return true;
      if (isKnown(sourceKey) || isKnown(targetKey)) return false;
      return pluralize(sourceKey) === targetKey;
    },
  };
}
