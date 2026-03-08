# PPSB Project State

**Last updated:** 2026-03-07 (session 2)

---

## Project Identity

- **Full name:** Power Platform Solution Blueprint (PPSB)
- **Tagline:** "Complete architectural blueprints for your Power Platform systems"
- **Type:** PPTB Desktop tool (runs inside Power Platform Toolbox Desktop)
- **License:** MIT, free and open-source
- **Entry point:** `dist/index.html`
- **Tool display name in PPTB:** "Power Platform Solution Blueprint (PPSB)"
- **GitHub:** https://github.com/sabrish/power-platform-solution-blueprint

---

## Current Version

**v0.9.0** (released 2026-03-07)

---

## What is Working (as of v0.9.0)

### Core Discovery
- Entity schema discovery (fields, relationships, keys, alternate keys)
- Plugin discovery with full registration details and execution order
- Power Automate flow discovery with trigger and connection analysis
- Business rule discovery with full compiled-JS parser (all condition and action types)
- Classic workflow discovery with migration recommendations
- Business Process Flow documentation (stages and steps)
- JavaScript web resource analysis with external call detection
- Custom API documentation with parameters
- Environment variable discovery and value tracking
- Connection reference discovery with premium connector detection
- Global choice documentation
- Security role discovery with permission matrices
- Field security profile discovery
- Attribute masking rule discovery
- Column security profile discovery
- Forms and web resources discovery (including `rootcomponentbehavior` handling)

