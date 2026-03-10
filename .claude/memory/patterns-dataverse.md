# Established Patterns — Dataverse, API & Infrastructure

<!-- Agents: load this file for any task involving Dataverse API calls, -->
<!-- discovery, export, authentication, build tooling, or commits. -->
<!-- For UI patterns see: .claude/memory/patterns-ui.md -->

---

## PATTERN-002 — Batch OData Queries (Never Query in Loops)

**Source:** DATAVERSE_OPTIMIZATION_GUIDE.md, CLAUDE.md
**Applies to:** All agents

Never query Dataverse in a loop. Always batch with OR filters, then group in memory.

### Standard Batch Pattern
```typescript
const batchSize = 20; // Standard (use 10 for privilege queries)
const allResults: SomeType[] = [];

for (let i = 0; i < ids.length; i += batchSize) {
  const batch = ids.slice(i, i + batchSize);
  const filter = batch.map(id => {
    const cleanId = id.replace(/[{}]/g, '');  // normalize GUID
    return `fieldid eq ${cleanId}`;
  }).join(' or ');
  const result = await client.queryData(`table?$select=f1,f2&$filter=${filter}`);
  allResults.push(...result.value);
}
```

### Group-in-Memory Pattern (one-to-many)
```typescript
// Fetch all in one batch query
const allItems = await batchFetch(ids);

// Group in memory by parent ID
const grouped = new Map<string, Item[]>();
for (const item of allItems) {
  const parentId = normalizeGuid(item._parentid_value);
  if (!grouped.has(parentId)) grouped.set(parentId, []);
  grouped.get(parentId)!.push(item);
}

// Use grouped data without additional queries
for (const parent of parents) {
  parent.children = grouped.get(normalizeGuid(parent.id)) ?? [];
}
```

### Anti-Patterns (Never Do)
```typescript
// NEVER — N+1 queries
for (const id of ids) {
  const result = await client.queryData(`table?$filter=id eq ${id}`);
}

// NEVER — querying inside map/filter
const enriched = await Promise.all(
  items.map(async item => ({
    ...item,
    details: await client.queryData(`details?$filter=itemid eq ${item.id}`)
  }))
);
```

### Batch Size Guidelines
- **Standard:** `batchSize = 20` for most queries
- **Conservative:** `batchSize = 10` for security role privilege queries (long field paths)
- **Rationale:** GUIDs are 36 chars; 20 GUIDs ≈ 1.5KB in URL; prevents HTTP 414/400

---

## PATTERN-003 — GUID Handling (Three Rules)

**Source:** DATAVERSE_OPTIMIZATION_GUIDE.md, CLAUDE.md
**Applies to:** All agents
**Severity if violated:** Blocker (silent failures, 0 results returned)

```typescript
// Rule 1: OData filters — raw GUID, no quotes, no braces (for primary key / regular ID fields)
const cleanGuid = guidValue.replace(/[{}]/g, '');
const filter = `id eq ${cleanGuid}`;           // correct
// const filter = `id eq '${guidValue}'`;      // WRONG — quotes
// const filter = `id eq {${guidValue}}`;      // WRONG — braces

// EXCEPTION: _solutionid_value lookup field on solutioncomponents requires
// braces AND single quotes. Raw GUID format returns 0 results silently.
// This is a Dataverse-specific quirk for this particular field.
const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
const filter = `_solutionid_value eq '${guidWithBraces}'`;   // CORRECT for this field only

// Rule 2: Normalize for comparison — lowercase, no braces
function normalizeGuid(guid: string): string {
  return guid.toLowerCase().replace(/[{}]/g, '');
}

// Rule 3: Store normalized GUIDs
const objectId = component.objectid.toLowerCase().replace(/[{}]/g, '');
inventory.pluginIds.push(objectId);  // normalized on storage
```

**Why it matters:** Dataverse returns GUIDs with braces `{guid}`. OData needs them raw for primary key fields. Comparisons need both sides normalized. The `_solutionid_value` field on `solutioncomponents` is an exception — it requires braces+quotes; changing it to raw GUID causes silent 0 results. Verified in production 2026-03-10.

---

