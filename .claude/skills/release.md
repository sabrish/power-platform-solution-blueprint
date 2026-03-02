---
name: release
description: Full release sequence invoked by the orchestrator. Runs reviewer, security-auditor, document-updater (version bump), and developer (typecheck/build/shrinkwrap) in order. Not invoked directly by the project owner — the orchestrator calls this when you say "prepare a release" or "cut a release".
---

/agent orchestrator

Release sequence for Power Platform Solution Blueprint (PPSB).
Run every step in order. Do not skip steps. Do not proceed past a failed step.

**Target version:** $ARGUMENTS
(If no version specified, ask the project owner for the target version before proceeding.)

---

## Step 1: Code Review

Invoke the **reviewer** agent.
- Scope: all files changed since the last release tag
- The reviewer must return ✅ Approved or ⚠️ Approved with comments to proceed
- If ❌ Changes required: stop, report blockers, wait for fixes before re-running

---

## Step 2: Security Audit

Invoke the **security-auditor** agent.
- Scope: full sweep — source code AND .claude/ folder
- If any CRITICAL or HIGH findings: stop, report findings, do not proceed
- MEDIUM or LOW findings: report but may proceed at project owner's discretion

---

## Step 3: Version Bump and Documentation

Invoke the **document-updater** agent with these exact tasks:

1. Bump version in `package.json` to the target version
2. Finalise `CHANGELOG.md`: move the `## [Unreleased]` section to a versioned
   entry `## [X.Y.Z] — YYYY-MM-DD` with today's date
3. Update `README.md`: update the shields.io version badge at the top and any
   inline version references to the target version
4. Verify all three files match — `package.json` version field, `CHANGELOG.md`
   latest entry header, and `README.md` badge must ALL show the same version
   number. This is a release blocker if they do not match.

Do not proceed to Step 4 until the document-updater confirms all three files
are consistent.

---

## Step 4: Build Verification

Invoke the **developer** agent with these exact tasks, in this exact order:

1. `pnpm typecheck` — must pass with zero errors. Stop if any errors.
2. `pnpm build` — must complete successfully. Stop if it fails.
3. `npm shrinkwrap` — regenerates npm-shrinkwrap.json to capture the updated
   version from package.json. Must use `npm`, never `pnpm`. See NPM_SHRINKWRAP_GENERATION.md.

**Critical:** npm shrinkwrap MUST run after Step 3 (version bump). Running it
before will capture the old version number in npm-shrinkwrap.json.

---

## Step 5: Release Summary and Git Commands

Confirm all four steps passed, then print the following — do not run any of these:

```
## Release v[VERSION] — Ready to Publish

All checks passed:
✅ Code review
✅ Security audit
✅ Version bump — package.json, CHANGELOG.md, README.md all show v[VERSION]
✅ pnpm typecheck — zero errors
✅ pnpm build — succeeded
✅ npm shrinkwrap — regenerated

Run these commands to publish:

git add package.json CHANGELOG.md README.md npm-shrinkwrap.json
git commit -m "chore: release v[VERSION]"
git tag v[VERSION] -m "Release v[VERSION]"
git push origin main
git push origin v[VERSION]
```

NEVER run git push yourself. The project owner must execute these commands
manually. Git push to the public repo is irreversible.
