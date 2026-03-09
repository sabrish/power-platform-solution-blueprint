# Power Platform Solution Blueprint (PPSB) — Development Guide

## Project

PPSB is a documentation tool that runs inside PPTB Desktop (Power Platform Toolbox). It
discovers and documents Dataverse environments — entities, plugins, flows, business rules,
classic workflows, BPFs, web resources, custom APIs, security roles, and more — then exports
as Markdown, JSON, HTML, or ZIP. It is a flat-structure, single-package React/TypeScript app
served under the `pptb-webview://` protocol from `dist/index.html`.

**Stack:** TypeScript 5.x (strict) · React 18 · Vite 5 · Fluent UI v9 · `@pptb/types` v1.0.19+ · pnpm · Cytoscape.js · Mermaid · JSZip

**APIs:** `window.dataverseAPI` for all Dataverse calls · `await window.toolboxAPI.getToolContext()`
for tool context · NEVER use `window.toolboxAPI.dataverse.*` or `executeDataverseRequest()` — both do not exist.

## Mandatory Startup Sequence (ALL agents)

Before responding to any task, read in order:

1. `.claude/memory/project.md` — current version, working features, next steps
2. `.claude/memory/decisions.md` — accepted decisions; never re-debate these
3. `.claude/memory/learnings.md` — corrections from the project owner; every entry is a hard rule
4. Pattern files — load based on task domain:
   - Dataverse, API, discovery, export, build, commits → `.claude/memory/patterns-dataverse.md`
   - React components, Fluent UI v9, UI behaviour → `.claude/memory/patterns-ui.md`
   - Both → load both
   - Documentation only (no code changes) → skip both
5. `.claude/memory/interactions/` — scan for files relevant to the current task

Report: **"Memory loaded: [files read]"**

## Memory & Agents

- **`.claude/memory/`** — persistent project state, decisions, patterns, corrections
  - `interactions/` subdir — session logs; **gitignored**, must never be committed
- **`.claude/agents/`** — sub-agent definitions (model, tools, responsibilities per agent)

## Agents

| Agent | Model | Role |
|-------|-------|------|
| `orchestrator` | Sonnet 4.5 | Routes all tasks; start every session here |
| `architect` | Opus 4.5 | Architecture decisions and data model design; only ONE active at a time |
| `developer` | Sonnet 4.5 | All implementation — features, bugs, components, Dataverse integration |
| `reviewer` | Haiku 4.5 | Read-only code review for TypeScript, React, Fluent UI v9, and security |
| `document-updater` | Haiku 4.5 | CHANGELOG, docs/, README, and memory file maintenance |
| `skills-learner` | Haiku 4.5 | Captures corrections and feedback into memory files |
| `security-auditor` | Haiku 4.5 | Read-only security scan before any commit, push, or release |

## Hard Rules

- **NEVER** guess Dataverse component type codes — always check `COMPONENT_TYPES_REFERENCE.md` first
- **NEVER** use `executeDataverseRequest()` or `window.toolboxAPI.dataverse.*` — they do not exist
- **ALWAYS** use static imports for reporters — dynamic imports break under `pptb-webview://`
- **ALWAYS** commit one logical change per commit, Conventional Commits format, with trailer:
  `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
- **ALWAYS** run `pnpm typecheck && pnpm build` after any code change before committing — typecheck alone is not sufficient; a passing typecheck does not guarantee the Vite build succeeds
- **ALWAYS** run the `/pre-commit` skill before any commit touching source, docs, or memory files — it runs reviewer then security-auditor in sequence

## UI Hard Rules (Fluent UI v9 — enforced at every review)

These rules were codified on 2026-03-09. Violations are blockers at review time. Full details in `.claude/memory/patterns-ui.md`.

| Rule | What is forbidden | What to use instead |
|------|-------------------|---------------------|
| AUDIT-001 | `colorPalette*Background*` as `backgroundColor` on raw elements with text | `<Badge color="...">` or left-border |
| AUDIT-002 | `<Badge>` without explicit `shape` prop | `shape="rounded"` (labels) / `shape="circular"` (counts) |
| AUDIT-003 | Hex colours in makeStyles or inline styles | Semantic `color` prop on Badge; `tokens.*` everywhere else |
| AUDIT-004 | Raw pixel values (`16px`, `fontWeight: 500`) | `tokens.spacingVertical*`, `tokens.fontWeight*` |
| AUDIT-005 | `nameColumn` without `minWidth: 0` + `wordBreak: 'break-word'` | Both required always |
| AUDIT-006 | `detailValue` without overflow protection | `minWidth: 0`, `wordBreak: 'break-word'`, `overflowWrap: 'anywhere'` |
| AUDIT-007 | `alignItems: 'center'` on card-row grids | `alignItems: 'start'` always |
| AUDIT-008 | Bare `SearchBox`/`Input`/`Checkbox` outside `FilterBar`/`FilterGroup` | `FilterBar` + `FilterGroup` + `ToggleButton` |
| AUDIT-009 | Inline emoji or plain `<Text>` for empty states | `<EmptyState type="..." />` |
| AUDIT-010 | Native `<button>`, `<input>`, `<select>` with CSS resets | Fluent UI `Button`, `Input`, `Dropdown` |
| AUDIT-011 | Card-row rows without hover transition | `transition: 'all 0.2s ease'` + `:hover` styles |
| AUDIT-012 | `detailsGrid` not using `minmax(200px, 1fr)` | Always `minmax(200px, 1fr)` |
| AUDIT-013 | `DataGrid` in any component browser view | Card-row accordion (PATTERN-001) |

## Key Reference Files

| File | Purpose |
|------|---------|
| `COMPONENT_TYPES_REFERENCE.md` | Dataverse component type integer codes — check before any new discovery work |
| `SUPPORTED_COMPONENTS.md` | User-facing component coverage status — Supported, Partial, and Planned |
| `DATAVERSE_OPTIMIZATION_GUIDE.md` | Batching patterns, GUID rules, HTTP 414 prevention |
| `UI_PATTERNS.md` | Fluent UI v9 patterns (card-row lists, tokens, makeStyles) |
| `NPM_SHRINKWRAP_GENERATION.md` | Shrinkwrap regeneration — must use `npm`, never `pnpm` |
| `CONTRIBUTING.md` | Commit conventions and PR workflow |
| `docs/` | Architecture, user guide, roadmap, API security reference |