## PATTERN-004 — Metadata API: Fetch All + Filter in Memory

**Source:** CLAUDE.md, decisions.md
**Applies to:** All agents
**Severity if violated:** Blocker (query fails with "query parameter not supported")

The `EntityDefinitions` metadata endpoint does NOT support `startswith()`, `orderBy`, or complex filters.

```typescript
// CORRECT — basic equality only, filter/sort in memory
const result = await client.queryMetadata('EntityDefinitions', {
  select: ['LogicalName', 'SchemaName', 'DisplayName'],
  filter: 'IsCustomEntity eq true',  // basic equality only
});
const filtered = result.value.filter(e => e.LogicalName.startsWith('prefix_'));
filtered.sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));

// WRONG — will fail with API error
const result = await client.queryMetadata('EntityDefinitions', {
  filter: `startswith(LogicalName, 'prefix_')`,  // NOT SUPPORTED
  orderBy: ['LogicalName'],                       // NOT SUPPORTED
});
```

---

## PATTERN-005 — PPTB API Usage

**Source:** CLAUDE.md, decisions.md
**Applies to:** All agents

```typescript
// Data access — always window.dataverseAPI
await window.dataverseAPI.queryData('publishers?$select=publisherid,friendlyname&$filter=isreadonly eq false');

// Tool context — always async await
const toolContext = await window.toolboxAPI.getToolContext();
const environmentUrl = toolContext.connectionUrl;

// NEVER use these (they don't exist or are wrong)
window.toolboxAPI.dataverse.queryData(...)  // OLD, wrong structure
window.executeDataverseRequest(...)          // DOES NOT EXIST
window.toolboxAPI.getToolContext()           // WRONG — must be awaited
```

---

## PATTERN-006 — Publisher Scope Converts to Solution Scope

**Source:** CLAUDE.md, decisions.md
**Applies to:** Architect, Developer

Publisher scope ALWAYS resolves to solution IDs at the UI layer before passing to core logic.

```typescript
// UI layer (ScopeSelector.tsx)
const solutionIds = publisherScopeMode === 'all-solutions'
  ? filteredSolutions.map(s => s.solutionid)
  : selectedSolutionIds;

// Conversion layer: publisher scope becomes solution scope
if (scope.type === 'publisher') {
  return { type: 'solution', solutionIds: scope.solutionIds, ... };
}
```

Never create separate publisher-specific query methods in discovery classes.

---

## PATTERN-007 — Static Imports Only in BlueprintGenerator (Reporters and Discovery Classes)

**Source:** decisions.md, CHANGELOG v0.7.2
**Applies to:** Developer

All imports in `BlueprintGenerator.ts` — reporters, ZipPackager, and discovery classes — must be static. Dynamic `import()` creates chunks unreachable under `pptb-webview://`. This applies to the entire file, not just reporters.

```typescript
// CORRECT — static import
import { MarkdownReporter } from './reporters/MarkdownReporter';
import { HtmlReporter } from './reporters/HtmlReporter';
import { ZipPackager } from './reporters/ZipPackager';
import { PluginDiscovery } from './discovery/PluginDiscovery';
import { FlowDiscovery } from './discovery/FlowDiscovery';

// WRONG — dynamic import (breaks PPTB Desktop)
const { MarkdownReporter } = await import('./reporters/MarkdownReporter');
const { PluginDiscovery } = await import('./discovery/PluginDiscovery');
```

---

## PATTERN-010 — Selective $select Always

**Source:** DATAVERSE_OPTIMIZATION_GUIDE.md
**Applies to:** All agents

Never query without `$select`. Always request only the fields you need.

```typescript
// CORRECT
await window.dataverseAPI.queryData('entities?$select=entityid,logicalname,displayname');

// WRONG — gets all fields
await window.dataverseAPI.queryData('entities');
```

---

## PATTERN-011 — Conventional Commits + Co-Authored-By

**Source:** CLAUDE.md, CONTRIBUTING.md
**Applies to:** All agents (especially Orchestrator and Developer when committing)

