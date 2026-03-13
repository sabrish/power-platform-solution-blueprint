# PPSB Memory Files Index

This directory contains the persistent project state and development patterns. All agents load these files at the start of every session following the Mandatory Startup Sequence in `CLAUDE.md`.

| File | Purpose |
|------|---------|
| [project.md](.claude/memory/project.md) | Current project state: version, features, progress, next steps, known issues |
| [decisions.md](.claude/memory/decisions.md) | Accepted architecture decisions; never re-debate these |
| [learnings.md](.claude/memory/learnings.md) | Corrections and hard rules from project owner experience; load for all tasks |
| [patterns-dataverse.md](.claude/memory/patterns-dataverse.md) | Dataverse, API, discovery, build and commit patterns; load for backend/core tasks |
| [patterns-ui.md](.claude/memory/patterns-ui.md) | React, Fluent UI v9, and UI behaviour patterns; load for UI/component tasks |
| [patterns-general.md](.claude/memory/patterns-general.md) | DRY/SOLID patterns from 2026-03-13 audit; load for all code tasks |
| [interactions/](.claude/memory/interactions/) | Session logs and interaction records (gitignored; never committed) |

## Loading by Task Domain

- **Dataverse, API, discovery, export, build, or commits** → load `patterns-dataverse.md`
- **React components, Fluent UI v9, or UI behaviour** → load `patterns-ui.md`
- **Any task involving new or modified code** → also load `patterns-general.md`
- **Documentation only (no code changes)** → skip pattern files
- **Always load:** `project.md`, `decisions.md`, `learnings.md`

## Key Directories

| Dir | Purpose |
|-----|---------|
| `.claude/agents/` | Sub-agent definitions (model, tools, responsibilities per agent) |
| `.claude/interactions/` | Session logs; gitignored, must never be committed |
