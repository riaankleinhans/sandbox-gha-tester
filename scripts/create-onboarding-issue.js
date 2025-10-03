const fs = require('fs');
const path = require('path');

async function createOnboardingIssue(github, context, projectName, originalIssueNumber) {
  // Read the onboarding template
  const templatePath = path.join(process.cwd(), '.github/ISSUE_TEMPLATE/project-onboarding.md');
  let templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Remove YAML front matter
  templateContent = templateContent.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // Add reference link at the top after the welcome message
  templateContent = templateContent.replace(
    /(# Welcome to CNCF Project Onboarding)/,
    `$1\n\nref: #${originalIssueNumber}`
  );
  
  // Add reference to original issue at the bottom
  templateContent += `\n\n---\n\n**Related Issue:** This onboarding issue was automatically created after the community vote was completed in issue #${originalIssueNumber}.`;
  
  // Create the onboarding issue
  const onboardingIssue = await github.rest.issues.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: `[PROJECT ONBOARDING] ${projectName}`,
    body: templateContent,
    labels: ['project onboarding', 'sandbox'],
    assignees: ['caniszczyk', 'idvoretskyi', 'jeefy', 'krook', 'mrbobbytables', 'RobertKielty', 'cynthia-sg', 'lukaszgryglicki', 'riaankleinhans']
  });
  
  console.log('Created onboarding issue:', onboardingIssue.data.number);
  return onboardingIssue.data.number;
}

async function commentAndClose(github, context, originalIssueNumber, onboardingIssueNumber, projectName) {
  // Comment on the original issue
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: originalIssueNumber,
    body: `🎉 Congratulations! The onboarding issue has been created for **${projectName}**.

The community vote has been completed successfully, and your project is now ready to begin the CNCF onboarding process.

**Next Steps:**
- Please review and work through the tasks in the onboarding issue: #${onboardingIssueNumber}
- Complete onboarding within one month of acceptance
- Contact CNCF staff if you have any questions

Good luck with your project's journey in the CNCF! 🚀`
  });
  
  // Close the original issue
  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: originalIssueNumber,
    state: 'closed'
  });
  
  console.log(`Commented on issue #${originalIssueNumber} and closed it`);
  console.log(`Created onboarding issue #${onboardingIssueNumber}`);
}

module.exports = {
  createOnboardingIssue,
  commentAndClose
};
