## Push Branch

Run this sequence in order. Stop and report if any step fails — do not push.

### Step 1: TypeScript build check

Run: `pnpm tsc --noEmit`

If this fails: stop. Report the errors. Do not continue.

### Step 2: Full test suite

Run: `pnpm test --run`

If any tests fail: stop. Report which tests failed. Do not continue.

### Step 3: Production build

Run: `pnpm build`

This catches bundle errors, dynamic import failures, and chunk size issues.
If this fails: stop. Report the errors. Do not continue.

Check the build output for unexpected chunk sizes. Flag any chunk > 500KB
that was not present before this change.

### Step 4: Security audit (full branch diff)

Run: `git diff main...HEAD --name-only`

Pass the full list of changed files to @security-auditor.
This catches anything that passed pre-commit but is present anywhere
in the branch history that will become public on push.

If any HIGH severity finding: stop. Do not push.
Advise the project owner to rebase/squash to remove the sensitive
data from history before pushing.
MEDIUM or LOW: report and ask whether to proceed.

### Step 5: Push

Only reach this step if Steps 1–4 all pass.

Run: `git push origin [current branch name]`

Report: "Branch pushed. All pre-PR checks passed."
Remind the project owner to open a PR if one does not exist.
