# PPSB Project State

**Last updated:** 2026-10-10
**Current version:** 1.5.0 (`package.json`)

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

**v1.5.0** (released 2026-10-10)
- Published to npm on 2026-10-10 via `workflow_dispatch`, with provenance. The npm environment requires reviewer approval before publish.
- Tag `v1.5.0` on `main`, created after the PR merge. No GitHub Release was created.
- Full notes: CHANGELOG.md `[1.5.0]`.

**Recent releases** (details in CHANGELOG.md):
- **v1.4.0** (2026-07-01): YAML frontmatter on Markdown exports, entity description blockquotes, flat cross-entity headings
- **v1.3.0** (2026-06-23): 12 new component types, Reverse Solution Lookup (`referencingSolutions`, #40), cascade configuration in exports (#42), business rule parser patterns (#37)
- **v1.1.2** (2026-03-17), **v1.1.1** (2026-03-17), **v1.1.0** (2026-03-12), **v1.0.1** and **v1.0.0** (2026-03-11), **v0.9.0** (2026-03-07), and earlier: CHANGELOG.md

---

## What's Working

**Stable baseline (v1.0+):** Full Dataverse discovery of entities, plugins, flows, business rules, classic workflows, BPFs, web resources, custom APIs, environment variables, connection references, global choices, security roles, field security profiles, attribute masking, column security profiles, forms, canvas apps, custom pages and model-driven apps. Scope selector (publisher and solution multi-select), entity list flag filter (AND logic), Component Browser card-row accordion (PATTERN-001), universal search on all tabs, Results Dashboard, interactive Cytoscape.js ERD with pan/zoom and PNG/SVG export, JSON, Markdown, HTML and ZIP export.

**Stable since v1.1.0:** Pipeline-first Cross-Entity Automation view; external API call detection on flow steps; HTML/Markdown export parity; AUDIT-001–013 compliance; business rule IF/THEN/ELSE structure (`conditionGroups`, `elseActions`); Reverse Solution Lookup (`referencingSolutions`, v1.3.0); cascade configuration in relationship tables (v1.3.0); YAML frontmatter on Markdown output (v1.4.0).

**Carry-forward from v1.0.0:** Reviewer fixes across list components: `useCallback` on toggles, explicit `JSX.Element` return types, `mergeClasses` for class composition, Checkbox for the "Has Default" filter, `FlowDiscovery` OData guard.

---

## Known Limitations

- **Canvas Apps:** Basic metadata discovery; component-level screen analysis is not available from the API
- **Custom Pages:** Metadata only
- **Power Pages:** Only if deployed to Dataverse
- **Customer Insights - Journeys:** Not included

---

## Architecture Overview

```
Presentation:   React UI (src/components/, src/hooks/, src/App.tsx)
Business Logic: Core TypeScript (src/core/)
Data Access:    window.dataverseAPI (PPTB Desktop official API)
Data:           Microsoft Dataverse (Cloud)
```

**Structure (flat, not a monorepo since v0.5.1):** `src/core/` holds discovery (12+ services implementing `IDiscoverer<T>`), analyzers, generators and processors, reporters, exporters, parsers, types and utils. `src/components/` holds React components (`CrossEntityAutomation/`, `ERDView/` sub-folders). `src/hooks/` holds shared hooks. Unit tests are co-located as `*.test.ts` under `src/`.

**Key dependencies:** React 18, Vite 5, TypeScript (strict), Fluent UI v9, `@pptb/types` ^1.2.6, Cytoscape.js (ERD), Mermaid (pipeline diagrams in exports, CDN pinned to 10.9.1), JSZip, pnpm.

---

## Development Commands

```bash
pnpm install    # Install dependencies
pnpm build      # Build (outputs to dist/)
pnpm dev        # Dev server (browser testing only)
pnpm typecheck  # Type check
pnpm test       # Unit tests (vitest run, node environment)
pnpm validate   # PPTB manifest validation (pptb-validate)
```

Lint and format tooling is not installed. See Known Follow-ups.

**Release workflow:**
- Release sequence: `/release` (reviewer, security audit, version bump, documentation at step 3b, then typecheck, test, build and validate at step 4). Version must match in `package.json`, CHANGELOG.md, the README version line and the `docs/user-guide.md` version subtitle, matched by its text (learnings.md, 2026-02-26)
- Release tags are created on `main` after merge, never on a branch (learnings.md, 2026-03-07)

---

## In Progress

Nothing in progress on this branch. The branch `chore/process-and-docs-cleanup` holds documentation and process cleanup only.

---

## Known Issues / Blockers

**PPTB Desktop issues (open):**
- Debug Install Package fails with `spawn EINVAL` on Windows
- Icon CORS error when loading a local tool

**Deferred findings** (pre-existing; waived at the 1.5.0 push and tracked as follow-ups):
- Inline styles in `DetectionCoverageBanner.tsx` and `ResultsDashboard.tsx`
- Inline `color:#666` in the coverage notice in `HtmlTemplates.ts`

---

## Next Steps

1. **Near-term:** Baseline Comparison (load a previous blueprint JSON and detect added, removed and modified components); CLI tool `ppsb generate [options]` with service principal auth; CI/CD integration (GitHub Actions and Azure DevOps tasks)
2. **Medium-term:** Impact analysis ("what if" scenarios for entities, fields and plugins); unused component detection; business process mining from flow execution history; custom analysis rules (JSON/YAML config)
3. **Extended platform support:** Canvas Apps component-level analysis (requires `.msapp` extraction); Power Pages portal analysis (forms, lists, Liquid templates); Customer Insights and Marketing journeys; virtual/elastic tables, AI models and PCF controls; deeper model-driven app analysis (forms, views, dashboards)

---

## Known Follow-ups (open, not scheduled)

**Deferred code follow-ups:**
- `ZipPackager.ts` (~line 134): repo URL points to the `anthropics` org instead of `sabrish`
- `CrossEntityAnalyzer.ts` (~line 686): `wf.entity.toLowerCase()` is unguarded
- Classic-workflow resolver paths are untested; add classic-workflow entity resolution tests
- Flow parser invents entity names from action names (e.g. `Get_Account_Details` yields `details`)

**Tooling and process:**
- Lint and format: ESLint and Prettier are not installed, though `developer.md` requires them
- Line endings: git emits LF/CRLF warnings; add a `.gitattributes`
- `dev-watch` script and sourcemap configuration: review
- `package.json` `engines` and `packageManager`: review
- Orchestrator tool list: review
- Reviewer and security-auditor read-only git access: review
- Deferred: faster gate (parallel reviewer/auditor, diff-scoped review, tiered gates) — drafts saved outside the repo; needs a short design pass
- Consider deterministic check scripts: secret patterns, `htmlEscape` coverage, inline styles, and typecheck, build and test in one command
- Publish workflow hardening is tracked outside this repository

**Tests:** The test suite is small and co-located. CI coverage and test gating need review. Test confidence assertions are coupled to implementation detail.

**SRI hashes:** Regenerate whenever the pinned Mermaid or Cytoscape version changes. Download the exact pinned URL, then run `openssl dgst -sha384 -binary <file> | openssl base64 -A`.

**README wording:** Quick Start vs Installation headings; other wording issues. `src/core/reporters/html/README.md` still says the HTML export is self-contained.

**Pending cleanup (docs and config):**
- `CLAUDE.md`: about 130 lines against the under-80-line target
- Orchestrator and CLAUDE-SETUP nits
- `docs/user-guide.md`: the two "New in v1.3.0" paragraphs need checking against current output

**Waived at the 1.5.0 push (review findings, inline styles):**
- Inline styles in `src/components/CrossEntityAutomation/DetectionCoverageBanner.tsx` and `src/components/ResultsDashboard.tsx`
- Inline `color:#666` in the Cross-Entity coverage notice in `src/core/reporters/html/HtmlTemplates.ts`

**Doc drift (also on `main`):** `.claude/memory/patterns-dataverse.md` says `batchSize = 10`; the option is `initialBatchSize`.

---

## Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Primary development guide, read first |
| `COMPONENT_TYPES_REFERENCE.md` | Dataverse component type codes; check before discovery work |
| `DATAVERSE_OPTIMIZATION_GUIDE.md` | Performance patterns and GUID handling rules |
| `UI_PATTERNS.md` | UI design decisions (card-row pattern is canonical in `patterns-ui.md` PATTERN-001) |
| `docs/architecture.md` | Technical architecture |
| `docs/roadmap.md` | Future development plans |
| `docs/API_SECURITY.md` | API call reference and security considerations |
| `docs/user-guide.md` | End-user documentation |
| `CONTRIBUTING.md` | Commit conventions and development workflow |
