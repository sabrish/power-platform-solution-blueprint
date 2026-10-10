---
allowed-tools: Task, Read
description: Run the full PPSB release sequence. Invoke when the project owner says things like "ready for release", "run release", "trigger release", "cut a release", "prepare a release", or "release vX.Y.Z".
---

Release sequence for Power Platform Solution Blueprint (PPSB).
Run every step in order. Do not skip steps. Do not proceed past a failed step.

**Target version:** $ARGUMENTS
(If no version specified, ask the project owner for the target version before proceeding.)

---

## Step 1: Code Review

Invoke the **reviewer** agent.
- Scope: all files changed since the last release tag
- The reviewer must return APPROVED or APPROVED WITH COMMENTS to proceed
- If BLOCKED: stop, report blockers, wait for fixes before re-running

**Progress:** Step 1 complete ✅ — Code review passed. / ❌ Step 1 failed — [blockers]. Release halted.

---

## Step 2: Security Audit

Invoke the **security-auditor** agent.
- Scope: full sweep — source code AND .claude/ folder
- Any CRITICAL or HIGH finding: stop, report findings, do not proceed.

**Progress:** Step 2 complete ✅ — Security audit passed. / ❌ Step 2 failed — [findings]. Release halted.

---

## Step 3: Version Bump and Documentation

### Step 3a — Developer agent: Version bump

Invoke the **developer** agent to run:

```
npm version X.Y.Z --no-git-tag-version
```

This updates only `package.json` (the repository has no `npm-shrinkwrap.json`). Do not proceed to Step 3b
until the developer confirms the file is updated.

**Progress:** Step 3a complete ✅ — package.json updated to vX.Y.Z.

### Step 3b — Document-updater agent: Documentation

Invoke the **document-updater** agent with these exact tasks:

1. Finalise `CHANGELOG.md`: move the `## [Unreleased]` section to a versioned
   entry `## [X.Y.Z] — YYYY-MM-DD` with today's date. The heading is matched by its text.
2. Update `README.md`: update the `**Version:** X.Y.Z · **Status:** Stable` line near the top
   and any inline version references to the target version. The version line is plain text;
   shields.io badges are not used because PPTB's README viewer blocks `img.shields.io`.
3. Update `docs/user-guide.md`: change the version subtitle
   (`Complete guide for using Power Platform Solution Blueprint (PPSB) vX.Y.Z`)
   to the target version. Locate the line by its subtitle text, not by line number.
4. Verify all **four** locations show the same version: the `package.json` `version` field,
   the `CHANGELOG.md` `## [X.Y.Z]` heading, the `README.md` version line, and the
   `docs/user-guide.md` subtitle. This is a release blocker if they do not match.

Do not proceed to Step 4 until the document-updater confirms all four locations are consistent.

**Progress:** Step 3b complete ✅ — CHANGELOG.md, README.md and docs/user-guide.md updated. All four locations consistent on vX.Y.Z. / ❌ Step 3b failed — version mismatch: [detail]. Release halted.

---

## Step 4: Build and Verification

Invoke the **developer** agent with these exact tasks, in this exact order:

1. `pnpm typecheck` — must pass with zero errors. Stop if any errors.
2. `pnpm test` — all unit tests must pass. Stop if any test fails.
3. `pnpm build` — must complete successfully. Stop if it fails.
4. `pnpm validate` — PPTB manifest validation must pass. Stop if it fails.
5. Dependency audit (production-only; this is the release gate). Must show **zero critical and zero high** findings.
   A critical or high finding in the production dependency tree removes the Verified badge immediately (see `docs/VERIFICATION.md` section 3). The check method is in `docs/VERIFICATION.md` section 4 (Governance Audit Method).
   - Build the tarball into a temp directory: `npm pack --pack-destination <temp-dir>`
   - In a second, empty temp directory: `npm init --yes`, then
     `npm install --package-lock-only --ignore-scripts --omit=dev <absolute-path-to-tarball>`. Use the ABSOLUTE path to the tarball (the `<temp-dir>` path joined with the filename `npm pack` printed), not a relative path, because the install runs after changing directory and a relative path will not resolve.
   - In the same directory, run `npm audit --omit=dev --json` and read `metadata.vulnerabilities`. The gate is `critical == 0` and `high == 0`. If `metadata.vulnerabilities` is absent (for example a registry or network error), treat the audit as FAILED and re-run it. A non-zero exit code is not a failure by itself only when `metadata.vulnerabilities` is present and critical and high are 0: `npm audit` exits non-zero on moderate findings too, and only critical and high findings block the release.
   - Report the `moderate` and `low` counts as information only. Any critical or high finding stops the release.
   - Informational only: run `pnpm audit` in the repository root to audit the whole tree, including dev dependencies (this repo's lockfile is `pnpm-lock.yaml`). Its findings do not block the release.
   - Repeat the production-only audit after publish (Step 5, item 5) against `<pkg>@<version>`, which is the same method the governance script uses on the published package.

**Progress:** Step 4 complete ✅ — Typecheck, tests, build and manifest validation passed. Dependency audit: zero critical/high. / ❌ Step 4 failed — [error]. Release halted.

---

## Step 5: Release Summary and Git Commands

Confirm Steps 1–4 (including Steps 3a and 3b) all passed, then print the following. Do not run any of these:

```
Release complete.
Code review ✅/❌
Security audit ✅/❌/⚠️
Version bump ✅/❌
Documentation updated ✅/❌
Typecheck ✅/❌
Tests ✅/❌
Build ✅/❌
Manifest validation ✅/❌
Dependency audit (zero critical/high) ✅/❌
Verdict: READY TO PUBLISH ✅ / BLOCKED ❌
```

Print the git commands for manual execution only if the verdict is READY TO PUBLISH.

**1. Release commit (on the release branch).** Run `/pre-commit` on the four files first; the commit needs its own CLEAR TO COMMIT.

```
git add package.json CHANGELOG.md README.md docs/user-guide.md
git commit -m "chore: release vX.Y.Z"
```

**2. Push and open a PR.** Push the branch with `/push-branch`, delegated to the developer agent when the project owner asks for it. Do not use `git push` directly. Open a PR into `main` and merge it.

**3. Tag on main, after the merge.** The tag must be created on `main`, never on the release branch:

```
git checkout main
git pull --ff-only origin main
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

Use `-F <file>` instead of `-m` to put the CHANGELOG section for `[X.Y.Z]` in the tag body. Tags `v1.0.0` to `v1.4.0` use that form.

**4. Publish to npm (recommended path).** Run the **Publish to npm** workflow manually from `main` and approve the `npm` environment deployment when reviewer approval is requested. This is the path v1.5.0 used. See `.github/PUBLISHING.md`. Publishing by creating a GitHub Release from the tag is UNTESTED: the `npm` environment deploys from protected branches only, so a release-triggered run (tag ref) may be blocked. Do not create a GitHub Release after a manual run has published: publishing a Release triggers the workflow again. That run waits for approval in the `npm` environment (or is blocked by its deployment policy). npm refuses to republish an existing version, so do not approve it.

**5. Post-publish.** Confirm the version on npm (`npm view <pkg> version`). Then repeat the production-only audit from Step 4, item 5, against `<pkg>@<version>`: in a fresh empty temp directory run `npm init --yes`, `npm install --package-lock-only --ignore-scripts --omit=dev <pkg>@<version>`, then `npm audit --omit=dev --json` and read `metadata.vulnerabilities` with the same gate as Step 4 (critical == 0 and high == 0). If `metadata.vulnerabilities` is absent, treat the audit as FAILED and re-run it. A non-zero exit code is not a failure by itself only when that field is present and critical and high are 0. Any critical or high finding is escalated to the project owner.

NEVER run `git push`, `git tag` or any publish action yourself. The project owner runs these commands manually, unless the project owner explicitly authorises the action for that release.
