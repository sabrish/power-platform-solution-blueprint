## Pre-Commit Security Check

Files in scope: $ARGUMENTS
(If no files specified, ask the project owner which files are being committed.)

Type-check, build, lint, and format have already run inside the
developer agent after each unit. This gate handles security only.

## Step 1: Determine changed file scope

If $ARGUMENTS were provided, use that list as scope. Otherwise, determine scope from git:

1. **Try:** `git diff origin/<current-branch>...HEAD --name-only`
   - If this succeeds and returns files, use that list.

2. **If Step 1 fails** (branch not yet on remote — first push):
   Try: `git diff origin/main...HEAD --name-only`
   - If this succeeds and returns files, use that list.
   - Note in the output: "First push on branch — diffing against main."

3. **If both fail or return empty:**
   Fall back to a full scan.
   - Note in the output: "Could not determine diff scope — running full scan."

## Step 2: Security audit (changed files only)

Invoke @security-auditor with this instruction prepended to the agent prompt:

"Scoped run — scan only these changed files: <file list from Step 1>
Additionally scan .claude/memory/*.md and .claude/agents/*.md unconditionally.
Do not scan files outside this scope."

The auditor sweeps the determined scope files. The auditor looks for:
- Secrets, API keys, tokens, connection strings
- Hardcoded environment URLs or tenant IDs
- Personally identifiable data
- Anything that should be in .env or config, not source

If any HIGH severity finding: BLOCKED — do not commit.
MEDIUM or LOW: report and ask project owner whether to proceed.

## Verdict

```
Pre-commit complete.
Security audit ✅/❌/⚠️
Verdict: CLEAR TO COMMIT ✅ / BLOCKED ❌
```
