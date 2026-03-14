# PPSB Learnings & Corrections

<!-- Agents: read every entry here before starting work. These are non-negotiable rules. -->

---

## [2026-02-10] — Never use executeDataverseRequest or old toolboxAPI.dataverse path

Promoted → PATTERN-005 in patterns-dataverse.md ([2026-02-10])

---

## [2026-02-10] — getToolContext is async — always await it

Promoted → PATTERN-005 in patterns-dataverse.md ([2026-03-14])

---

## [2026-02-10] — Monorepo workspace imports are forbidden

Captured → decisions.md [2026-02-10] Flat Structure

---

## [2026-02-11] — Dynamic imports break PPTB Desktop — use static imports for reporters

Promoted → PATTERN-007 in patterns-dataverse.md ([2026-02-11])

---

## [2026-02-11] — GUID formatting in OData filters — no quotes, no braces

Promoted → PATTERN-003 in patterns-dataverse.md ([2026-02-11])

---

## [2026-02-11] — Metadata API does not support startswith() or orderBy

Promoted → PATTERN-004 in patterns-dataverse.md ([2026-02-11])

---

## [2026-02-11] — orderBy is not supported in classic workflow OData queries

**Affects:** Developer, Reviewer
**Severity:** Blocker
**Rule:** Never add `orderBy` to classic workflow (`workflows` table) OData queries. Sort in memory after fetching.
**Context:** An `orderBy primaryentity` clause caused the Dataverse workflow query to fail silently, returning empty results in v0.7.1. The fix was to remove `orderBy` from the query and sort in memory.
**Example:**
- Wrong: `workflows?$select=...&$orderby=primaryentity asc` — silent empty result
- Right: Fetch without `$orderby`, then `results.sort((a, b) => a.primaryentity.localeCompare(b.primaryentity))`

---

## [2026-02-11] — Always batch large queries — HTTP 414/400 prevention

Promoted → PATTERN-002 in patterns-dataverse.md ([2026-02-11])

---

## [2026-02-11] — Publisher scope must not have separate query paths in discovery classes

Promoted → PATTERN-006 in patterns-dataverse.md ([2026-02-11])

---

## [2026-02-11] — Checkbox labels must use "Include" pattern, not "Exclude"

Promoted → PATTERN-008 in patterns-ui.md ([2026-03-14])

---

## [2026-02-22] — Never use DataGrid for component browser lists

Promoted → PATTERN-001/AUDIT-013 in patterns-ui.md ([2026-03-14])

---

## [2026-02-22] — ERD must be a single all-entities diagram

**Affects:** Developer, Architect
**Severity:** High
**Rule:** The ERD must always generate a single diagram with all entities color-coded by publisher. No per-publisher splitting, no top-N filtering, no "50+ entities" banners.
**Context:** Previous versions split ERDs per publisher and filtered to top-15 connected entities, hiding entities and producing misleading multi-diagram output. Fixed in v0.7.1.
**Example:**
- Wrong: Generating one ERD per publisher, or filtering to top 15 entities
- Right: Single ERD with all entities, publisher color-coding in the legend

---

## [2026-02-23] — BPF step count reads processstage.clientdata JSON array

**Affects:** Developer
**Severity:** High
**Rule:** Business Process Flow step counts must be read from `processstage.clientdata`, which is a top-level JSON array. Each entry has `DisplayName`, `Type`, and `Field: { AttributeName, IsRequired }`.
**Context:** BPF stages were always showing 0 steps before v0.7.2 because the parser was not reading the `clientdata` field correctly.
**Example:**
- Wrong: Reading step count from a non-existent `steps` property
- Right: Parse `JSON.parse(stage.clientdata)` as an array; each element is a step with `DisplayName`, `Type`, `Field`

---

## [2026-02-23] — Business rule descriptions: filter placeholder text

**Affects:** Developer
**Severity:** Medium
**Rule:** Always apply the `filterDescription` utility to business rule description fields before displaying them. Dataverse stores "Click to add description" as a placeholder when no description is set.
**Context:** Business rules were showing "Click to add description" in both the row preview and expanded detail panel. Fixed in v0.7.2 by applying `filterDescription` in both places.
**Example:**
- Wrong: `<Text>{rule.description}</Text>` — may show placeholder
- Right: `<Text>{filterDescription(rule.description)}</Text>`

---

## [2026-02-23] — Long strings in detail grid items need overflow protection

Promoted → AUDIT-006 in patterns-ui.md ([2026-03-14])

---

## [2026-02-23] — Theme toggle removed — use ThemeContext only

**Affects:** Developer (UI)
**Severity:** Medium
**Rule:** Do not add or re-add a standalone ThemeToggle component. Theme handling is consolidated into ThemeContext. Theme is determined by ThemeContext and does not need a manual toggle in header bars.
**Context:** ThemeToggle was removed in v0.7.2 to simplify the theme system.
**Example:**
- Wrong: Adding `<ThemeToggle />` to a header component
- Right: Use ThemeContext; no manual toggle needed

---

## [2026-02-26] — npm-shrinkwrap.json must be generated with npm, not pnpm

**Affects:** Developer, Document Updater
**Severity:** High
**Rule:** When regenerating `npm-shrinkwrap.json` after dependency changes, always use native `npm`, not `pnpm`. The pnpm-generated format creates `.pnpm` directory paths that break npm install in PPTB Desktop.
**Context:** v0.6.2 fixed a "Cannot read properties of null (reading 'matches')" error caused by a pnpm-generated shrinkwrap. See `NPM_SHRINKWRAP_GENERATION.md` for exact steps.
**Example:**
- Wrong: `pnpm install && pnpm shrinkwrap` — generates incompatible format
- Right: Follow NPM_SHRINKWRAP_GENERATION.md steps using native npm

---

## [2026-02-26] — Release workflow is owned by the orchestrator — never git push autonomously

