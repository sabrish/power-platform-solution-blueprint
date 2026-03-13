---
name: General Development Patterns (DRY/SOLID)
description: DRY and SOLID patterns codified from the 2026-03-13 full audit. Every agent must load this for any task that touches new or modified code.
type: reference
---

# General Development Patterns (DRY/SOLID)

<!-- Load this file for ANY task that writes or modifies code. -->
<!-- These are the results of the 2026-03-13 full codebase DRY/SOLID audit. -->

---

## SHARED UTILITIES — Always Use These

### GUID Normalisation (D1)

**Never write:** `id.toLowerCase().replace(/[{}]/g, '')`
**Always use:** `import { normalizeGuid, normalizeBatch } from '../utils/guid';`

Found 87+ raw occurrences across all discovery files. Single source of truth: `src/core/utils/guid.ts`.

---

### OData Annotation Reads (D4)

**Never write:** `record['_ownerid_value@OData.Community.Display.V1.FormattedValue'] ?? 'Unknown'`
**Always use:** `import { extractOwnershipMetadata } from '../utils/metadata';`
```typescript
const { owner, ownerId, modifiedBy } = extractOwnershipMetadata(record);
```
Found 80+ raw occurrences across all discovery files. Single source of truth: `src/core/utils/metadata.ts`.

---

### OData OR-Filter Building (D2)

**Never write:** `batch.map(id => \`customapiid eq ${id}\`).join(' or ')`
**Always use:** `import { buildOrFilter } from '../utils/odata';`

`buildOrFilter(batch, 'fieldname', { guids: true })` already existed and is the standard. Five discovery files were bypassing it.

---

### Entity Name Resolution (D17)

**Never write:** `entity && entity !== 'none' ? entity : null`
**Always use:** `import { resolveEntityName } from '../utils/entityName';`
```typescript
const entity = resolveEntityName(flow.entity) ?? resolveEntityName(flow.definition.triggerEntity);
```
Handles: `null`, `undefined`, `''`, `'none'`, `'NONE'`, whitespace-only.

---

## SHARED HOOKS — Always Use These

### Expand/Collapse State (D5)

**Never write:**
```typescript
const [expandedId, setExpandedId] = useState<string | null>(null);
const toggleExpand = useCallback((id: string) => {
  setExpandedId(prev => prev === id ? null : id);
}, []);
```
**Always use:** `import { useExpandable } from '../hooks/useExpandable';`
```typescript
const { expandedId, toggleExpand } = useExpandable();
```
Found 20+ identical blocks across all list components. Single source: `src/hooks/useExpandable.ts`.

---

### Filter/Search State (D6)

**Never write** custom filter set state management.
**Always use:** `import { useListFilter } from '../hooks/useListFilter';`

`useListFilter` handles: search input, debounce, filter set toggles, filtered results. PluginsList was bypassing this and needs to be migrated.

---

## PATTERNS TO AVOID DUPLICATING

### Display Name Fallback Chains (D3)

Found 60+ `x || y || z || 'fallback'` chains for display names. Future work: create `getDisplayName()` utility in `src/core/utils/display.ts`.

Until then, always use the same pattern: `displayName || schemaName || logicalName || 'Unknown'` — never invent new fallback orders.

---

### Enum Code-to-Name Mapping (D9)

Found 40+ switch statements mapping numeric Dataverse codes to string labels. Future work: extract to `src/core/utils/enums.ts`.

Until then, define code maps as `const` objects at the top of each file, not inside functions.

---

### Badge Color/Appearance Mapping (D8)

Found 25+ switch/ternary blocks mapping status strings to Badge color props. Future work: extract to `src/core/utils/badgeStyles.ts`.

Until then, always use `appearance="filled"` with `color` token — never hardcode hex colours.

---

### DetailRow JSX Pattern (D12)

Found 100+ repeated `<Text className={shared.detailLabel}>...</Text>` + `<Text className={shared.detailValue}>...</Text>` pairs.

