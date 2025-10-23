# Testing Guide

This guide explains how to test the Onboarding Progress Monitor safely using a test repository.

## Quick Start

1. **Create test repository**
2. **Install dependencies** 
3. **Create test issues**
4. **Run monitor in test mode**
5. **Verify results**

---

## Step 1: Create Test Repository

Create a private test repository on GitHub:

```bash
# Using GitHub CLI (recommended)
gh repo create sandbox-test --private --description "Test repository for onboarding monitor"

# Or manually:
# 1. Go to GitHub.com
# 2. Click "New repository"
# 3. Name: sandbox-test (or your preferred name)
# 4. Set to Private
# 5. Create repository
```

---

## Step 2: Set Up Test Repository

Clone and prepare your test repository:

```bash
# Clone your test repo
git clone https://github.com/YOUR_USERNAME/sandbox-test.git
cd sandbox-test

# Copy automation files from sandbox-gha-tester
cp -r /path/to/sandbox-gha-tester/.github .
cp -r /path/to/sandbox-gha-tester/scripts .
cp /path/to/sandbox-gha-tester/package.json .

# Install dependencies
npm install

# Commit and push
git add .
git commit -m "Add onboarding monitor automation"
git push origin main
```

---

## Step 3: Create GitHub Token

Create a Personal Access Token for testing:

1. Go to: https://github.com/settings/tokens?type=beta
2. Click "Generate new token"
3. Configure:
   - **Name:** `Sandbox Test Monitor`
   - **Expiration:** 30 days (for testing)
   - **Repository access:** Select your test repository
   - **Permissions:**
     - Issues: **Read and write**
     - Contents: **Read-only**
4. Generate and copy the token

---

## Step 4: Add Token to Repository

Add the token as a repository secret:

1. Go to: `https://github.com/YOUR_USERNAME/sandbox-test/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `ONBOARDING_MONITOR_TOKEN`
4. Value: Paste your token
5. Click "Add secret"

---

## Step 5: Create Test Issues

Use the setup script to create test issues with various ages:

```bash
# Dry run first (see what would be created)
node scripts/setup-test-issues.js --repo YOUR_USERNAME/sandbox-test --token YOUR_TOKEN --dry-run

# Create the test issues
node scripts/setup-test-issues.js --repo YOUR_USERNAME/sandbox-test --token YOUR_TOKEN
```

**This creates 7 test issues:**
- **Fresh (1 day):** No action expected
- **New (30 days):** Should get `onboarding/incomplete` label
- **Stale (180 days):** Should get `onboarding/stale` label  
- **Warning (270 days):** Should get `onboarding/warning` label
- **Critical (305 days):** Should create health issue in TOC repo
- **Urgent (335 days):** Should trigger weekly warnings
- **Archival (365 days):** Should trigger archival

---

## Step 6: Run Monitor in Test Mode

### Option A: Manual Workflow Run (Recommended)

1. Go to: `https://github.com/YOUR_USERNAME/sandbox-test/actions/workflows/onboarding-monitor.yml`
2. Click "Run workflow"
3. Configure:
   - **check_all:** `true` (process all issues)
   - **test_mode:** `true` (enable test mode)
   - **test_offset_days:** `0` (no additional offset)
4. Click "Run workflow"

### Option B: Local Testing

```bash
# Set environment variables
export TEST_MODE=true
export TEST_AGE_OFFSET_DAYS=0

# Run the monitor script directly
node scripts/onboarding-progress-monitor.js
```

---

## Step 7: Verify Results

### Check Workflow Logs

1. Go to Actions tab
2. Click on the workflow run
3. Expand "Run onboarding progress monitor"
4. Look for:
   ```
   🧪 TEST MODE ENABLED
   Found 7 issues with onboarding labels to check
   📋 Processing issue #1: "Test Project Alpha"
      Age: 1 months, 4 weeks, 30 days
      ✅ Applied label: onboarding/incomplete
   ```

### Check Issues

Visit each test issue and verify:

1. **Appropriate labels applied** based on age
2. **Comments posted** with correct timeline information
3. **Health issues created** in TOC repo (for 10+ month issues)

### Expected Results