**Affects:** Orchestrator, Developer, Document Updater
**Severity:** Blocker
**Rule:** The orchestrator owns the release sequence. When the project owner says "prepare a release" or "cut a release", invoke the `/release` skill. The sequence is: (1) Reviewer, (2) Security Auditor, (3) Document Updater — version bump in `package.json`, CHANGELOG and README badge must all match before proceeding, (4) Developer — `pnpm typecheck`, `pnpm build`, `npm shrinkwrap` in that order (shrinkwrap MUST run after version bump), (5) Orchestrator prints git commands for manual execution. The orchestrator must NEVER run `git push` itself.
**Context:** Git push to the public repo is irreversible. The project owner must retain manual control of the final push step. The orchestrator owns the release sequence coordination but hands off the actual publish action.
**Example:**
- Wrong: Orchestrator runs `git push origin v0.8.0` autonomously after tagging
- Right: Orchestrator prints `git tag v0.8.0 -m "Release v0.8.0"` and `git push origin v0.8.0` and waits for the project owner to execute them manually

---

## [2026-03-03] — Run pnpm typecheck AND pnpm build before every commit — typecheck alone is not sufficient

**Affects:** All agents
**Severity:** Blocker
**Rule:** After any set of code changes, always run BOTH `pnpm typecheck` AND `pnpm build` before committing. Running only `pnpm typecheck` is not sufficient — a passing typecheck does not guarantee the Vite build will succeed.
**Context:** After implementing entity list flag improvements, only `pnpm typecheck` was run before committing. The project owner had to point out that `pnpm build` is also required after every changeset. A clean typecheck does not catch Vite bundler errors, missing static assets, or chunk resolution issues that only surface at build time.
**Example:**
- Wrong: `pnpm typecheck` passes → commit (skipping build)
- Right: `pnpm typecheck && pnpm build` — both must pass before committing any source change

---

## [2026-02-26, updated 2026-03-13] — Version numbers in five files must always match at release time

**Affects:** Document Updater, Orchestrator, Reviewer
**Severity:** Blocker
**Rule:** Version numbers appear in five places that must all match before a release is tagged:
1. `package.json` — the `"version"` field
2. `CHANGELOG.md` — the latest versioned entry header (e.g. `## [1.1.0] — 2026-03-12`)
3. `README.md` — the shields.io version badge at the top and any inline version references
4. `src/core/reporters/JsonReporter.ts` — the `private readonly toolVersion` field (line ~24). This is hardcoded and is NOT derived from `package.json`. It must be manually updated on every release.
5. `docs/user-guide.md` — the version string in the subtitle on line 3 (e.g. `Complete guide for using Power Platform Solution Blueprint (PPSB) v1.1.0`)

The Document Updater must update all five in the same release step. Mismatched versions across any of these files is a release blocker and must be resolved before the orchestrator prints the git tag command.
**Context:** (1–3) Added 2026-02-26 after noticing the README badge was missing from the release workflow. (4–5) Added 2026-03-13: `JsonReporter.ts` contains a hardcoded `toolVersion` class field that agents repeatedly overlooked at release time; `docs/user-guide.md` line 3 subtitle also embeds the version string and was equally overlooked.
**Example:**
- Wrong: Bumping `package.json` to `1.2.0` and updating `CHANGELOG.md` and `README.md` but leaving `JsonReporter.ts` on `1.1.0` and `docs/user-guide.md` subtitle on `v1.1.0`
- Right: Update all five files in the same step; verify every location reads the new version before proceeding
- ❌ Wrong: `private readonly toolVersion = '1.1.0';` after bumping the project to `1.2.0`
- ✅ Right: `private readonly toolVersion = '1.2.0';` — updated in the same commit as `package.json`

---

## [2026-03-05] — Filter control selection: Binary inclusion uses Checkbox, categorical multi-select uses ToggleButton

**Affects:** Developer (UI), Reviewer
**Severity:** High
**Rule:** Choose filter controls based on the property's semantic nature, not just the number of values. A Checkbox filters for binary boolean inclusion (e.g., "Include X" where the inverse is just the default baseline, not a meaningful filter target). A ToggleButton group filters for categorical multi-select where all distinct values are independently useful filter targets, or where BOTH values of a binary property are equally useful. Never use a Checkbox where users would reasonably want to filter to either value independently.
**Context:** Plugin Packages filter examples: "Include packages with disabled steps" is a checkbox (only the positive value is interesting; "without disabled steps" is the default). Plugin State (Enabled vs Disabled) is a ToggleButton (both values are equally useful filter targets). This distinction prevents filter UX that doesn't map to user intent.
**Example:**
- Wrong: Using Checkbox for "Plugin State" when both Enabled and Disabled are meaningful filters
- Wrong: Using ToggleButton for "Include deprecated code" when only the positive value is a filter target
- Right: Checkbox for "Include packages with disabled steps" (positive value only)
- Right: ToggleButton for Plugin State (all values useful), Enabled/Disabled toggle (both values useful)

---

## [2026-03-05] — Plugin Stage filters are always categorical ToggleButton

**Affects:** Developer (UI), Reviewer
**Severity:** High
**Rule:** Plugin Stage filters (Pre-Validation, Pre-Operation, Post-Operation, Async) must always use ToggleButton groups with OR logic, never Checkbox. Stage is a categorical classification property with 4 distinct values where all are equally meaningful filter targets, and combinations are valid. This is distinct from "surface the notable ones" exception properties (which use Checkbox).
**Context:** Stage is a foundational property classification, not a boolean flag. Users filter by stage category. All 4 stage values define meaningful categories (e.g., "show only synchronous early-stage steps" = Pre-Validation + Pre-Operation). The key distinction: Checkboxes surface exceptions; ToggleButtons classify by category.
**Example:**
- Wrong: Using Checkbox for "Include Pre-Validation steps"
- Right: ToggleButton group with all 4 stage values selectable via OR logic

---

## [2026-03-05] — Field Security Profiles: SearchBox only, no categorical filters

**Affects:** Developer (UI), Reviewer
**Severity:** Medium
**Rule:** Field Security Profiles component list must use SearchBox only for filtering. Do not add categorical filter controls (Checkboxes, ToggleButtons, or dropdowns). This matches Security Roles behaviour and is intentional.
**Context:** Field Security Profiles are identified and filtered primarily by name. There are no meaningful categorical dimensions (like Stage, State, or Type) that warrant filter controls.
**Example:**
- Wrong: Adding ToggleButton group for "Profile Type" or "Status" to Field Security Profiles filter bar
- Right: SearchBox only

---

