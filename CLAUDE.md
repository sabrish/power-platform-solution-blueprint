# Power Platform Solution Blueprint (PPSB) - Development Guide

## Project Overview

This is a flat-structure project for **Power Platform Solution Blueprint (PPSB)**, a documentation tool that runs inside PPTB Desktop.

**Tagline:** "Complete architectural blueprints for your Power Platform systems"

## Critical Documentation References

**⚠️ ALWAYS CHECK THESE FIRST - DO NOT GUESS!**

### Microsoft Dataverse Documentation
- **[Solution Component Types](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/solutioncomponent)** - Complete component type list
- **[SDK Message Processing Step](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/sdkmessageprocessingstep)** - Plugin step schema
- **[SDK Message Processing Step Image](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/sdkmessageprocessingstepimage)** - Plugin image schema
- **[Workflow Table](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/workflow)** - Workflow/flow schema
- **[Web API Reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/)** - OData query reference

**📚 Local Reference:** See `COMPONENT_TYPES_REFERENCE.md` for complete component type list

### PPTB Desktop API Reference

**IMPORTANT:** This project uses PPTB Desktop API. Official documentation: https://docs.powerplatformtoolbox.com/tool-development/api-reference

### API Structure

**IMPORTANT:** This project uses official `@pptb/types` package (v1.0.19+).

The PPTB API provides two separate global objects:

```typescript
// Toolbox API (getToolContext is async!)
window.toolboxAPI = {
  getToolContext: async function,  // ← Returns Promise<ToolboxAPI.ToolContext>
  connections: object,
  utils: object,
  fileSystem: object,
  terminal: object,
  events: object,
  settings: object
}

// Dataverse API (separate global)
window.dataverseAPI = {
  queryData: function,
  fetchXmlQuery: function,
  create: function,
  retrieve: function,
  update: function,
  delete: function,
  // ... other Dataverse methods
}
```

### Dataverse API Methods

**Use `window.dataverseAPI` for all Dataverse operations:**

#### Query Data
```typescript
window.dataverseAPI.queryData(odataQuery: string, connectionTarget?: 'primary' | 'secondary')
```
- Executes OData queries with `$select`, `$filter`, `$orderby`, `$expand`, etc.
- Example: `queryData('publishers?$select=publisherid,friendlyname&$filter=isreadonly eq false')`

#### FetchXML Queries
```typescript
window.dataverseAPI.fetchXmlQuery(fetchXml: string, connectionTarget?: 'primary' | 'secondary')
```

#### CRUD Operations
- `create(entityName, record, connectionTarget?)`
- `retrieve(entityLogicalName, id, columns?, connectionTarget?)`
- `update(entityLogicalName, id, record, connectionTarget?)`
- `delete(entityLogicalName, id, connectionTarget?)`
- `createMultiple(entityLogicalName, records, connectionTarget?)`
- `updateMultiple(entityLogicalName, records, connectionTarget?)`

#### Metadata Operations
- `getEntityMetadata(entityLogicalName, searchByLogicalName?, selectColumns?, connectionTarget?)`
- `getAllEntitiesMetadata(selectColumns?, connectionTarget?)`
- `getSolutions(selectColumns?, connectionTarget?)`
- `publishCustomizations(tableLogicalName?, connectionTarget?)`

#### Helper Methods
- `buildLabel(text, languageCode?)` - Creates properly formatted label objects

### Connection Targets

All Dataverse API methods accept an optional `connectionTarget` parameter:
- `'primary'` (default)
- `'secondary'`

To enable multi-connection support, add to `package.json`:
```json
"features": {
  "multiConnection": "required" | "optional"
}
```

### Metadata API Limitations

**⚠️ CRITICAL: The Dataverse metadata API (`EntityDefinitions`) has VERY limited query support!**

**NOT Supported:**
- ❌ `startswith()` function
- ❌ `orderBy` parameter
- ❌ Complex filters beyond basic equality
- ❌ Most OData query functions

**Supported:**
- ✅ Basic equality filters: `IsCustomEntity eq true`
- ✅ `$select` for specific fields
- ✅ `$expand` for navigation properties

