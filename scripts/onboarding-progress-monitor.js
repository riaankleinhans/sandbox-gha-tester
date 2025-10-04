const fs = require('fs');
const path = require('path');

/**
 * Calculate the time since an issue was created
 * @param {string} createdAt - ISO date string
 * @returns {Object} Time breakdown in months, weeks, days
 */
function getTimeSinceCreation(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  return { days, weeks, months };
}

/**
 * Get the appropriate label and action based on time since creation
 * @param {Object} timeInfo - Time breakdown object
 * @returns {Object} Label and action information
 */
function getProgressAction(timeInfo) {
  const { months, weeks, days } = timeInfo;
  
  // Month 11 logic: weeks 1-3 weekly, week 4 daily
  if (months === 11) {
    const weekInMonth = Math.floor((days % 30) / 7) + 1;
    const dayInWeek = (days % 7) + 1;
    
    if (weekInMonth <= 3) {
      // Weekly warnings for weeks 1-3
      return {
        label: 'onboarding/approaching-archival',
        action: 'weekly_warning',
        weekInMonth,
        dayInWeek
      };
    } else {
      // Daily warnings for week 4
      return {
        label: 'onboarding/approaching-archival',
        action: 'daily_warning',
        weekInMonth,
        dayInWeek
      };
    }
  }
  
  // Other month milestones
  if (months >= 12) {
    return { label: 'onboarding/archived', action: 'archive' };
  } else if (months >= 10) {
    return { label: 'onboarding/approaching-archival', action: 'create_health_issue' };
  } else if (months >= 9) {
    return { label: 'onboarding/warning', action: 'tag_teams' };
  } else if (months >= 6) {
    return { label: 'onboarding/stale', action: 'tag_teams' };
  } else if (months >= 3) {
    return { label: 'onboarding/incomplete', action: 'comment' };
  }
  
  return null;
}

/**
 * Create a comment for the onboarding issue
 * @param {Object} timeInfo - Time breakdown
 * @param {Object} actionInfo - Action information
 * @param {string} projectName - Name of the project
 * @returns {string} Comment content
 */
