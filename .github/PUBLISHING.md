# Publishing to npm

This repository publishes to npm using **OIDC Trusted Publishing** — no long-lived npm tokens required.

> **Setup guide:** See [`NPM_TRUSTED_PUBLISHING.md`](NPM_TRUSTED_PUBLISHING.md) for the npm + GitHub trusted publisher configuration.

---

## How Publishing Works

The `publish-npm.yml` workflow has two jobs:

1. **`build`** — runs on every trigger. Installs dependencies with `pnpm install --frozen-lockfile`, runs `pnpm test`, then `pnpm build`, and uploads `dist/` as an artifact. If tests fail, the build job fails and nothing is published.
2. **`publish`** — `needs: build`. Runs only when the event is a GitHub Release or the run's ref is `main`; otherwise it is skipped. It runs in the `npm` GitHub Environment, downloads the `dist` artifact and runs `npm publish --access public`. Authentication uses OIDC (short-lived token, no secrets to manage), and provenance attestations are generated automatically. Only this job has `id-token: write`.

The version published is the one in `package.json`. The workflow takes no version input.

**Triggers:**
- `release: published` — a GitHub Release is published
- `workflow_dispatch` — Actions → "Publish to npm" → "Run workflow" (no inputs; run from `main`)

**Environment:** The `npm` environment requires approval by a reviewer before the publish job runs. Its deployment policy allows protected branches only.

---

## Release Process

Follow the release sequence in `.claude/commands/release.md`. In summary:

1. Reviewer, security audit, version bump (`npm version X.Y.Z --no-git-tag-version`), documentation, typecheck, tests, build, manifest validation and dependency audit run in sequence (see `release.md`).
2. Commit the release files on the release branch, push with `/push-branch`, open a PR into `main`, and merge it.
3. On `main`, the project owner creates the tag (annotated; the tag is never created on a feature branch):
   ```bash
   git checkout main
   git pull --ff-only origin main
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```
4. Publish: run the workflow manually from `main` (below). A GitHub Release is optional once a manual run has published.

---

## Manual Publish (workflow_dispatch)

1. Go to **Actions** → **Publish to npm**
2. Click **"Run workflow"**
3. Select the `main` branch. The publish job is skipped for other branches. There is no version input; the version is read from `package.json`
4. Click **"Run workflow"**
5. Approve the deployment in the `npm` environment when the reviewer approval is requested

---

## Publishing via GitHub Release (optional)

A GitHub Release can be created from the tag after a manual run has published the same version.

1. Go to **Releases** → **Draft a new release** and choose the tag `vX.Y.Z`
2. Publish the release. This triggers the workflow again.
3. The publish job waits for approval in the `npm` environment. **Reject** that approval if the version is already on npm, because npm refuses to republish an existing version.

---

## Local Publish (emergency fallback only)

Only use this if GitHub Actions is unavailable. A local publish does not produce provenance attestations.

```bash
# Ensure you are logged in to npm
npm whoami

# Build the project
pnpm build

# Publish
npm publish --access public
```

---

## Dependency Audit

Release Step 4 (`.claude/commands/release.md`) requires zero critical and zero high findings before publish. The same audit is repeated after publish against `<package>@<version>`.

---

## Verifying Publication

```bash
# Check package info
npm view @sabrish/power-platform-solution-blueprint

# View provenance signatures
npm view @sabrish/power-platform-solution-blueprint --json | jq .dist.signatures
```

Visit the package page and look for the **Provenance** badge.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "This operation requires authentication" | Trusted Publisher not configured on npm | Configure it in npm package settings — see `NPM_TRUSTED_PUBLISHING.md` |
| "Workflow not authorized" | Wrong workflow, repo or environment details in the npm trusted publisher config | Verify: owner `sabrish`, repo `power-platform-solution-blueprint`, workflow `publish-npm.yml`, environment `npm` |
| "cannot republish an existing version" | The `package.json` version is already on npm (for example, a GitHub Release re-triggered the workflow after a manual publish) | Reject the pending `npm` approval. Do not retry the same version; a new release needs a new version number |
| Publish job waiting for approval | The `npm` environment requires reviewer approval | Approve the deployment on the run page if the run is intended; reject it otherwise |
| Publish job blocked or rejected by environment policy | The `npm` environment deployment policy allows protected branches only | Run the workflow manually from `main`. Release-triggered runs use a tag ref; if such a run is blocked, use the manual run instead |
| Tests fail | `pnpm test` in the `build` job failed, so the `publish` job never ran | Run `pnpm test` locally, fix the failing tests, then re-run the workflow |
| Build fails | `pnpm build` in the `build` job failed (after tests passed), or the lockfile is out of date under `--frozen-lockfile` | Fix TypeScript/bundle errors locally; run `pnpm install` and commit `pnpm-lock.yaml` if the lockfile is stale |
| `publish` job skipped | Manual run was not on `main`, and the event was not a release | Re-run from `main` via workflow_dispatch, or publish via a GitHub Release |

---

## Resources

- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers/)
- [GitHub OIDC Hardening](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [PPTB Publishing Guide](https://docs.powerplatformtoolbox.com/tool-development/publishing)