Every commit MUST:
1. Use Conventional Commits format: `<type>[optional scope]: <description>`
2. End with `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
3. Be a separate commit per logical change — never batch unrelated changes

**Types:** feat, fix, docs, style, refactor, perf, test, chore, build, ci, revert

**Scopes:** ui, core, dataverse, discovery, export, scope-selector, blueprint, deps

**Commit workflow:**
1. `git status` — identify changed files
2. Group into logical units
3. `git add <specific files>` per group (never `git add -A` blindly)
4. `git commit -m "..."` with trailer

---

## PATTERN-012 — Error Handling: Continue on Entity-Level Failures

**Source:** docs/architecture.md
**Applies to:** Developer

Blueprint generation must not abort on a single entity failure. Catch at entity level, log, continue.

```typescript
for (const entity of entities) {
  try {
    entity.plugins = await this.getPlugins(entity.id);
  } catch (error) {
    console.error(`Failed to get plugins for ${entity.LogicalName}`, error);
    entity.plugins = [];
    errors.push({ entity: entity.LogicalName, phase: 'plugin-discovery', error });
  }
}
```

---

## PATTERN-014 — COMPONENT_TYPES_REFERENCE.md Must Be Checked First

**Source:** CLAUDE.md
**Applies to:** All agents

Before implementing any new component discovery, always check `COMPONENT_TYPES_REFERENCE.md` for the correct component type integer value. Never guess component type codes.

Also verify against official Microsoft documentation:
- https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/solutioncomponent

---

## PATTERN-015 — Full window.dataverseAPI Method Reference

**Source:** CLAUDE.md (pre-refactor), @pptb/types v1.0.19+
**Applies to:** All agents
**See also:** PATTERN-005 for the core usage pattern

### Query methods
```typescript
window.dataverseAPI.queryData(odataQuery: string, connectionTarget?: 'primary' | 'secondary')
window.dataverseAPI.fetchXmlQuery(fetchXml: string, connectionTarget?: 'primary' | 'secondary')
```

### CRUD
```typescript
window.dataverseAPI.create(entityName, record, connectionTarget?)
window.dataverseAPI.retrieve(entityLogicalName, id, columns?, connectionTarget?)
window.dataverseAPI.update(entityLogicalName, id, record, connectionTarget?)
window.dataverseAPI.delete(entityLogicalName, id, connectionTarget?)
window.dataverseAPI.createMultiple(entityLogicalName, records, connectionTarget?)
window.dataverseAPI.updateMultiple(entityLogicalName, records, connectionTarget?)
```

### Metadata
```typescript
window.dataverseAPI.getEntityMetadata(entityLogicalName, searchByLogicalName?, selectColumns?, connectionTarget?)
window.dataverseAPI.getAllEntitiesMetadata(selectColumns?, connectionTarget?)
window.dataverseAPI.getSolutions(selectColumns?, connectionTarget?)
window.dataverseAPI.publishCustomizations(tableLogicalName?, connectionTarget?)
```

### Helper
```typescript
window.dataverseAPI.buildLabel(text, languageCode?)  // Creates properly formatted label objects
```

### Connection targets
- `connectionTarget` defaults to `'primary'`
- Use `'secondary'` for multi-connection scenarios
- To enable multi-connection, add to `package.json`:
  ```json
  "features": { "multiConnection": "required" | "optional" }
  ```

---

## PATTERN-017 — FetchLogger Must Be Wired Through All Batching Discovery Classes

**Source:** learnings.md [2026-03-08]
**Applies to:** Developer, Reviewer

Every discovery class that calls `withAdaptiveBatch` must accept a `FetchLogger` in its constructor and pass it to every `withAdaptiveBatch` call. `BlueprintGenerator` initialises the logger at the top of `generate()` and must pass `this.logger` to every qualifying discovery class constructor.

### Required constructor signature
```typescript
constructor(
  private client: PptbDataverseClient,
  private onProgress: ProgressCallback,
  private logger: FetchLogger,
) {}
```

### Required withAdaptiveBatch call shape
```typescript
await withAdaptiveBatch(ids, async (batch) => {
  // ... query logic ...
}, {
  step: 'descriptive-step-name',
  entitySet: 'logicalname_of_table',
  logger: this.logger,
  getBatchLabel: (id) => labelMap.get(id),  // omit on first pass; provide on second pass
});
```

### Exempt classes (single non-batched queries only)
PublisherDiscovery, SolutionDiscovery, EntityDiscovery, SchemaDiscovery.

### BlueprintGenerator wiring
```typescript
this.logger = new FetchLogger();
const plugins = new PluginDiscovery(this.client, onProgress, this.logger);
const flows   = new FlowDiscovery(this.client, onProgress, this.logger);
// ... all batching discovery classes ...
```

---

## PATTERN-022 — Two-Pass Discovery: Pass 2 Silent, Snap to 100% After Completion

**Source:** learnings.md [2026-03-09]
**Applies to:** Developer, Reviewer
**Confirmed in:** WebResourceDiscovery.ts, FormDiscovery.ts

When a discovery class makes two passes over item sets that may differ in size (e.g. Pass 1: entity names → IDs, Pass 2: IDs → content/XML), do NOT report progress from Pass 2 using Pass 1's total as the denominator. This produces "189%" style overflow.

### Required pattern

```typescript
const N = items.length; // Pass 1 total — owns all progress

