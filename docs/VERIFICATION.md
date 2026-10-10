# PPTB Verification: Maintenance Guide

This guide explains how maintainers keep the PPTB **Verified** badge on PPSB. It covers the criteria, the rules that remove the badge, and a pre-release checklist.

**Source of criteria:** `https://docs.powerplatformtoolbox.com/tool-development/maturity-model`, read on 2026-10-10. Re-check the live page before each verification request or re-review.

---

## 1. How Verification Works

Verified status requires both:

1. **Automated validation** — `pnpm validate` (runs `pptb-validate`, defined in `package.json`) must pass.
2. **Human review** — a PPTB reviewer checks the tool against the criteria in section 2.

---

## 2. Verification Criteria

| Area | Requirement | How PPSB meets it / what to check |
|------|-------------|-----------------------------------|
| README quality | Includes a screenshot, a description of what the tool does, and install/run instructions | `README.md` contains screenshots under `docs/screenshots/`, a feature description, and an install section. Keep all three present. |
| CSP exceptions | Any `cspExceptions` must be documented | `package.json` has **no** `cspExceptions` field. Adding one removes the badge immediately (section 3; maturity-model page, "Keeping the Badge (Nightly Governance)", read 2026-10-10). |
| Security (CVEs) | No unresolved critical or high vulnerabilities in the dependency tree, checked with `npm audit` (maturity-model page) | Run `npm audit --omit=dev` on the packed tarball before release and on the published package after, using PPTB's governance-script method (see section 4). |
| Deprecated PPTB APIs | Tool does not use deprecated PPTB APIs | The PPTB API surface PPSB uses is listed below. Check it against the current `@pptb/types` release. |
| Theme | Tool reacts to PPTB light and dark themes | `src/contexts/ThemeContext.tsx` reads the theme via `window.toolboxAPI.utils.getCurrentTheme()` and re-applies it on `settings:updated` events. |
| Icon | SVG icon present under `dist/` and referenced by the top-level `icon` field | `package.json` sets `"icon": "icon/ppsb.svg"`. The source file is `public/icon/ppsb.svg`, which Vite copies to `dist/icon/ppsb.svg`. |
| Version | Version 1.0.0 or higher | `package.json` `version` (see `package.json`). |
| Bug response health | Fewer than 5 open bugs; first maintainer response within 10 days | Flagged at 10 days without a response. A bug unanswered for more than 30 days is a blocker for the verification review. |
| Active contributor | Maintainer is actively contributing | Maintainer activity on the repository. |
| Breaking changes | Tool is updated for breaking changes in PPTB APIs | Track PPTB release notes and `@pptb/types` changes (section 4). |
| Usage signals | Two of three: 10+ monthly active users, 50+ downloads, one rating of 3 or higher | A reviewer may waive this requirement only for a new tool with no usage history that meets all other criteria to a high standard. |

### PPTB API Surface Used by PPSB

Verified by searching `src/`:

| API | Used in | Purpose |
|-----|---------|---------|
| `window.toolboxAPI.getToolContext()` | `src/hooks/useBlueprint.ts`, `src/hooks/useScopeData.ts` | Resolves the active environment URL |
| `window.toolboxAPI.events.on()` / `.off()` | `src/hooks/useConnectionChange.ts` | Subscribes to connection change events and unsubscribes on cleanup |
| `window.toolboxAPI.utils.getCurrentTheme()` | `src/contexts/ThemeContext.tsx` | Reads the initial light/dark theme; also listens for `events.on` `settings:updated` |
| `window.dataverseAPI` | `src/hooks/useBlueprint.ts`, `src/hooks/useScopeData.ts` via `PptbDataverseClient` (`src/core/dataverse/PptbDataverseClient.ts`) | All Dataverse calls |

Do not add calls to `window.toolboxAPI.dataverse.*` or `executeDataverseRequest()`. Neither exists (see PATTERN-005 in `.claude/memory/patterns-dataverse.md`).

---

## 3. Rules for Keeping the Badge

Source: `https://docs.powerplatformtoolbox.com/tool-development/maturity-model`, section "Keeping the Badge (Nightly Governance)", read 2026-10-10. The page describes nightly checks in general; it does not describe their scope.

| Event | Consequence | Required action |
|-------|-------------|-----------------|
| Critical or high CVE in the production dependency tree | Badge removed immediately | Fix the dependency, publish, and request full re-verification |
| New CSP exception added | Badge removed immediately | Confirm and document the exception, then request full re-verification |
| Bug health threshold breached | 2-week grace period | Resolve before the grace period ends, or the badge is removed |
| PPTB API breaking change unaddressed | Removed 2 weeks after release | Update and publish; deprecations are announced 2 weeks before release |
| Publishing an update while a verification request is queued or under review | Cancels the request; you must resubmit | Do not update the tool while the request is queued or under review. An update cancels the request, and you must resubmit (maturity-model page, read 2026-10-10) |
| Badge removed for any reason | Reinstatement requires the same full review; the tool shows as Unverified during re-verification | Request full re-verification |

- A bug unanswered for more than 30 days is a blocker for the verification review (section 2).
- The governance-script method behind the CVE check (production-only, install-then-audit) is explained once, in section 4 (Governance Audit Method).

---

## 4. Pre-Release Checklist (Maintainers)

Run before every release tag:

- [ ] `pnpm validate` passes
- [ ] `pnpm test` and `pnpm build` pass (the same gate used by `.github/workflows/publish-npm.yml`)
- [ ] Pre-release security audit: reproduce the governance-script check (`.claude/commands/release.md` Step 4, item 5) on the packed tarball, installing it production-only in an empty temp directory and running `npm audit --omit=dev`. Confirm zero critical and zero high findings. Repeat against the published package after publish (`release.md` Step 5, item 5). Optionally run `pnpm audit` in the repository root for dev dependencies; it is informational and does not block the release.
- [ ] No new `cspExceptions` entry in `package.json` (a new entry removes the badge immediately; section 3)
- [ ] `icon/ppsb.svg` is present under `dist/` after `pnpm build`
- [ ] `README.md` screenshots and install instructions still match the release
- [ ] PPTB release notes checked for API changes affecting the table in section 2
- [ ] No verification request is queued. If one is, hold the publish.
- [ ] Open issues reviewed; first response given to every issue within 10 days

### Governance Audit Method

The maturity-model page states that PPTB runs nightly governance checks but does not describe their scope. PPTB's governance script (`runNpmAudit` in `PowerPlatformToolBox/tool-management`, `buildScripts/maturityGovernance.js`, read 2026-10-10) audits the published package by installing it in a temp directory with `npm install --package-lock-only --ignore-scripts --omit=dev <pkg>@<version>` and running `npm audit --json --omit=dev`. Maintainers reproduce that check before each release (pre-release checklist above) and after publish.

---

## Related Documents

- `CONTRIBUTING.md` — Testing in PPTB Desktop
- `.github/PUBLISHING.md` — publish workflow
- `package.json` — `validate`, `test`, and `build` scripts
