# PPSB Project State

**Last updated:** 2026-03-14

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

**v1.1.0** (released 2026-03-12) — minor: pipeline-first Cross-Entity Automation view, external API call detection, HTML/Markdown export parity, and AUDIT compliance fixes
**v1.0.1** (released 2026-03-11) — patch: discovery pagination fix + OData injection guards
**v1.0.0** (released 2026-03-11)
**v0.9.0** (released 2026-03-07)

---

## What is Working (as of v1.1.0)

**Stable baseline (v1.0+):** Full Dataverse component discovery — entities, plugins, flows, business rules, classic workflows, BPFs, web resources, custom APIs, environment variables, connection references, global choices, security roles, field security profiles, attribute masking, column security profiles, forms, canvas apps, custom pages, model-driven apps. Scope selector (publisher + solution multi-select), entity list with flag filter bar (AND logic), Component Browser card-row accordion (PATTERN-001), universal search/filter on all tabs, Results Dashboard, interactive Cytoscape.js ERD with pan/zoom and PNG/SVG export, JSON/Markdown/HTML/ZIP export.

**v1.1.0:** Pipeline-first Cross-Entity Automation view (automation nodes top-level, entities as children with ← inbound badge), external API call detection on flow steps, HTML/Markdown export parity for external calls and Manual trigger pipelines, full AUDIT-001–013 compliance sweep across all components.

**Business rule parser (v1.1.0):** Full IF/THEN/ELSE structure (`conditionGroups: ConditionGroup[]`, `elseActions: Action[]`); handles all condition/action types including `controls.forEach` delegate and date-derived variables.

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
    discovery/        12+ component discovery services (all implement IDiscoverer<T>)
    analyzers/        PerformanceAnalyzer, WorkflowMigrationAnalyzer, CrossEntityMapper, ExternalDependencyAggregator
    generators/       ERDGenerator.ts, BlueprintGenerator.ts
      processors/     16 component processors extracted from BlueprintGenerator
    reporters/        MarkdownReporter, JsonReporter, HtmlReporter, ZipPackager
    exporters/        Export-format helpers
    parsers/          FlowDefinitionParser, JavaScriptParser, BusinessRuleParser
    types/            Shared TypeScript interfaces and types
    utils/            Shared utility functions (guid, metadata, entityName, grouping, complexity, odata)
  components/         React components
    CrossEntityAutomation/  Sub-components extracted from CrossEntityAutomationView
    ERDView/          Sub-components and utilities (constants, stylesheet, export, traversal)
  hooks/              Custom React hooks (useListFilter, useCardRowStyles, useExpandable)
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

### In Progress — UI/Export Bug Fixes and DRY/SOLID Refactoring (Batch 1)

**Status:** Nearly complete — pending Issue 3 full resolution, pre-commit gate, CHANGELOG, and version bump

**Completed this session (2026-03-13):**

1. **Custom APIs row click** (fixed) — `onSelectAPI` removed from row onClick; only calls `toggleExpand`
2. **Environment Variables eye icon shift** (fixed) — dedicated 32px grid column for visibility toggle
3. **Flow mislabelling** (PARTIAL) — `resolveEntityName()` fixes 'none' guard; diagnostic `[PPSB-DIAG]` logging added to `CrossEntityAnalyzer.ts` (lines 454, 464, 608, 618) to capture real-world data for flows showing as "Solution Flow (unscoped)"
4. **CDS Default Solution filter** (fixed) — extended ScopeSelector predicates
5. **Business Rules IF/THEN/ELSE structure** (fully implemented) — `conditionGroups: ConditionGroup[]` + `elseActions: Action[]` structure; parser handles single/multi group + optional else; UI renders IF/ELSE IF/THEN/ELSE; both HTML and Markdown exports updated
6. **HTML cross-entity export** (fixed) — pipeline-first structure in HtmlTemplates.ts and MarkdownReporter.ts

**DRY/SOLID refactoring completed:**
- `src/core/utils/guid.ts` — `normalizeGuid()`, `normalizeBatch()`
- `src/core/utils/metadata.ts` — `extractOwnershipMetadata()`
- `src/core/utils/entityName.ts` — `resolveEntityName()`
- `src/core/utils/grouping.ts` — consolidated grouping functions
- `src/core/utils/complexity.ts` — `calculateComplexityScore()`
- `src/core/utils/odata.ts` — `buildOrFilter()`
- `src/hooks/useExpandable.ts` — shared expand/collapse state
- `src/core/discovery/IDiscoverer.ts` — interface implemented on 11 discovery classes
- `src/core/generators/processors/` — 16 processor files split from BlueprintGenerator
- `src/components/CrossEntityAutomation/` — sub-components extracted from CrossEntityAutomationView.tsx
- `src/components/ERDView/` — utilities extracted (constants, stylesheet, export, traversal)

