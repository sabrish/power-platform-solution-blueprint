# PPSB Architecture

Technical architecture and design documentation for Power Platform Solution Blueprint

---

## Development Philosophy

PPSB was developed through an AI-collaborative approach:
- **ChatGPT**: Used for initial concept exploration, feature brainstorming, and requirements validation
- **Claude**: Provided detailed architecture design, comprehensive planning, and hands-on implementation through Claude Code

This collaboration enabled rapid development while maintaining architectural consistency and code quality.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Core Business Logic](#core-business-logic)
4. [React UI Components](#react-ui-components)
5. [Dataverse Integration](#dataverse-integration)
6. [Discovery Components](#discovery-components)
7. [Analysis Components](#analysis-components)
8. [Export Architecture](#export-architecture)
9. [Performance Optimizations](#performance-optimizations)
10. [Error Handling](#error-handling)
11. [Accessibility](#accessibility)
12. [Extension Points](#extension-points)

---

## 1. Overview

PPSB follows a clean architecture pattern with strict separation of concerns:

```
┌─────────────────────────────────────────┐
│         PPTB Tool (React UI)            │  Presentation Layer
├─────────────────────────────────────────┤
│         Core Library (TypeScript)        │  Business Logic Layer
├─────────────────────────────────────────┤
│    PPTB API (window.toolboxAPI)         │  Data Access Layer
├─────────────────────────────────────────┤
│      Microsoft Dataverse (Cloud)         │  Data Layer
└─────────────────────────────────────────┘
```

**Key Principles**:
- **Separation of Concerns**: UI knows nothing about Dataverse, Core knows nothing about React
- **Dependency Injection**: Core uses interfaces (IDataverseClient), UI provides implementation
- **Type Safety**: Strict TypeScript throughout, comprehensive type definitions
- **Testability**: Pure functions, mockable interfaces, isolated components
- **Extensibility**: Plugin architecture for analyzers, reporters, discovery components

---

## 2. Project Structure

The project uses a flat single-package structure (not a monorepo) with all source at root level.

```
power-platform-solution-blueprint/
├── src/
│   ├── core/                     # Pure TypeScript business logic
│   │   ├── dataverse/            # PptbDataverseClient.ts
│   │   ├── discovery/            # 12+ component discovery services
│   │   ├── analyzers/            # Analysis engines
│   │   │   ├── PerformanceAnalyzer.ts
│   │   │   ├── WorkflowMigrationAnalyzer.ts
│   │   │   ├── CrossEntityMapper.ts
│   │   │   └── ExternalDependencyAggregator.ts
│   │   ├── generators/           # ERD and blueprint generation
│   │   │   ├── ERDGenerator.ts
│   │   │   └── BlueprintGenerator.ts
│   │   ├── reporters/            # Export formats
│   │   │   ├── MarkdownReporter.ts
│   │   │   ├── JsonReporter.ts
│   │   │   ├── HtmlReporter.ts
│   │   │   └── ZipPackager.ts
│   │   ├── exporters/            # Export-format helpers
│   │   ├── parsers/              # Content parsers
│   │   │   ├── FlowDefinitionParser.ts
│   │   │   ├── JavaScriptParser.ts
│   │   │   └── BusinessRuleParser.ts
│   │   ├── types/                # Shared TypeScript interfaces and types
│   │   └── utils/                # Shared utility functions
│   │
│   └── components/               # React UI — no business logic
│       ├── App.tsx
│       ├── ScopeSelector.tsx
│       ├── ResultsDashboard.tsx
│       └── ... (20+ components and hooks)
│
├── docs/                         # Documentation
├── CLAUDE.md
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

**Why flat structure?** PPTB Desktop requires a single-package layout. The original monorepo (packages/core + packages/pptb-tool) was dismantled in v0.5.1 due to `pptb-webview://` protocol incompatibilities with workspace package references.

---

## 3. Core Business Logic

The `src/core/` directory is pure TypeScript with zero UI dependencies.

### Type System

**Blueprint Types** (`types/blueprint.ts`):
- `BlueprintResult`: Root type containing all discovered data
- `EntityBlueprint`: Complete entity documentation (schema + automation)
- `Plugin`, `Flow`, `BusinessRule`: Component types
- `ERDDefinition`: ERD diagram with metadata
- `CrossEntityLink`, `ExternalEndpoint`: Analysis results

**Design Principles**:
- Discriminated unions for type safety (e.g., `ExecutionMode: 'Sync' | 'Async'`)
- Optional properties for conditional data (`erd?: ERDDefinition`)
- Comprehensive JSDoc comments
- No `any` types (strict TypeScript)

### Dataverse Client

**Interface** (`IDataverseClient.ts`):
```typescript
export interface IDataverseClient {
  query<T>(odataQuery: string): Promise<QueryResult<T>>;
  queryMetadata(entityLogicalName: string): Promise<EntityMetadata>;
}
```

**Implementation** (`PptbDataverseClient.ts`):
- Uses `window.dataverseAPI.queryData()`
- Builds OData query strings
- Parses responses
- Handles errors and retries

**Why Interface?**:
- **Testability**: Mock client for unit tests
- **Flexibility**: Could add NodeDataverseClient for CLI
- **Portability**: Core package not tied to PPTB Desktop

### Discovery Services

Each discovery service follows the same pattern:

```typescript
export class {Component}Discovery {
  constructor(private client: IDataverseClient) {}

  async discover{Components}(scope: Scope): Promise<{Component}[]> {
    // 1. Query Dataverse
    const result = await this.client.query<RawType>(odataQuery);

    // 2. Transform to domain model
    const components = result.value.map(this.transform);

    // 3. Enrich with related data
    await this.enrichComponents(components);

    // 4. Return
    return components;
  }
}
```

**Discovery Services**:
- PublisherDiscovery, SolutionDiscovery
- EntityDiscovery, PluginDiscovery, FlowDiscovery
- BusinessRuleDiscovery, WorkflowDiscovery, BPFDiscovery
- WebResourceDiscovery, CustomAPIDiscovery
- EnvironmentVariableDiscovery, ConnectionReferenceDiscovery
- GlobalChoiceDiscovery, SecurityRoleDiscovery
- FieldSecurityProfileDiscovery, ColumnSecurityDiscovery

### Analyzers

Analyzers take discovered data and produce insights:

**PerformanceAnalyzer**:
- Identifies sync plugins with external calls (high risk)
- Scores entity complexity (fields + automation density)
- Flags long execution chains

**WorkflowMigrationAnalyzer**:
- Categorizes classic workflows by complexity
- Generates step-by-step migration recommendations
- Assesses blockers (child workflows, custom activities)

**CrossEntityMapper**:
- Parses flow definitions for cross-entity operations
- Identifies plugin patterns (naming-based heuristic)
- Maps automation source → target entity

**ExternalDependencyAggregator**:
- Collects external calls from flows, plugins, web resources
- Groups by domain
- Assigns risk levels (Trusted/Known/Unknown)
- Assesses risk factors (sync call, HTTP vs HTTPS)

### Generators

**ERDGenerator**:
- Builds Mermaid ERD diagram
- Color-codes entities by publisher
- Creates legend and quick links table

**BlueprintGenerator** (Orchestrator):
- Coordinates all discovery services
- Runs analyzers
- Reports progress
- Assembles final BlueprintResult

### Reporters

**MarkdownReporter**:
- Generates complete folder structure
- Creates index and entity detail pages
- Formats tables using helper functions
- Embeds Mermaid diagrams

**HtmlReporter**:
- Single-page HTML with embedded CSS/JS
- Interactive navigation sidebar
- Accordion sections
- Sortable tables (client-side JavaScript)
- Mermaid rendering via CDN

**JsonReporter**:
- Serializes BlueprintResult to JSON
- Pretty-printed for human readability
- Includes metadata (version, timestamp, scope)

**ZipPackager**:
- Uses JSZip library
- Bundles Markdown files, JSON, HTML
- Creates organized directory structure
- Returns Blob for download

---

## 4. React UI Components

React 18 application using Vite and Fluent UI v9.

### Component Hierarchy

```
App
├── ScopeSelector
│   ├── PublisherSelector (multi-select dropdown)
│   ├── SolutionSelector (multi-select dropdown)
│   └── SystemEntitiesCheckbox
│
└── ResultsDashboard
    ├── SummaryCards
    ├── ERDView
    │   └── MermaidDiagram
    ├── Tabs
    │   ├── EntitiesTab
    │   │   └── EntityDetailView (modal)
    │   │       ├── OverviewTab
    │   │       ├── SchemaTab (FieldsTable)
    │   │       ├── AutomationTab
    │   │       └── ExecutionPipelineTab
    │   ├── PluginsTab (PluginsList)
    │   ├── FlowsTab (FlowsList)
    │   ├── SecurityTab
    │   │   ├── SecurityRolesTab
    │   │   ├── FieldSecurityTab
    │   │   ├── AttributeMaskingTab
    │   │   └── ColumnSecurityTab
    │   ├── ExternalDependenciesTab
    │   └── CrossEntityTab
    └── ExportDialog
        ├── FormatSelector
        └── DownloadButton
```

### State Management

**No Redux/Context** - Simple useState + props

```typescript
// App.tsx
const [scope, setScope] = useState<Scope | null>(null);
const [result, setResult] = useState<BlueprintResult | null>(null);
const [isGenerating, setIsGenerating] = useState(false);
const [progress, setProgress] = useState<Progress | null>(null);
```

**Why no state management library?**:
- Single parent component (App)
- Linear flow (Scope → Generate → Results → Export)
- No complex shared state
- Simpler to understand and maintain

### Custom Hook: useBlueprintGeneration

```typescript
function useBlueprintGeneration() {
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(async (scope: Scope) => {
    setIsGenerating(true);
    setError(null);

    try {
      const generator = new BlueprintGenerator(client, scope);

      generator.onProgress((progress) => {
        setProgress(progress);
      });

      const result = await generator.generate();
      setResult(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { result, isGenerating, progress, error, generate };
}
```

### Fluent UI v9 Usage

**Components Used**:
- **Layout**: Card, Divider, makeStyles
- **Input**: Button, Checkbox, Dropdown, SearchBox
- **Display**: Badge, Spinner, Text, Title
- **Navigation**: Tabs, TabList, Tab
- **Feedback**: MessageBar
- **Icons**: @fluentui/react-icons

**Styling Approach**:
```typescript
const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  // ... more styles
});

const styles = useStyles();
return <div className={styles.container}>...</div>;
```

**Why Fluent UI?**:
- Microsoft design language (consistent with Power Platform)
- Accessibility built-in (WCAG AA compliant)
- TypeScript-first
- Excellent performance
- Regular updates

---

## 5. Dataverse Integration

### PPTB API Usage

**Initialization**:
```typescript
// main.tsx
declare global {
  interface Window {
    toolboxAPI: PptbAPI;
  }
}

// Check API availability
if (!window.toolboxAPI) {
  throw new Error('PPTB Desktop API not available');
}
```

**Query Pattern**:
```typescript
async query<T>(odataQuery: string): Promise<QueryResult<T>> {
  try {
    const result = await window.dataverseAPI.queryData(odataQuery);
    return {
      value: result.value,
      count: result.value.length,
    };
  } catch (error) {
    // Handle error
    throw new DataverseError('Query failed', error);
  }
}
```

### OData Query Construction

**Example**:
```typescript
// Get plugins for entity
const query = `sdkmessageprocessingsteps?` +
  `$filter=_sdkmessagefilterid_value eq ${entityId}` +
  `&$select=name,rank,stage,mode,statuscode` +
  `&$expand=sdkmessageid($select=name)` +
  `&$orderby=rank asc`;
```

**Best Practices**:
- Always use `$select` (don't fetch unnecessary fields)
- Use `$expand` for related data (reduces round-trips)
- Filter server-side when possible (`$filter`)
- Sort server-side (`$orderby`)
- Batch queries when API supports it

### Performance Optimizations

**CRITICAL: See DATAVERSE_OPTIMIZATION_GUIDE.md for detailed patterns**

Key optimizations implemented:

1. **Batched Queries**: Reduce N queries to 1
   ```typescript
   // Before: N queries
   for (const entity of entities) {
     await getPlugins(entity.id);
   }

   // After: 1 query
   const allPlugins = await getPlugins(entityIds);
   const groupedPlugins = groupBy(allPlugins, 'entityId');
   ```

2. **GUID Normalization** (prevents silent failures):
   ```typescript
   // Normalize GUIDs: remove braces, lowercase
   const cleanGuid = guid.toLowerCase().replace(/[{}]/g, '');
   const filter = `id eq ${cleanGuid}`;  // No quotes!
   ```

3. **In-Memory Filtering**:
   ```typescript
   // When API doesn't support filter
   const allItems = await client.query('items');
   const filtered = allItems.filter(item => condition(item));
   ```

4. **Strategic $expand**:
   - Use when related data always needed
   - Avoid when conditional or rarely needed

---

## 6. Discovery Components

Each discovery service follows the same lifecycle:

### 1. Query Construction

Build OData query with:
- `$filter`: Scope constraints (solution ID, publisher prefix)
- `$select`: Only needed fields
- `$expand`: Related entities
- `$orderby`: Sort for consistent ordering

### 2. API Call

```typescript
const result = await this.client.query<RawType>(query);
```

### 3. Transformation

Map raw API response to domain model:
```typescript
private transform(raw: RawPlugin): Plugin {
  return {
    id: raw.sdkmessageprocessingstepid,
    name: raw.name,
    stage: this.mapStage(raw.stage),
    mode: raw.mode === 0 ? 'Sync' : 'Async',
    // ... more mapping
  };
}
```

### 4. Enrichment

Fetch related data:
```typescript
// Get plugin images
for (const plugin of plugins) {
  plugin.images = await this.getImages(plugin.id);
}
```

**Optimization**: Batch this step when possible.

### 5. Return

Return fully hydrated domain objects.

---

## 7. Analysis Components

Analyzers produce insights from raw discovered data.

### Performance Analyzer

**Inputs**: Plugins, flows
**Outputs**: PerformanceRisk[]

**Logic**:
1. Find sync plugins with external calls (critical risk)
2. Calculate entity complexity scores
3. Identify execution chains >5 steps (performance concern)
4. Flag flows with >10 actions (complexity risk)

### Workflow Migration Analyzer

**Inputs**: Classic workflows
**Outputs**: WorkflowMigrationAssessment[]

**Logic**:
1. Parse workflow XAML
2. Identify blockers (child workflows, custom activities, conditions)
3. Assign complexity (Low/Medium/High)
4. Generate migration recommendations

### Cross-Entity Mapper

**Inputs**: Flows (with parsed definitions), plugins
**Outputs**: CrossEntityLink[]

**Logic**:
1. Parse flow actions for Dataverse operations on different entities
2. Check plugin names for cross-entity patterns (heuristic)
3. Build source → target mapping

### External Dependency Aggregator

**Inputs**: Flows, plugins, web resources
**Outputs**: ExternalEndpoint[]

**Logic**:
1. Collect all external calls
2. Group by domain
3. Assign risk level based on:
   - Domain (trusted/known/unknown)
   - Protocol (HTTPS vs HTTP)
   - Execution mode (sync vs async)
4. Build recommendation list

---

## 8. Export Architecture

### Reporter Pattern

All reporters implement informal interface:
```typescript
interface IReporter {
  generate(result: BlueprintResult): string | Blob;
}
```

### Markdown Reporter

**Strategy**: Generate file-per-entity structure

**Implementation**:
1. Create index.md with summary
2. For each entity: Generate {LogicalName}.md
3. Generate component pages (Plugins.md, Flows.md, etc.)
4. Build ERD page with Mermaid diagram
5. Return Map<filename, content>

**File Structure**:
- Flat structure (no deep nesting)
- Consistent naming (kebab-case)
- Cross-links using relative paths

### HTML Reporter

**Strategy**: Single-page application (SPA) in HTML

**Implementation**:
1. Generate CSS (embedded in `<style>`)
2. Generate HTML structure (sidebar + sections)
3. Generate JavaScript (embedded in `<script>`)
4. Embed Mermaid diagrams as text (rendered client-side)
5. Return single HTML string

**JavaScript Features**:
- Accordion toggle
- Tab switching
- Smooth scroll navigation
- Table sorting (client-side)
- Print styles

### JSON Reporter

**Strategy**: Serialize BlueprintResult with metadata

**Implementation**:
1. Add metadata (version, timestamp, scope)
2. JSON.stringify with pretty-print (2-space indent)
3. Return JSON string

**Usage**:
- Baselines for comparison
- Programmatic analysis
- CI/CD integration

### ZIP Packager

**Strategy**: Bundle multiple formats

**Implementation** (using JSZip):
1. Create ZIP instance
2. Add Markdown files to `markdown/` folder
3. Add `blueprint.json` to root
4. Add `blueprint.html` to root
5. Generate Blob
6. Return Blob for download

---

## 9. Performance Optimizations

### Query Batching

**Problem**: 1000 entities × 5 queries each = 5000 API calls

**Solution**: Batch queries
- Single query for all plugins across entities
- Group results in memory
- Reduces 1000 queries to 1

### GUID Handling

**Problem**: GUIDs in OData filters cause silent failures if formatted incorrectly

**Solution**:
- Normalize: remove braces, lowercase
- Use raw GUID in filters (no quotes)
- Example: `id eq a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Lazy Rendering

**Problem**: Large ERD (500+ entities) causes browser lag

**Solution**:
- Render ERD only when section expanded
- Use `IntersectionObserver` to detect visibility
- Defer Mermaid rendering until needed

### Table Virtualization

**Problem**: Rendering 1000-row tables is slow

**Solution**:
- Use Fluent UI DataGrid (has built-in virtualization)
- Only render visible rows
- Smooth scrolling with invisible buffer

### Caching

**Strategy**: Cache discovery results during generation

**Implementation**:
```typescript
private cache = new Map<string, any>();

async getPlugins(entityId: string): Promise<Plugin[]> {
  const cacheKey = `plugins-${entityId}`;

  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey);
  }

  const plugins = await this.fetchPlugins(entityId);
  this.cache.set(cacheKey, plugins);
  return plugins;
}
```

---

## 10. Error Handling

### Error Categories

**1. Dataverse Errors**:
- Permission denied
- Network timeout
- Invalid query
- Entity not found

**2. Parsing Errors**:
- Malformed XML (workflow)
- Invalid JSON (flow definition)
- Unexpected data structure

**3. Generation Errors**:
- Out of memory (huge environment)
- Browser timeout
- User cancellation

### Error Handling Strategy

**Granular Try-Catch**:
```typescript
// Entity-level error handling
for (const entity of entities) {
  try {
    const plugins = await this.getPlugins(entity.id);
    entity.plugins = plugins;
  } catch (error) {
    console.error(`Failed to get plugins for ${entity.LogicalName}`, error);
    // Log error but continue with other entities
    entity.plugins = [];
    errors.push({
      entity: entity.LogicalName,
      phase: 'plugin-discovery',
      error,
    });
  }
}
```

**User-Friendly Messages**:
```typescript
catch (error) {
  if (error.status === 403) {
    throw new Error('Permission denied. You need System Administrator role.');
  } else if (error.status === 404) {
    throw new Error('Entity not found. It may have been deleted.');
  } else if (error.message.includes('timeout')) {
    throw new Error('Request timed out. Dataverse may be overloaded. Please try again in a few minutes.');
  } else {
    throw new Error(`Unexpected error: ${error.message}`);
  }
}
```

**Retry Logic**:
```typescript
async queryWithRetry<T>(query: string, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.client.query<T>(query);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## 11. Accessibility

PPSB follows WCAG 2.1 AA standards.

### Keyboard Navigation

- **Tab Order**: Logical tab order through all interactive elements
- **Focus Indicators**: Visible focus rings (Fluent UI default)
- **Shortcuts**: Common shortcuts work (Escape to close dialogs, Enter to submit)

### Screen Readers

- **Semantic HTML**: `<nav>`, `<main>`, `<section>`, `<article>`
- **ARIA Labels**: `aria-label`, `aria-labelledby`, `aria-describedby`
- **Live Regions**: `aria-live="polite"` for progress updates
- **Skip Links**: "Skip to main content" link (hidden, keyboard-accessible)

### Color Contrast

- **Fluent UI Tokens**: All colors meet WCAG AA contrast ratios
- **Error States**: Icons + text (not color alone)
- **Focus Indicators**: High-contrast borders

### Testing

- **Automated**: axe-core via browser extension
- **Manual**: Keyboard-only navigation test
- **Screen Reader**: NVDA test on Windows

---

## 12. Extension Points

PPSB is designed for extensibility.

### Custom Discovery Services

Add new discovery services by implementing pattern:

```typescript
export class CustomComponentDiscovery {
  constructor(private client: IDataverseClient) {}

  async discoverCustomComponents(scope: Scope): Promise<CustomComponent[]> {
    // Implementation
  }
}
```

Register in `BlueprintGenerator`:
```typescript
const customDiscovery = new CustomComponentDiscovery(this.client);
const customComponents = await customDiscovery.discoverCustomComponents(scope);
result.customComponents = customComponents;
```

### Custom Analyzers

Add analyzers for custom insights:

```typescript
export class CustomAnalyzer {
  analyze(result: BlueprintResult): CustomInsight[] {
    // Analysis logic
  }
}
```

### Custom Reporters

Support additional export formats:

```typescript
export class PdfReporter {
  generate(result: BlueprintResult): Blob {
    // Generate PDF using library like jsPDF
  }
}
```

### Plugin Architecture (Future)

**Vision**: Load plugins at runtime

```json
{
  "plugins": [
    {
      "name": "custom-discovery",
      "entry": "./plugins/custom-discovery.js"
    },
    {
      "name": "custom-analyzer",
      "entry": "./plugins/custom-analyzer.js"
    }
  ]
}
```

**Benefits**:
- Community contributions
- Custom organizational logic
- Industry-specific analyzers

---

## Summary

PPSB architecture emphasizes:
- **Separation of concerns** (Core/UI split)
- **Type safety** (Strict TypeScript)
- **Performance** (Batching, caching, lazy rendering)
- **Extensibility** (Plugin pattern, interfaces)
- **Maintainability** (Clear patterns, comprehensive docs)

**Made with ❤️ for the Power Platform community**