## [2026-03-05] — EntityList flag filter uses AND logic; all other categorical filters use OR logic

**Affects:** Developer (UI), Reviewer
**Severity:** High
**Rule:** EntityList component has a unique ToggleButton filter labeled "Has all of:" which uses AND logic — the entity must have ALL selected flag types. All other section filters (State, Type, Stage, Mode, Scope, Status, Binding, and similar categorical properties) use OR logic — show items matching ANY selected value. EntityList's AND-logic implementation must not be copied or used as a template for other filters. Use property-name group labels (e.g., "Stage:", "State:") for OR-logic filters, never the "Has all of:" label pattern.
**Context:** EntityList filters across multiple associated component dimensions (plugins, flows, rules, etc.), making AND logic appropriate for that specific case. It is the exception, not the pattern. All other categorical filters should follow the standard OR-logic expectation: show items where the property matches one of the selected values.
**Example:**
- Wrong: `<Text>Has all of:</Text>` label on a Stage filter (Stage uses OR logic)
- Wrong: Using AND logic for a State filter
- Right: EntityList uses "Has all of:" with AND logic for flag combinations
- Right: Stage filter uses "Stage:" label with OR logic: show items where stage is Pre-Validation OR Pre-Operation OR...

---

## [2026-03-07] — Release tags must be created on main, not on feature branches

**Affects:** Orchestrator, Developer
**Severity:** Blocker
**Rule:** Never create a git release tag on a feature branch or fix branch. Tags must only be created on `main` AFTER the PR is merged. If a tag is created on the wrong branch, it must be deleted (`git tag -d vX.Y.Z`) and re-applied post-merge on `main`.
**Context:** The agent created `git tag v0.9.0` on the `fix/search-and-erd-fixes` branch before the PR was merged. The tag had to be deleted and will be re-applied after merge. Tags on branches produce misleading history and can point to commits that are never part of `main`.
**Example:**
- Wrong: `git tag v0.9.0` while on branch `fix/search-and-erd-fixes` (before PR merge)
- Right: Merge the PR first, checkout `main`, pull, then `git tag v0.9.0 -m "Release v0.9.0"`

---

## [2026-03-07] — npm version also updates npm-shrinkwrap.json — include it in the release commit

**Affects:** Developer, Orchestrator, Document Updater
**Severity:** Blocker
**Rule:** When running `npm version X.Y.Z --no-git-tag-version` to bump the version, npm automatically updates BOTH `package.json` AND `npm-shrinkwrap.json`. Both files must be included in the release commit. Never commit `package.json` and `CHANGELOG.md` alone — `npm-shrinkwrap.json` must be staged too.
**Context:** After the version bump command, three files change: `package.json`, `npm-shrinkwrap.json`, and any other files updated in the same step. Omitting `npm-shrinkwrap.json` from the release commit leaves the published shrinkwrap out of sync with the declared version.
**Example:**
- Wrong: `git add package.json CHANGELOG.md && git commit -m "chore: release v0.9.0"` (shrinkwrap missing)
- Right: `git add package.json npm-shrinkwrap.json CHANGELOG.md README.md && git commit -m "chore: release v0.9.0"`

---

## [2026-03-07] — Business rule clientdata is always XML, never JSON

**Affects:** Developer
**Severity:** Blocker
**Rule:** The `clientdata` field on Dataverse `workflows` records for business rules is always XML format, not JSON. Never call `JSON.parse()` on `clientdata` — it will always throw. Detect the format with `clientdata.trimStart().startsWith('<')` before attempting any parse.
**Context:** Business rule compiled output is wrapped in `<clientdata><clientcode><![CDATA[...compiled JS...]]></clientcode></clientdata>`. Attempting `JSON.parse()` throws every time. Contrast with BPF stage `processstage.clientdata` which IS JSON — the same field name on a different table has a different format.
**Example:**
- Wrong: `const parsed = JSON.parse(rule.clientdata)` — always throws for business rules
- Right: `if (clientdata.trimStart().startsWith('<')) { /* extract CDATA JS content */ } else { /* unexpected */ }`

---

## [2026-03-07] — Business rule compiled-JS patterns (reference for parser work)

**Affects:** Developer
**Severity:** High
**Rule:** When parsing compiled JavaScript from business rule `clientdata`, recognise these variable patterns exactly. Do not guess alternative shapes — Dataverse always compiles to these forms.
**Context:** The Dataverse business rule compiler always emits variables in consistent patterns. A parser must handle all of them to correctly extract conditions and actions.
**Example:**
- Field-control vars: `var vN = v0.attributes.get('fieldname')` → fieldVarMap (key = vN, value = fieldname)
- Value vars: `var vN = (vM) ? vM.getValue() : null` OR `var vN = (vM) ? vM.getUtcValue() : null` → valueVarMap
- Derived vars (date normalisation): `var vN = (((vM) != undefined...) ? new Date(...) : null)` → derivedVarMap
- Early-return guard: uses field-control vars with `== undefined` — these are NOT conditions, they are guard clauses and must be skipped when extracting conditions
- Condition patterns: `!= undefined` (contains data), `== undefined` (does not contain data), `(vN)==(literal)` (equals), helper `vH((vN),('value'),function(){indexOf===-1})` (string contains / does not contain), `(vA) < (vB)` (comparison)
- Action patterns: direct `.setVisible()`, `.setDisabled()`, `.setRequiredLevel()`, `.setValue()`, AND the delegate pattern `vN.controls.forEach(function(c,i){ c.setVisible(true) })` — both patterns must be handled

---

## [2026-03-07] — Debug artifacts must be removed before any release commit

**Affects:** Developer, Reviewer
**Severity:** High
**Rule:** Temporary debug fields, debug HTML blocks, and diagnostic console.log statements are acceptable during active development but must be fully removed before any release. The `/pre-commit` skill (reviewer + security-auditor) must catch these; reviewer must explicitly check for debug artifacts in every pre-release review.
**Context:** Debug fields (`rawClientData`, `rawXaml` on `BusinessRuleDefinition`) and a `<details>` raw-data HTML block were present in a release candidate. A diagnostic `console.log` block in `htmlScripts()` was also included in production output. These had to be manually identified and removed.
**Example:**
- Wrong: Committing `rawClientData?: string` on a public-facing type interface in a release
- Wrong: Leaving `<details><summary>Raw clientdata</summary>...</details>` in the HTML export template
- Wrong: `console.log('DEBUG business rule clientdata:', rule.clientdata)` in production `htmlScripts()`
- Right: Remove all `raw*` debug fields, `<details>` debug blocks, and diagnostic console.log before staging the release commit