**Pattern: Fetch All + Filter in Memory**
```typescript
// ✅ CORRECT - Metadata API pattern
const result = await client.queryMetadata<EntityMetadata>('EntityDefinitions', {
  select: ['LogicalName', 'SchemaName', 'DisplayName'],
  filter: 'IsCustomEntity eq true', // Basic equality only
  // NO orderBy - not supported
});

// Filter by prefix in memory
const filteredEntities = result.value.filter(entity =>
  entity.LogicalName.startsWith('prefix_')
);

// Sort in memory
filteredEntities.sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));

// ❌ WRONG - Will fail with "query parameter not supported"
const result = await client.queryMetadata<EntityMetadata>('EntityDefinitions', {
  filter: `startswith(LogicalName, 'prefix_')`, // NOT supported
  orderBy: ['LogicalName'], // NOT supported
});
```

**Key Insight:** Regular entity queries (via `queryData()`) support full OData, but metadata queries have strict limitations.

## Project Structure

```
power-platform-solution-blueprint/
├── src/
│   ├── core/                 # Core business logic (TypeScript)
│   │   ├── dataverse/        # PptbDataverseClient implementation
│   │   ├── discovery/        # Component discovery classes
│   │   ├── generators/       # Blueprint generation logic
│   │   ├── analyzers/        # Analysis engines
│   │   └── reporters/        # Export format generators
│   │
│   ├── components/           # React UI components
│   ├── hooks/                # React custom hooks
│   ├── utils/                # UI utilities
│   ├── types/                # TypeScript type definitions
│   ├── App.tsx               # Main UI component
│   └── main.tsx              # React entry point
│
├── docs/                     # Documentation
├── dist/                     # Build output
├── index.html                # PPTB tool entry point
├── package.json              # Project configuration
└── CLAUDE.md                 # This file
```

## Key Implementation Details

### PptbDataverseClient.ts
- Located: `src/core/dataverse/PptbDataverseClient.ts`
- Uses: `window.dataverseAPI.queryData()` (official PPTB Dataverse API)
- Accepts `DataverseAPI.API` instance in constructor
- Builds OData query strings from QueryOptions
- Returns QueryResult<T> with parsed response

### Type Definitions
- Official types from `@pptb/types` package (v1.0.19+)
- Custom types in: `src/types/`
- Always use official PPTB types for API integration

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm build           # Build all packages
pnpm dev             # Run dev server (for browser testing)
pnpm typecheck       # Type check all packages
```

## Commit Message Convention

**⚠️ CRITICAL — Claude MUST always do this without being asked:**
- **Create a separate commit for each logical change** (e.g. one commit per bug fix, one per feature). Never batch unrelated changes into a single commit.
- **Always use Conventional Commits format** for every commit message.
- **Always include the Co-Authored-By trailer** (see below).

Format: `<type>[optional scope]: <description>`

Common types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

Examples:
- `feat(ui): add dark mode support`
- `fix(ui): prevent table column overflow`
- `docs: add conventional commits guide`

**Always end every commit message with:**
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Commit workflow Claude must follow after completing any task:**
1. `git status` — identify which files changed
2. Group into logical units (one bug fix = one commit, one feature = one commit, docs = one commit)
3. `git add <specific files>` for each group — never `git add -A` blindly
4. `git commit -m "..."` with conventional commit message + Co-Authored-By trailer
5. Repeat for each logical group

📖 **See [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines**

## Testing in PPTB Desktop

1. Build the project: `pnpm build`
2. Load in PPTB Desktop from: `dist/index.html`
3. Tool display name: "Power Platform Solution Blueprint (PPSB)"

## Features

### Scope Selector (Current)
The app includes a professional scope selection screen with two main options:

#### 1. **By Publisher** - Multi-select publishers with solution filtering
   - Multi-select dropdown for publishers (stays open during selection)
   - Selected publishers shown as dismissible Tags
   - After selecting publishers, choose:
     - **"All solutions from selected publishers"** (default) - Documents all solutions
     - **"Specific solutions only"** - Shows filtered multi-select of solutions from chosen publishers
   - Solutions filtered by publisher prefix (uniquename starts with customizationprefix)

#### 2. **By Solution** (Default/Recommended) - Direct multi-select
   - Multi-select any solutions regardless of publisher
   - Dropdown stays open during selection, closes on click outside
   - Selected solutions shown as dismissible Tags

**Additional options:**
- **Include system-owned entities** - Checkbox to include Microsoft entities (Account, Contact, etc.)
- **Include system fields** - Checkbox to include common system fields (createdon, modifiedby, etc.)

**Scope Selector Features:**
- ✅ Loads publishers and solutions on mount
- ✅ Multi-select dropdowns stay open during selection (close on outside click)
- ✅ Shows loading states with spinner
- ✅ Handles errors with MessageBar and retry option
- ✅ Validates selections (Continue button disabled until valid selection)
- ✅ Uses Fluent UI v9 components throughout (Radio, Dropdown, Tag, Checkbox, Field)
- ✅ Displays selected scope in confirmation screen with all details
- ✅ Smart filtering: solutions filtered by publisher prefix when in Publisher mode

### Components Structure
- `src/components/ScopeSelector.tsx` - Main scope selection component
- `src/components/EntityList.tsx` - Searchable entity list with Fluent UI
- `src/hooks/useEntityDiscovery.ts` - Custom hook for fetching entities based on scope
- `src/types/scope.ts` - TypeScript types for scope selection (discriminated union)
- `src/App.tsx` - Main app flow: ScopeSelector → Entity List

### Entity Discovery (Current)
After scope selection, the app fetches and displays entities:

**Core Business Logic (`src/core/`):**
- `EntityDiscovery` class with two methods:
  - `getEntitiesBySolutions(solutionIds)` - Gets entities from solution components
  - `getAllEntities(includeSystem)` - Gets all entities with optional system filter
- **Note:** Publisher scope internally uses solution IDs (same path as solution scope)
- Uses `queryMetadata()` for EntityDefinitions endpoint
- Queries solution components to find entities in solutions

**UI Components (`src/components/`):**
- `useEntityDiscovery` hook - Fetches entities based on selected scope
- `EntityList` component:
  - Searchable list (filters by LogicalName or DisplayName)
  - Shows entity count and search results count
  - Click to select entity (logged to console)
  - Empty state handling
  - Sorted alphabetically by DisplayName

## Performance & Optimization

**CRITICAL:** See `DATAVERSE_OPTIMIZATION_GUIDE.md` for comprehensive performance patterns.

### Key Performance Rules

1. **NEVER query in loops** - Always batch queries with OR filters
2. **Pre-fetch and group** - Fetch all related data once, group in memory
3. **Use selective $select** - Only request fields you need
4. **Strategic $expand** - Fetch related data when always needed
5. **Track query counts** - Aim for < 50 queries per blueprint generation
6. **ALWAYS batch large queries** - Use `batchSize = 20` (or 10 for conservative cases) to prevent HTTP 414/400 errors

### CRITICAL: GUID Handling Rules

**⚠️ GUIDs cause silent failures if not handled correctly!**

**Rule 1: OData filters use raw GUIDs (no quotes, no braces)**
```typescript
// ✅ CORRECT - Raw GUID without quotes or braces
const cleanGuid = guidValue.replace(/[{}]/g, '');
const filter = `id eq ${cleanGuid}`;