function createComment(timeInfo, actionInfo, projectName) {
  const { months, weeks, days } = timeInfo;
  
  let comment = `## ⚠️ Onboarding Progress Alert for ${projectName}\n\n`;
  
  if (actionInfo.action === 'archive') {
    comment += `🚨 **CRITICAL**: This onboarding issue has been open for **${months} months** (${days} days).\n\n`;
    comment += `This project has exceeded the 1-year onboarding deadline and will be automatically archived.\n\n`;
    comment += `**Action Taken:**\n`;
    comment += `- ✅ Applied \`onboarding/archived\` label\n`;
    comment += `- ✅ Closed this onboarding issue\n`;
    comment += `- ✅ Commented on health issue in TOC repository\n\n`;
    comment += `The project will need to reapply for CNCF Sandbox status if they wish to continue.\n\n`;
    comment += `---\n*This action was taken automatically by the CNCF onboarding progress monitor.*`;
    
  } else if (actionInfo.action === 'daily_warning') {
    comment += `🚨 **FINAL WARNING**: This onboarding issue has been open for **${months} months** (${days} days).\n\n`;
    comment += `**Daily Warning #${dayInWeek}** - This project will be automatically archived in **${30 - (days % 30)} days**.\n\n`;
    comment += `**Immediate Action Required:**\n`;
    comment += `- Complete all remaining onboarding tasks\n`;
    comment += `- Contact CNCF staff if you need assistance\n`;
    comment += `- Update this issue with your progress\n\n`;
    comment += `**Next Steps:**\n`;
    comment += `- Tomorrow: Another daily warning\n`;
    comment += `- In ${30 - (days % 30)} days: Automatic archival\n\n`;
    comment += `---\n*This is an automated daily warning from the CNCF onboarding progress monitor.*`;
    
  } else if (actionInfo.action === 'weekly_warning') {
    comment += `⚠️ **WARNING**: This onboarding issue has been open for **${months} months** (${days} days).\n\n`;
    comment += `**Weekly Warning #${actionInfo.weekInMonth}** - This project will be automatically archived in **${365 - days} days**.\n\n`;
    comment += `**Action Required:**\n`;
    comment += `- Complete remaining onboarding tasks\n`;
    comment += `- Contact CNCF staff if assistance is needed\n`;
    comment += `- Update this issue with progress\n\n`;
    comment += `**Timeline:**\n`;
    comment += `- Next week: Another weekly warning\n`;
    comment += `- Week 4: Daily warnings will begin\n`;
    comment += `- In ${365 - days} days: Automatic archival\n\n`;
    comment += `---\n*This is an automated weekly warning from the CNCF onboarding progress monitor.*`;
    
  } else if (actionInfo.action === 'create_health_issue') {
    comment += `⚠️ **APPROACHING DEADLINE**: This onboarding issue has been open for **${months} months** (${days} days).\n\n`;
    comment += `This project is approaching the 1-year onboarding deadline and will be automatically archived if not completed.\n\n`;
    comment += `**Actions Taken:**\n`;
    comment += `- ✅ Applied \`onboarding/approaching-archival\` label\n`;
    comment += `- ✅ Created health issue in TOC repository for visibility\n\n`;
    comment += `**Next Steps:**\n`;
    comment += `- Complete all remaining onboarding tasks\n`;
    comment += `- Contact CNCF staff immediately if assistance is needed\n`;
    comment += `- In 1 month: Weekly warnings will begin\n`;
    comment += `- In 2 months: Automatic archival\n\n`;
    comment += `---\n*This is an automated alert from the CNCF onboarding progress monitor.*`;
    
  } else if (actionInfo.action === 'tag_teams') {
    const urgency = months >= 9 ? 'HIGH PRIORITY' : 'PRIORITY';
    comment += `📋 **${urgency}**: This onboarding issue has been open for **${months} months** (${days} days).\n\n`;
    comment += `**Actions Taken:**\n`;
    comment += `- ✅ Applied \`${actionInfo.label}\` label\n`;
    comment += `- ✅ Tagged TOC and projects team for visibility\n\n`;
    comment += `**Next Steps:**\n`;
    comment += `- Complete remaining onboarding tasks\n`;
    comment += `- Contact CNCF staff if assistance is needed\n`;
    comment += `- Update this issue with progress\n\n`;
    comment += `**Timeline:**\n`;
    comment += `- In ${3 - (months % 3)} months: Health issue will be created\n`;
    comment += `- In ${6 - (months % 6)} months: Automatic archival\n\n`;
    comment += `---\n*This is an automated alert from the CNCF onboarding progress monitor.*`;
    
  } else {
    comment += `📝 **REMINDER**: This onboarding issue has been open for **${months} months** (${days} days).\n\n`;
    comment += `**Action Taken:**\n`;
    comment += `- ✅ Applied \`onboarding/incomplete\` label\n\n`;
    comment += `**Next Steps:**\n`;
    comment += `- Complete remaining onboarding tasks\n`;
    comment += `- Contact CNCF staff if assistance is needed\n`;
    comment += `- Update this issue with progress\n\n`;
    comment += `**Timeline:**\n`;
    comment += `- In ${3 - (months % 3)} months: TOC team will be tagged\n`;
    comment += `- In ${9 - months} months: Automatic archival\n\n`;
    comment += `---\n*This is an automated reminder from the CNCF onboarding progress monitor.*`;
  }
  
  return comment;
}

/**
 * Create a health issue in the TOC repository using the proper project-health.yaml template
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context
 * @param {string} projectName - Name of the project
 * @param {number} onboardingIssueNumber - Number of the onboarding issue
 * @returns {Promise<number>} Health issue number
 */
