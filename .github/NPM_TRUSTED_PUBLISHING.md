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
     - **Environment** (optional): `npm-production`

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
4. Run the workflow to publish v0.5.1
5. After success, remove the token and revert the workflow

---

## 🔄 After First Publish

Once the package exists on npm:

1. **Configure Trusted Publisher** (follow Step 1 above)
2. **Verify workflow has OIDC permissions:**
   ```yaml
   permissions:
     id-token: write  # ✅ Required for OIDC
   ```
3. **Remove any token references** from the workflow ✅ (Already done)

---

## 📦 Publishing Flow (After Setup)

### Automatic Publish (via Release):
```bash
gh release create v0.5.2 --title "v0.5.2" --notes "Release notes"
```

### Manual Publish (via Workflow):
1. Go to Actions → Publish to npm
2. Click "Run workflow"
3. OIDC handles npm authentication automatically (no npm token required), but GitHub environment protection rules for the `npm-production` environment may still require manual approval before the job runs.

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