// ❌ WRONG - With quotes
const filter = `id eq '${guidValue}'`;

// ❌ WRONG - With braces
const filter = `id eq {${guidValue}}`;
```

**Rule 2: Normalize GUIDs for comparison (remove braces, lowercase)**
```typescript
// ✅ CORRECT
private normalizeGuid(guid: string): string {
  return guid.toLowerCase().replace(/[{}]/g, '');
}
```

**Rule 3: Store normalized GUIDs consistently**
```typescript
// ✅ CORRECT - Always normalize when storing
const objectId = component.objectid.toLowerCase().replace(/[{}]/g, '');
inventory.pluginIds.push(objectId);
```

**Why This Matters:**
- Dataverse returns GUIDs with braces: `{guid-here}`
- OData queries need raw GUIDs: `guid-here` (no quotes, no braces)
- Comparisons need normalization: `guid-here` (no braces, lowercase)
- Missing any of these = silent failures and 0 results

### CRITICAL: HTTP 414/400 "Request Too Long" Prevention

**⚠️ Large OData queries with OR filters can exceed URL/header limits!**

**Rule 1: Always batch large queries**
```typescript
// ✅ CORRECT - Batch queries
const batchSize = 20; // Standard for most cases
const allResults: any[] = [];

for (let i = 0; i < ids.length; i += batchSize) {
  const batch = ids.slice(i, i + batchSize);
  const filter = batch.map(id => {
    const cleanId = id.replace(/[{}]/g, '');
    return `fieldid eq ${cleanId}`;
  }).join(' or ');
  const result = await client.query(table, { select, filter });
  allResults.push(...result.value);
}

