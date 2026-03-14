## Pre-Commit Checks

Files in scope: $ARGUMENTS
(If no files specified, ask the project owner which files are being committed.)

Run these checks in order. Stop and report on first failure.

### Step 1: TypeScript type-check

Run: `pnpm tsc --noEmit`

Fail fast — if this fails, stop here.

### Step 2: Lint

Run: `pnpm eslint $ARGUMENTS --max-warnings 0`

### Step 3: Format check

Run: `pnpm prettier --check $ARGUMENTS`

### Step 4: Related unit tests

Run: `pnpm vitest related $ARGUMENTS --run`

Only runs tests related to the changed files. Fast.

### Step 5: Reviewer spot-check

Invoke @reviewer with the files in $ARGUMENTS.
The reviewer checks learnings.md violations first (automatic blockers),
then does a targeted review — not the full checklist, just:
- Any obvious learnings violations
- TypeScript strictness
- No direct DOM manipulation or fetch in components

### Step 6: Security audit (changed files only)

Invoke @security-auditor to sweep only the files in $ARGUMENTS.

The auditor looks for:
- Secrets, API keys, tokens, connection strings
- Hardcoded environment URLs or tenant IDs
- Personally identifiable data
- Anything that should be in .env or config, not source

If any HIGH severity finding: BLOCKED — do not commit.
MEDIUM or LOW: report and ask project owner whether to proceed.

### Final verdict

```
✅ CLEAR TO COMMIT — all checks passed
❌ BLOCKED — list specific failures, do not commit
```
