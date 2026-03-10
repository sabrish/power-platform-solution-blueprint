# PPSB Claude Code Setup Guide

> Reference for the agent system, memory files, skills, and session workflows
> for the Power Platform Solution Blueprint (PPSB) project.

---

## Overview

This project uses Claude Code with a structured multi-agent system. All development
work — features, fixes, architecture, documentation, and releases — flows through
this system. The setup is optimised for:

- **Session continuity** — agents load shared memory files so no context is lost
  between sessions
- **Cost efficiency** — expensive models (Opus) used only where needed; lightweight
  models (Haiku) for read-only tasks
- **Safety** — security audit and code review gates before every commit; git push
  always manual
- **Memory hygiene** — periodic maintenance keeps memory files lean and signal-rich

---

## Agents

All agents live in `.claude/agents/`. Start every session with the orchestrator —
never invoke specialist agents directly.

| Agent | Model | Invoke for |
|-------|-------|-----------|
| `orchestrator` | Sonnet 4.5 | **Start here for everything.** Routes tasks, manages session flow, owns the release sequence |
| `architect` | Opus 4.5 | Architecture decisions, API design, data models, security design. ⚠️ Most expensive — orchestrator flags cost before invoking |
| `developer` | Sonnet 4.5 | All implementation: features, bug fixes, components, Dataverse integration, TypeScript |
| `reviewer` | Haiku 4.5 | Read-only code review. Checks learnings violations first (auto-blocker), then full checklist |
| `document-updater` | Haiku 4.5 | CHANGELOG, docs/, README, memory file updates, end-of-session project.md |
| `skills-learner` | Haiku 4.5 | Captures corrections into learnings.md. Invoke when you correct an agent's mistake |
| `security-auditor` | Haiku 4.5 | Read-only security sweep. Runs before every commit and release |

**Hard rules:**
- Only ONE architect instance active at a time
- Never invoke developer, architect, reviewer, etc. directly — always go through orchestrator
- Never run `git push` autonomously — orchestrator prints the commands, you run them

**Two-tier invocation design:**
- **Implementation tasks** (features, bugs, architecture, documentation): always
  go through the orchestrator — `/agent orchestrator` — and describe the task.
  The orchestrator delegates to the right specialist.
- **Corrections and maintenance tasks**: invoke the specialist directly.
  `/agent skills-learner` for corrections; `/maintain-*` and `/trim-guides` skills
  for memory maintenance. These bypass the orchestrator by design — they are
  administrative, not implementation work.

---

## Memory System

All agents read these files at startup before doing any work. They are the project's
persistent brain across sessions.
```
.claude/memory/
├── project.md        Current version, what's working, in progress, next steps
├── decisions.md      Accepted architecture decisions — never re-debate these
├── learnings.md      Corrections from the project owner — every entry is a hard rule
├── patterns-dataverse.md   Dataverse, API, build & commit patterns — load for backend tasks
├── patterns-ui.md          React, Fluent UI v9 & UI behaviour patterns — load for UI tasks
└── interactions/     Session logs — gitignored, never committed
```

### project.md
Current project state. Updated at the end of every session by the orchestrator.
Contains: version, what's working, in progress, known limitations, next steps.

### decisions.md
Architecture decisions log. Once a decision is Accepted, agents do not re-debate it.
New decisions are added by the architect and written here immediately.

### learnings.md
The most important file. Every entry is a correction from a real mistake — a hard rule
that all agents check before starting work. The reviewer checks this file first; any
violation is an automatic blocker.

### patterns-dataverse.md and patterns-ui.md
Stable, proven code patterns split by domain. Agents load only the file relevant
to their current task — UI agents skip Dataverse patterns, backend agents skip UI
patterns. Both are loaded for full-stack tasks or architecture work. Promoted from
learnings.md after being stable across multiple sessions.

### interactions/ (gitignored)
Session logs written during work. Never committed to the public repo. Listed in
`.gitignore`.

---

## Skills

Skills are split across two directories:

- **`.claude/commands/`** — Claude Code slash commands. Type `/skill-name` directly in the
  terminal and Claude Code injects the prompt. Also invokable by the orchestrator agent.
- **`.claude/skills/`** — Internal skills. Not accessible as terminal slash commands; the
  orchestrator reads and executes these on your behalf when you describe the task.

| Skill | Location | Invoked by | When to use |
|-------|----------|-----------|------------|
| `/pre-commit [files]` | `.claude/commands/` | You or Orchestrator | Before every commit — runs reviewer then security-auditor |
| `/release v[X.Y.Z]` | `.claude/skills/` | Orchestrator | When you say "prepare a release" — runs the full release sequence |
| `/maintain-learnings` | `.claude/skills/` | You | Every 3-4 sessions — promotes stable learnings to patterns, keeps learnings.md lean |
| `/maintain-memory` | `.claude/skills/` | You | Every 3-4 sessions — trims project.md to under 150 lines |
| `/maintain-decisions` | `.claude/skills/` | You | Every major version — collapses settled decisions to summaries |
| `/trim-guides` | `.claude/skills/` | You | When combined pattern count reaches ~20 entries — removes duplication with root guide files |

**Two kinds of skills:**
- **Terminal slash commands** (`.claude/commands/`): Type `/pre-commit [files]` directly
  in the Claude Code terminal. The orchestrator can also invoke these by reading the file.
- **Internal skills** (`.claude/skills/`): Tell the orchestrator "ready to commit [files]"
  or "prepare a release for vX.Y.Z" and it invokes the skill. Requires your approval at
  each step before anything is written.