// ❌ WRONG - Single query with 100+ items
const filter = ids.map(id => `fieldid eq ${id}`).join(' or ');
```

**Rule 2: Use conservative batch sizes**
- **Standard:** `batchSize = 20` (for most queries)
- **Conservative:** `batchSize = 10` (for queries with long paths or many parameters)
- **GUIDs are 36 characters** - 20 GUIDs ≈ 1.5KB in URL

**Rule 3: Clean GUIDs before batching**
```typescript
// ✅ CORRECT - Clean each GUID
const filter = batch.map(id => {
  const cleanId = String(id).replace(/[{}]/g, '');
  return `privilegeid eq ${cleanId}`;
}).join(' or ');
```

**Common Failures:**
- Security role privileges: 500-1000+ privileges per role → Must batch
- Form queries: 100+ entities → Must batch
- Field permissions: 100+ entities → Must batch
- Workflow classification: 100+ workflows → Must batch

**URL Length Limits:**
- Typical server limit: 2,000-8,000 characters
- HTTP 414: URL too long
- HTTP 400: Request headers too long

### Implemented Optimizations

✅ **Solution Component Discovery** - Batched from N queries to 1 query
✅ **Plugin Image Fetching** - Batched from N queries to 1 query
✅ **Workflow Classification** - Single batch query with OR filters
✅ **Entity Metadata** - In-memory filtering when API doesn't support server filters
✅ **Attribute Filtering** - Only shows attributes actually in solution

### Before Adding New Queries

- [ ] Can this be combined with existing query?
- [ ] Am I querying in a loop? → Batch with OR filters
- [ ] Do I need all fields? → Use $select
- [ ] Is this one-to-many? → Pre-fetch and group
- [ ] **Are GUIDs in filters wrapped in single quotes?** ← CRITICAL!
- [ ] **Are GUIDs normalized for comparison (no braces, lowercase)?** ← CRITICAL!
- [ ] Tested with 50+ items?

**See DATAVERSE_OPTIMIZATION_GUIDE.md for detailed patterns and examples.**

## Architectural Patterns & Best Practices

### Publisher Scope Architecture

**Key Learning:** Publisher scope and solution scope should use the same code path.

**Why?** When users select "By Publisher," they ALWAYS end up with a list of solution IDs:
- **"All solutions from publisher"** → System provides filtered list of solutions
- **"Specific solutions"** → User selects specific solutions

**Implementation:**
```typescript
// UI Layer (ScopeSelector.tsx)
if (publisherScopeMode === 'all-solutions') {
  // Use filtered solutions from selected publishers
  solutionIds = filteredSolutions.map(s => s.solutionid);
} else {
  // Use user-selected solutions
  solutionIds = selectedSolutionIds;
}

// Conversion Layer (useBlueprint.ts)
if (scope.type === 'publisher') {
  // Convert to solution scope - same path!
  return {
    type: 'solution',
    solutionIds: scope.solutionIds,
    includeSystem: scope.includeSystem,
    excludeSystemFields: scope.excludeSystemFields,
  };
}
```

**Benefits:**
- ✅ Single code path = less code, fewer bugs
- ✅ Avoids metadata API limitations (no `startswith()` needed)
- ✅ Uses existing optimized solution component queries
- ✅ Reduced code by 78 lines in one refactoring

**Anti-pattern:** Creating separate query methods for publisher scope when solution IDs are already available.

### UX Consistency Patterns

**Pattern: Consistent Checkbox Language**

**Problem:** Mixing "Include" and "Exclude" patterns confuses users:
- ✅ "Include system-owned entities"
- ❌ "Exclude system fields"

**Solution:** Use consistent "Include" pattern:
- ✅ "Include system-owned entities"
- ✅ "Include system fields"

**Implementation:**
```typescript
// State uses positive naming
const [includeSystem, setIncludeSystem] = useState(true);
const [includeSystemFields, setIncludeSystemFields] = useState(false);

// Convert to internal format if needed
const scope = {
  includeSystem,
  excludeSystemFields: !includeSystemFields, // Invert for backward compatibility
};
```

### Progress Reporting Patterns

**Pattern: Context-Aware Progress Messages**

**Problem:** Generic progress messages don't communicate what's actually happening:
- ❌ "5 of 20 entities processed" (when processing plugins)

**Solution:** Dynamic messages based on current phase:
- ✅ "5 of 20 plugins processed"
- ✅ "10 of 50 flows processed"
- ✅ "3 of 15 business rules processed"

**Implementation:**
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

const componentLabel = getComponentLabel(progress.phase);
const message = `${progress.current} of ${progress.total} ${componentLabel} processed`;
```

### Component Browser List Pattern

**⚠️ CRITICAL: Every list in the Component Browser MUST use the card-row expandable pattern.**

