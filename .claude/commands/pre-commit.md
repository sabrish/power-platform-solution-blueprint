## Pre-Commit Security Check

Files in scope: $ARGUMENTS
(If no files specified, ask the project owner which files are being committed.)

Type-check, build, lint, and format have already run inside the
developer agent after each unit. This gate handles security only.

## Step 1: Security audit (changed files only)

Invoke @security-auditor to sweep only the files in $ARGUMENTS.

The auditor looks for:
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
