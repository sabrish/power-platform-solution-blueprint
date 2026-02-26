# Established Patterns

<!-- Stable patterns promoted from project documentation and coding standards. -->
<!-- These are proven, stable patterns. Agents must follow them without deviation. -->

---

## PATTERN-001 — Card-Row Expandable List (Component Browser)

**Source:** CLAUDE.md, UI_PATTERNS.md, FlowsList.tsx, PluginsList.tsx
**Applies to:** All agents, especially Developer

Every list in the Component Browser MUST use the card-row expandable pattern. DataGrid is forbidden for new lists.

### Required Structure

```tsx
const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  row: {
    display: 'grid',
    // First col: 24px chevron. Second col: minmax(200px, 2fr) name. Rest: auto
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, boxShadow: tokens.shadow4 },
  },
  rowExpanded: { backgroundColor: tokens.colorBrandBackground2 },
  chevron: { display: 'flex', alignItems: 'center', color: tokens.colorNeutralForeground3 },
  nameColumn: {
    display: 'flex', flexDirection: 'column', gap: '2px',
    minWidth: 0,  // REQUIRED — enables text truncation
    wordBreak: 'break-word',
  },
  codeText: { fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',       // REQUIRED — seamless attachment
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',       // REQUIRED — seamless attachment
  },
});
```

### Rules
1. Self-contained — no `onSelect` prop, no navigation. Detail expands inline below the row.
2. `makeStyles` only — all styles via design tokens, no inline style objects except one-off overrides.
3. First grid column is always `24px` (chevron), second is always `minmax(200px, 2fr)` (name column).
4. `nameColumn` always has `minWidth: 0` to allow truncation.
5. All long text uses `TruncatedText` component — never raw text in grid cells.
6. Expanded detail has `borderTop: 'none'` and `marginTop: '-4px'` to attach seamlessly.
7. Empty state: full centred panel with icon, heading, description — never a plain string.
8. ResultsDashboard renders `<MyList items={result.items} />` directly — no surrounding conditional or back button.

### Checklist
- [ ] Uses makeStyles + card-row grid (NOT DataGrid)
- [ ] First grid column 24px chevron, second minmax(200px, 2fr) name
- [ ] nameColumn has minWidth: 0
- [ ] All long text uses TruncatedText
- [ ] Expanded detail: borderTop none, marginTop -4px
- [ ] Self-contained — no onSelect / navigation prop
- [ ] Empty state has icon + heading + description

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
// Rule 1: OData filters — raw GUID, no quotes, no braces
const cleanGuid = guidValue.replace(/[{}]/g, '');
const filter = `id eq ${cleanGuid}`;           // correct
// const filter = `id eq '${guidValue}'`;      // WRONG — quotes
// const filter = `id eq {${guidValue}}`;      // WRONG — braces

// Rule 2: Normalize for comparison — lowercase, no braces
function normalizeGuid(guid: string): string {
  return guid.toLowerCase().replace(/[{}]/g, '');
}

// Rule 3: Store normalized GUIDs
const objectId = component.objectid.toLowerCase().replace(/[{}]/g, '');
inventory.pluginIds.push(objectId);  // normalized on storage
```

**Why it matters:** Dataverse returns GUIDs with braces `{guid}`. OData needs them raw. Comparisons need both sides normalized. Missing any step causes silent failures.

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

## PATTERN-007 — Static Imports for Reporters

**Source:** decisions.md, CHANGELOG v0.7.2
**Applies to:** Developer

All reporters and the ZipPackager must use static imports. Dynamic `import()` creates chunks unreachable under `pptb-webview://`.

```typescript
// CORRECT — static import
import { MarkdownReporter } from './reporters/MarkdownReporter';
import { HtmlReporter } from './reporters/HtmlReporter';
import { ZipPackager } from './reporters/ZipPackager';

// WRONG — dynamic import (breaks PPTB Desktop)
const { MarkdownReporter } = await import('./reporters/MarkdownReporter');
```

---

## PATTERN-008 — Consistent Checkbox Language ("Include" Pattern)

**Source:** CLAUDE.md, CHANGELOG v0.5.3
**Applies to:** Developer (UI)

All checkboxes use "Include" phrasing, never "Exclude". Internal logic can invert if needed.

```typescript
// UI state — positive naming
const [includeSystem, setIncludeSystem] = useState(true);
const [includeSystemFields, setIncludeSystemFields] = useState(false);

// Defaults: Include system entities ON, Include system fields OFF

// Convert for internal/backward compat if needed
const scope = {
  includeSystem,
  excludeSystemFields: !includeSystemFields,  // invert internally
};
```

---

## PATTERN-009 — Context-Aware Progress Messages

**Source:** CLAUDE.md, CHANGELOG v0.5.3
**Applies to:** Developer

Progress messages show the type of component being processed, not just a generic "entities".

```typescript
const getComponentLabel = (phase: ProgressPhase): string => {
  switch (phase) {
    case 'schema': return 'entities';
    case 'plugins': return 'plugins';
    case 'flows': return 'flows';
    case 'business-rules': return 'business rules';
    default: return 'items';
  }
};
// Produces: "5 of 20 plugins processed" (not "5 of 20 entities processed")
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
2. End with `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
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

## PATTERN-013 — Text Display: Wrap, Don't Truncate

**Source:** UI_PATTERNS.md
**Applies to:** Developer (UI)

Long text in list rows wraps; it does not truncate with ellipsis. Use `TruncatedText` for grid cells (which handles the word-break approach). Key CSS values:

```typescript
// Column containing long text
nameColumn: {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,               // enables wrapping
  wordBreak: 'break-word',
}

// Grid rows with wrapping text
row: {
  alignItems: 'start',       // not 'center' — multi-line content needs top alignment
  gridTemplateColumns: '24px minmax(200px, 2fr) auto auto',
}
```

For detail panels: `minWidth: 0`, `wordBreak: 'break-word'`, `overflowWrap: 'anywhere'`.

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
