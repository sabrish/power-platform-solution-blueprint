# npm-shrinkwrap.json Generation Guide

## Overview

This project uses **pnpm** for development but requires **npm-shrinkwrap.json** for PPTB Desktop compatibility. The shrinkwrap file must be generated using **npm** (not pnpm) to ensure correct format and compatibility.

## Why This Process is Needed

- **Development**: We use `pnpm` for faster installs and disk space efficiency
- **PPTB Desktop**: Requires `npm-shrinkwrap.json` for consistent npm installations
- **Incompatibility**: pnpm's lockfile format (`.pnpm` directories) is incompatible with npm's parser

## When to Regenerate

Regenerate `npm-shrinkwrap.json` whenever:
- Dependencies are added, updated, or removed in `package.json`
- Before publishing a new version to npm
- After any changes to `package.json` dependencies or devDependencies

## Step-by-Step Process

### 1. Backup pnpm Files

```bash
# Temporarily move pnpm-lock.yaml to prevent conflicts
mv pnpm-lock.yaml pnpm-lock.yaml.bak
```

### 2. Clean Build Artifacts

```bash
# Remove existing node_modules and shrinkwrap
rm -rf node_modules
rm npm-shrinkwrap.json
```

### 3. Generate with npm

```bash
# Install dependencies with npm (use --legacy-peer-deps if needed)
npm install --legacy-peer-deps

# Generate npm-shrinkwrap.json from package-lock.json
npm shrinkwrap
```

**Note**: `npm shrinkwrap` renames `package-lock.json` to `npm-shrinkwrap.json`

### 4. Verify Generation

```bash
# Check that shrinkwrap has no .pnpm paths (should return 0)
grep -c "\.pnpm" npm-shrinkwrap.json || echo "No .pnpm references found - GOOD"

# Verify structure uses standard npm paths
head -n 50 npm-shrinkwrap.json
```

Look for paths like:
- ✅ `"node_modules/@package/name"` (correct)
- ❌ `"node_modules/.pnpm/@package+name@version"` (wrong - pnpm format)

### 5. Test Installation

```bash
# Test the pack and install workflow
npm pack
mkdir test-install
cd test-install
tar -xzf ../YOUR-PACKAGE-NAME-VERSION.tgz
cd package
npm install --production --no-optional
```

**Expected**: Installation should complete without errors.
**Common Error if Wrong**: `Cannot read properties of null (reading 'matches')`

### 6. Cleanup Test Artifacts

```bash
# Return to project root
cd ../..
rm -rf test-install
rm *.tgz
```

### 7. Restore pnpm for Development

```bash
# Restore pnpm-lock.yaml
mv pnpm-lock.yaml.bak pnpm-lock.yaml

# Optional: Reinstall with pnpm for continued development
rm -rf node_modules
pnpm install
```

## Complete Script

For convenience, here's the complete workflow:

```bash
# Save as scripts/regenerate-shrinkwrap.sh

#!/bin/bash
set -e

echo "🔄 Regenerating npm-shrinkwrap.json..."

# Backup pnpm files
echo "📦 Backing up pnpm-lock.yaml..."
mv pnpm-lock.yaml pnpm-lock.yaml.bak

# Clean
echo "🧹 Cleaning build artifacts..."
rm -rf node_modules
rm -f npm-shrinkwrap.json package-lock.json

# Install with npm
echo "📥 Installing with npm..."
npm install --legacy-peer-deps

# Generate shrinkwrap
echo "🔒 Generating npm-shrinkwrap.json..."
npm shrinkwrap

# Verify
echo "✅ Verifying generation..."
PNPM_COUNT=$(grep -c "\.pnpm" npm-shrinkwrap.json || echo "0")
if [ "$PNPM_COUNT" -eq "0" ]; then
    echo "✅ No .pnpm references found - GOOD"
else
    echo "❌ ERROR: Found $PNPM_COUNT .pnpm references!"
    exit 1
fi

# Test
echo "🧪 Testing pack and install..."
npm pack
mkdir -p test-install
tar -xzf *.tgz -C test-install
cd test-install/package
npm install --production --no-optional
cd ../..

# Cleanup
echo "🧹 Cleaning up test artifacts..."
rm -rf test-install
rm *.tgz

# Restore pnpm
echo "📦 Restoring pnpm-lock.yaml..."
mv pnpm-lock.yaml.bak pnpm-lock.yaml

echo "✅ npm-shrinkwrap.json successfully regenerated and tested!"
```

Make executable:
```bash
chmod +x scripts/regenerate-shrinkwrap.sh
```

## Troubleshooting

### Error: `Cannot read properties of null (reading 'matches')`
**Cause**: npm-shrinkwrap.json contains pnpm-specific paths
**Solution**: Regenerate using this guide, ensuring pnpm-lock.yaml is moved before npm install

### Error: `Unsupported URL Type "workspace:"`
**Cause**: npm is reading pnpm-lock.yaml or pnpm workspace configuration
**Solution**: Ensure pnpm-lock.yaml is renamed/moved before running npm install

### Error: `npm audit` shows vulnerabilities
**Note**: This is normal. Run `npm audit fix` for safe fixes. Major version updates (--force) should be done carefully in a separate release.

## Important Notes

- ✅ **Always use npm** to generate npm-shrinkwrap.json (not pnpm)
- ✅ **Test the installation** before committing
- ✅ **Keep pnpm-lock.yaml** for development workflow
- ❌ **Don't commit .pnpm paths** in npm-shrinkwrap.json
- ❌ **Don't run `pnpm install`** with npm-shrinkwrap.json present (creates conflicts)

## CI/CD Integration

If using CI/CD, ensure your publish workflow uses npm for final verification:

```yaml
# Example GitHub Actions
- name: Verify npm-shrinkwrap.json
  run: |
    npm install --production --no-optional
    npm pack
    tar -xzf *.tgz
    cd package
    npm install --production --no-optional
```

---

**Last Updated**: 2026-02-12
**Version Compatibility**: npm 7+, pnpm 8+