**Pending before PR merge:**
1. **Issue 3 full fix** — awaiting user to run tool and share `[PPSB-DIAG]` console output for flows showing as "Solution Flow (unscoped)"
2. **Remove `[PPSB-DIAG]` logs** from CrossEntityAnalyzer.ts after Issue 3 is resolved
3. **Run `/pre-commit`** (reviewer + security-auditor) before creating PR
4. **Update CHANGELOG.md** for this batch of changes
5. **Version bump** — this batch warrants a version increment

**Current build state:** `pnpm typecheck && pnpm build` — PASSES (verified 2026-03-13)

### Released in v1.1.0 (2026-03-12)

Minor release. Key features shipped:
- Cross-Entity Automation Trace redesigned as pipeline-first view: automation nodes (flows, classic workflows, BPFs) are top-level accordion items; entities appear as children with ← inbound badges on flows that target them
- External API call detection added to flow step analysis: HTTP trigger actions and premium/external connector calls surfaced per step
- Entities that own flows with external API calls are included in the default Cross-Entity Automation view automatically
- HTML and Markdown export parity restored: external call annotations and Manual trigger pipelines now render in both export formats
- Token sweep across all list components: raw pixel values and hex colours replaced with `tokens.*` equivalents
- `useCallback` wrapping applied to all toggle/filter handlers across all list components
- `EmptyState` component adopted across all component lists (bare `<Text>` empty states removed)
- Full AUDIT-001 through AUDIT-013 compliance verified and fixed across all list components

### Released in v1.0.1 (2026-03-11)

Patch release from the `fix/bug-in-component-discovery` branch. Key fixes:
- `queryAll()` now uses `@odata.nextLink` cursor pagination; `$skip` removed (error 0x80060888 on customapis and other entity types)
- Custom API, Connection Reference, and Custom Connector objectid-intersection queries isolated per PATTERN-012; each failure is contained
- `PublisherDiscovery` derives publishers via `$expand` on solutions — fixes missing publishers in managed-only environments
- OData injection guards added to `BusinessRuleDiscovery`, `SchemaDiscovery`, and `FieldSecurityProfileDiscovery`
- Workflow GUIDs normalised before batching in `getBusinessRulesByIds`
- `FieldSecurityProfileDiscovery` refactored to structured `QueryOptions`

### Released in v1.0.0 (2026-03-11)

All work from the `feat/cross-entity-automation` branch has been released. The branch was merged to `main` as part of the v1.0.0 release.

**Key features shipped in v1.0.0:**
- Cross-Entity Automation Trace — full pipeline accordion UI with field-match analysis and risk detection
- Canvas Apps, Custom Pages, and Model-Driven Apps discovery tabs
- Full WCAG 2.1 accessibility pass
- `componentIcons.ts` single source of truth for all icons
- `useListFilter` hook for shared filter/search logic
- Solutions section in HTML export; additional XSS fixes
- Complete card-row pattern compliance across all component lists (`TruncatedText` deleted)
- BPF stages rendered as accordion in HTML export; excluded from JSON/ZIP
- Classic Workflow deduplication and activation-record-only filtering
- System Admin role detection fix
- Carry-forward reviewer fixes across all component lists:
  - ConnectionReferencesList: mutedText moved to makeStyles, Connection ID conditional lifted out of Text, redundant display:grid removed, toggleExpand in useCallback
  - PluginsList: toggleExpand/toggleStageFilter/toggleStateFilter wrapped in useCallback, size="medium" on filteringAttributes Badge, explicit React.ReactElement return type on renderPluginDetails
  - FlowDiscovery: OData injection guard added to getFlowsForEntity
  - EnvironmentVariablesList: Checkbox replaces ToggleButton for "Has Default" binary filter, mergeClasses replaces string concatenation, toggleExpand in useCallback, listContainer marginTop moved to makeStyles, Default filter logic fixed (!!v.defaultValue && !v.currentValue), Default badge changed to appearance="tint" color="subtle" for light-theme visibility, explicit JSX.Element return types added

### Known Limitations

- **Canvas Apps:** Basic metadata discovery supported; component-level screen analysis not available from API
- **Custom Pages:** Metadata only
- **Power Pages:** Only if deployed to Dataverse
- **Customer Insights - Journeys:** Not included

---

## Next Steps (from roadmap.md)

### Near-term
- Baseline Comparison: Load previous blueprint JSON, detect added/removed/modified components
- CLI tool: `ppsb generate [options]` with service principal auth
- CI/CD integration: GitHub Actions and Azure DevOps tasks

### Medium-term
- Impact analysis ("what if" scenarios for entities/fields/plugins)
- Unused component detection
- Business process mining (flow execution history)
- Custom analysis rules (compliance/quality, JSON/YAML config)

### Extended Platform Support
- Canvas Apps enhanced analysis (component-level screen analysis; requires .msapp extraction)
- Power Pages full portal component analysis (forms, lists, Liquid templates)
- Customer Insights and Marketing journeys
- Additional Dataverse component types (virtual/elastic tables, AI models, PCF controls)
- Model-driven app enhanced documentation (deep module, form, view, and dashboard analysis beyond metadata)

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