The canonical reference implementations are `FlowsList.tsx` and `PluginsList.tsx`. All component browser lists (`ClassicWorkflowsList`, `CustomConnectorsList`, `EnvironmentVariablesList`, `BusinessProcessFlowsList`, etc.) must use this pattern. **Do NOT use Fluent UI `DataGrid` for component browser lists** — it causes column overflow and navigates away from the list.

**The only exception** is `ConnectionReferencesList.tsx` which uses DataGrid — but this is legacy and should not be replicated for new lists.

#### Card-Row Pattern (REQUIRED)

```tsx
// makeStyles — grid layout with explicit column sizes
const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  row: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(200px, 2fr) auto auto auto', // adjust cols as needed
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, boxShadow: tokens.shadow4 },
  },
  rowExpanded: { backgroundColor: tokens.colorBrandBackground2 },
  chevron: { display: 'flex', alignItems: 'center', color: tokens.colorNeutralForeground3 },
  nameColumn: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  codeText: { fontFamily: 'Consolas, Monaco, monospace', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  expandedDetails: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    borderRadius: `0 0 ${tokens.borderRadiusMedium} ${tokens.borderRadiusMedium}`,
    marginTop: '-4px',
  },
  // ... detailsGrid, detailItem, detailLabel, detailValue, section as needed
});

// Component — self-contained, NO onSelect prop, NO navigation
export function MyList({ items }: { items: MyItem[] }) {
  const styles = useStyles();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className={styles.container} style={{ marginTop: '16px' }}>
      {sorted.map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <div key={item.id}>
            <div
              className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
              onClick={() => toggleExpand(item.id)}
            >
              <div className={styles.chevron}>
                {isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              </div>
              <div className={styles.nameColumn}>
                <Text weight="semibold"><TruncatedText text={item.name} /></Text>
                <Text className={styles.codeText}><TruncatedText text={item.schemaName} /></Text>
              </div>
              <Badge appearance="filled" ...>{item.status}</Badge>
              {/* other badge/text columns */}
            </div>
            {isExpanded && renderDetail(item)}
          </div>
        );
      })}
    </div>
  );
}
```

#### Key Rules

1. **Self-contained** — no `onSelect` prop, no navigation away. Detail expands inline below the row.
2. **`makeStyles` only** — all styles via design tokens, no inline style objects except for one-off overrides.
3. **Grid columns** — always start with `24px` (chevron) then `minmax(200px, 2fr)` (name), then `auto` columns for badges/short text.
4. **Name column** — always `minWidth: 0` to allow truncation; two lines (display name + schema name in `codeText`).
5. **All long text uses `TruncatedText`** — never raw text in grid cells that could overflow.
6. **Expanded detail** — `borderTop: 'none'` + `marginTop: '-4px'` to attach seamlessly to the row above.
7. **Empty state** — full centred panel with icon, heading, description. Never just a plain string.
8. **ResultsDashboard** — simply renders `<MyList items={result.items} />`. No state, no conditional detail view, no Back button needed.

#### Checklist when creating or editing any list component

- [ ] Uses `makeStyles` + card-row grid (NOT DataGrid)
- [ ] First grid column is `24px` chevron, second is `minmax(200px, 2fr)` name column
- [ ] `nameColumn` has `minWidth: 0` to enable text truncation
- [ ] All long text in rows uses `TruncatedText`
- [ ] Expanded detail panel has `borderTop: 'none'` and `marginTop: '-4px'`
- [ ] Component is self-contained — no `onSelect` / navigation prop
- [ ] ResultsDashboard renders it directly with no surrounding conditional logic
- [ ] Empty state has icon + heading + description

## Important Notes

- ⚠️ **CRITICAL: Check COMPONENT_TYPES_REFERENCE.md before implementing component discovery**
- ⚠️ **NEVER guess component type values - use official Microsoft documentation**
- ✅ **Always use `window.toolboxAPI.dataverse.queryData()` for OData queries**
- ❌ **Never use `executeDataverseRequest()` - it doesn't exist**
- 📚 **Check official docs first:**
  - Microsoft Dataverse: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/
  - PPTB Desktop: https://docs.powerplatformtoolbox.com/tool-development/api-reference
  - PPTB Types: Use official `@pptb/types` package (v1.0.19+)
- 🎨 **UI Framework:** Fluent UI React v9 (includes @fluentui/react-icons)
- 📦 **Package Manager:** pnpm
- 🔧 **Build Tool:** Vite + TypeScript (strict mode)
- 🎯 **Default Scope:** "By Solution" is the recommended and default selection
- ⚡ **Performance:** Follow DATAVERSE_OPTIMIZATION_GUIDE.md patterns