Future work: create `<DetailRow label={} value={} />` component in `src/components/shared/`.

Until then, always use the shared `detailLabel` and `detailValue` classes from `useCardRowStyles`.

---

## SOLID PRINCIPLES

### S1 — Single Responsibility

Each function/method should do ONE thing. Discovery methods that currently mix: query + normalise + map + progress + error-handling should be broken into separate steps.

**Accepted violation:** Existing discovery classes are grandfathered. New discovery classes must separate mapping logic from query logic.

---

### S2 — Open/Closed

Adding a new component type must not require editing all reporters and UI tabs. Accepted decision: reporter templating pattern to be implemented. Until then, new component types are accepted as requiring multi-file edits — but minimise the surface.

---

### S3 — Liskov Substitution

All discovery classes must eventually implement `IDiscoverer<T>`. Do NOT add new discovery classes without implementing this interface. Accepted decision recorded in decisions.md.

---

### S4 — Interface Segregation

Do not force optional parameters onto classes that don't use them. If a discovery class doesn't need `FetchLogger`, don't include it in the constructor.

---

### S5 — Dependency Inversion

`BlueprintGenerator` directly instantiates all discovery classes. New discovery classes: follow the same pattern for now (grandfathered). Long-term: `DiscoveryFactory` injection pattern to be adopted.

---

## FILE ORGANISATION — One File, One Job

**Rule:** Each file should contain ONE logical unit. If a filename contains "and", it likely violates this rule.

**Examples:**
- One component per file — `PluginsList.tsx`, not `PluginsAndFlowsList.tsx`
- One hook per file — `useExpandable.ts`, not `useExpandableAndFilter.ts`
- Utilities grouped by domain in `utils/` folder — `guid.ts`, `odata.ts`, `metadata.ts`
- If a file exports more than one top-level function/component, those functions/components must be tightly related and used together

**Exception:** Standalone output artifacts (HTML exports, Markdown reports) may combine multiple sections into a single file — this is acceptable because the output itself is a single deliverable.

**Processors:** Component processors extracted to `src/core/generators/processors/` — one processor per component type. Each processor is a pure function that receives dependencies as parameters.

---

## DISCOVERY CLASSES — IDiscoverer<T> Interface

**Standard interface:** `src/core/discovery/IDiscoverer.ts`

All ID-based discovery classes implement:
```typescript
interface IDiscoverer<T> {
  discoverByIds(ids: string[]): Promise<T[]>;
}
```

**11 implementing classes:**
- FlowDiscovery, PluginDiscovery, BusinessRuleDiscovery, ClassicWorkflowDiscovery
- BusinessProcessFlowDiscovery, CustomAPIDiscovery, WebResourceDiscovery
- EnvironmentVariableDiscovery, ConnectionReferenceDiscovery, GlobalChoiceDiscovery, SecurityRoleDiscovery

**Usage in processors:** Discovery instances typed as `IDiscoverer<T>` where only `discoverByIds()` is needed. Concrete types used when additional methods are required (e.g. `SecurityRoleDiscovery.getRoleDetailsForRoles()`).

**New discovery classes:** Must implement `IDiscoverer<T>` if they accept an array of IDs and return an array of results.

---

## UNDERUSED EXISTING UTILITIES

These already exist and MUST be used — not reimplemented:

| Utility | Location | Use for |
|---------|----------|---------|
| `buildOrFilter()` | `src/core/utils/odata.ts` | All OData OR-filters on ID fields |
| `withAdaptiveBatch()` | `src/core/utils/` | All batched discovery queries |
| `useListFilter` | `src/hooks/useListFilter.ts` | All list component filter/search state |
| `useCardRowStyles` | `src/hooks/useCardRowStyles.ts` | All card-row list components |
| `componentIcons` | `src/components/componentIcons.ts` | All component/tab icon references |
| `EmptyState` | `src/components/EmptyState.tsx` | All empty list states |
| `IDiscoverer<T>` | `src/core/discovery/IDiscoverer.ts` | All new ID-based discovery classes |