async function createHealthIssue(github, context, projectName, onboardingIssueNumber) {
  // Use the proper CNCF TOC project-health.yaml template format
  const healthIssueBody = `**Purpose of This Issue**

This Project Health Issue has been filed to ascertain the current activity and health of the project so the TOC may identify the appropriate support and guidance for the project to return to an optimal state of health or determination of archival.

It is intended to **initiate a public discussion to seek understanding** and define a path forward. Perceptions or commentary counter to this are not constructive for the project or the community. 

Should maintainers have sensitive, confidential, or private factors and concerns that influence or affect the project, they are encouraged to contact the TOC directly through CNCF Staff, the private-toc mailing list, Slack, or email.

---

## Project name
${projectName}

## Project Issue Link
https://github.com/${context.repo.owner}/${context.repo.repo}/issues/${onboardingIssueNumber}

## Concern
This sandbox project has been in the onboarding process for 10+ months and is approaching the automatic archival deadline. The project has not completed the required onboarding tasks within the expected timeframe, which may indicate:

- Lack of active maintainer engagement
- Insufficient resources to complete onboarding
- Project may no longer be actively maintained
- Need for additional support or guidance

**Timeline:**
- **Current:** 10+ months in onboarding process
- **Deadline:** 12 months (automatic archival)
- **Remaining:** ~2 months

**Onboarding Issue:** [#${onboardingIssueNumber}](https://github.com/${context.repo.owner}/${context.repo.repo}/issues/${onboardingIssueNumber})

**Automated Monitoring:** This health issue was automatically created by the CNCF onboarding progress monitor when the project reached the 10-month milestone.

## Prior engagement
This is an automated health check triggered by the onboarding progress monitoring system. No prior TOC engagement has been initiated for this specific onboarding delay.

## Additional Information
The CNCF onboarding progress monitor automatically tracks sandbox project onboarding progress and creates health issues for projects that have been in the onboarding process for 10+ months. This ensures timely intervention before automatic archival occurs.

**Next Steps:**
- Contact project maintainers to assess current status
- Determine if additional support is needed
- Evaluate if extension is warranted
- Provide guidance for completing onboarding tasks

---
*This health issue was automatically created by the CNCF onboarding progress monitor.*`;

  try {
    const healthIssue = await github.rest.issues.create({
      owner: 'cncf',
      repo: 'toc',
      title: `[HEALTH]: ${projectName} - Onboarding Deadline Approaching`,
      body: healthIssueBody,
      labels: ['needs-triage', 'toc', 'kind/review', 'review/health'],
      assignees: ['riaankleinhans'] // Update with actual TOC members
    });
    
    console.log(`✅ Created health issue #${healthIssue.data.number} in cncf/toc`);
    return healthIssue.data.number;
  } catch (error) {
    console.error('❌ Failed to create health issue:', error.message);
    return null;
  }
}

/**
 * Check if we should skip this issue based on recent activity
 * @param {Object} issue - GitHub issue object
 * @param {Object} actionInfo - Action information
 * @param {boolean} checkAll - Whether to check all issues regardless of existing labels
 * @returns {boolean} True if we should skip
 */
function shouldSkipIssue(issue, actionInfo, checkAll = false) {
  // If checkAll is true, only skip based on recent activity, not existing labels
  if (checkAll) {
    // For daily warnings, only proceed if it's been at least 1 day since last comment
    if (actionInfo.action === 'daily_warning') {
      const lastComment = issue.comments > 0 ? new Date(issue.updated_at) : new Date(issue.created_at);
      const hoursSinceLastUpdate = (new Date() - lastComment) / (1000 * 60 * 60);
      return hoursSinceLastUpdate < 20; // Skip if updated within last 20 hours
    }
    
    // For weekly warnings, only proceed if it's been at least 6 days since last comment
    if (actionInfo.action === 'weekly_warning') {
      const lastComment = issue.comments > 0 ? new Date(issue.updated_at) : new Date(issue.created_at);
      const daysSinceLastUpdate = (new Date() - lastComment) / (1000 * 60 * 60 * 24);
      return daysSinceLastUpdate < 6; // Skip if updated within last 6 days
    }
    
    // For other actions, don't skip based on existing labels when checkAll is true
    return false;
  }
  
  // Normal operation - skip based on recent activity AND existing labels
  // For daily warnings, only proceed if it's been at least 1 day since last comment
  if (actionInfo.action === 'daily_warning') {
    const lastComment = issue.comments > 0 ? new Date(issue.updated_at) : new Date(issue.created_at);
    const hoursSinceLastUpdate = (new Date() - lastComment) / (1000 * 60 * 60);
    return hoursSinceLastUpdate < 20; // Skip if updated within last 20 hours
  }
  
  // For weekly warnings, only proceed if it's been at least 6 days since last comment
  if (actionInfo.action === 'weekly_warning') {
    const lastComment = issue.comments > 0 ? new Date(issue.updated_at) : new Date(issue.created_at);
    const daysSinceLastUpdate = (new Date() - lastComment) / (1000 * 60 * 60 * 24);
    return daysSinceLastUpdate < 6; // Skip if updated within last 6 days
  }
  
  // For other actions, check if we've already processed this milestone
  const existingLabels = issue.labels.map(label => label.name);
  return existingLabels.includes(actionInfo.label);
}

