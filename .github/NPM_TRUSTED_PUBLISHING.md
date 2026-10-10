# npm Trusted Publishing Setup Guide

This repository uses **npm Trusted Publishers** with OIDC for secure, token-free publishing from GitHub Actions.

---

## 🔐 What is Trusted Publishing?

Trusted Publishing uses **OpenID Connect (OIDC)** to authenticate GitHub Actions with npm directly, eliminating the need for long-lived tokens. Each publish uses a short-lived, cryptographically-signed token specific to your workflow.

### Benefits:
- ✅ **No tokens to manage** - No expiration, no rotation, no leaks
- ✅ **Automatic provenance** - Supply chain transparency built-in
- ✅ **More secure** - Short-lived tokens that can't be extracted
- ✅ **No 2FA bypass needed** - OIDC handles authentication

---

## ⚙️ Setup Instructions

### Step 1: Configure npm Package for Trusted Publishing

**Historical:** The package has existed on npm since 2026-02, so the first-publish prerequisite no longer applies. This section is kept as the reference for the trusted publisher configuration.

1. **Go to your package settings:**
   - Navigate to: https://www.npmjs.com/package/@sabrish/power-platform-solution-blueprint/settings

2. **Find "Trusted Publisher" section:**
   - Scroll down to **"Publishing Access"** or **"Trusted Publisher"**

3. **Add GitHub Actions as trusted publisher:**
   - Click **"GitHub Actions"** button
   - Fill in the details:
     - **Repository owner**: `sabrish`
     - **Repository name**: `power-platform-solution-blueprint`
     - **Workflow file**: `publish-npm.yml`
     - **Environment**: `npm` (must match the `environment: name: npm` of the publish job)

4. **Save the configuration**

---

## 🚀 First Publish (Historical)

**Historical — do not follow for this package.** The package's first publish predates the trusted publisher configuration, and trusted publishing through the workflow is the standard publish path. The workflow does not use an npm token, and there is no `env:` block that would supply one.

---

## 🔄 Workflow Configuration

The workflow (`.github/workflows/publish-npm.yml`) has two jobs: `build` (install, test, build, upload `dist` as an artifact) and `publish` (needs `build`; downloads `dist` and publishes). `id-token: write` is set on the `publish` job only, not at workflow level:

```yaml
permissions:
  contents: read  # Workflow-level default; no id-token here

jobs:
  build:
    # pnpm install --frozen-lockfile, pnpm test, pnpm build, upload dist artifact

  publish:
    needs: build
    if: github.event_name == 'release' || github.ref == 'refs/heads/main'
    environment:
      name: npm
    permissions:
      contents: read
      id-token: write  # Required for OIDC; scoped to this job only
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'

      - name: Update npm to latest  # OIDC publishing needs npm >= 11.5.1
        run: npm install -g npm@latest

      - name: Download dist artifact
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist

      - name: Publish to npm (Trusted Publishing via OIDC)
        run: npm publish --access public
```

**Requirements for OIDC publishing:**
- `registry-url` is set on `actions/setup-node`.
- `id-token: write` is set on the `publish` job.
- No `NODE_AUTH_TOKEN` or other npm token is set in the workflow. The workflow has no `env:` block.

---

## 📦 Publishing Flow (After Setup)

### Manual Publish (via Workflow, recommended):
1. Go to Actions → Publish to npm
2. Click "Run workflow" and select the `main` branch. The workflow has no version input
3. OIDC handles npm authentication automatically (no npm token required). The `npm` environment requires reviewer approval before the publish job runs

### GitHub Release publish (UNTESTED):
Creating a GitHub Release from an existing tag (for example `vX.Y.Z`) would trigger the workflow through a tag ref. This path is untested for this package. The `npm` environment deploys from protected branches only, so the run may be blocked. Use Manual Publish above.

Creating a GitHub Release after a manual publish triggers the workflow again. That run waits for approval in the `npm` environment (or is blocked by its deployment policy). npm refuses to republish an existing version, so do not approve it.

---

## 🔍 Verification

After publishing with Trusted Publishing:

1. **Check package page:**
   - Visit: https://www.npmjs.com/package/@sabrish/power-platform-solution-blueprint
   - Look for **🛡️ Provenance** badge

2. **View provenance details:**
   ```bash
   npm view @sabrish/power-platform-solution-blueprint --json | jq .dist.signatures
   ```

3. **Verify trusted publisher:**
   - Package settings should show GitHub Actions as configured publisher

---

## 🐛 Troubleshooting

### Error: "This operation requires authentication"
- **Cause**: Trusted Publisher not configured on npm
- **Fix**: Configure it in package settings

### Error: "Workflow not authorized"
- **Cause**: Wrong workflow file name, repo details, or environment name
- **Fix**: Verify configuration matches exactly:
  - Owner: `sabrish`
  - Repo: `power-platform-solution-blueprint`
  - Workflow: `publish-npm.yml`
  - Environment: `npm`

### Error: "You cannot publish over the previously published versions: X.Y.Z"
- **Cause**: The version in `package.json` is already on npm
- **Fix**: Reject the pending `npm` environment approval. A new release needs a new version number

### Run blocked by the environment's deployment policy (protected branches only)
- **Cause**: The `npm` environment's deployment policy allows protected branches only. A run triggered by a GitHub Release uses a tag ref, which the policy does not allow, so the run is blocked. The GitHub Release path is UNTESTED for this package.
- **Fix**: Run the workflow manually from `main` (see Manual Publish above). This is the recommended path.

---

## 📚 Resources

- [npm Trusted Publishers Docs](https://docs.npmjs.com/trusted-publishers/)
- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)

---

## 🎯 Current Status

- ✅ Trusted publishing works for this package
- ✅ v1.5.0 was published from `main` via workflow_dispatch, with provenance
- ✅ Workflow uses OIDC (`id-token: write` on the publish job only); no npm token is used
- ✅ Publish runs in the `npm` GitHub Environment

---

**Next Action**: None for setup. Future releases follow `.github/PUBLISHING.md`.