---

## [2026-03-07] — Tooltip innerHTML values in embedded JS must be HTML-escaped

**Affects:** Developer
**Severity:** Blocker
**Rule:** Any Cytoscape (or similar) tooltip content written via `tip.innerHTML = ...` must pass all graph data values through an HTML escape helper before insertion. Never insert raw `n.data(...)` or `e.data(...)` values directly into innerHTML.
**Context:** Graph node and edge labels sourced from Dataverse (entity names, field names, relationship names) may contain `<`, `>`, `&`, or `"` characters, which would break the tooltip HTML structure or open an XSS vector.
**Example:**
- Wrong: `` tip.innerHTML = `<b>${n.data('label')}</b>`; ``
- Right:
```javascript
var _esc = function(s) {
  return (s == null ? '' : String(s))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
// Then: tip.innerHTML = `<b>${_esc(n.data('label'))}</b>`;
```

---

## [2026-03-07] — CrossEntityAnalyzer must use source-centric scan, not blueprint-centric scan

**Affects:** Developer, Architect
**Severity:** High
**Rule:** When discovering flow entry points for cross-entity automation tracing, always scan flows as the starting point and group by their *target* entity. Do NOT iterate over blueprints as targets and match flows into them — this misses flows that write to entities not in the current blueprint scope (e.g., out-of-scope entities like `custom_entity`, `connections`). Additionally, pass the full flat `flows` array separately to handle unscoped flows (scheduled, manual, no primary entity) which never appear on any `EntityBlueprint.flows` list.
**Context:** The initial implementation of `discoverEntryPoints` iterated over blueprints as target entities, so flows pointing at out-of-scope targets were silently dropped. The fix (`discoverAllEntryPoints`) groups by target entity derived from flow definitions directly — even entities not in blueprints appear in the chain. A third `allFlows` argument was added to `CrossEntityAnalyzer.analyze()` to cover unscoped flows.
**Example:**
- Wrong: `for (const bp of blueprints) { matchFlowsInto(bp) }` — drops out-of-scope targets
- Right: `for (const flow of allFlows) { groupByTarget(flow) }` — source-centric, captures all targets

---

## [2026-03-07] — Dataverse flow primaryentity returns literal "none" for unscoped flows, not null

**Affects:** Developer
**Severity:** High
**Rule:** When reading `primaryentity` from Dataverse `workflows` records for Power Automate flows, the field returns the literal string `"none"` (not null, not undefined) for flows that have no primary entity (scheduled, manual, or unbound flows). A null check alone (`if (!flow.entity)`) will pass for `"none"` because a non-empty string is truthy, causing `"none"` to be used as the entity name in downstream logic. Always treat `flow.entity === 'none'` the same as null.
**Context:** `CrossEntityAnalyzer` was using `"none"` as the source entity label because the null guard `if (flow.entity)` evaluated true for the literal string `"none"`. Fixed by adding an explicit `|| flow.entity === 'none'` check everywhere `primaryentity` is consumed.
**Example:**
- Wrong: `if (!flow.entity) { /* skip unscoped */ }` — passes for `"none"`, pollutes entity labels
- Right: `if (!flow.entity || flow.entity === 'none') { /* skip or handle as unscoped */ }`

---

## [2026-03-07] — CDN library versions in HTML export must be pinned to specific versions

**Affects:** Developer
**Severity:** High
**Rule:** All CDN `<script>` tags in the HTML export template must reference a specific pinned version (e.g., `mermaid@10.9.1`), never a floating major version (e.g., `mermaid@10`). Floating versions can silently update and break the exported HTML output.
**Context:** The Cytoscape CDN reference was already pinned to `@3.33.1`. The Mermaid CDN reference was using floating `@10` which can silently pull in a breaking minor update. All CDN libraries in the export must follow the same pinned-version convention.
**Example:**
- Wrong: `<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>`
- Right: `<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>`

---

## [2026-03-08] — All discovery classes that batch must use withAdaptiveBatch and FetchLogger

Promoted → PATTERN-017 in patterns-dataverse.md ([2026-03-14])

---

## [2026-03-09] — Full UI/UX audit completed — all findings codified as hard rules

Findings captured as AUDIT-001 through AUDIT-013 in `.claude/memory/patterns-ui.md`. See that file for all specs. ([2026-03-09])

---

## [2026-03-09] — AUDIT rules are enforced at every commit/push/review — not just full audits

**Affects:** Developer, Reviewer, Orchestrator
**Severity:** Blocker
**Rule:** AUDIT-001 through AUDIT-013 must be checked by the developer before declaring implementation done, and by the reviewer on every pre-commit review. Tech debt must be caught at the point of introduction, NOT deferred to a periodic full audit. The reviewer agent's checklist now includes an explicit "Fluent UI v9 Audit Rules" section (AUDIT-001–013) that must be worked through on every review. The developer agent's self-check (step 5b) must confirm all audit rules before signing off.
**Context:** The project owner explicitly requested: "I want each commit or push or review to validate we are good." The reviewer.md and developer.md agent definitions were updated on 2026-03-09 to embed all 13 audit rules as explicit checklist items. CLAUDE.md was also updated with a "UI Hard Rules" table summarising all 13 rules. These changes mean any new violation will be caught at review time rather than only at a full periodic audit.
**Example:**
- Wrong: Developer writes a new component with `<Badge color="success">Label</Badge>` (missing `shape`) and only runs typecheck — the violation slips through
- Right: Developer self-check (step 5b) catches missing `shape` prop before declaring done; reviewer's AUDIT-002 checklist item catches it as a blocker if not

---

## [2026-03-09] — Sticky table columns: zIndex is required on body cells, not just headers

Promoted → PATTERN-018 in patterns-ui.md ([2026-03-14])

---

## [2026-03-10] — Full icon alignment with Power Apps solution explorer (componentIcons.ts)