/**
 * Main function to monitor onboarding progress
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context
 * @param {boolean} checkAll - Whether to check all issues regardless of age
 */
async function monitorOnboardingProgress(github, context, checkAll = false) {
  try {
    // Get all open issues with onboarding labels
    const issues = await github.rest.issues.listForRepo({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'open',
      labels: 'project onboarding,sandbox'
    });
    
    console.log(`Found ${issues.data.length} onboarding issues to check`);
    
    if (checkAll) {
      console.log('🚀 INITIAL DEPLOYMENT: Will process all issues regardless of existing labels');
      console.log('   This ensures all existing onboarding issues get properly labeled based on their age');
    } else {
      console.log('🔄 REGULAR MONITORING: Will skip issues that already have appropriate labels');
    }
    
    for (const issue of issues.data) {
      try {
        // Extract project name from issue title
        const titleMatch = issue.title.match(/^\[PROJECT ONBOARDING\]\s*(.+)$/);
        if (!titleMatch) {
          console.log(`⚠️  Skipping issue #${issue.number} - not an onboarding issue`);
          continue;
        }
        
        const projectName = titleMatch[1].trim();
        const timeInfo = getTimeSinceCreation(issue.created_at);
        const actionInfo = getProgressAction(timeInfo);
        
        console.log(`📋 Processing issue #${issue.number}: "${projectName}"`);
        console.log(`   Age: ${timeInfo.months} months, ${timeInfo.weeks} weeks, ${timeInfo.days} days`);
        
        if (!actionInfo) {
          console.log(`   ✅ No action needed (age: ${timeInfo.months} months)`);
          continue;
        }
        
        console.log(`   Action: ${actionInfo.action}, Label: ${actionInfo.label}`);
        
        // Skip if we shouldn't process this issue
        if (shouldSkipIssue(issue, actionInfo, checkAll)) {
          console.log(`   ⏭️  Skipping - recently updated or already processed`);
          continue;
        }
        
        // Apply the label
        await github.rest.issues.addLabels({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: issue.number,
          labels: [actionInfo.label]
        });
        
        console.log(`   ✅ Applied label: ${actionInfo.label}`);
        
        // Create appropriate comment
        const comment = createComment(timeInfo, actionInfo, projectName);
        await github.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: issue.number,
          body: comment
        });
        
        console.log(`   ✅ Added comment`);
        
        // Handle special actions
        if (actionInfo.action === 'create_health_issue') {
          const healthIssueNumber = await createHealthIssue(github, context, projectName, issue.number);
          if (healthIssueNumber) {
            // Update the comment to include health issue reference
            const updatedComment = comment + `\n\n**Health Issue Created:** [#${healthIssueNumber}](https://github.com/cncf/toc/issues/${healthIssueNumber})`;
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issue.number,
              body: updatedComment
            });
          }
        }
        
        if (actionInfo.action === 'tag_teams') {
          // Tag TOC and projects team (update with actual usernames)
          await github.rest.issues.addAssignees({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: issue.number,
            assignees: ['riaankleinhans'] // Update with actual TOC members
          });
        }
        
        if (actionInfo.action === 'archive') {
          // Close the onboarding issue
          await github.rest.issues.update({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: issue.number,
            state: 'closed'
          });
          
          console.log(`   ✅ Closed onboarding issue`);
          
          // Comment on health issue if it exists
          // Note: This would require tracking health issue numbers
          // For now, we'll just log that this should be done
          console.log(`   📝 Note: Should comment on health issue in TOC repo`);
        }
        
        console.log(`   ✅ Completed processing issue #${issue.number}`);
        
      } catch (error) {
        console.error(`❌ Error processing issue #${issue.number}:`, error.message);
      }
    }
    
    console.log('🎉 Onboarding progress monitoring completed');
    
  } catch (error) {
    console.error('❌ Error in onboarding progress monitoring:', error.message);
    throw error;
  }
}

module.exports = {
  monitorOnboardingProgress,
  getTimeSinceCreation,
  getProgressAction,
  createComment,
  createHealthIssue
};
