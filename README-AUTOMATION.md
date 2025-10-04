# CNCF Sandbox Automation Suite

This repository contains automation workflows for managing the CNCF Sandbox application and onboarding process.

## Automations

### 1. Vote Monitor and Onboarding Creation

Monitors sandbox application issues and automatically creates onboarding issues when community voting passes.

**How It Works:**
1. **Trigger**: When `gitvote/passed` label is added to an issue
2. **Action**: Creates a new onboarding issue using the project-onboarding.md template
3. **Result**: Comments on original issue and closes it

**Files:**
- `.github/workflows/vote-monitor.yml` - Main automation workflow
- `scripts/create-onboarding-issue.js` - Helper functions
- `.github/ISSUE_TEMPLATE/project-onboarding.md` - Onboarding issue template

### 2. Onboarding Progress Monitor

Tracks the progress of sandbox onboarding issues and automatically escalates warnings for stalled projects.

**How It Works:**
1. **Trigger**: Runs weekly (Mondays at 9 AM UTC) or manually
2. **Action**: Monitors onboarding issues and applies appropriate labels/comments based on age
3. **Result**: Progressive warnings leading to automatic archival after 1 year
4. **Initial Deployment**: First scheduled run processes ALL existing onboarding issues regardless of existing labels

**Timeline:**
- **3 months** → `onboarding/incomplete` label + reminder comment
- **6 months** → `onboarding/stale` label + tag TOC/projects team
- **9 months** → `onboarding/warning` label + tag TOC/projects team
- **10 months** → `onboarding/approaching-archival` label + create health issue in TOC repo using [project-health.yaml template](https://github.com/cncf/toc/blob/main/.github/ISSUE_TEMPLATE/project-health.yaml)
- **11 months** → Weekly warnings (weeks 1-3), then daily warnings (week 4)
- **1 year** → `onboarding/archived` label + close onboarding + comment on health issue

**Files:**
- `.github/workflows/onboarding-monitor.yml` - Main monitoring workflow
- `scripts/onboarding-progress-monitor.js` - Progress tracking logic

## Deployment

1. Copy these files to the CNCF sandbox repository
2. Update the assignees in `project-onboarding.md` template to include CNCF staff
3. Update TOC member usernames in the monitoring script
4. The automations will automatically start working

## Testing

### Vote Monitor
Add the `gitvote/passed` label to any `[Sandbox] Project Name` issue to test the automation.

### Onboarding Monitor
- **Initial Deployment**: The first scheduled run will automatically process all existing onboarding issues
- **Manual Testing**: Use workflow dispatch with `check_all: true` to force processing all issues
- **Regular Operation**: Subsequent runs will only process issues that need new labels
