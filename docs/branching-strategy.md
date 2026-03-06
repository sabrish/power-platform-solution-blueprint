# Branching Strategy

This project uses short-lived feature branches aligned to roadmap delivery slices.

## Branch Types

- `main`
  - Stable integration branch.
  - Only merge via reviewed feature/fix branches.

- `feat/<roadmap-item>-phase-<n>`
  - Roadmap implementation branches.
  - Keep each branch focused on one deliverable slice.
  - Example: `feat/canvas-apps-phase-1`.

- `fix/<topic>`
  - Focused bug fixes that can target `main` or an active `feat/*` branch.
  - Example: `fix-timeout-issue`.

## Recommended Workflow

1. Create an epic branch for each roadmap stream only if multiple parallel phases are expected.
   - Optional format: `feat/<roadmap-item>`.
2. Deliver work in phase branches.
   - Format: `feat/<roadmap-item>-phase-<n>`.
3. Merge phase branches into `main` after validation (`typecheck`, `build`, and scenario testing).
4. Keep branches current by rebasing or merging `main` frequently for long-running features.

## Current Roadmap Branches

- `feat/baseline-comparison`
- `feat/canvas-apps-phase-1`
- `feat/canvas-apps-phase-2`
- `feat/canvas-apps-phase-3`
