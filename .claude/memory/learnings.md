# PPSB Learnings & Corrections

<!-- Agents: read every entry here before starting work. These are non-negotiable rules. -->

---

## [2026-02-10] — Never use executeDataverseRequest or old toolboxAPI.dataverse path

Promoted → PATTERN-005 in patterns-dataverse.md ([2026-02-10])

---

## [2026-02-10] — getToolContext is async — always await it

**Affects:** All agents
**Severity:** Blocker
**Rule:** Always `await window.toolboxAPI.getToolContext()`. It returns a Promise, not a synchronous value.
**Context:** Treating it as synchronous returns a Promise object, not the ToolContext, causing downstream null reference errors.
**Example:**
- Wrong: `const ctx = window.toolboxAPI.getToolContext(); ctx.connectionUrl`
- Right: `const ctx = await window.toolboxAPI.getToolContext(); ctx.connectionUrl`

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

**Affects:** Developer (UI)
**Severity:** Medium
**Rule:** All boolean checkboxes in the scope selector and elsewhere must use "Include [thing]" phrasing. Never "Exclude [thing]". Invert the value internally if needed.
**Context:** "Exclude system fields" was confusing users. Changed to "Include system fields" in v0.5.3.
**Example:**
- Wrong: Checkbox label "Exclude system fields"
- Right: Checkbox label "Include system fields" (with `excludeSystemFields: !includeSystemFields` internally)

---

## [2026-02-22] — Never use DataGrid for component browser lists

**Affects:** Developer, Reviewer
**Severity:** High
**Rule:** Do not use Fluent UI `DataGrid` for any component browser list component. Always use the card-row expandable pattern (see PATTERN-001 in `.claude/memory/patterns-ui.md`).
**Context:** DataGrid caused column overflow and navigated away from the list view. The canonical examples are FlowsList.tsx and PluginsList.tsx.
**Example:**
- Wrong: `<DataGrid items={flows} columns={columns} />`
- Right: Card-row div grid with chevron, inline expand, makeStyles — see FlowsList.tsx

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

**Affects:** Developer (UI)
**Severity:** Medium
**Rule:** Detail grid items (expanded panel content) must include `minWidth: 0`, `wordBreak: 'break-word'`, and `overflowWrap: 'anywhere'` to prevent assembly names, unique names, and other long strings from overflowing their grid column.
**Context:** Plugin list and BPF list expanded detail panels had text overflow issues with long assembly names and unique names. Fixed in v0.7.2.
**Example:**
- Wrong: `detailValue: { fontSize: tokens.fontSizeBase200 }` — overflows with long values
- Right: `detailValue: { fontSize: tokens.fontSizeBase200, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }`

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

## [2026-02-26] — Version numbers in three files must always match at release time

**Affects:** Document Updater, Orchestrator, Reviewer
**Severity:** Blocker
**Rule:** Version numbers appear in three places that must all match before a release is tagged: (1) `package.json` — the `"version"` field, (2) `CHANGELOG.md` — the latest versioned entry header (e.g. `## [0.8.0] — 2026-02-26`), (3) `README.md` — the shields.io version badge at the top and any inline version references. The Document Updater must update all three in the same release step. Mismatched versions across these files is a release blocker and must be resolved before the orchestrator prints the git tag command.
**Context:** Added after noticing the README.md version badge was not explicitly included in the release workflow document-updater step. The orchestrator release sequence now requires the document-updater to confirm all three files are consistent before marking step 4 complete.
**Example:**
- Wrong: Bumping `package.json` to `0.8.0` and updating `CHANGELOG.md` but leaving the README badge on `0.7.2`
- Right: Update `package.json`, `CHANGELOG.md`, and `README.md` badge in the same step; verify all three read `0.8.0` before proceeding

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
**Rule:** When discovering flow entry points for cross-entity automation tracing, always scan flows as the starting point and group by their *target* entity. Do NOT iterate over blueprints as targets and match flows into them — this misses flows that write to entities not in the current blueprint scope (e.g., out-of-scope entities like `msnfp_awards`, `connections`). Additionally, pass the full flat `flows` array separately to handle unscoped flows (scheduled, manual, no primary entity) which never appear on any `EntityBlueprint.flows` list.
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
