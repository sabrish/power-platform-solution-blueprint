# Power Platform Solution Blueprint (PPSB) - Development Guide

## Project Overview

This is a monorepo for **Power Platform Solution Blueprint (PPSB)**, a documentation tool that runs inside PPTB Desktop.

**Tagline:** "Complete architectural blueprints for your Power Platform systems"

## PPTB Desktop API Reference

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
- `src/types/scope.ts` - TypeScript types for scope selection (discriminated union)
- `src/App.tsx` - Main app with conditional rendering (ScopeSelector → Confirmation)

## Important Notes

- ✅ **Always use `window.toolboxAPI.dataverse.queryData()` for OData queries**
- ❌ **Never use `executeDataverseRequest()` - it doesn't exist**
- 📚 **Check official docs:** https://docs.powerplatformtoolbox.com/tool-development/api-reference
- 🎨 **UI Framework:** Fluent UI React v9 (includes @fluentui/react-icons)
- 📦 **Package Manager:** pnpm workspaces
- 🔧 **Build Tool:** Vite + TypeScript (strict mode)
- 🎯 **Default Scope:** "By Solution" is the recommended and default selection