### UI
- Scope Selector: By Publisher (multi-select) and By Solution (default, multi-select)
- Entity list with flag-based filter bar (AND logic) and search
- Component Browser with card-row expandable pattern (PATTERN-001)
- Plugin Packages tab grouping plugin steps by assembly
- Clickable Dashboard summary cards that select the corresponding Component Browser tab
- Compact Component Browser tabs (icon + count when unselected; full label + count when selected)
- Universal search/filter bar on every component list tab
- Results Dashboard with tabbed view
- Interactive ERD: Cytoscape.js force-directed graph with pan/zoom, node isolation, publisher filter, edge hover (relationship name + attribute), PNG/SVG export
- Export: JSON, Markdown, HTML, ZIP (all static imports — dynamic imports broken under pptb-webview://)
- Real-time progress reporting with phase-specific labels

### Key fixes since v0.7.2
- Business rule parser completely rewritten — covers all condition/action patterns including `controls.forEach` delegate, double-wrapped parens, date-derived variables
- HTML export: SyntaxError fix (`\n` escaping), Edge storage shim, Mermaid pinned to 10.9.1, `startOnLoad: false`, tooltip XSS defence (`_esc()`), ERD data in JSON data-block
- ERD replaced: Mermaid static diagram → Cytoscape.js interactive graph
- DB diagram (dbdiagram.io export): attribute-less entities now get fallback columns from relationship data
- Security role privilege matrix reads `depthValue` (numeric) correctly
- Entity badge counts, filter bar visibility, AND filter logic, managed/custom badges all corrected
- Classic workflow migration log `console.warn` removed from production

---

## Architecture Overview

```
Presentation:   React UI (src/components/, src/hooks/, src/App.tsx)
Business Logic: Core TypeScript (src/core/)
Data Access:    window.dataverseAPI (PPTB Desktop official API)
Data:           Microsoft Dataverse (Cloud)
```

**Structure (flat — NOT monorepo since v0.5.1):**
```
src/
  core/
    dataverse/        PptbDataverseClient.ts
    discovery/        12+ component discovery services
    analyzers/        PerformanceAnalyzer, WorkflowMigrationAnalyzer, CrossEntityMapper, ExternalDependencyAggregator
    generators/       ERDGenerator.ts, BlueprintGenerator.ts
    reporters/        MarkdownReporter, JsonReporter, HtmlReporter, ZipPackager
    exporters/        Export-format helpers
    parsers/          FlowDefinitionParser, JavaScriptParser, BusinessRuleParser
    types/            Shared TypeScript interfaces and types
    utils/            Shared utility functions
  components/         React components
  hooks/              Custom React hooks
  types/              TypeScript type definitions
  App.tsx
  main.tsx
```

**Key dependencies:**
- React 18 + Vite 5 + TypeScript (strict mode)
- Fluent UI v9 (`@fluentui/react-components`, `@fluentui/react-icons`)
- `@pptb/types` v1.0.19+ (official PPTB Desktop type definitions)
- Cytoscape.js (interactive ERD graph)
- Mermaid (execution pipeline diagrams in HTML/Markdown exports; CDN, pinned to 10.9.1)
- JSZip (ZIP packaging)
- pnpm (package manager)

---

## Development Commands

```bash
pnpm install    # Install dependencies
pnpm build      # Build (outputs to dist/)
pnpm dev        # Dev server (browser testing only)
pnpm typecheck  # Type check
```

---

## In Progress / Known Limitations

### Cross-Entity Automation Trace (branch: `feat/cross-entity-automation`) — UNCOMMITTED

Active development. Build passes (`pnpm typecheck && pnpm build` clean). No commit made yet.

**What is implemented and working:**

- `CrossEntityAnalyzer.ts` — completely rewritten with source-centric entry-point scan:
  - `discoverAllEntryPoints()` groups triggers by *target* entity, not by blueprints list — catches flows writing to out-of-scope entities (e.g. `msnfp_awards`, `connections`)
  - Accepts `allFlows` as a third argument to `analyze()` — unscoped flows (scheduled, manual, no primary entity) are scanned separately
  - Unscoped flows use synthetic `sourceEntity` labels: `"(scheduled)"` → "Scheduled Flow", `"(manual)"` → "Manual / On-Demand Flow", `"(unscoped)"` → "Solution Flow"
  - `primaryentity = "none"` (literal string, not null) is now treated the same as null — guards present in both `discoverAllEntryPoints` and `allFlowsById` building
- `BlueprintGenerator.ts` — passes flat `flows` array as third argument to `CrossEntityAnalyzer.analyze()`
- `CrossEntityAutomationView.tsx` — completely rewritten to pipeline accordion UI:
  - Entity accordion rows with 8-color cycling left accent
  - Collapsed view shows step-type pills (abbreviated activation overview)
  - Expanded view: numbered steps, TypeBadge, stage, Sync/Async, warning for no filter
  - Branch block attached right of steps that write to another entity (colored border matching downstream entity accent, target name + operation + field pills)
  - Field-match verdict below each step (green/dimmed/red with hit/miss field pills)
  - Inline nested child pipeline (max depth 2) with "↩ back to Parent" return marker
  - "Won't fire" collapsible section at bottom per entity

**Still pending:**
- Project owner has not yet confirmed the new UI looks correct in the app
- Debug `console.log` statements in `FlowDefinitionParser.ts` and `CrossEntityAnalyzer.ts` must be removed once detection is confirmed working (see learnings.md [2026-03-07] debug artifacts rule)
- No commit made — awaiting user confirmation of UI

**Modified files (all uncommitted):**
- `src/core/analyzers/CrossEntityAnalyzer.ts`
- `src/core/generators/BlueprintGenerator.ts`
- `src/components/CrossEntityAutomationView.tsx`

### Other Known Limitations

- **Canvas Apps:** Metadata only (no component-level analysis available from API)
- **Custom Pages:** Metadata only
- **Power Pages:** Only if deployed to Dataverse
- **Customer Insights - Journeys:** Not included

---

## Next Steps (from roadmap.md)

### Near-term (v0.8+)
- Baseline Comparison: Load previous blueprint JSON, detect added/removed/modified components
- CLI tool: `ppsb generate [options]` with service principal auth
- CI/CD integration: GitHub Actions and Azure DevOps tasks

### Medium-term
- Impact analysis ("what if" scenarios for entities/fields/plugins)
- Unused component detection
- Business process mining (flow execution history)
- Custom analysis rules (compliance/quality, JSON/YAML config)

### Extended Platform Support
- Canvas Apps (requires .msapp extraction)
- Power Pages (full portal component analysis)
- Customer Insights and Marketing journeys
- Additional Dataverse component types (virtual/elastic tables, AI models, PCF controls)
- Model-driven app documentation (modules, forms, views, dashboards)

---

## Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Primary development guide — read first |
| `COMPONENT_TYPES_REFERENCE.md` | Complete Dataverse component type codes — always check before implementing discovery |
| `DATAVERSE_OPTIMIZATION_GUIDE.md` | Performance patterns and GUID handling rules |
| `UI_PATTERNS.md` | UI design decisions (card-row pattern now canonically documented in `.claude/memory/patterns-ui.md` PATTERN-001) |
| `docs/architecture.md` | Technical architecture — updated 2026-03-02; flat structure, correct API layer, card-row pattern, static-import constraint |
| `docs/roadmap.md` | Future development plans |
| `docs/API_SECURITY.md` | API call reference and security considerations |
| `docs/user-guide.md` | End-user documentation |
| `CONTRIBUTING.md` | Commit conventions and development workflow |

---

## npm-shrinkwrap.json

Must be regenerated with native `npm` (not pnpm) whenever dependencies are updated. Required for PPTB Desktop compatibility. See `NPM_SHRINKWRAP_GENERATION.md` for steps.
