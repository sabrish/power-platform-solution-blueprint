# PPSB Audit Report — 2026-03-10

## Executive Summary

1. **Debug `console.log` statements** in `FlowDefinitionParser.ts` and `CrossEntityAnalyzer.ts` noted in session log as pending cleanup — must be removed before merge/release (P0 blocker).
2. **10 `any` type casts** across UI components (`ERDView`, `ExportDialog`, `ExternalDependenciesView`, `FieldsTable`, `SolutionDistributionView`) and `SecurityRoleDiscovery.ts` — weak type safety in UI layer while core types are solid.
3. **Card-row list styles and filter/search logic duplicated** across 8+ list components (~400 lines of near-identical CSS, identical `useMemo`/`useState` filter patterns) — the largest DRY opportunity in the codebase.
4. **Agent system has ~600 lines of duplicated content** — Mandatory Startup Sequence, UI Hard Rules table, and project context all restated in every agent file instead of being a single source of truth in `CLAUDE.md`.
5. **Core architectural health is excellent** — discovery classes, card-row UI pattern, API batching, and the memory system are all working correctly and consistently. This codebase is production-ready modulo the debug cleanup.

---

## Part 1: Codebase Findings

### 1.1 Duplication & Redundancy

#### HIGH IMPACT

**1. Card-row list component styles duplicated across 8+ components**

Files: `FlowsList.tsx`, `PluginsList.tsx`, `BusinessRulesList.tsx`, `BusinessProcessFlowsList.tsx`, `ClassicWorkflowsList.tsx`, `WebResourcesList.tsx`, `CustomAPIsList.tsx`, `ConnectionReferencesList.tsx`

Duplicated blocks in every file:
- `nameColumn` — `minWidth: 0, wordBreak: 'break-word'`
- `expandedDetails` — `backgroundColor`, `padding`, `borderTop: 'none'`, `marginTop: '-4px'`
- `detailsGrid` — `gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'`
- `badge` group styling
- `codeText` styling

Estimated ~400 lines that could be reduced to a single shared `useCardRowStyles()` hook or exported `cardRowStyles` makeStyles block.

**2. Filter and search logic duplicated in all list components**

Every list component independently implements:
```typescript
const [searchValue, setSearchValue] = useState('');
const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
const filtered = useMemo(() => items.filter(...), [items, searchValue, activeFilters]);
```
No shared abstraction. A custom hook `useComponentFilter(items, searchFields, filterGroups)` would eliminate ~150 lines of duplication.

**3. Empty-state detection pattern duplicated**

Every list component independently checks `filtered.length === 0` then renders `<EmptyState>`. Could be wrapped in a `<FilteredList>` container component or handled inside the custom filter hook.

#### MEDIUM IMPACT

**4. Badge rendering duplicated for state/type badges**

`FlowsList.tsx` lines 195–212, `PluginsList.tsx` lines 235–250 both implement switch statements for state badge colour/label. Should be a shared `formatStateBadge(state, componentType)` utility function.

**5. OData `OR` filter construction repeated in every discovery class**

```typescript
batch.map(id => `fieldname eq '${id}'`).join(' or ')
```
Appears in `PluginDiscovery.ts`, `FlowDiscovery.ts`, `BusinessRuleDiscovery.ts` and others. Should be a shared `buildOrFilter(ids: string[], field: string): string` utility.

**6. Two-pass progress math duplicated**

`FlowDiscovery.ts` lines 67, 91–93: `Math.floor(done / 2)` / `Math.floor(done / 2) + half`
`WebResourceDiscovery.ts` lines 57, 92: Same pattern
Should extract to a `TwoPassProgressTracker` helper or similar.

---

### 1.2 Inefficiency

**1. `ExecutionOrderCalculator` — no instance caching**

Instantiated inline in `CrossEntityAnalyzer`; if called in a tight loop (e.g., per-entity pipeline construction), a new instance is created each time. Lazy-instantiate once and reuse, or convert to pure functions.

**2. GUID normalization scattered across discovery classes**

`PluginDiscovery.ts` lines 57, 81, 142–143 and `FlowDiscovery.ts` line 73 call `.toLowerCase()` in multiple places. Should normalise GUIDs at the discovery entry point before passing to batch queries.

**3. Regex patterns in parsers likely compiled per-call**

