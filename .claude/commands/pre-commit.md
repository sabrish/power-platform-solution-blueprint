## Pre-Commit Gate

Type-check, build, lint, and format have already run inside the
developer agent after each unit. This gate handles code review and security.

## Step 1: Determine changed file scope once

If $ARGUMENTS were provided, use that list as scope. Otherwise, determine scope from git **once** — this result will be passed to both reviewer and security-auditor:

1. **Try:** `git diff origin/<current-branch>...HEAD --name-only`
   - If this succeeds and returns files, use that list.

2. **If Step 1 fails** (branch not yet on remote — first push):
   Try: `git diff origin/main...HEAD --name-only`
   - If this succeeds and returns files, use that list.
   - Note in the output: "First push on branch — diffing against main."

3. **If both fail or return empty:**
   Fall back to a full scan.
   - Note in the output: "Could not determine diff scope — running full scan."

Store this file list for use in Steps 2 and 3.

## Step 2: Code review (changed files only)

Invoke @reviewer with this instruction prepended to the agent prompt:

"Scoped run — review only these changed files: <file list from Step 1>
Do not review files outside this scope."

The reviewer performs read-only TypeScript, React, Fluent UI v9, and code quality checks on the determined scope files only.

If any major issue found: report and ask project owner whether to proceed.

## Step 3: Security audit (changed files only)

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
Code review ✅/❌/⚠️
Security audit ✅/❌/⚠️
Verdict: CLEAR TO COMMIT ✅ / BLOCKED ❌
```
