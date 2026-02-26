# Repository Security Setup

This guide ensures only @sabrish can approve PRs, merge code, and deploy to npm.

---

## ✅ Step 1: Branch Protection Rules (REQUIRED)

**Protects the `main` branch from unauthorized changes.**

### Configure via GitHub UI:

1. Go to: https://github.com/sabrish/power-platform-solution-blueprint/settings/branches

2. Click **"Add branch protection rule"** (or edit existing rule for `main`)

3. **Branch name pattern**: `main`

4. **Enable these settings:**

   ✅ **Require a pull request before merging**
   - ✅ Require approvals: **1**
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require review from Code Owners

   ✅ **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging

   ✅ **Require conversation resolution before merging**

   ✅ **Do not allow bypassing the above settings**
   - This ensures even admins (you) follow the rules

   ✅ **Restrict who can push to matching branches**
   - Add: **@sabrish** (only you can push)
   - Or leave empty to allow only via PR

   ✅ **Restrict who can dismiss pull request reviews**
   - Add: **@sabrish** (only you can dismiss reviews)

   ✅ **Allow force pushes**: ❌ Disabled

   ✅ **Allow deletions**: ❌ Disabled

5. Click **"Create"** or **"Save changes"**

---

## ✅ Step 2: Environment Protection (REQUIRED for npm publishing)

**Controls who can trigger the publish workflow.**

### Configure via GitHub UI:

1. Go to: https://github.com/sabrish/power-platform-solution-blueprint/settings/environments

2. Click **"New environment"** (or edit if exists)

3. **Name**: `npm`

4. **Configure environment:**

   ✅ **Required reviewers**
   - Add: **@sabrish**
   - Anyone trying to deploy must wait for your approval

   ✅ **Deployment branches**
   - Select: **Protected branches only**
   - Only `main` (protected branch) can deploy

5. Click **"Save protection rules"**

### Workflow configuration:

The `publish-npm.yml` workflow already references `environment: name: npm`. No further changes needed.

---

## ✅ Step 3: General Repository Settings

1. Go to: https://github.com/sabrish/power-platform-solution-blueprint/settings

2. **Pull Requests section:**
   - ✅ Allow merge commits
   - ❌ Allow squash merging (optional - your preference)
   - ❌ Allow rebase merging (optional - your preference)
   - ✅ Always suggest updating pull request branches
   - ✅ Automatically delete head branches

3. **Require a pull request before merging:**
   - ❌ Allow auto-merge (keeps you in control)

---

## ✅ Step 4: Actions Permissions

1. Go to: https://github.com/sabrish/power-platform-solution-blueprint/settings/actions

2. **General Actions permissions:**
   - ✅ Allow all actions and reusable workflows
   - Or: ✅ Allow select actions (if you want to whitelist)

3. **Workflow permissions:**
   - ⭕ Read repository contents and packages permissions (recommended)
   - ❌ Read and write permissions

4. **Allow GitHub Actions to create and approve pull requests:**
   - ❌ Disabled (prevents automated PRs without your review)

---

## 🔒 What This Protects:

✅ **No one can push directly to `main`** - All changes must go through PRs
✅ **Only you can approve PRs** - CODEOWNERS ensures your review is required
✅ **Only you can merge PRs** - Branch protection restricts merge permissions
✅ **Only you can trigger npm publish** - Environment protection requires your approval
✅ **No force pushes** - History cannot be rewritten
✅ **No branch deletion** - `main` branch is protected from deletion

---

## 🧪 Testing the Protection:

1. **Test PR protection:**
   - Create a test branch: `git checkout -b test-protection`
   - Make a change: `echo "test" >> README.md`
   - Commit and push: `git add README.md && git commit -m "test: branch protection check" && git push -u origin test-protection`
   - Create PR on GitHub
   - Try to merge without approval → Should be blocked

2. **Test direct push protection:**
   - Try: `git push origin main` → Should be rejected

3. **Test workflow deployment:**
   - Trigger the publish workflow
   - You should receive a notification to approve the deployment

---

## 📝 Workflow for Making Changes:

1. Create feature branch: `git checkout -b feature/my-change`
2. Make changes and commit
3. Push branch: `git push -u origin feature/my-change`
4. Create Pull Request on GitHub
5. **You review and approve your own PR** (as code owner)
6. Merge PR
7. Delete feature branch (auto-deleted if configured)

---

## 🚨 Emergency Access:

If you need to bypass protections temporarily (emergencies only):

1. Go to branch protection rules
2. Temporarily disable required checks
3. Make emergency fix
4. Re-enable protections immediately

**Best practice:** Never bypass. Always use PRs even for your own changes.

---

## ✅ Checklist:

- [ ] Branch protection rules configured on `main`
- [ ] CODEOWNERS file committed (✅ Already done)
- [ ] Environment `npm` protection set up in GitHub UI (required reviewers, protected branches only)
- [x] Workflow already references `environment: name: npm` ✅
- [ ] Repository settings reviewed
- [ ] Actions permissions restricted
- [ ] Protection tested with test PR

---

**Status**: CODEOWNERS file is in place. Complete the GitHub UI configuration above to fully secure the repository.