Promoted → PATTERN-019 in patterns-ui.md ([2026-03-14])

---

## [2026-03-10] — LLM-based dead code detection is unreliable — run knip first

**Affects:** All agents
**Severity:** High
**Rule:** When performing a codebase audit, ALWAYS run `pnpm lint:unused` (knip) FIRST before any LLM analysis. Knip performs definitive import-graph tracing and is the authoritative source for unused exports and dead files. LLM audit findings for dead code and unused exports are unreliable without it. The audit report must include knip output as its first section.
**Context:** During a deep audit this session, the LLM-based Explore agent missed three dead files: `SecurityOverview.tsx` (470 lines), `ErrorState.tsx`, and `LoadingState.tsx`. It claimed "no unreachable code detected". Root cause: LLM sampling cannot exhaustively trace every export against every import in a large codebase. Knip found them immediately.
**Example:**
- Wrong: Run LLM code audit → report "no dead code found" → ship
- Right: Run `pnpm lint:unused` → review knip output first → then use LLM for deeper analysis of findings knip surfaces

---

## [2026-03-10] — Knip warns: Props interfaces and reserved enum members are intentional

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** Props interfaces (e.g. `FlowsListProps`) exported for documentation clarity but never imported externally, and `ComponentType` enum members (`PluginType`, `PluginAssembly`, `SdkMessageProcessingStepImage`) reserved for future Dataverse component detection, are intentionally accepted knip warnings. Configure knip with `types: 'warn'` and `enumMembers: 'warn'` — do NOT suppress these entirely. They must remain visible so any unexpected growth in the count (or a type that could leak sensitive data) is caught.
**Context:** knip surfaces these as "unused" because they are never imported elsewhere in the codebase. Both categories are intentional: props interfaces exist for documentation; reserved enum members exist to avoid type-code guessing when future discovery work is added. Full suppression would hide genuine regressions.
**Example:**
- Wrong: Adding `ignore: ['*Props', 'ComponentType']` to knip config — silences all future leaks
- Right: `types: 'warn'` and `enumMembers: 'warn'` — they surface in output but do not fail CI; review count if it grows

---

## [2026-03-10] — SecurityRolesView.tsx is the live component; SecurityOverview.tsx was dead and is deleted

**Affects:** Developer, Reviewer
**Severity:** High
**Rule:** All security roles UI changes must be made to `SecurityRolesView.tsx`. `SecurityOverview.tsx` was a dead duplicate (470 lines) that was never wired into `ResultsDashboard.tsx` and has been deleted. Do not recreate it.
**Context:** `SecurityOverview.tsx` was discovered by knip as a dead file during the 2026-03-10 audit. It had never been connected to `ResultsDashboard.tsx` (which imports `SecurityRolesView.tsx`). The file was deleted as part of the dead code cleanup. Any future work on the security roles tab must target `SecurityRolesView.tsx`.
**Example:**
- Wrong: Creating or editing a file named `SecurityOverview.tsx` for security roles display
- Right: Edit `SecurityRolesView.tsx` — it is the component rendered by `ResultsDashboard.tsx`

---

## [2026-03-10] — ClassicWorkflowXamlParser: self-closing tags matched by both patterns — guard required

**Affects:** Developer
**Severity:** High
**Rule:** In `ClassicWorkflowXamlParser.extractSteps`, the `openTagPattern` (`<Element\b([^>]*)>`) also matches self-closing tags (`<Element ... />`) because `[^>]*>` matches the `>` in `/>`. Always guard the open-tag loop body with `if (attrs.trimEnd().endsWith('/')) continue;` to skip self-closing tags already handled by `selfClosingPattern`. Without this guard, every self-closing XAML step is parsed twice, producing duplicate Classic Workflow entry points in the pipeline traces.
**Example:**
- Wrong: `openTagPattern` loop with no self-closing guard → duplicate entries for `<mxswa:UpdateEntity ... />`
- Right: `if (attrs.trimEnd().endsWith('/')) continue;` at the top of the open-tag loop body

---

## [2026-03-10] — Fluent UI icon SVG paths are extractable from @fluentui/react-icons npm package

**Affects:** Developer
**Severity:** Medium
**Rule:** Actual Fluent UI icon SVG path data can be extracted directly from `node_modules/@fluentui/react-icons/lib/sizedIcons/chunk-*.js`. Each icon is registered as `createFluentIcon('Name', '24', ['<path-data>'])`. The path array contains a single `d` string. Use `viewBox="0 0 24 24" fill="currentColor"` for 24-size icons. This is the source of truth for `navIcon()` in `HtmlTemplates.ts` — never hand-craft approximations when the real path is available.
**Example:**
- Wrong: Hand-crafting a rough stroke-based SVG approximation for navIcon('flows')
- Right: Extract actual path from chunk-*.js: `grep -A1 "CloudFlow24Regular = " lib/sizedIcons/chunk-*.js`

---

## [2026-03-10] — Security role privilege depths use Power Platform UI terminology

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** Map Dataverse privilege depth values to Power Platform UI terminology everywhere they are displayed: `Basic` → `User`, `Local` → `BU`, `Deep` → `P:CBU`, `Global` → `Org`. Use the legend "User = own records · BU = Business Unit · P:CBU = Parent & Child BUs · Org = Organisation-wide". Apply to both the React UI (`depthLabel` helper in SecurityOverview.tsx) and HTML export (`privDepthLabel` helper in HtmlTemplates.ts).

---

## [2026-03-10] — Special Permissions Matrix must filter out roles with no special permissions

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** The Special Permissions Matrix (both React UI and HTML export) must only show rows for security roles that have at least one special permission set to `true`. Showing all roles produces empty rows for roles with no special permissions. Filter: `securityRoles.filter(role => specialPermissionKeys.some(key => role.specialPermissions[key]))`. If no roles have special permissions, show a "No roles have special permissions" message instead of an empty table.

---

## [2026-03-10] — HTML export sections for Custom APIs, BRs, and BPFs must use accordion with details

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** The HTML export sections for Custom APIs, Business Rules, and Business Process Flows must use collapsible accordion rows (not flat tables) to show full details in the expanded panel:
- Custom APIs: expanded panel shows request parameters table (uniqueName, type, isOptional, description) and response properties table
- Business Rules: expanded panel shows conditions table (field, operator, value, logicOperator) and actions table (type, field, value/message)
- BPFs: expanded panel shows stages with their steps (stepName, fieldName, required)
Using flat tables with only counts (e.g. "5 conditions") was insufficient — users need to see the actual content without leaving the export.

