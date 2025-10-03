# Sandbox Vote Automation

This automation monitors sandbox application issues and automatically creates onboarding issues when community voting passes.

## How It Works

1. **Trigger**: When `gitvote/passed` label is added to an issue
2. **Action**: Creates a new onboarding issue using the project-onboarding.md template
3. **Result**: Comments on original issue and closes it

## Files

- `.github/workflows/vote-monitor.yml` - Main automation workflow
- `scripts/create-onboarding-issue.js` - Helper functions
- `.github/ISSUE_TEMPLATE/project-onboarding.md` - Onboarding issue template

## Deployment

1. Copy these files to the CNCF sandbox repository
2. Update the assignees in `project-onboarding.md` template to include CNCF staff
3. The automation will automatically start working

## Testing

Add the `gitvote/passed` label to any `[Sandbox] Project Name` issue to test the automation.