// Pass 1: reports progress against N
await withAdaptiveBatch(items, async (batch) => {
  // ... fetch metadata ...
}, {
  onProgress: (done) => this.onProgress?.(done, N),
  // ...
});

// Pass 2: SILENT — no onProgress
await withAdaptiveBatch(secondPassIds, async (batch) => {
  // ... fetch content/XML ...
}, {
  // NO onProgress here
  step: '...', entitySet: '...', logger: this.logger,
});

// Snap to 100% after Pass 2 finishes
this.onProgress?.(N, N);
```

### Diagnosis
If the UI shows ">100%" (e.g. "276 of 146 items processed (189%)"), the relevant discovery class is calling `onProgress` in Pass 2 with a denominator derived from Pass 1's item count.

---

## PATTERN-016 — Official Documentation Reference URLs

**Source:** CLAUDE.md (pre-refactor)
**Applies to:** All agents — check these before implementing any Dataverse feature

### PPTB Desktop API
- https://docs.powerplatformtoolbox.com/tool-development/api-reference

### Microsoft Dataverse
- **Solution Component Types:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/solutioncomponent
- **SDK Message Processing Step:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/sdkmessageprocessingstep
- **SDK Message Processing Step Image:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/sdkmessageprocessingstepimage
- **Workflow Table:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/workflow
- **Web API Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/

**Rule:** Never guess component type codes or API field names. Check these docs first.

---

## PATTERN-023 — Two-Pass Discovery Progress Reporting

**Source:** discovery classes (WebResourceDiscovery, FormDiscovery, and others)
**Applies to:** Developer, Reviewer
**See also:** PATTERN-022 for two-pass discovery architecture.

**Context:** Discovery classes that do a first pass (list IDs) and a second pass (fetch details)
must split progress reporting 50/50 so the progress bar advances smoothly across both passes.

**Rule:**
- Pass 1 reports progress as `Math.floor(done / 2)` out of `total`
- Pass 2 reports progress as `Math.floor(total / 2) + Math.floor(done / 2)` out of `total`
- The `onProgress` callback always receives `(current: number, total: number)` — never a float

```typescript
// Pass 1: fetch IDs
for (let i = 0; i < ids.length; i += batchSize) {
  const batch = ids.slice(i, i + batchSize);
  // ... fetch ...
  onProgress?.(Math.floor((i + batch.length) / 2), ids.length);
}

// Pass 2: fetch details
for (let i = 0; i < ids.length; i += batchSize) {
  const batch = ids.slice(i, i + batchSize);
  // ... fetch ...
  onProgress?.(Math.floor(ids.length / 2) + Math.floor((i + batch.length) / 2), ids.length);
}
```

**Anti-pattern:** Calling `onProgress?.(done, total)` only during one pass — causes the bar
to appear stuck at 50% or jump from 0% to 100%.

> **Note:** Use PATTERN-022 (Pass 2 silent, snap to 100%) when the two passes iterate over
> different-sized item sets. Use PATTERN-023 (50/50 split) when both passes iterate the same
> set and you want the bar to advance continuously across both passes.
