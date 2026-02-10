# Publishing to npm - Trusted Publishing Setup

This repository uses **GitHub Actions with npm provenance** for secure, automated publishing to npm.

## 🔐 Security Features

- ✅ **Provenance attestations** - Cryptographically signed build provenance
- ✅ **OIDC authentication** - No long-lived tokens in workflows
- ✅ **2FA support** - Manual workflow supports one-time passwords
- ✅ **Minimal permissions** - Workflows use least-privilege access

---

## 📋 One-Time Setup

### 1. Create npm Access Token

**Required for automated publishing until npm fully supports OIDC.**

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click **"Generate New Token"** → **"Granular Access Token"**
3. Configure the token:
   - **Token name**: `GitHub Actions - power-platform-solution-blueprint`
   - **Expiration**: 90 days (maximum)
   - **Packages and scopes**: Select your package
   - **Permissions**:
     - ✅ Read and write (for publishing)
   - **Organizations**: (Leave default)
   - **IP allowances**: GitHub Actions IP ranges (optional for extra security)
4. Click **"Generate Token"**
5. **Copy the token immediately** (you won't see it again)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository: https://github.com/sabrish/power-platform-solution-blueprint
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **"Add secret"**

### 3. Enable Provenance on npm (Optional but Recommended)

1. Go to your package page: https://www.npmjs.com/package/@sabrish/power-platform-solution-blueprint
2. Navigate to **Settings**
3. Enable **"Provenance attestations"** if available

---

## 🚀 Publishing Methods

### Method 1: Automatic Publish (via GitHub Release)

**Recommended for version releases**

1. Update version in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

2. Commit and push:
   ```bash
   git add package.json
   git commit -m "Bump version to X.Y.Z"
   git push
   ```

3. Create a GitHub Release:
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "Release notes here"
   ```

   Or via GitHub UI:
   - Go to **Releases** → **Draft a new release**
   - Create a new tag (e.g., `v0.5.1`)
   - Click **"Publish release"**

4. The workflow will automatically:
   - Build the project
   - Publish to npm with provenance
   - Generate signed attestations

### Method 2: Manual Publish (via GitHub Actions)

**For immediate publishing with 2FA**

1. Go to **Actions** → **Manual Publish to npm**
2. Click **"Run workflow"**
3. Enter your current 2FA code (6 digits from authenticator app)
4. Click **"Run workflow"**
5. Monitor the workflow execution

### Method 3: Local Publish (Fallback)

**Only if GitHub Actions is unavailable**

```bash
# Ensure you're logged in
npm whoami

# Build the project
pnpm build

# Publish with 2FA
npm publish --access public --otp=YOUR_2FA_CODE
```

---

## 🔍 Verifying Publication

After publishing, verify the package:

```bash
# View package info
npm view @sabrish/power-platform-solution-blueprint

# Check provenance (if supported)
npm view @sabrish/power-platform-solution-blueprint --json | jq .dist.signatures
```

Visit your package page:
https://www.npmjs.com/package/@sabrish/power-platform-solution-blueprint

Look for the **provenance badge** (🛡️ Provenance) indicating secure publishing.

---

## 🔄 Token Rotation

npm granular access tokens expire after 90 days. Set a calendar reminder to rotate:

1. 7 days before expiration, generate a new token (same process as setup)
2. Update `NPM_TOKEN` secret in GitHub
3. Delete the old token from npm

---

## 🐛 Troubleshooting

### Workflow fails with "403 Forbidden"
- **Cause**: Token expired or insufficient permissions
- **Fix**: Regenerate token with "Read and write" permission

### Workflow fails with "E401 Unauthorized"
- **Cause**: Token not set or incorrect in GitHub Secrets
- **Fix**: Verify `NPM_TOKEN` secret exists and is correct

### Manual workflow requires 2FA but fails
- **Cause**: OTP code expired (codes are valid for 30 seconds)
- **Fix**: Get a fresh code and run workflow immediately

### Package size warning
- **Cause**: Large build artifacts (expected for this project)
- **Fix**: This is normal - Mermaid and other dependencies are large

---

## 📚 Additional Resources

- [npm Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [PPTB Publishing Guide](https://docs.powerplatformtoolbox.com/tool-development/publishing)