---

## [2026-03-09, updated 2026-03-12] — Globe20Regular for inline external-call indicators

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** Use `Globe20Regular` for inline "makes external calls" row indicators across all component lists. `DocumentGlobe24Regular` and `Globe20Regular` are visually distinct — no ambiguity.
**Context:** Web Resources moved to `DocumentGlobe24Regular` (MS icon: globe+document). `Globe24Regular` is now used for the External Dependencies navigation tab.
**Example:**
- Wrong: `<ArrowUpRight20Regular />` as the icon for an inline external API call indicator
- Right: `<Globe20Regular />` for inline external-call row indicators; `DocumentGlobe24Regular` for Web Resources tab; `Globe24Regular` for External Dependencies tab

---

## [2026-03-09] — All component-category icons must live in componentIcons.ts

Promoted → PATTERN-019 in patterns-ui.md ([2026-03-14])

---

## [2026-03-10] — Plugin icon is PuzzlePiece24Regular; Environment Variables icon is BracesVariable24Regular

Promoted → PATTERN-019 in patterns-ui.md ([2026-03-14])

---

## [2026-03-09] — Replace all inline emoji with Fluent UI icon components in the React UI

Promoted → PATTERN-020 in patterns-ui.md ([2026-03-14])

---

## [2026-03-09] — Footer links use window.open only — no toast, no clipboard copy

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** Footer links must open with `window.open(url, '_blank', 'noopener,noreferrer')` only. Do not show a toast notification and do not call `copyToClipboard`. PPTB Desktop does not route `window.open` to `shell.openExternal` — that is a known platform limitation and is acceptable.
**Context:** An earlier implementation added a toast and clipboard fallback. The project owner confirmed the simpler `window.open` call is correct and no fallback is needed.
**Example:**
- Wrong: `copyToClipboard(url); showToast('Link copied')` as a fallback
- Right: `window.open(url, '_blank', 'noopener,noreferrer')`

---

## [2026-03-09] — HTML export icons: navIcon/alertIcon helpers; never emoji in exported HTML

Promoted → PATTERN-021 in patterns-ui.md ([2026-03-14])

---

## [2026-03-09] — Two-pass discovery: Pass 2 must be silent; snap to 100% after it completes

Promoted → PATTERN-022 in patterns-dataverse.md ([2026-03-14])

---

## [2026-03-09] — Fluent UI icon names: verify exact export name, do not assume size suffix

**Affects:** Developer, Reviewer
**Severity:** High
**Rule:** Not all Fluent UI icons follow the `Name24Regular` pattern. Before using any icon, verify its exact export name by running `pnpm typecheck` or checking the `@fluentui/react-icons` package source. The size suffix (e.g. `24`) is sometimes omitted entirely. Example: `TextBulletListSquareSettings24Regular` does NOT exist — the correct name is `TextBulletListSquareSettingsRegular` (no size suffix). Never assume the suffix is present.
**Context:** Importing a non-existent icon name causes a TypeScript error that only surfaces at typecheck time. The safe workflow is: write the import → typecheck → adjust the name if the error points to the specific export.
**Example:**
- Wrong: `import { TextBulletListSquareSettings24Regular } from '@fluentui/react-icons'` — does not exist
- Right: `import { TextBulletListSquareSettingsRegular } from '@fluentui/react-icons'` — correct name

---

## [2026-03-09] — HTML export: ALL data strings must go through htmlEscape() — including enum-like strings

**Affects:** Developer, Reviewer
**Severity:** Blocker
**Rule:** Every value sourced from analysis data that is written into an HTML template literal in `HtmlTemplates.ts` or `HtmlReporter.ts` MUST be wrapped in `this.htmlEscape()` (or the equivalent helper). This includes fields that look like enums or constants at the TypeScript type level (e.g. `automationType`, `operation`, `mode`, `confidence`, `entryPoint`) — they are typed as `string` and their actual runtime values are untrusted. No string from analysis data ever bypasses escaping.
**Context:** Reviewer found 6 XSS vectors in the pipeline traces HTML section where string fields from `CrossEntityTrace` and activation records were written directly into template literals. All six were enum-like in TypeScript but still typed as `string`.
**Example:**
- Wrong: `` `<td>${trace.automationType}</td>` `` — raw string, potential XSS
- Right: `` `<td>${this.htmlEscape(trace.automationType)}</td>` ``

---

## [2026-03-09] — HTML export coverage notices must use CSS class, not inline hex colour

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** Coverage notices and informational call-outs in the HTML export must use existing CSS classes (`alert alert-info`, `alert alert-warning`) rather than inline `style="background-color:#e8f4fd"` or similar hardcoded hex. Inline hex colours break dark-mode rendering and do not adapt to the HTML export's theme toggle.
**Context:** A `coverageNotice` div was using `style="background:#e8f4fd; border-left:4px solid #0078d4"` instead of the `<div class="alert alert-info">` class already defined in the HTML export stylesheet. Reviewer flagged it as a dark-mode violation.
**Example:**
- Wrong: `<div style="background:#e8f4fd; border-left:4px solid #0078d4">Coverage: ...</div>`
- Right: `<div class="alert alert-info">Coverage: ...</div>`

---

## [2026-03-09] — catch blocks in BlueprintGenerator must push to stepWarnings, not console.error

**Affects:** Developer, Reviewer
**Severity:** High
**Rule:** When a non-fatal error occurs during blueprint generation (e.g. a discovery phase partially fails), push a structured entry to `this.stepWarnings` rather than calling `console.error()`. The format is `{ step: string, message: string, partial: true }`. `console.error` produces noise in the PPTB Desktop console and is invisible to the user; stepWarnings surfaces the issue in the UI and is included in the JSON/HTML export report.
**Context:** Column security discovery catch blocks were calling `console.error()`. Reviewer flagged them as violating the stepWarnings contract established in BlueprintGenerator.
**Example:**
- Wrong: `catch (err) { console.error('Column security failed', err); }`
- Right: `catch (err) { this.stepWarnings.push({ step: 'column-security', message: String(err), partial: true }); }`

