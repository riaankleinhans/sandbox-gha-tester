# Sandbox Vote Automation

This repository contains a GitHub Actions automation that monitors sandbox application issues and automatically creates onboarding issues when community voting is completed.

## Overview

The automation watches for issues with the `[Sandbox] Project Name` format and monitors their labels for the completion of the Gitvote community voting process. When specific label conditions are met, it automatically:

1. Creates a new project onboarding issue using the project-onboarding.md template
2. Extracts the project name from the original issue title
3. Comments on the original voting issue with congratulations and a link to the new onboarding issue
4. Closes the original voting issue

## Trigger Conditions

The automation is **simple and focused** - it only triggers when the vote passes:

### Single Trigger Condition
- **Triggers only when**: `gitvote/passed` label is added to an issue
- **That's it!** No complex conditions or multiple scenarios to worry about

### Why This Works
- ✅ **Simple logic** - One label, one trigger, one action
- ✅ **Reliable** - Gitvote only adds this label when the vote actually passes
- ✅ **Efficient** - Only runs when it needs to
- ✅ **Easy to understand** - No complex state checking required

## Workflow Files

### Main Automation
- **File**: `.github/workflows/vote-monitor.yml`
- **Triggers**: `issues.labeled` event (only when `gitvote/passed` label is added)
- **Purpose**: Creates onboarding issue when community vote passes

### Test Workflow
- **File**: `.github/workflows/test-vote-automation.yml`
- **Triggers**: Manual workflow dispatch
- **Purpose**: Tests the automation logic without creating actual issues

## Issue Templates

### Application Template
- **File**: `.github/ISSUE_TEMPLATE/application.yml`
- **Format**: `[Sandbox] <Project Name>`
- **Purpose**: Used for initial sandbox applications

### Onboarding Template
- **File**: `.github/ISSUE_TEMPLATE/project-onboarding.md`
- **Format**: `[PROJECT ONBOARDING] <Project Name>`
- **Purpose**: Used for the automatically created onboarding issues

## Automation Process

1. **Issue Monitoring**: The workflow monitors all issue label changes
2. **Condition Check**: Verifies that the voting conditions are met
3. **Project Name Extraction**: Extracts the project name from the issue title using regex pattern `^\[Sandbox\]\s*(.+)$`
4. **Onboarding Issue Creation**: Creates a new issue with:
   - Title: `[PROJECT ONBOARDING] <Project Name>`
   - Labels: `project onboarding`, `sandbox`
   - Assignees: CNCF staff members
   - Body: Complete onboarding checklist from template
5. **Original Issue Management**: 
   - Adds congratulatory comment with link to new issue
   - Closes the original voting issue

## Configuration

### Gitvote Configuration
The repository includes a `.gitvote.yml` file that configures the voting parameters:

```yaml
profiles:
  default:
    duration: 13w
    pass_threshold: 30
    allowed_voters:
      users:
        - riaankleinhans
    close_on_passing: true
  sandbox:
    duration: 2w
    pass_threshold: 30
    allowed_voters:
      users:
        - riaankleinhans
    close_on_passing: true
```

## Testing

To test the automation:

1. Go to the Actions tab in GitHub
2. Select "Test Vote Automation" workflow
3. Click "Run workflow"
4. Provide a test project name and optional issue number
5. Review the dry run output to verify the logic

## Example Flow

1. **Initial Issue**: `[Sandbox] My Awesome Project` is created
2. **Voting Process**: Community votes using Gitvote app
3. **Vote Passes**: Gitvote adds `gitvote/passed` label
4. **Automation Trigger**: Workflow detects the `gitvote/passed` label
5. **Onboarding Issue**: `[PROJECT ONBOARDING] My Awesome Project` is created
6. **Comment**: Original issue receives congratulations comment with link
7. **Closure**: Original issue is closed

## Error Handling

The automation includes several safety checks:

- **Project Name Validation**: Ensures project name can be extracted from title
- **Label Verification**: Confirms all required labels are present/absent
- **Conditional Execution**: Only runs when all conditions are met
- **Duplicate Prevention**: Checks for existing conditions before proceeding

## Permissions

The automation requires the following GitHub permissions:
- `issues: write` - To create issues and comments
- `issues: read` - To read issue details and labels
- `pull-requests: read` - For repository access

## Maintenance

To maintain the automation:

1. **Update Assignees**: Modify the assignees list in the workflow file
2. **Update Templates**: Modify the issue templates as needed
3. **Test Changes**: Use the test workflow to validate modifications
4. **Monitor Logs**: Check workflow execution logs for any issues

## Troubleshooting

Common issues and solutions:

### Automation Not Triggering
- Verify issue title follows `[Sandbox] <Project Name>` format
- Check that all required labels are present/absent
- Review workflow execution logs

### Project Name Extraction Issues
- Ensure issue title matches the expected format
- Check for special characters in project names
- Verify regex pattern in workflow file

### Permission Errors
- Confirm GitHub Actions has necessary permissions
- Check repository settings for workflow permissions
- Verify token permissions in workflow file

## Support

For issues or questions about this automation:

1. Check the workflow execution logs
2. Use the test workflow to validate logic
3. Review this documentation
4. Create an issue in this repository for bugs or feature requests
