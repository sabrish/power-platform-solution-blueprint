# PPSB Claude Code Setup Guide

> Reference for the agent system, memory files, commands, and session workflows
> for the Power Platform Solution Blueprint (PPSB) project.

---

## Overview

This project uses Claude Code with a structured multi-agent system. All development
work — features, fixes, architecture, documentation, and releases — flows through
this system. The setup is optimised for:

- **Session continuity** — agents load shared memory files so no context is lost
  between sessions
- **Cost efficiency** — the most expensive models (Opus, Fable) are reserved for
  architecture work; Sonnet handles implementation and code review; Haiku handles
  documentation upkeep and the security sweep
- **Safety** — security audit and code review gates before every commit (`/pre-commit`)
  and every push (`/push-branch`); the orchestrator never runs `git push` outside `/push-branch`
- **Memory hygiene** — periodic maintenance keeps memory files lean and signal-rich

---

## Start a session

Start Claude Code as the orchestrator from the project root:

```
claude --agent orchestrator
```

This starts the session as the orchestrator: its prompt, tools, and model apply, and
`CLAUDE.md` still loads. Then type your first message. Examples:

- A task: `Task: add a retry to the entity list export. Read memory, then delegate to developer.`
- Resume: `Where did we leave off?`

**What the orchestrator does at startup:**
1. Reads `CLAUDE.md`, `.claude/memory/project.md`, `decisions.md`, and `learnings.md`
2. Scans `.claude/memory/interactions/` for files relevant to the task (gitignored)
3. Reports `Memory loaded: [files read]`
4. Summarises where the project left off
5. Asks what to work on, or proceeds if your first message names a task

Pattern files are loaded per task domain (see Memory System), not at startup.

**Optional project default:** adding `"agent": "orchestrator"` to `.claude/settings.json`
makes the orchestrator the default for `claude` in this project, without the flag.
This is not applied in this repository. The `--agent` flag overrides the setting.

> **Note:** this project starts agents with `claude --agent <name>` only. The `/agent <name>`
> form inside a session is not used here and is not confirmed against the Claude Code docs.

---

## Agents

All agents live in `.claude/agents/`. Start every session with the orchestrator.
Specialist agents are reached through the orchestrator.