---

## [2026-03-08] — N+1 query patterns must be replaced with a single batched pass

Promoted → PATTERN-002 in patterns-dataverse.md ([2026-03-14])

---

## [2026-03-10] — canvasapps OData field restrictions and Custom Page detection

**Affects:** Developer, Reviewer
**Severity:** Blocker
**Rule:** The `canvasapps` Dataverse entity does NOT expose `modifiedon` or `createdon` via OData. Do not include either in `$select` — the query will fail with 0x80060888. Use `canvasapptype` to distinguish subtypes.
**canvasapptype values:**
- `0` = Standard canvas app
- `1` = Component library (skip — not a user-facing app)
- `2` = Custom page
**Discovery:** Both Canvas Apps (type 0) and Custom Pages (type 2) use solution component type **300** in `solutioncomponents`. There is NO separate component type code for Custom Pages. Split post-retrieval by `canvasapptype`.
**OData filter for custom pages:** `GET /canvasapps?$filter=canvasapptype eq 2`
**Example:**
- Wrong: `select: ['canvasappid', 'displayname', 'name', 'ismanaged', 'modifiedon']` → OData error
- Wrong: Expecting custom pages to have componenttype 10004 in solutioncomponents → they use 300
- Right: `select: ['canvasappid', 'displayname', 'name', 'description', 'ismanaged', 'canvasapptype']`, then split on `canvasapptype === 2`

---

## [2026-03-11] — Text overflow violations in components that do not use useCardRowStyles

**Affects:** Developer, Reviewer
**Severity:** High
**Rule:** AUDIT-005 and AUDIT-006 must be checked in EVERY component that has a card-row or detail-grid layout, not only those that use `useCardRowStyles`. Components that define their own local `makeStyles` (rather than extending the shared hook) are the highest-risk source of text overflow regressions.

**Components confirmed violating as of 2026-03-11 (now fixed):**

| Component | Violation | Root cause |
|-----------|-----------|------------|
| `FieldsTable.tsx` | AUDIT-006: local `detailValue` missing `minWidth: 0`, `wordBreak`, `overflowWrap` | Own makeStyles, not extending shared hook |
| `FieldsTable.tsx` | AUDIT-008: bare `SearchBox` outside `FilterBar` | Not using FilterBar wrapper |
| `RelationshipsView.tsx` | AUDIT-006: local `detailValue` missing `minWidth: 0`, `wordBreak`, `overflowWrap` | Own makeStyles, not extending shared hook |
| `RelationshipsView.tsx` | PATTERN-001 rule 5: `TruncatedText` used in card-row list row cells | Forces `whiteSpace: nowrap` — text overlaps |
| `PluginsList.tsx` | PATTERN-001 rule 5: `TruncatedText` in expanded description detail | Forces truncation instead of wrapping |
| `WebResourcesList.tsx` | PATTERN-001 rule 5: `TruncatedText` in expanded description and URL detail | Forces truncation instead of wrapping |
| `FlowsList.tsx` | PATTERN-001 rule 5: `TruncatedText` in expanded URL detail | Forces truncation instead of wrapping |

**Check every new component for:**
1. Any local `nameColumn` style — must have `minWidth: 0` AND `wordBreak: 'break-word'`
2. Any local `detailValue` style — must have `minWidth: 0`, `wordBreak: 'break-word'`, `overflowWrap: 'anywhere'`
3. Any `TruncatedText` usage in card-row rows or detail values — replace with plain `<Text>` + `wordBreak` styles; `TruncatedText` may only be used in genuine column-constrained contexts where overflow is truly unavoidable
4. Any `SearchBox` outside `FilterBar` in a component list — wrap in `FilterBar`

**Fix pattern for TruncatedText in card-row rows:**
```tsx
// Wrong — causes overlapping text
<Text weight="semibold"><TruncatedText text={rel.SchemaName} /></Text>

// Right — wraps properly
<Text weight="semibold" className={styles.nameColumn}>{rel.SchemaName}</Text>
```

---

## [2026-03-11, updated 2026-03-12] — Globe20Regular is the standard external-call row indicator

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** `Globe20Regular` is the standard inline external-call row indicator across ALL component lists (FlowsList, WebResourcesList, etc.).

**Rationale:** `DocumentGlobe24Regular` (document + globe) and `Globe20Regular` (plain globe) are visually distinct icons — no ambiguity. `Globe20Regular` (plain globe = "the internet") is the correct semantic choice for an inline "makes external calls" indicator. `ArrowUpRight20Regular` is NOT used for this purpose.

**Summary:**
- All component row indicators for "has external calls" → `Globe20Regular`
- Web Resources component-category icon → `DocumentGlobe24Regular` (from componentIcons.ts)
- External Dependencies nav tab → `Globe24Regular` (from componentIcons.ts)

---

## [2026-03-11] — All toggle handlers in list components must be wrapped in useCallback

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** Every toggle handler function in a list component (`toggleExpand`, `toggleStageFilter`, `toggleStateFilter`, `toggleHasDefaultFilter`, and any similar function that closes over component state and is passed as a prop or used in JSX) must be wrapped in `useCallback` with appropriate dependencies. Bare inline arrow functions or `function` declarations directly in the component body are not acceptable.
**Context:** Carry-forward reviewer fix applied across ConnectionReferencesList, PluginsList, and EnvironmentVariablesList on 2026-03-11. Components without useCallback on toggle handlers cause unnecessary child re-renders and fail the reviewer's React patterns checklist.
**Example:**
- Wrong: `const toggleExpand = (id: string) => { setExpanded(prev => ...); };`
- Right: `const toggleExpand = useCallback((id: string) => { setExpanded(prev => ...); }, []);`

---

## [2026-03-11] — Explicit JSX.Element return types required on exported components and inner render functions

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** All exported React function components and all inner render helper functions (e.g. `renderPluginDetails`, `renderFlowDetails`) must have an explicit `JSX.Element` (or `React.ReactElement`) return type annotation. Never omit the return type annotation and rely on TypeScript inference alone.
**Context:** Carry-forward reviewer fix applied to PluginsList and EnvironmentVariablesList on 2026-03-11. Explicit return types make contract violations visible at the call site immediately and are required by the reviewer checklist.
**Example:**
- Wrong: `const renderPluginDetails = (plugin: Plugin) => { return <div>...</div>; }`
- Right: `const renderPluginDetails = (plugin: Plugin): JSX.Element => { return <div>...</div>; }`
- Right (exported component): `export const PluginsList = (): JSX.Element => { ... }`

