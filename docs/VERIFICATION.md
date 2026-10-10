# PPTB Verification: Maintenance Guide

This guide explains how maintainers keep the PPTB **Verified** badge on PPSB. It covers the criteria, the rules that remove the badge, and a pre-release checklist.

**Source of criteria:** `https://docs.powerplatformtoolbox.com/tool-development/maturity-model`. The page could not be fetched while this guide was written, so the criteria below are reported from the maturity model summary, not independently verified. Re-check the live page before each verification request or re-review.

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
| CSP exceptions | Any `cspExceptions` must be documented | `package.json` has **no** `cspExceptions` field. Adding one removes the badge (section 3). |
| Security (CVEs) | No critical or high CVEs in the published package's production dependencies | Run `npm audit --omit=dev` against the published package's dependency tree (see section 4). |
| Deprecated PPTB APIs | Tool does not use deprecated PPTB APIs | The PPTB API surface PPSB uses is listed below. Check it against the current `@pptb/types` release. |
| Theme | Tool reacts to PPTB light and dark themes | `src/contexts/ThemeContext.tsx` reads the theme via `window.toolboxAPI.utils.getCurrentTheme()` and re-applies it on `settings:updated` events. |
| Icon | SVG icon present under `dist/` and referenced by the top-level `icon` field | `package.json` sets `"icon": "icon/ppsb.svg"`. The source file is `public/icon/ppsb.svg`, which Vite copies to `dist/icon/ppsb.svg`. |
| Version | Version 1.0.0 or higher | `package.json` `version` (currently 1.5.0). |
| Bug response health | Fewer than 5 open bugs; first maintainer response within 10 days | Flagged at 10 days without a response; blocker at 30 days (reported, not independently verified). |
| Active contributor | Maintainer is actively contributing | Maintainer activity on the repository. |
| Breaking changes | Tool is updated for breaking changes in PPTB APIs | Track PPTB release notes and `@pptb/types` changes (section 4). |
| Usage signals | Two of three: 10+ monthly active users, 50+ downloads, one rating of 3 or higher | A reviewer may waive this requirement (reported, not independently verified). |

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

| Event | Consequence |
|-------|-------------|
| Critical or high CVE in the published package's production dependencies | Badge removed immediately |
| New `cspExceptions` entry added to `package.json` | Badge removed immediately |
| Bug-health breach (5+ open bugs, or no first response within 10 days) | 2-week grace period to fix. Unresolved after the grace period, the badge is removed. |
| Unaddressed PPTB API breaking change | Badge removed 2 weeks after the PPTB release that introduced it |
| Publishing an update while a verification request is queued | Cancels the queued request. Do not publish during a queued request. |
| Badge removed for any reason | Reinstatement requires a full re-review, not a shortcut |

---

## 4. Pre-Release Checklist (Maintainers)

Run before every release tag:

- [ ] `pnpm validate` passes
- [ ] `pnpm test` and `pnpm build` pass (the same gate used by `.github/workflows/publish-npm.yml`)
- [ ] Pre-release security audit: `npm audit --omit=dev` shows no critical or high findings for the published package. Run it against the published dependency tree, not only the dev lockfile.
- [ ] No new `cspExceptions` entry in `package.json`
- [ ] `icon/ppsb.svg` is present under `dist/` after `pnpm build`
- [ ] `README.md` screenshots and install instructions still match the release
- [ ] PPTB release notes checked for API changes affecting the table in section 2
- [ ] No verification request is queued. If one is, hold the publish.
- [ ] Open issues reviewed; first response given to every issue within 10 days

### Nightly Audit

The maturity model expects the CVE check to run nightly. This repository does not currently define a scheduled audit workflow. Adding one is a maintainer task outside this document.

---

## Related Documents

- `CONTRIBUTING.md` — Testing in PPTB Desktop
- `.github/PUBLISHING.md` — publish workflow
- `package.json` — `validate`, `test`, and `build` scripts