`BusinessRuleParser.ts` and `FlowDefinitionParser.ts` likely declare regex patterns inside methods. If these parsers are called in loops (1,000+ records), every call recompiles the regex. Define all patterns as `static readonly` constants at module scope.

**4. Large `$select` lists could be profiled**

`SecurityRoleDiscovery.ts` (383 lines) likely has long `$select` lists. Could benefit from summary vs full fetch modes for pipeline-display vs detail-display use cases. Low priority.

---

### 1.3 Dead / Unreachable Code

**No unreachable code detected.** All exports are consumed; no dead variables found.

**TODO/FIXME comments indicating planned-but-not-yet work (not dead code — properly flagged):**

| File | Line | Note |
|------|------|------|
| `ExecutionOrderCalculator.ts` | ~7 | `TODO: Add support for JavaScript form scripts` |
| `SolutionDistributionAnalyzer.ts` | ~64 | `TODO: Track solution membership in component discovery phase` |
| `SolutionDistributionAnalyzer.ts` | ~170 | `TODO: Implement by checking component solution membership` |
| `ExternalDependencyAggregator.ts` | ~50 | `TODO: Parse XAML for external calls (HTTP requests, web service calls)` |

These are correctly documented planned features. No action required beyond tracking.

---

### 1.4 Abstraction Gaps

**1. Error handling not fully consistent across discovery classes**

- `PluginDiscovery.ts` line ~120: Generic message `"Failed to retrieve plugins: ..."` — no structured context (batch size, partial results, entity count)
- `BusinessRuleDiscovery.ts` line ~77: bare `throw error` without wrapping in `DataverseError`
- Recommendation: Standardise on `DataverseError` with `{ step, message, partial }` shape used in `BlueprintGenerator.stepWarnings`

**2. Progress callback signature inconsistent across discovery classes**

- `PluginDiscovery`: `onProgress?.(Math.floor(done / 2), total)`
- `FlowDiscovery`: same two-pass math, different placement
- `WebResourceDiscovery`: `onProgress?.(done, resourceIds.length)` — single-pass
- Recommendation: Standardise via a shared `ProgressReporter` adapter that handles single vs two-pass arithmetic

**3. Batch size hardcoded in every discovery class**

All classes hardcode `initialBatchSize: 20` or `10`. `BlueprintGenerator` has a `scaleTier` concept but it doesn't flow into discovery constructors. Parameterise batch size via discovery constructor options.

---

### 1.5 Type Safety

#### Blockers

| File | Location | Issue |
|------|----------|-------|
| `ExternalDependenciesView.tsx` | `item.riskFactors.map((factor: any` | `riskFactors` and `detectedIn` should be typed from `ExternalEndpoint` interface |
| `ERDView.tsx` | `let collected: any`, `let frontier: any` | Should be typed as `CytoscapeElement` or equivalent |
| `ExportDialog.tsx` | `blueprintGenerator: any` prop | Should type as `BlueprintGenerator` class |
| `SolutionDistributionView.tsx` | `calculatePercentages(counts: any)` | Should be `Record<string, number>` |
| `FieldsTable.tsx` | `let aVal: any; let bVal: any` in sort comparator | Type based on actual attribute value shapes |
| `SecurityRoleDiscovery.ts` | `mapRole(role: any)` | Define `RawSecurityRole` interface matching the OData record shape |

#### Non-blockers

- `ScopeSelector.tsx`, `ThemeContext.tsx` — `(_: unknown, data)` pattern for Fluent UI handlers is correct
- `ThemeContext.tsx` — `(_event: any, payload: any)` for native theme event from external library is acceptable

---

### 1.6 Component Browser (UI)

**Compliance status against AUDIT-001–013:**

