# Power Platform Solution Blueprint (PPSB) — Development Guide

## Project

PPSB is a documentation tool that runs inside PPTB Desktop (Power Platform Toolbox). It
discovers and documents Dataverse environments — entities, plugins, flows, business rules,
classic workflows, BPFs, web resources, custom APIs, security roles, and more — then exports
as Markdown, JSON, HTML, or ZIP. It is a flat-structure, single-package React/TypeScript app
served under the `pptb-webview://` protocol from `dist/index.html`.

**Stack:** TypeScript 5.x (strict) · React 18 · Vite 5 · Fluent UI v9 · `@pptb/types` v1.0.19+ · pnpm · Mermaid · JSZip

**APIs:** `window.dataverseAPI` for all Dataverse calls · `await window.toolboxAPI.getToolContext()`
for tool context · NEVER use `window.toolboxAPI.dataverse.*` or `executeDataverseRequest()` — both do not exist.

## Mandatory Startup Sequence (ALL agents)

Before responding to any task, read in order:

1. `.claude/memory/project.md` — current version, working features, next steps
2. `.claude/memory/decisions.md` — accepted decisions; never re-debate these
3. `.claude/memory/learnings.md` — the project owner's corrections; every entry is a hard rule
4. `.claude/memory/patterns.md` — established code patterns; follow exactly
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
  `Co-Authored-By: Claude <noreply@anthropic.com>`
- **ALWAYS** run security-auditor before any commit touching source, docs, or memory files

## Key Reference Files

| File | Purpose |
|------|---------|
| `COMPONENT_TYPES_REFERENCE.md` | Dataverse component type integer codes — check before any new discovery work |
| `DATAVERSE_OPTIMIZATION_GUIDE.md` | Batching patterns, GUID rules, HTTP 414 prevention |
| `UI_PATTERNS.md` | Fluent UI v9 patterns (card-row lists, tokens, makeStyles) |
| `NPM_SHRINKWRAP_GENERATION.md` | Shrinkwrap regeneration — must use `npm`, never `pnpm` |
| `CONTRIBUTING.md` | Commit conventions and PR workflow |
| `docs/` | Architecture, user guide, roadmap, API security reference |
