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

**⚠️ IMPORTANT: Do this AFTER the first successful publish**

npm requires the package to exist before you can configure trusted publishing.

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
     - **Environment** (optional): `npm`

4. **Save the configuration**

---

## 🚀 First Publish (One-time Setup)

Since Trusted Publishing requires the package to exist, you need to do the **first publish** using a token:

### Option 1: Manual First Publish (Recommended)

```bash
# Local machine with npm login
npm publish --access public --otp=YOUR_2FA_CODE
```

### Option 2: GitHub Actions with Token (One-time)

1. Create a temporary npm token with 2FA bypass
2. Add to GitHub Secrets as `NPM_TOKEN`
3. Temporarily uncomment the `env:` block in the workflow:
   ```yaml
   env:
     NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```
4. Run the workflow to publish the desired version (for example, your next release)
5. After success, remove the token and revert the workflow

---

## 🔄 After First Publish

Once the package exists on npm:

1. **Configure Trusted Publisher** (follow Step 1 above)
2. **Verify workflow has correct OIDC configuration.** The workflow has two jobs: `build` (tests, build, uploads `dist`) and `publish` (needs `build`; downloads `dist` and publishes). `id-token: write` is set on the `publish` job only, not at workflow level:
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
         id-token: write  # ✅ Required for OIDC — scoped to this job only
       steps:
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '22'
             registry-url: 'https://registry.npmjs.org'  # ✅ REQUIRED for OIDC

         - name: Update npm to latest  # OIDC publishing needs npm >= 11.5.1
           run: npm install -g npm@latest

         - name: Publish to npm (Trusted Publishing via OIDC)
           run: npm publish --access public
   ```

   **Important:** The `registry-url` parameter is REQUIRED for OIDC authentication. When setup-node sees:
   - ✅ `registry-url` is set
   - ✅ `id-token: write` permission exists on the `publish` job
   - ✅ NO `NODE_AUTH_TOKEN` environment variable

   It automatically configures npm to use OIDC for authentication.

3. **Ensure NO token environment variables** in the publish step ✅ (Already done)

---

## 📦 Publishing Flow (After Setup)

### Automatic Publish (via Release):
```bash
gh release create v0.5.2 --title "v0.5.2" --notes "Release notes"
```

### Manual Publish (via Workflow):
1. Go to Actions → Publish to npm
2. Click "Run workflow"
3. OIDC handles npm authentication automatically (no npm token required), but GitHub environment protection rules for the `npm` environment may still require manual approval before the job runs.

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
- **Fix**: Configure it in package settings first

### Error: "Package does not exist"
- **Cause**: First publish not completed
- **Fix**: Do the first publish manually or with a token

### Error: "Workflow not authorized"
- **Cause**: Wrong workflow file name or repo details
- **Fix**: Verify configuration matches exactly:
  - Owner: `sabrish`
  - Repo: `power-platform-solution-blueprint`
  - Workflow: `publish-npm.yml`

---

## 📚 Resources

- [npm Trusted Publishers Docs](https://docs.npmjs.com/trusted-publishers/)
- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)

---

## 🎯 Current Status

- ✅ Workflow configured with OIDC permissions
- ✅ Token dependency removed from workflow
- ⏳ **Waiting**: First publish + npm trusted publisher configuration
- ⏳ **Then**: Token-free publishing via OIDC

---

**Next Action**: Complete first publish, then configure trusted publisher on npm.