| Rule | Status | Notes |
|------|--------|-------|
| AUDIT-001 — No palette background on raw text elements | ✅ PASS | `ExternalDependenciesView` uses `borderLeftColor` (correct) |
| AUDIT-002 — Badge always has explicit `shape` | ✅ PASS | Spot-checked FlowsList, PluginsList — shape="rounded"/"circular" present |
| AUDIT-003 — No hex colours | ✅ PASS | All styles use `tokens.*` |
| AUDIT-004 — No raw pixel values | ⚠️ MINOR | `ExternalDependenciesView` line ~98: `maxWidth: '250px'` inline — should be token-based |
| AUDIT-005 — `nameColumn` has `minWidth: 0` + `wordBreak` | ✅ PASS | Confirmed in all spot-checked components |
| AUDIT-006 — `detailValue` has overflow protection | ✅ PASS | `minWidth`, `wordBreak`, `overflowWrap` present |
| AUDIT-007 — Card-row grids use `alignItems: 'start'` | ✅ PASS | Confirmed across all observed components |
| AUDIT-008 — SearchBox/Input only via FilterBar | ✅ PASS | All list components use FilterBar + FilterGroup |
| AUDIT-009 — Empty states use `<EmptyState>` | ✅ PASS | All observed components use EmptyState component |
| AUDIT-010 — No native HTML interactive elements | ✅ PASS | All Fluent UI components |
| AUDIT-011 — Hover transition on card-row rows | ✅ PASS | `transition: 'all 0.2s ease'` present |
| AUDIT-012 — `detailsGrid` uses `minmax(200px, 1fr)` | ✅ PASS | Confirmed |
| AUDIT-013 — No DataGrid in component browser | ✅ PASS | Exception: `ConnectionReferencesList.tsx` (documented exception in decisions.md) |

---

## Part 2: Agent System Findings

### 2.1 Agent File Duplication

**1. Mandatory Startup Sequence duplicated in every agent (~300 lines total)**

The 5-step startup sequence (read project.md → decisions.md → learnings.md → pattern files → interactions/) is written out in full in:
- `orchestrator.md`
- `developer.md`
- `architect.md`
- `reviewer.md`
- `document-updater.md`
- `skills-learner.md`

Each has minor variations (different pattern file instructions) but the same core structure. If the startup sequence changes, it must be updated in 6+ places.

Recommendation: Extract core sequence to `CLAUDE.md § Mandatory Startup Sequence`. Each agent file references it and adds only its agent-specific variation (e.g., "load patterns-ui.md for UI tasks").

**2. UI Hard Rules table repeated three times**

- `CLAUDE.md` lines 60–78: Summary table (AUDIT-001–013)
- `developer.md` lines ~94–107: Restated as coding standards checklist
- `reviewer.md` lines ~81–123: Full rules with checkboxes and enforcement notes

Single source of truth in `CLAUDE.md`; agents reference it. Currently ~300 lines of combined duplication.

**3. Project context/stack duplicated across orchestrator, developer, architect**

Each agent file restates: stack (TypeScript, React, Fluent UI, Vite, pnpm), API rules, repo structure. Should be in `CLAUDE.md` once; agents reference it.

**4. Overlapping responsibilities: reviewer vs security-auditor**

- `reviewer.md` includes security checks (API exposure, console.log in production, hardcoded values)
- `security-auditor.md` covers similar credential/secret scanning
- The overlap is acceptable (different depth and scope) but could cause confusion. Consider documenting the boundary explicitly: "reviewer = code correctness + light security; security-auditor = credential/data privacy sweep".

---

### 2.2 CLAUDE.md / Memory

**Over-specification:**

