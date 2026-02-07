# Power Platform Solution Blueprint (PPSB) - Development Guide

## Project Overview

This is a monorepo for **Power Platform Solution Blueprint (PPSB)**, a documentation tool that runs inside PPTB Desktop.

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

The PPTB API is available at `window.toolboxAPI` with the following structure:

```typescript
window.toolboxAPI = {
  getToolContext: function,
  connections: object,
  dataverse: object,     // ← Main API for Dataverse operations
  utils: object,
  fileSystem: object,
  terminal: object,
  events: object,
  settings: object
}
```

### Dataverse API Methods

**DO NOT use `executeDataverseRequest()` - this does NOT exist!**

Instead, use these correct methods:

#### Query Data
```typescript
window.toolboxAPI.dataverse.queryData(odataQuery: string, connectionTarget?: 'primary' | 'secondary')
```
- Executes OData queries with `$select`, `$filter`, `$orderby`, `$expand`, etc.
- Example: `queryData('publishers?$select=publisherid,friendlyname&$filter=isreadonly eq false')`

#### FetchXML Queries
```typescript
window.toolboxAPI.dataverse.fetchXmlQuery(fetchXml: string, connectionTarget?: 'primary' | 'secondary')
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

## Project Structure

```
power-platform-solution-blueprint/
├── packages/
│   ├── core/                 # @ppsb/core - Pure TypeScript library
│   │   └── src/
│   │       ├── dataverse/    # PptbDataverseClient implementation
│   │       └── discovery/    # Publisher & Solution discovery
│   │
│   └── pptb-tool/            # @ppsb/pptb - React UI for PPTB Desktop
│       └── src/
│           ├── App.tsx       # Main UI component
│           └── types/pptb.d.ts  # PPTB API type definitions
│
├── package.json
├── pnpm-workspace.yaml
└── CLAUDE.md                 # This file
```

## Key Implementation Details

### PptbDataverseClient.ts
- Located: `packages/core/src/dataverse/PptbDataverseClient.ts`
- Uses: `window.toolboxAPI.dataverse.queryData()`
- Builds OData query strings from QueryOptions
- Returns QueryResult<T> with parsed response

### Type Definitions
- Located: `packages/pptb-tool/src/types/pptb.d.ts`
- Contains complete PPTB API interface definitions
- Keep this in sync with official PPTB documentation

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm build           # Build all packages
pnpm dev             # Run dev server (for browser testing)
pnpm typecheck       # Type check all packages
```

## Testing in PPTB Desktop

1. Build the project: `pnpm build`
2. Load in PPTB Desktop from: `packages/pptb-tool/dist/index.html`
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

**Core Package (@ppsb/core):**
- `EntityDiscovery` class with three methods:
  - `getEntitiesByPublisher(publisherPrefixes)` - Gets entities by publisher prefix
  - `getEntitiesBySolutions(solutionIds)` - Gets entities from solution components
  - `getAllEntities(includeSystem)` - Gets all entities with optional system filter
- Uses `queryMetadata()` for EntityDefinitions endpoint
- Queries solution components to find entities in solutions

**UI Package (@ppsb/pptb):**
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
- OData queries need quotes: `'guid-here'`
- Comparisons need normalization: `guid-here` (no braces, lowercase)
- Missing any of these = silent failures and 0 results

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

## Important Notes

- ⚠️ **CRITICAL: Check COMPONENT_TYPES_REFERENCE.md before implementing component discovery**
- ⚠️ **NEVER guess component type values - use official Microsoft documentation**
- ✅ **Always use `window.toolboxAPI.dataverse.queryData()` for OData queries**
- ❌ **Never use `executeDataverseRequest()` - it doesn't exist**
- 📚 **Check official docs first:**
  - Microsoft Dataverse: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/
  - PPTB Desktop: https://docs.powerplatformtoolbox.com/tool-development/api-reference
- 🎨 **UI Framework:** Fluent UI React v9 (includes @fluentui/react-icons)
- 📦 **Package Manager:** pnpm workspaces
- 🔧 **Build Tool:** Vite + TypeScript (strict mode)
- 🎯 **Default Scope:** "By Solution" is the recommended and default selection
- ⚡ **Performance:** Follow DATAVERSE_OPTIMIZATION_GUIDE.md patterns