---

## Session Workflows

### Starting a session
```
/agent orchestrator
[describe what you want to work on, or just say "resume" to continue from last session]
```

The orchestrator reads all memory files, summarises where the project left off, and
either asks what to work on or proceeds with the stated task.

### Ending a session
Tell the orchestrator the session is done:
```
/agent orchestrator
Session complete. Please run the end-of-session routine — update project.md with
what was completed, any new decisions, and next steps for the next session.
```
The orchestrator instructs the document-updater to update project.md. This is
built into the orchestrator's session management — no separate skill needed.

### When an agent makes a mistake
```
/agent skills-learner
Correction: [exactly what went wrong and what the right behaviour is]
```

The skills-learner captures this as a new entry in learnings.md and reads it back
for confirmation. All agents will respect this rule from the next session onward.

---

## Common Task Prompts

### Build a feature
```
/agent orchestrator
Task: [describe the feature]
Read memory, assess whether any architecture decisions are needed first, then
delegate to developer. Have reviewer check before we commit.
```

### Fix a bug
```
/agent orchestrator
Bug: [describe what's wrong and steps to reproduce]
Investigate and fix. Reviewer to check the fix before commit.
```

### Architecture decision
```
/agent orchestrator
I need an architecture decision on: [topic]
Invoke the architect (flag the Opus cost first). I need: decision rationale,
trade-offs, implementation guidance, and definition of done. Write the accepted
decision to decisions.md.
```

### Prepare a release
```
/agent orchestrator
Prepare a release for v[X.Y.Z].
```
The orchestrator invokes the `/release` skill automatically. It runs the full
sequence (reviewer → security audit → version bump → build verification) and prints
the git commands for you to run manually at the end. Do NOT run git push yourself.

### Before committing

Tell the orchestrator which files you're committing. It invokes `/pre-commit` automatically:
```
/agent orchestrator
Ready to commit these files: [list files]
```
The orchestrator runs reviewer then security-auditor and reports a combined verdict
before you run git add.

---

## Release Sequence

The orchestrator owns this. Never shortcut it.

1. **Reviewer** — full code review of all changed files since last release
2. **Security Auditor** — sweep source and `.claude/` folder
3. **Document Updater** — bump `package.json` version, finalise `CHANGELOG.md` with
   release date, update `README.md` shields.io version badge. All three must show the
   same version number before proceeding.
4. **Developer** — `pnpm typecheck` (must pass zero errors), `pnpm build` (must succeed),
   `npm shrinkwrap` (must run AFTER step 3 version bump — captures correct version)
5. **Orchestrator** — confirms all steps passed, prints git commands for manual execution:
```bash
git add package.json CHANGELOG.md README.md npm-shrinkwrap.json
git commit -m "chore: release v[version]"

git tag v[version] -m "Release v[version]"
git push origin main
git push origin v[version]
```

**The orchestrator never runs `git push`.** You run these commands manually.

---

## Maintenance Schedule

| Trigger | Task | Command |
|---------|------|---------|
| Before every commit | Review + audit gate | Tell orchestrator "ready to commit [files]" |
| Before every release | Full release sequence | Tell orchestrator "prepare a release for v[X.Y.Z]" |
| Every session end | Update project.md | Tell orchestrator "session done, update memory" |
| Every 3-4 sessions | Promote learnings → patterns | `/maintain-learnings` |
| Every 3-4 sessions | Trim project.md | `/maintain-memory` |
| Every major version | Collapse settled decisions | `/maintain-decisions` |
| Combined pattern count hits ~20 | Remove guide duplication | `/trim-guides` |

Running these keeps memory files lean. Without maintenance, startup context grows
with every session and signal-to-noise drops.

---

## Key Hard Rules (Summary)

Full rules are in `CLAUDE.md` and `.claude/memory/learnings.md`. These are the
most critical:

- **Never** use `window.toolboxAPI.dataverse.*` or `executeDataverseRequest()` — they do not exist
- **Always** `await window.toolboxAPI.getToolContext()` — it returns a Promise
- **Never** use dynamic `import()` for reporters — breaks under `pptb-webview://`
- **Never** use `startswith()` or `orderBy` on Dataverse metadata API — fetch all, filter in memory
- **Always** strip GUID braces before OData filters: `.replace(/[{}]/g, '')`
- **Always** batch queries at 20 (or 10 for privilege queries) — never build OR filters with 20+ GUIDs
- **Always** use `npm` (not `pnpm`) for `npm shrinkwrap`
- **Never** use `DataGrid` for component browser lists — card-row pattern only
- **Never** run `git push` autonomously — always manual

---

## File Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Primary dev guide — agents read this first |
| `CLAUDE-SETUP.md` | This file — human reference for the Claude Code system |
| `COMPONENT_TYPES_REFERENCE.md` | Dataverse component type integer codes |
| `DATAVERSE_OPTIMIZATION_GUIDE.md` | Batching patterns, GUID rules, HTTP 414 prevention |
| `UI_PATTERNS.md` | Fluent UI v9 patterns for this project |
| `NPM_SHRINKWRAP_GENERATION.md` | Shrinkwrap regeneration steps (must use npm) |
| `CONTRIBUTING.md` | Commit conventions and PR workflow |
| `docs/architecture.md` | Technical architecture (note: monorepo section is outdated) |
| `docs/roadmap.md` | Future development plans |
| `docs/API_SECURITY.md` | API call reference and security considerations |
| `docs/user-guide.md` | End-user documentation |

---

*Last updated: 2026-02-27 — generated by Claude Code document-updater*
