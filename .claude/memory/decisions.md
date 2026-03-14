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
- `docs/architecture.md` updated 2026-03-02 — flat structure, API layer, card-row, static imports all now current

---

## [2026-02-10] — Official PPTB API: window.dataverseAPI

**Status:** Accepted and implemented (since v0.5.1)
Use `window.dataverseAPI` for all Dataverse operations. `window.toolboxAPI.getToolContext()` (async — always await) for tool context. Forbidden: `window.toolboxAPI.dataverse.*` and `executeDataverseRequest()` (neither exists). **Technical spec:** PATTERN-005 in patterns-dataverse.md.

---

## [2026-02-10] — PptbDataverseClient Constructor

**Status:** Accepted and implemented (since v0.5.1)
Accepts `DataverseAPI.API` directly; environment URL from `toolContext.connectionUrl`. Matches `@pptb/types` package structure exactly. **Technical spec:** see PATTERN-005.

---

## [2026-02-11] — Publisher Scope Converts to Solution Scope

**Status:** Accepted and implemented (since v0.5.3)
Publisher scope always resolves to solution IDs at the UI layer before passing to core logic. No separate publisher-specific query methods in discovery classes. `getEntitiesByPublisher()` removed (saved 78 lines). **Technical spec:** PATTERN-006 in patterns-dataverse.md.

---

## [2026-02-11] — Metadata API: Fetch All + Filter in Memory

**Status:** Accepted and implemented
`EntityDefinitions` does not support `startswith()`, `orderBy`, or complex filters. Always fetch all custom entities and filter/sort in memory. **Technical spec:** PATTERN-004 in patterns-dataverse.md.

---

## [2026-02-11] — Batch Size = 20 (10 for privileges)

**Status:** Accepted and implemented
Standard batchSize = 20; privilege queries batchSize = 10 (longer field paths). Prevents HTTP 414/400. Tables requiring batching: plugin steps, images, workflows, web resources, custom APIs, security role privileges, forms, field permissions, connection references. **Technical spec:** PATTERN-002 in patterns-dataverse.md.

---

## [2026-02-11] — Static Imports for Reporters and ZipPackager

**Status:** Accepted and implemented (since v0.7.2)
All reporters and discovery classes in BlueprintGenerator must be statically imported. Dynamic `import()` creates chunks unreachable under `pptb-webview://`. **Technical spec:** PATTERN-007 in patterns-dataverse.md.

---

## [2026-02-11] — Vite Config: base: './'

**Status:** Accepted and implemented (since v0.5.1)

**Decision:** `vite.config.ts` must set `base: './'` so all asset paths are relative.

**Reason:** PPTB Desktop uses `pptb-webview://` protocol. Absolute paths fail; relative paths work.

---

## [2026-02-22] — No DataGrid for Component Browser Lists

**Status:** Accepted and implemented
Card-row accordion (PATTERN-001) required for all component browser lists. DataGrid causes column overflow and navigates away from the list. **Technical spec:** PATTERN-001 in patterns-ui.md, AUDIT-013.

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

## [2026-03-10] — canvasapptype === undefined treated as Standard Canvas App

**Status:** Accepted and implemented (v0.9.x)

**Decision:** In `AppDiscovery.getAppsAndPagesByIds`, when `canvasapptype` is absent from the Dataverse OData response, the record is classified as a standard Canvas App (type 0).

**Reason:** The `$select` includes `canvasapptype`. When a field is selected but missing from the response, Dataverse is omitting a null field (its standard OData behaviour). A null `canvasapptype` maps to type 0 (Standard Canvas App) per the Dataverse data model — the field only has three meaningful values: 0 (Standard), 1 (Component Library/skip), 2 (Custom Page). Any truly anomalous record would be surfaced during review of the canvas apps list in the UI.

**Risk accepted:** Component Library records that return null for `canvasapptype` in unusual environments could be misclassified. This is extremely low probability; Component Libraries always set `canvasapptype = 1`.

---

## [ongoing] — GUID Handling: Three Rules

**Status:** Non-negotiable, always apply

1. **OData filters:** Raw GUID, no quotes, no braces: `id eq a1b2c3d4-...`
   - **EXCEPTION — `_solutionid_value` on `solutioncomponents`:** requires braces + single quotes: `_solutionid_value eq '{guid}'`. Raw GUID format returns 0 results silently (verified 2026-03-10). Do NOT apply PATTERN-003 Rule 1 to this field.
2. **Comparisons:** Normalize — lowercase, no braces: `guid.toLowerCase().replace(/[{}]/g, '')`
3. **Storage:** Always store normalized GUIDs (lowercase, no braces)

**Why:** Dataverse returns GUIDs with braces. OData needs them without for most fields. The `_solutionid_value` exception is a confirmed Dataverse quirk — changing it causes production failures.

---

## [2026-03-13] — DRY/SOLID Are Non-Negotiable Design Principles

**Status:** Accepted
2026-03-13 audit found 87+ duplicate GUID normalisations, 80+ OData annotation reads, 100+ detail-row JSX pairs, 20+ expand/collapse state blocks. Shared utilities and hooks created to eliminate these. Never reimplement `normalizeGuid`, `extractOwnershipMetadata`, `resolveEntityName`, `buildOrFilter`, `useExpandable`. **Technical spec:** patterns-general.md (all sections).

---

## [2026-03-13] — Discovery Classes Must Implement IDiscoverer<T> Interface

**Status:** Accepted and implemented
All ID-based discovery classes implement `IDiscoverer<T>` with `discoverByIds(ids: string[]): Promise<T[]>`. Enables generic orchestration in processors; required for LSP compliance. 11 implementing classes. New discovery classes must implement this interface. **Technical spec:** patterns-general.md, DISCOVERY CLASSES section.

`discoverByIds()` is the standard entry point. Existing concrete method names (`getFlowsByIds`, etc.) are preserved for backward compatibility.

Processors in `src/core/generators/processors/` call `discoverByIds()` via the `IDiscoverer<T>` interface.

**Reason:** Required for S3 (Liskov Substitution) compliance and to enable generic orchestration. Do not add new discovery classes without implementing this interface.

---

## [2026-03-13] — Adding a New Component Type Must Not Require Editing All Reporters (Pending)

**Status:** Accepted — implementation pending

**Decision:** Adding a new component type currently requires editing `BlueprintGenerator`, `MarkdownReporter`, `JsonReporter`, `HtmlReporter`, `ZipPackager`, the UI tab list, and analyzers — a violation of the Open/Closed Principle. A reporter templating pattern must be introduced incrementally to isolate per-component-type formatting.

**Reason:** Audit identified this as S2 (Open/Closed) violation. Every new component type multiplies the edit surface.