| Issue Age | Expected Label | Expected Action |
|-----------|----------------|-----------------|
| 1 day | None | No action |
| 30 days | `onboarding/incomplete` | Reminder comment |
| 180 days | `onboarding/stale` | Alert + tag team |
| 270 days | `onboarding/warning` | Warning + tag team |
| 305 days | `onboarding/approaching-archival` | **Create health issue** |
| 335 days | `onboarding/approaching-archival` | Weekly warnings |
| 365 days | `onboarding/archived` | Close + update health issue |

---

## Advanced Testing

### Test Different Age Offsets

You can simulate different scenarios by adjusting the test offset:

```bash
# Simulate issues being 100 days older
# Run workflow with test_offset_days: 100

# This makes a 30-day issue appear as 130 days old
# Should trigger "stale" instead of "incomplete"
```

### Test Edge Cases

Create additional test issues manually:

```bash
# Create issue with wrong title format
# Should be skipped with warning

# Create issue with wrong labels  
# Should not be found by the workflow

# Create closed issue
# Should not be processed
```

### Test Rate Limiting

Create many test issues to test rate limiting:

```bash
# Create 50+ test issues
# Run workflow and check for rate limit warnings
# Verify delays between operations
```

---

## Troubleshooting

### Common Issues

**"Resource not accessible by integration"**
- Check token has correct permissions
- Verify repository access

**No issues processed**
- Check issues have correct labels: `project onboarding`, `sandbox`
- Verify title format: `[PROJECT ONBOARDING] {name}`
- Ensure issues are open

**Test mode not working**
- Verify `test_mode: true` in workflow inputs
- Check environment variables are set
- Look for "TEST MODE ENABLED" in logs

**Health issues not created**
- Check token has access to `cncf/toc` repository
- Verify project name extraction
- Check workflow logs for errors

### Debug Commands

```bash
# Check repository access
gh api repos/YOUR_USERNAME/sandbox-test

# List issues with onboarding labels
gh api repos/YOUR_USERNAME/sandbox-test/issues --jq '.[] | select(.labels[].name == "project onboarding")'

# Check workflow runs
gh run list --repo YOUR_USERNAME/sandbox-test
```

---

## Clean Up

After testing:

### Delete Test Issues

```bash
# Using GitHub CLI
gh issue list --repo YOUR_USERNAME/sandbox-test --label test --json number --jq '.[].number' | xargs -I {} gh issue close {} --repo YOUR_USERNAME/sandbox-test --comment "Test completed - closing"
```

### Or Close with Comments

Add a comment to each test issue:
```
✅ Test completed successfully
Closing this test issue.
```

### Delete Test Repository

```bash
# Using GitHub CLI
gh repo delete YOUR_USERNAME/sandbox-test --confirm

# Or manually delete on GitHub.com
```

---

## Production Deployment

Once testing is complete:

1. **Copy files** to `cncf/sandbox` repository
2. **Create PR** with automation files
3. **Add token** as repository secret
4. **Run initial deployment** with `check_all: true`
5. **Monitor** first few weekly runs

---

## Test Scenarios Reference

| Scenario | Days | Months | Expected Label | Expected Action |
|----------|------|--------|----------------|-----------------|
| Fresh | 1 | 0 | None | No action |
| New | 30 | 1 | `onboarding/incomplete` | Reminder comment |
| Stale | 180 | 6 | `onboarding/stale` | Alert + tag team |
| Warning | 270 | 9 | `onboarding/warning` | Warning + tag team |
| Critical | 305 | 10 | `onboarding/approaching-archival` | **Create health issue** |
| Urgent | 335 | 11 | `onboarding/approaching-archival` | Weekly warnings |
| Archival | 365 | 12 | `onboarding/archived` | Close + update health issue |

---

## Scripts Reference

### Setup Test Issues
```bash
node scripts/setup-test-issues.js --repo owner/repo --token TOKEN [--dry-run]
```

### Test Health Issue Format
```bash
node scripts/test-health-issue-format.js
```

### Manual Monitor Run
```bash
TEST_MODE=true TEST_AGE_OFFSET_DAYS=0 node scripts/onboarding-progress-monitor.js
```

---

**Happy Testing!** 🧪

Remember: Test thoroughly before deploying to production. The test mode allows you to safely experiment with different scenarios without affecting real onboarding issues.
