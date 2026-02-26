# Publishing to npm

This repository publishes to npm using **OIDC Trusted Publishing** — no long-lived npm tokens required.

> **Setup guide:** See [`NPM_TRUSTED_PUBLISHING.md`](NPM_TRUSTED_PUBLISHING.md) for one-time npm + GitHub configuration.

---

## How Publishing Works

The `publish-npm.yml` workflow handles all publishing. It authenticates with npm via OIDC (short-lived token, no secrets to manage) and generates signed provenance attestations automatically.

**Triggers:**
- Automatically on GitHub Release publication (`release: published`)
- Manually via Actions → "Publish to npm" → "Run workflow"

The workflow runs on the `npm` GitHub Environment. If that environment has required-reviewer protection configured, you will receive an approval notification before the job runs.

---

## Release Process

Follow the release workflow defined in `.claude/agents/orchestrator.md`. In summary:

1. Reviewer, Security Auditor, Document Updater, Developer all run in sequence (see orchestrator)
2. Orchestrator prints the exact git commands to run manually:
   ```bash
   git add package.json CHANGELOG.md README.md npm-shrinkwrap.json
   git commit -m "chore: release v[version]"
   git tag v[version] -m "Release v[version]"
   git push origin main
   git push origin v[version]
   ```
3. Create a GitHub Release from the tag — this triggers the publish workflow automatically

---

## Manual Publish (workflow_dispatch)

1. Go to **Actions** → **Publish to npm**
2. Click **"Run workflow"**
3. Optionally enter a version string (leave blank to use `package.json` version)
4. Click **"Run workflow"**
5. Approve the deployment in the `npm` environment if required-reviewer protection is active

---

## Local Publish (emergency fallback only)

Only use this if GitHub Actions is unavailable:

```bash
# Ensure you are logged in to npm
npm whoami

# Build the project
pnpm build

# Publish
npm publish --access public
```

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
| "Package does not exist" | First publish not completed | Do the first publish locally: `npm publish --access public` |
| "Workflow not authorized" | Wrong workflow/repo details in npm trusted publisher config | Verify: owner `sabrish`, repo `power-platform-solution-blueprint`, workflow `publish-npm.yml`, environment `npm` |
| Build fails | TypeScript errors or pnpm lockfile out of date | Fix errors locally; run `pnpm install` if lockfile is stale |

---

## Resources

- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers/)
- [GitHub OIDC Hardening](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [PPTB Publishing Guide](https://docs.powerplatformtoolbox.com/tool-development/publishing)
