# PPSB Learnings & Corrections

<!-- Agents: read every entry here before starting work. These are non-negotiable rules. -->

---

## [2026-02-10] — Never use executeDataverseRequest or old toolboxAPI.dataverse path

**Affects:** All agents
**Severity:** Blocker
**Rule:** Never call `executeDataverseRequest()` (it does not exist) and never use `window.toolboxAPI.dataverse.queryData()` (old structure). Always use `window.dataverseAPI.queryData()`.
**Context:** Pre-v0.5.1 code used the old API shape. The official `@pptb/types` package defines `window.dataverseAPI` as the correct global. Using the wrong path results in runtime errors.
**Example:**
- Wrong: `window.toolboxAPI.dataverse.queryData(...)`
- Wrong: `window.executeDataverseRequest(...)`
- Right: `window.dataverseAPI.queryData(...)`

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

**Affects:** All agents
**Severity:** Blocker
**Rule:** Never use workspace package references (`@ppsb/core`, `@ppsb/pptb-tool`) in imports. Always use relative paths.
**Context:** The project was refactored from a monorepo to a flat structure in v0.5.1. Workspace imports no longer resolve.
**Example:**
- Wrong: `import { BlueprintGenerator } from '@ppsb/core/generators/BlueprintGenerator'`
- Right: `import { BlueprintGenerator } from './core/generators/BlueprintGenerator'`

---

## [2026-02-11] — Dynamic imports break PPTB Desktop — use static imports for reporters

**Affects:** All agents
**Severity:** Blocker
**Rule:** Never use dynamic `import()` for reporters (MarkdownReporter, HtmlReporter, JsonReporter, ZipPackager). Always use static imports.
**Context:** Dynamic imports create separate Vite chunks. PPTB Desktop serves the tool via `pptb-webview://` protocol, which cannot resolve dynamically chunked paths. This caused all export operations to fail silently in v0.7.1. Fixed in v0.7.2 by converting to static imports.
**Example:**
- Wrong: `const { MarkdownReporter } = await import('./reporters/MarkdownReporter');`
- Right: `import { MarkdownReporter } from './reporters/MarkdownReporter';`

---

## [2026-02-11] — GUID formatting in OData filters — no quotes, no braces

**Affects:** All agents
**Severity:** Blocker
**Rule:** In OData `$filter` strings, GUIDs must be raw (no single quotes, no curly braces). Always strip braces with `.replace(/[{}]/g, '')` before building the filter string.
**Context:** Custom connector queries were broken in v0.7.1 because the filter was adding braces instead of removing them (`connectorid eq {guid}`). Classic workflow queries also failed. Dataverse returns GUIDs with braces; OData filters need them without.
**Example:**
- Wrong: `filter: \`connectorid eq '${id}'\`` (quoted)
- Wrong: `filter: \`connectorid eq {${id}}\`` (braced)
- Right: `const clean = id.replace(/[{}]/g, ''); filter: \`connectorid eq ${clean}\``

---

## [2026-02-11] — Metadata API does not support startswith() or orderBy

**Affects:** All agents
**Severity:** Blocker
**Rule:** When querying `EntityDefinitions` (or any metadata endpoint), never use `startswith()`, `orderBy`, or complex OData functions. Fetch all matching records with basic equality filters only, then filter and sort in memory.
**Context:** Publisher-scope queries were using `startswith(LogicalName, 'prefix_')` which caused "query parameter not supported" errors. Removed in v0.5.3.
**Example:**
- Wrong: `filter: "startswith(LogicalName, 'cr123_')"` — API error
- Wrong: `orderBy: ['LogicalName']` — API error
- Right: Fetch all with `filter: 'IsCustomEntity eq true'`, then `result.filter(e => e.LogicalName.startsWith('cr123_')).sort(...)`

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

**Affects:** All agents
**Severity:** Blocker
**Rule:** Any query fetching 20+ records by GUID must use batching (`batchSize = 20`, or 10 for privilege queries). Never build a single OData filter with 20+ OR clauses.
**Context:** Security role privileges (500-1000+ per role), form queries (100+ entities), field permissions, and workflow classification all caused HTTP 414/400 errors before batching was implemented in v0.5.3.
**Example:**
- Wrong: `const filter = ids.map(id => \`fieldid eq ${id}\`).join(' or ');` — 100+ ids = URL too long
- Right: Loop in chunks of 20, collect all results

---

## [2026-02-11] — Publisher scope must not have separate query paths in discovery classes

**Affects:** Architect, Developer
**Severity:** High
**Rule:** Publisher scope is always converted to solution IDs at the UI/conversion layer. Discovery classes only receive solution IDs. Never add publisher-specific methods to discovery classes.
**Context:** The original implementation had `getEntitiesByPublisher()` which duplicated code and tried to use unsupported metadata API features. Removed in v0.5.3 (78 lines deleted).
**Example:**
- Wrong: Creating `discoverPluginsByPublisher(publisherPrefix)` in PluginDiscovery
- Right: Resolve publisher → solution IDs in the hook/conversion layer, then call `discoverPlugins(solutionIds)`

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
**Rule:** Do not use Fluent UI `DataGrid` for any component browser list component. Always use the card-row expandable pattern (see PATTERN-001 in patterns.md).
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
**Rule:** When the project owner says "prepare a release" or "cut a release", the orchestrator must run the following sequence in order: (1) Reviewer — final code review of all changed files, (2) Security Auditor — full sweep of code and `.claude/` folder, (3) Document Updater — bumps version in `package.json`, finalises `CHANGELOG.md` with release date, updates `README.md` version badge and any inline version references — all three must match before proceeding, (4) Developer — runs `pnpm typecheck` (must pass zero errors), then `pnpm build` (must succeed), then `npm shrinkwrap` to capture the updated version from `package.json` — shrinkwrap must always run AFTER the version bump or it will capture the old version number, (5) Orchestrator — confirms all steps passed, then prints the exact git commands for the project owner to run manually: `git add .`, `git commit -m "chore: release v[version]"`, `git tag v[version] -m "Release v[version]"`, `git push origin main`, `git push origin v[version]`. The orchestrator must NEVER run `git push` itself.
**Context:** Git push to the public repo is irreversible. The project owner must retain manual control of the final push step. The orchestrator owns the release sequence coordination but hands off the actual publish action.
**Example:**
- Wrong: Orchestrator runs `git push origin v0.8.0` autonomously after tagging
- Right: Orchestrator prints `git tag v0.8.0 -m "Release v0.8.0"` and `git push origin v0.8.0` and waits for the project owner to execute them manually

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
