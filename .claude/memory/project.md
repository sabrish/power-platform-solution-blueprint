# PPSB Project State

**Last updated:** 2026-02-26 (migrated from CHANGELOG.md, docs/roadmap.md, CLAUDE.md)

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

**v0.7.2** (released 2026-02-23)

---

## What is Working (as of v0.7.2)

### Core Discovery
- Entity schema discovery (fields, relationships, keys, alternate keys)
- Plugin discovery with full registration details and execution order
- Power Automate flow discovery with trigger and connection analysis
- Business rule discovery and XAML parsing
- Classic workflow discovery with migration recommendations
- Business Process Flow documentation (stages and steps — BPF step count fixed in v0.7.2)
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
- Entity list with search
- Component Browser with card-row expandable pattern
- Results Dashboard with tabbed view
- ERD using Mermaid (single all-entities diagram with publisher color-coding)
- Export: JSON, Markdown, HTML, ZIP (all static imports — dynamic imports broken under pptb-webview://)
- Real-time progress reporting with phase-specific labels (plugins/flows/business rules/entities)

### Fixed in v0.7.2
- BPF step count now reads `processstage.clientdata` JSON array correctly
- All exports work under PPTB Desktop (converted from dynamic to static imports)
- Text overflow in component lists fixed (`minWidth: 0`, `wordBreak: 'break-word'`, `overflowWrap: 'anywhere'`)
- Classic workflow and custom connector OData query compatibility
- Business rule placeholder description text filtered out
- Theme toggle removed; theme handling consolidated into ThemeContext
- `PptbDataverseClient` now receives environment URL from `toolContext.connectionUrl`
- `solutionNames` added to blueprint metadata

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
- Mermaid (ERD rendering)
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

- **Cross-Entity Automation tab:** Shows "Coming Soon" preview with sample data. Full implementation requires plugin decompilation (ILSpy) and deeper XAML parsing.
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
| `UI_PATTERNS.md` | UI design decisions (card-row pattern now canonically documented in `.claude/memory/patterns.md` PATTERN-001) |
| `docs/architecture.md` | Technical architecture (note: describes old monorepo structure; actual structure is flat since v0.5.1) |
| `docs/roadmap.md` | Future development plans |
| `docs/API_SECURITY.md` | API call reference and security considerations |
| `docs/user-guide.md` | End-user documentation |
| `CONTRIBUTING.md` | Commit conventions and development workflow |

---

## npm-shrinkwrap.json

Must be regenerated with native `npm` (not pnpm) whenever dependencies are updated. Required for PPTB Desktop compatibility. See `NPM_SHRINKWRAP_GENERATION.md` for steps.