| Agent | Model | Effort | Invoke for |
|-------|-------|--------|-----------|
| `orchestrator` | `sonnet` | medium | **Start here for everything.** Routes tasks, manages session flow, owns the release sequence |
| `architect` | `opus` | medium | Architecture decisions, API design, data models, security design. ⚠️ Orchestrator flags cost before invoking |
| `architect-deep` | `fable` | high | Deep-dive architecture for large, ambiguous, or hard-to-reverse changes. Invoked only when the project owner names it explicitly. Shares the single architect slot with `architect`. ⚠️ Most expensive |
| `developer` | `sonnet` | high | All implementation: features, bug fixes, components, Dataverse integration, TypeScript |
| `reviewer` | `sonnet` | high | Read-only code review. Checks learnings violations first (auto-blocker), then full checklist |
| `document-updater` | `haiku` | — | CHANGELOG, docs/, README, memory file updates, end-of-session project.md |
| `skills-learner` | `sonnet` | medium | Captures corrections into learnings.md. Invoke when you correct an agent's mistake |
| `security-auditor` | `haiku` | — | Read-only security sweep. Runs on every commit (scoped to that commit's files, via `/pre-commit`), on every push (full branch diff, via `/push-branch`), and before every release |

Models are set with aliases (`haiku`, `sonnet`, `opus`, `fable`) in each agent's frontmatter
in `.claude/agents/`. "—" means the frontmatter sets no effort.

**Fallback model:** `.claude/settings.json` defines `"fallbackModel": ["opus"]`. Claude Code
documents `fallbackModel` as an ordered backup chain. See the Claude Code docs for scope.

Unconfirmed: whether frontmatter model and effort apply in full when an agent runs as the
main session agent (`claude --agent <name>`).

**Hard rules:**
- Only ONE architect instance active at a time (`architect` and `architect-deep` share the slot)
- Specialist agents are invoked through the orchestrator
- The orchestrator never runs `git push` outside `/push-branch`. In the release flow it never runs `git push` at all: it prints the git commands and you run them

**Invocation rules:**
- **Implementation, architecture, documentation, commit, and push requests:** go through the
  orchestrator (`claude --agent orchestrator`) and describe the task. The orchestrator delegates to the
  right specialist.
- **Corrections:** the orchestrator routes a correction to skills-learner immediately on a trigger
  phrase (for example "that's wrong", "don't do that", "remember this"), then resumes the task.
- **Maintenance commands:** `/maintain-learnings` runs skills-learner. `/maintain-memory`,
  `/maintain-decisions`, and `/trim-guides` run document-updater. See Commands below.

---

## Memory System

The orchestrator and every agent follow the Mandatory Startup Sequence in `CLAUDE.md`.
`project.md`, `decisions.md`, and `learnings.md` are read at startup. Pattern files are
loaded per task domain, not at startup. These files are the project's persistent brain
across sessions.
```
.claude/memory/
├── project.md                  Current version, what's working, in progress, next steps
├── decisions.md                Accepted architecture decisions — never re-debate these
├── learnings.md                Corrections from the project owner — every entry is a hard rule
├── patterns-general.md         DRY/SOLID patterns — load for any task that adds or changes code
├── patterns-dataverse.md       Dataverse, API, discovery, export, build & commit patterns — load for backend tasks
├── patterns-ui.md              React, Fluent UI v9 & UI behaviour patterns — load for UI tasks
├── MEMORY.md                   Index of this directory (git-tracked)
└── interactions/               Session logs — gitignored, never committed
```

### project.md
Current project state. Updated at the end of every session by the document-updater, when the orchestrator instructs it.
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

### patterns-general.md
DRY/SOLID patterns for shared utilities and data access. Loaded for any task that adds or
changes code, alongside the domain pattern file.

### MEMORY.md
Index of the files in `.claude/memory/`. Git-tracked like the other memory files.

### interactions/ (gitignored)
Session logs written during work. Never committed to the public repo. Listed in
`.gitignore`.

---

## Commands and Skills

Slash commands live in `.claude/commands/`. Type `/command-name` in the Claude Code terminal,
or describe the trigger to the orchestrator. The orchestrator has Task but no Bash or Skill,
so it delegates the command to the developer, which has Bash (see `.claude/agents/orchestrator.md`).

`.claude/skills/` holds one skill, `prompt-engineering`
(`.claude/skills/prompt-engineering/SKILL.md`). Only `skills-learner` loads it (see
`.claude/agents/skills-learner.md`), when it drafts or reviews an agent-ready prompt.
It has no slash command.

### Commands — `.claude/commands/`

| Command | Invoked by | When to use |
|---------|-----------|------------|
| `/pre-commit [files]` | You, or Orchestrator via the developer | Before every `git commit`. Runs the reviewer and security-auditor on the named files only. Does not run typecheck, build, or tests: the developer runs `pnpm typecheck && pnpm build && pnpm test` before this |
| `/push-branch` | You, or Orchestrator via the developer | Instead of `git push`. Runs `pnpm test`, `pnpm build`, then security-auditor and reviewer on the full branch diff (`git diff main...HEAD`). Runs `git push origin <branch>` only if all of them pass |
| `/release vX.Y.Z` | You, or Orchestrator | When you say "prepare a release". Runs the full release sequence (see Release Sequence) and prints the git commands for you to run |
| `pnpm validate` | Developer | PPTB manifest validation (`pptb-validate`). Run after any manifest change |
| `/trim-guides` | You | When combined pattern count reaches ~20 entries. Runs document-updater, which proposes `PATTERN-XXX` replacements for `DATAVERSE_OPTIMIZATION_GUIDE.md` and `UI_PATTERNS.md` and applies only the approved ones |
| `/maintain-learnings` | You | Every 3-4 sessions — runs skills-learner to promote stable learnings to patterns and keep learnings.md lean |
| `/maintain-memory` | You | Every 3-4 sessions — runs document-updater to trim project.md to under 150 lines |
| `/maintain-decisions` | You | Every major version — runs document-updater to collapse settled decisions and archive full rationale to `docs/architecture.md` |

### Skills — `.claude/skills/`

| Skill | Used by | When to use |
|-------|---------|------------|
| `prompt-engineering` | `skills-learner` | When drafting or reviewing a feature or verification prompt for another agent |

---

## Session Workflows

### Starting a session

See [Start a session](#start-a-session) above (`claude --agent orchestrator`).

### Ending a session
Send the orchestrator this session-complete prompt:
```
Session complete. Please run the end-of-session routine — update project.md with
what was completed, any new decisions, and next steps for the next session.
```
The orchestrator instructs the document-updater to update project.md. This is
built into the orchestrator's session management — no separate skill needed.

### When an agent makes a mistake
State the correction to the orchestrator during a session, using a trigger phrase such as
"that's wrong", "don't do that", or "never do that again". The orchestrator routes it to
skills-learner immediately, then resumes the task (see Skills-Learner Triggers in
`.claude/agents/orchestrator.md`).

The skills-learner captures this as a new entry in learnings.md and reads it back
for confirmation. All agents will respect this rule from the next session onward.

---

## Common Task Prompts

The prompts below are sent inside an orchestrator session (`claude --agent orchestrator`).

### Build a feature
```
Task: [describe the feature]
Read memory, assess whether any architecture decisions are needed first, then
delegate to developer. Have reviewer check before we commit.
```

### Fix a bug
```
Bug: [describe what's wrong and steps to reproduce]
Investigate and fix. Reviewer to check the fix before commit.
```

### Architecture decision
```
I need an architecture decision on: [topic]
Invoke the architect (flag the Opus cost first). I need: decision rationale,
trade-offs, implementation guidance, and definition of done. Write the accepted
decision to decisions.md.
```

### Prepare a release
```
Prepare a release for v[X.Y.Z].
```
The orchestrator coordinates the release sequence (see Release Sequence below) and prints the
git commands for you to run manually at the end. It has no Bash, so the developer runs the
build and version steps. Do NOT run git push yourself.

### Before committing

The developer runs `pnpm typecheck && pnpm build` and `pnpm test` after each change. Then tell
the orchestrator which files you're committing. It delegates `/pre-commit` to the developer:
```
Ready to commit these files: [list files]
```
The orchestrator delegates `/pre-commit` to the developer, scoped to that commit's own files. `/pre-commit`
runs the reviewer and security-auditor on the named files only, and reports a verdict (CLEAR TO COMMIT or
BLOCKED) for that commit before you run `git add`.

### Pushing the branch

Instead of running `git push` directly, say "push the branch". The orchestrator delegates `/push-branch` to the developer:
```
Push the branch.
```
`/push-branch` runs the full test suite, the production build, and the security-auditor and
reviewer on the full branch diff. It runs `git push origin <branch>` only if all four pass.
Never run `git push` directly.

---

## Release Sequence

The orchestrator coordinates this sequence from `.claude/commands/release.md`. It has Task but no
Bash or Skill, so each step runs through the named agent, and git and build commands go to the
developer. Never shortcut it. Each step must pass before the next one starts.

1. **Reviewer** — Step 1. Full review of all files changed since the last release tag. Must
   return Approved or Approved with comments; ❌ halts the release.
2. **Security Auditor** — Step 2. Full sweep of source and the `.claude/` folder. CRITICAL or HIGH
   findings halt the release. See `.claude/commands/release.md` Step 2.
3. **Version bump and documentation** — Step 3, in two parts:
   - **3a, Developer:** runs `npm version X.Y.Z --no-git-tag-version`, which updates
     `package.json` only.
   - **3b, Document-updater:** finalises `CHANGELOG.md` (moves `[Unreleased]` to
     `## [X.Y.Z] — YYYY-MM-DD`), updates the `**Version:** X.Y.Z` line in `README.md` and inline version
     references, and updates the `docs/user-guide.md` subtitle. It then verifies that
     `package.json`, the latest `CHANGELOG.md` header, the `README.md` version line, and the
     `docs/user-guide.md` subtitle all show X.Y.Z. A mismatch halts the release.
4. **Build verification** — Step 4, Developer, in this order: `pnpm typecheck` (zero errors),
   `pnpm test` (all pass), `pnpm build` (must succeed), `pnpm validate` (PPTB manifest validation
   passes), then the pre-release dependency audit (governance-style; zero critical and zero high
   findings). Each item must pass before the next runs. The exact audit steps are in
   `.claude/commands/release.md` Step 4, item 5.
5. **Orchestrator** — Step 5. Prints the release summary. Prints the git commands only if the
   verdict is READY TO PUBLISH. It runs none of them.

The tag is created on `main` after the release PR merges, never on the release branch.

```bash
# On the release branch
# 1. Run /pre-commit on the four Step 3 files (delegated to the developer).
#    Commit only after CLEAR TO COMMIT for these files.
git add package.json CHANGELOG.md README.md docs/user-guide.md
git commit -m "chore: release vX.Y.Z"
# 2. Push with /push-branch (delegated to the developer), open a PR to main, and merge it

# On main, after the merge
git checkout main
git pull --ff-only origin main
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

Pushing a tag does not start `publish-npm.yml`. The workflow runs on `release: published` and on
`workflow_dispatch`. Publish with a manual run from `main` (Actions → "Publish to npm" → "Run
workflow"), approving the `npm` environment deployment when reviewer approval is requested. This is
the recommended path; v1.5.0 used it. Publishing by creating a GitHub Release for `vX.Y.Z` is
UNTESTED: the `npm` environment deploys from protected branches only, so a release-triggered run
(tag ref) may be blocked. Reviewer approval is set on the `npm` environment in GitHub and is not
configured in this repository. See `.github/PUBLISHING.md`.

**In the release flow the orchestrator never runs `git push`.** You run these commands manually.

---

## Maintenance Schedule

| Trigger | Task | Command |
|---------|------|---------|
| Before every commit | Scoped reviewer and security-auditor on the commit's own files | Developer runs `pnpm typecheck && pnpm build` and `pnpm test`. Then tell orchestrator "ready to commit [files]" → `/pre-commit` |
| Before every push | Full gate: tests, build, security-auditor and reviewer on the full branch diff, then push | Tell orchestrator "push the branch" → `/push-branch` |
| Before every release | Full release sequence | Tell orchestrator "prepare a release for v[X.Y.Z]" → `/release` |
| Every session end | Update project.md | Send the session-complete prompt (see Ending a session) |
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
- **Always** strip GUID braces before OData filters: `.replace(/[{}]/g, '')`. Exception:
  `_solutionid_value` on `solutioncomponents` requires braces and single quotes (see `decisions.md`, "GUID Handling")
- **Always** batch queries at 20 (or 10 for privilege queries) — never build OR filters with 20+ GUIDs
- **Never** use `DataGrid` for component browser lists — card-row pattern only
- **Never** run `git push` directly — use `/push-branch`. Release git commands are run by you

---

## File Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Primary dev guide — agents read this first |
| `CLAUDE-SETUP.md` | This file — human reference for the Claude Code system |
| `COMPONENT_TYPES_REFERENCE.md` | Dataverse component type integer codes |
| `DATAVERSE_OPTIMIZATION_GUIDE.md` | Batching patterns, GUID rules, HTTP 414 prevention |
| `UI_PATTERNS.md` | Fluent UI v9 patterns for this project |
| `SUPPORTED_COMPONENTS.md` | User-facing component coverage status (Supported, Partial, Planned) |
| `COMPONENT_ICONS_REFERENCE.md` | Power Apps solution explorer icons per component type |
| `CONTRIBUTING.md` | Commit conventions and PR workflow |
| `README.md` | User-facing project overview, quick start, and features |
| `docs/architecture.md` | Technical architecture (flat single-package structure) |
| `docs/roadmap.md` | Future development plans |
| `docs/API_SECURITY.md` | API call reference and security considerations |
| `docs/user-guide.md` | End-user documentation |
| `docs/VERIFICATION.md` | PPTB Verified-status maintenance guide |

---

*Last updated: 2026-10-10 — updated by Claude Code document-updater*