---

## [2026-03-11] — OData injection guard required in all discovery methods that accept user-supplied strings

**Affects:** Developer, Reviewer
**Severity:** Blocker
**Rule:** Any discovery method that inserts a caller-supplied string directly into an OData filter string must sanitise the input before use. The minimum guard is: strip or encode characters that have special meaning in OData (`'`, `"`, `;`, `(`, `)`, `$`). For entity logical names and GUIDs, which follow a known safe pattern, a regex allowlist guard is sufficient: `/^[a-z0-9_]+$/i.test(value)` — throw or skip if the test fails.
**Context:** FlowDiscovery.getFlowsForEntity accepted an entity logical name from the caller and inserted it directly into an OData filter. An injection guard was added as a carry-forward fix on 2026-03-11. Any discovery method that constructs OData filter strings from external or caller-supplied input must apply the same guard.
**Example:**
- Wrong: `` `primaryentity eq '${entityName}'` `` with no validation of entityName
- Right: `if (!/^[a-z0-9_]+$/i.test(entityName)) throw new Error('Invalid entity name');` then use entityName in filter

---

## [2026-03-11] — mergeClasses must replace string concatenation for Fluent UI class composition

**Affects:** Developer, Reviewer
**Severity:** Medium
**Rule:** When conditionally composing Fluent UI `makeStyles` class names, always use `mergeClasses(...)` from `@fluentui/react-components`. Never concatenate class names with string interpolation (e.g. `` `${styles.base} ${isActive ? styles.active : ''}` ``). String concatenation can produce spurious leading/trailing spaces and bypasses Fluent UI's de-duplication logic.
**Context:** Carry-forward reviewer fix applied to EnvironmentVariablesList on 2026-03-11. Several class assignments were using template-literal string concatenation instead of `mergeClasses`.
**Example:**
- Wrong: `` className={`${styles.cardRow} ${isExpanded ? styles.expanded : ''}`} ``
- Right: `className={mergeClasses(styles.cardRow, isExpanded && styles.expanded)}`

---

## [2026-03-12] — Present a fix brief and wait for approval before implementing reviewer-flagged changes

**Affects:** Developer, Orchestrator
**Severity:** High
**Rule:** Before implementing any fixes for reviewer-flagged blockers or high-severity comments, present a brief summary of each issue and the proposed fix approach to the project owner. Do not touch any code until the project owner explicitly approves the plan.
**Context:** The agent jumped straight into implementing reviewer fixes without first checking with the project owner. The correct workflow is: (1) list each blocker/issue with a one-line description of what is wrong, (2) state the intended fix approach for each, (3) wait for the project owner to say "go ahead" or adjust the plan, then (4) implement.
**Example:**
- Wrong: Reviewer flags 3 blockers → agent immediately edits source files to address them
- Right: Reviewer flags 3 blockers → agent posts a brief ("Issue 1: missing shape prop on Badge — fix: add shape='rounded'. Issue 2: ...") → project owner approves → agent implements

---

## [2026-03-12] — Split staged files into separate commits by logical area before git add/commit

**Affects:** Developer, Orchestrator
**Severity:** Blocker
**Rule:** When multiple batches of changes exist (e.g. a feature implementation, a refactor sweep, a UI token/style audit pass, and review compliance fixes), split them into separate commits by logical area BEFORE running `git add`. Never bundle unrelated file groups into a single commit just because they all passed review together. CLAUDE.md already mandates "one logical change per commit" — that rule applies even when a large set of files is ready at the same time.
**Context:** The agent bundled 24 files of unrelated changes — core feature files, export/reporter changes, a UI token sweep, and review compliance fixes — into a single commit. All four groups had passed pre-commit review, but they were logically independent changes and should have been committed separately. Passing review does not override the one-logical-change rule.
**Example:**
- Wrong: `git add src/core/discovery/PluginDiscovery.ts src/core/reporters/HtmlReporter.ts src/components/PluginsList.tsx src/components/FlowsList.tsx ... (24 files) && git commit -m "feat: ..."`
- Right:
  1. `git add <core feature files> && git commit -m "feat(plugins): ..."`
  2. `git add <export/reporter files> && git commit -m "feat(export): ..."`
  3. `git add <UI token/style files> && git commit -m "style: apply token sweep to all component lists"`
  4. `git add <review compliance files> && git commit -m "fix(review): address reviewer findings across component lists"`

---

## [2026-03-12] — Only .claude/memory/interactions/ is gitignored — all other memory files are git-tracked

**Affects:** All agents
**Severity:** Blocker
**Rule:** Never claim that `.claude/memory/` files are gitignored. Only the `.claude/memory/interactions/` subdirectory is gitignored. All other files directly under `.claude/memory/` — `learnings.md`, `project.md`, `decisions.md`, `patterns-dataverse.md`, `patterns-ui.md`, and any future files added there — are tracked by git and must be committed normally like any other project file.
**Context:** The agent repeatedly and incorrectly stated that memory files were gitignored, which would have caused agents to skip committing important project state. The `.gitignore` only excludes `interactions/` (session logs), not the persistent memory files.
**Example:**
- Wrong: "I will not commit `.claude/memory/learnings.md` because memory files are gitignored"
- Wrong: Treating any `.claude/memory/*.md` file as excluded from version control
- Right: Stage and commit `.claude/memory/learnings.md`, `project.md`, `decisions.md`, `patterns-*.md` along with any other changed project files
- Right: Only `.claude/memory/interactions/` (session logs) is gitignored and must never be committed

---

## [2026-03-13] — Never reimplement shared utilities — check src/core/utils/ and src/hooks/ first

Promoted → patterns-general.md D1–D6 ([2026-03-14])

---

## [2026-03-13] — buildOrFilter() must be used for all OData OR-filter construction

Promoted → patterns-general.md D2 ([2026-03-14])