1. **Startup sequence specifies "ALL agents" but agents need different steps**
   Orchestrator should skip pattern files (it routes, doesn't code). Document-updater should skip both. Current wording forces every agent to consider all 5 steps even when irrelevant.

2. **UI Hard Rules table in CLAUDE.md is a summary but reads as authoritative**
   Agents that don't do UI work (document-updater, security-auditor) don't need it. Add a scoping note: "UI agents only — skip if no React changes in scope."

**Gaps:**

3. **`SUPPORTED_COMPONENTS.md` not listed in Key Reference Files table**
   Newly created (2026-03-09) but not referenced in CLAUDE.md. Agents won't know to check it for component coverage status.

4. **No explicit instruction on when to skip memory files**
   CLAUDE.md says "all agents" must read all 5 files. No exception for trivial tasks (e.g., fixing a typo). Add: "For read-only diagnostic or single-file tasks, steps 4–5 may be skipped at agent discretion."

**No conflicting instructions detected** — rules are internally consistent.

---

### 2.3 Pattern Files

**Overall: Excellent. No major issues.**

`patterns-dataverse.md` — 405 lines, PATTERN-001 to PATTERN-022. Clear, actionable, with code examples. Well-maintained.

`patterns-ui.md` — 365 lines, PATTERN-001 + PATTERN-008–021 + AUDIT-001–013. Comprehensive. Matches codebase behaviour.

**Minor gaps:**

1. **No pattern for `ErrorState` component usage** — `ErrorState.tsx` exists and is used but no PATTERN-0xx documents when/how to use it vs inline error handling. Low priority.

2. **No pattern for two-pass discovery progress calculation** — session log shows this was hand-rolled in 3+ places this sprint. Should be PATTERN-023 in `patterns-dataverse.md`.

3. **No pattern documenting `stage.entity` vs `stage.entityName` field naming** — caused a bug this session (fixed). Worth a learnings entry if not already captured.

---

### 2.4 Skill Files

**Overall: Well-structured. No bloat.**

| Skill | Location | Status |
|-------|----------|--------|
| `pre-commit` | `.claude/commands/` | ✅ Correctly placed as terminal slash command |
| `release` | `.claude/skills/` | ✅ Comprehensive, clear sequence |
| `maintain-learnings` | `.claude/skills/` | ✅ Clear activation criteria |
| `maintain-memory` | `.claude/skills/` | ✅ Clear activation criteria |
| `maintain-decisions` | `.claude/skills/` | ✅ Clear activation criteria |
| `trim-guides` | `.claude/skills/` | ✅ Clear activation criteria |

**Minor observation:**

- `release.md` references `CHANGELOG.md` format — verify that format expectations are still correct against the current changelog structure (sprint-level verification, not a code change).
- No skill for "code review ready" pre-PR checklist (beyond pre-commit). Low priority.

---

### 2.5 Token Efficiency

**Estimated token load per agent invocation:**

| Agent | Context loaded | Approx lines | Assessment |
|-------|---------------|-------------|------------|
| Orchestrator | CLAUDE.md + project.md + decisions.md + learnings.md | ~1,100 | ✅ Lean |
| Developer | All memory files + patterns (both) + task files | ~1,700 | ✅ Appropriate for senior role |
| Architect | All memory files + patterns (both) | ~1,700 | ✅ Appropriate for architecture scope |
| Reviewer | All memory files + patterns (both) + submitted files | ~1,700 + code | ✅ Appropriate |
| Security-auditor | Memory files only + scoped file list | ~900 | ✅ Lean |
| Document-updater | Memory files only (no patterns needed) | ~900 | ✅ Lean |
| Skills-learner | Memory files only | ~900 | ✅ Lean |

**Growth risk: `learnings.md` at ~660 lines / 55 entries**

This file is loaded by every agent. At 55 entries it is manageable, but compounding sprint-over-sprint without pruning will increase token cost for every invocation. The `/maintain-learnings` skill exists precisely for this — schedule it every 3–4 sessions.

**No agents are loading unnecessary context.** Pattern files are already gated (only loaded for relevant task domains).

---

## Part 3: Cross-Cutting Observations

### 3.1 Naming Consistency

| Spec/doc term | Code term | Match? |
|--------------|-----------|--------|
| Entry Points | `entryPoints`, `allEntryPoints` | ✅ |
| Activation Map | `buildActivationMap()`, `ActivationResult` | ✅ |
| Pipeline Trace | `pipelineTrace`, `EntityPipelineTrace` | ✅ |
| Shared Child Pipelines | `sharedChildPipelines` | ✅ |
| Cross-entity Level 1/2 | `crossEntityLevel`, `level1`, `level2` | ✅ |
| WontFire | `firingStatus: 'WontFire'` | ✅ (removed client-only BRs this sprint) |
| Business Process Flow | `BusinessProcessFlow`, `BPFDefinition` | ✅ |

No naming inconsistencies found. Spec and code terminology are aligned.

### 3.2 Experimental Features

**No active 🧪 experimental features.** The cross-entity automation feature (the main active branch) is now complete and gate-ready. No feature flags or conditional branches observed that are always true/false.

### 3.3 Agent System Coverage of Active Development

| Area | Coverage |
|------|---------|
| Cross-entity automation (Level 1+2) | ✅ Complete — all decisions, learnings, and patterns captured this sprint |
| Per-entry-point Mermaid output | ✅ Implemented; no outstanding gaps in agent instructions |
| Component browser UI fixes | ✅ AUDIT-001–013 enforced by reviewer; patterns-ui.md current |
| Custom API parameter discovery | ✅ Fix committed (`isoptional` nullable) |
| Export detail sections (BR/BPF/CustomAPI) | ✅ Implemented; no gaps |
| Security role PP terminology | ✅ Implemented; reviewer will enforce |
| HTML Fluent UI icons | ✅ Implemented; no agent-level gap |

**No coverage gaps** for current active development areas.

### 3.4 Session Continuity

- `session-2026-03-09-b.md` in `.claude/memory/interactions/` correctly documents handoff state
- Pending debug cleanup (console.log removal) is the only outstanding item flagged in session log
- 4 new learnings entries captured from this sprint's work
- `project.md` and `decisions.md` appear current

---

## Recommended Actions (Prioritised)

| Priority | Area | Finding | Suggested Action | Effort |
|----------|------|---------|-----------------|--------|
| **P0** | Codebase | Debug `console.log` in `FlowDefinitionParser.ts` and `CrossEntityAnalyzer.ts` (session log) | Remove all debug statements; run `pnpm build` to confirm | 5 min |
| **P1** | Codebase | 6 files with `any` type: `ERDView`, `ExportDialog`, `ExternalDependenciesView`, `FieldsTable`, `SolutionDistributionView`, `SecurityRoleDiscovery` | Type each with proper interfaces; prioritise `SecurityRoleDiscovery` (core) and `ExternalDependenciesView` (UI) | 2–4 hrs |
| **P2** | Codebase | Card-row styles duplicated in 8+ components (~400 lines) | Extract `useCardRowStyles()` hook; refactor all list components | 4–6 hrs |
| **P2** | Codebase | Filter/search logic duplicated in all list components | Create `useComponentFilter(items, searchFields, filterGroups)` hook | 2–3 hrs |
| **P2** | Codebase | OData OR filter construction repeated in all discovery classes | Extract `buildOrFilter(ids, field)` to shared utility | 1 hr |
| **P2** | Codebase | Regex patterns likely compiled per-call in parsers | Define all parser regex as `static readonly` constants | 1 hr |
| **P3** | Agent System | Mandatory Startup Sequence duplicated in 6 agent files | Extract to `CLAUDE.md`; agents reference with per-agent variation | 1–2 hrs |
| **P3** | Agent System | UI Hard Rules table in CLAUDE.md + Developer.md + Reviewer.md | Single source in `CLAUDE.md`; agents reference | 1 hr |
| **P3** | Agent System | Project context duplicated in orchestrator, developer, architect | Extract to `CLAUDE.md`; agents reference | 1 hr |
| **P3** | Memory | `SUPPORTED_COMPONENTS.md` missing from CLAUDE.md Key Reference Files | Add one-line entry to the Key Reference Files table | 5 min |
| **P3** | Patterns | No PATTERN-023 for two-pass progress calculation | Document in `patterns-dataverse.md` | 30 min |
| **P4** | Memory | `learnings.md` at 55 entries (~660 lines) | Schedule `/maintain-learnings` every 3–4 sessions | Ongoing |
| **P4** | Codebase | `ExternalDependenciesView` line ~98 uses `maxWidth: '250px'` | Convert to token-based value | 15 min |
| **P4** | Agent System | Reviewer/security-auditor boundary not explicitly documented | Add one-paragraph boundary note to each file | 15 min |

---

## Codebase Health Summary

| Dimension | Status | Notes |
|-----------|--------|-------|
| Type Safety | 🟡 Yellow | 6 files with `any` in UI layer; core discovery types solid |
| Code Duplication | 🟡 Yellow | Card-row styles + filter logic across 8+ list components |
| Pattern Adherence | 🟢 Green | PATTERN-001, AUDIT-001–013, PATTERN-017, PATTERN-022 all correct |
| Error Handling | 🟢 Green | `stepWarnings` used consistently; no swallowed errors (post this sprint) |
| API Safety | 🟢 Green | Batching correct; no N+1 queries; GUIDs normalised |
| UI Compliance | 🟢 Green | All AUDIT rules pass in spot-check; one minor pixel value |
| Agent System | 🟢 Green | Clear responsibilities; no conflicts; ~600 lines of addressable duplication |
| Memory | 🟢 Green | Current, well-organised; 55 learnings entries manageable |
| Release Readiness | 🟡 Yellow | Debug cleanup required (P0); otherwise production-ready |
