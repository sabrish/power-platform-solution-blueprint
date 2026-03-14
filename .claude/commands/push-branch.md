## Push Branch

Run this sequence in order. Stop and report if any step fails.
Do not push if anything fails.

### Step 1: Full test suite

Run: `pnpm test --run`

If any tests fail: stop. Report which tests failed. Do not continue.

### Step 2: Production build

Run: `pnpm build`

Catches bundle errors, dynamic import failures, chunk size issues.
If this fails: stop. Report the errors. Do not continue.

Flag any chunk > 500KB that was not present before this change.

### Step 3: Security audit (full branch diff)

Run: `git diff main...HEAD --name-only`

Pass the full list of changed files to @security-auditor.
Catches anything present anywhere in the branch history that will
become public on push.

If any HIGH severity finding: stop. Do not push.
Advise the project owner to rebase/squash to remove the sensitive
data from history before pushing.
MEDIUM or LOW: report and ask whether to proceed.

### Step 4: Reviewer (full branch diff)

Pass the full list of changed files from Step 3 to @reviewer.

Reviewer checks:
- learnings.md violations first (automatic blockers)
- Full review checklist against all changed files
- Sees the complete changeset for full context

If reviewer returns ❌: stop. Do not push.
Fix blockers then re-run /push-branch from the start.

### Step 5: Push

Only reach this step if Steps 1–4 all pass.

Run: `git push origin [current branch name]`

Report: "Branch pushed. All pre-push checks passed."
Remind the project owner to open a PR if one does not exist.

## Completion report

```
Push complete.
Full tests ✅/❌
Production build ✅/❌
Bundle size ✅/❌/⚠️
Security audit ✅/❌/⚠️
Reviewer ✅/❌
Branch pushed ✅/❌
Verdict: PUSHED ✅ / BLOCKED ❌
```
