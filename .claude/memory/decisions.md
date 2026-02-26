# Architecture Decisions

<!-- All significant architecture decisions are logged here. -->
<!-- Agents must not re-debate accepted decisions. -->

---

## [2026-02-10] — Flat Structure (not monorepo)

**Status:** Accepted and implemented (since v0.5.1)

**Decision:** Repository uses a flat structure with all source at root level. The original monorepo with `packages/core` and `packages/pptb-tool` was dismantled.

**Reason:** PPTB Desktop tool development standards require flat structure. The monorepo layout caused `pptb-webview://` protocol incompatibilities.

**Impact:**
- All source lives under `src/core/` (business logic) and `src/components/` (React UI)
- Import paths use relative paths (`./core`, `../core`), never workspace package references (`@ppsb/core`)
- Single `package.json` at root
- `docs/architecture.md` still describes the old monorepo structure — it is out of date

---

## [2026-02-10] — Official PPTB API: window.dataverseAPI

**Status:** Accepted and implemented (since v0.5.1)

**Decision:** Use `window.dataverseAPI` for ALL Dataverse operations. Use `window.toolboxAPI.getToolContext()` (async) for tool context.

**Reason:** Official PPTB Desktop API structure as defined by `@pptb/types` v1.0.19+.

**Anti-pattern explicitly rejected:**
- `window.toolboxAPI.dataverse.queryData()` — old structure, do not use
- `executeDataverseRequest()` — does not exist

**Key API shape:**
```typescript
window.dataverseAPI.queryData(odataQuery, connectionTarget?)
window.dataverseAPI.fetchXmlQuery(fetchXml, connectionTarget?)
window.dataverseAPI.create / retrieve / update / delete / ...
await window.toolboxAPI.getToolContext()  // async — always await
```

---

## [2026-02-10] — PptbDataverseClient Constructor

**Status:** Accepted and implemented (since v0.5.1)

**Decision:** `PptbDataverseClient` accepts a `DataverseAPI.API` instance directly (not a nested toolbox structure). Environment URL comes from `toolContext.connectionUrl`.

**Why:** Matches official `@pptb/types` package structure exactly.

---

## [2026-02-11] — Publisher Scope Converts to Solution Scope

**Status:** Accepted and implemented (since v0.5.3)

**Decision:** Publisher scope always converts internally to a list of solution IDs and then uses the same code path as solution scope. No separate publisher-specific query methods.

**Reason:**
- "All solutions from publisher" → system provides filtered solution list → solution IDs
- "Specific solutions only" → user selects → solution IDs
- Both paths end with solution IDs; a single code path is simpler and avoids metadata API limitations (`startswith()` not supported on EntityDefinitions)

**What was removed:** `getEntitiesByPublisher()` method (reduced code by 78 lines)

**Implementation:**
```typescript
// In useBlueprint.ts or equivalent conversion layer
if (scope.type === 'publisher') {
  return {
    type: 'solution',
    solutionIds: scope.solutionIds,  // already resolved at UI layer
    includeSystem: scope.includeSystem,
    excludeSystemFields: scope.excludeSystemFields,
  };
}
```

---

## [2026-02-11] — Metadata API: Fetch All + Filter in Memory

**Status:** Accepted and implemented

**Decision:** The Dataverse metadata API (`EntityDefinitions`) does NOT support `startswith()`, `orderBy`, or complex filters. Always fetch all custom entities and filter in memory.

**Supported:** Basic equality filters (`IsCustomEntity eq true`), `$select`, `$expand`
**Not supported:** `startswith()`, `orderBy`, most OData functions

**Pattern:**
```typescript
// Fetch all custom entities
const result = await client.queryMetadata('EntityDefinitions', {
  select: ['LogicalName', 'SchemaName', 'DisplayName'],
  filter: 'IsCustomEntity eq true',
});
// Filter by prefix in memory
const filtered = result.value.filter(e => e.LogicalName.startsWith('prefix_'));
// Sort in memory
filtered.sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));
```

---

## [2026-02-11] — Batch Size = 20 (10 for privileges)

**Status:** Accepted and implemented

**Decision:** All OData OR-filter batch queries use `batchSize = 20`. Security role privilege queries use `batchSize = 10` due to longer field paths and higher URL length risk.

**Reason:** Prevents HTTP 414 (URL too long) and HTTP 400 errors. GUIDs are 36 characters; 20 GUIDs ≈ 1.5KB in URL.

**Tables that require batching:** plugin steps, plugin images, workflows, web resources, custom APIs, security role privileges, forms, field permissions, connection references.

---

## [2026-02-11] — Static Imports for Reporters and ZipPackager

**Status:** Accepted and implemented (since v0.7.2)

**Decision:** All reporters (`MarkdownReporter`, `JsonReporter`, `HtmlReporter`, `ZipPackager`) must be statically imported, never dynamically imported.

**Reason:** Dynamic `import()` calls create separate Vite chunks that are unreachable under the `pptb-webview://` protocol used by PPTB Desktop. Static imports bundle everything into the main chunk.

**Anti-pattern explicitly rejected:**
```typescript
// NEVER use dynamic imports for reporters
const { MarkdownReporter } = await import('./reporters/MarkdownReporter');
```

---

## [2026-02-11] — Vite Config: base: './'

**Status:** Accepted and implemented (since v0.5.1)

**Decision:** `vite.config.ts` must set `base: './'` so all asset paths are relative.

**Reason:** PPTB Desktop uses `pptb-webview://` protocol. Absolute paths fail; relative paths work.

---

## [2026-02-22] — No DataGrid for Component Browser Lists

**Status:** Accepted and implemented

**Decision:** Do NOT use Fluent UI `DataGrid` for component browser lists. All lists must use the card-row expandable pattern.

**Reason:** DataGrid causes column overflow and navigates away from the list, breaking the UX.

**Exception (legacy, do not replicate):** `ConnectionReferencesList.tsx` uses DataGrid.

**Canonical reference implementations:** `FlowsList.tsx`, `PluginsList.tsx`

---

## [2026-02-22] — ERD: Single Diagram, All Entities

**Status:** Accepted and implemented (since v0.7.1)

**Decision:** The ERD generates a single diagram containing all entities, color-coded by publisher. No per-publisher splitting, no top-N filtering.

**What was removed:**
- Top-15 most-connected-entities filter
- Per-publisher diagram splitting
- "50+ entities" warning banner

---

## [2026-02-23] — No State Management Library

**Status:** Accepted (architectural principle)

**Decision:** Use only React `useState` + props. No Redux, Zustand, or Context for component state.

**Reason:** Single parent component (App.tsx), linear flow (Scope → Generate → Results → Export), no complex shared state needed.

---

## [2026-02-26] — npm-shrinkwrap.json Must Use npm (not pnpm)

**Status:** Accepted and implemented (since v0.6.2)

**Decision:** `npm-shrinkwrap.json` must be regenerated using native `npm`, not `pnpm`.

**Reason:** pnpm-generated shrinkwrap creates `.pnpm` directory paths incompatible with npm install, causing "Cannot read properties of null (reading 'matches')" error in PPTB Desktop.

---

## [ongoing] — GUID Handling: Three Rules

**Status:** Non-negotiable, always apply

1. **OData filters:** Raw GUID, no quotes, no braces: `id eq a1b2c3d4-...`
2. **Comparisons:** Normalize — lowercase, no braces: `guid.toLowerCase().replace(/[{}]/g, '')`
3. **Storage:** Always store normalized GUIDs (lowercase, no braces)

**Why:** Dataverse returns GUIDs with braces. OData needs them without. Missing any step causes silent failures (0 results returned).
