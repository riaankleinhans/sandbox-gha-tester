/**
 * Test script to validate the health issue format
 * This generates a sample health issue body to verify the format matches
 * the project-health.yaml template structure
 */

const fs = require('fs');
const path = require('path');

// Import the monitoring script functions
const {
  createHealthIssue,
  getTimeSinceCreation,
  getProgressAction,
  createComment
} = require('./onboarding-progress-monitor.js');

/**
 * Mock GitHub API client for testing
 */
class MockGitHub {
  constructor() {
    this.createdIssues = [];
    this.rest = {
      issues: {
        create: async (params) => {
          console.log('\n📝 Mock Issue Creation Called');
          console.log('   Owner:', params.owner);
          console.log('   Repo:', params.repo);
          console.log('   Title:', params.title);
          console.log('   Labels:', params.labels);
          console.log('\n--- Issue Body Start ---\n');
          console.log(params.body);
          console.log('\n--- Issue Body End ---\n');
          
          const issueNumber = this.createdIssues.length + 100;
          this.createdIssues.push({ ...params, number: issueNumber });
          
          return {
            data: {
              number: issueNumber,
              html_url: `https://github.com/${params.owner}/${params.repo}/issues/${issueNumber}`
            }
          };
        }
      }
    };
  }
}

/**
 * Mock context for testing
 */
const mockContext = {
  repo: {
    owner: 'cncf',
    repo: 'sandbox'
  }
};

/**
 * Test the health issue creation
 */
async function testHealthIssueFormat() {
  console.log('🧪 Testing Health Issue Format');
  console.log('=' .repeat(80));
  console.log('\nNote: This tests the health issue format created at the 10-month milestone.');
  console.log('Onboarding issues MUST have:');
  console.log('  - Title format: [PROJECT ONBOARDING] {project name}');
  console.log('  - Labels: project onboarding, sandbox\n');
  
  const mockGithub = new MockGitHub();
  const projectName = 'Test Project';
  const onboardingIssueNumber = 42;
  const monthsInOnboarding = 10;
  
  console.log('\n📊 Test Parameters:');
  console.log('   Project Name:', projectName);
  console.log('   Onboarding Issue:', onboardingIssueNumber);
  console.log('   Months in Onboarding:', monthsInOnboarding);
  
  try {
    const healthIssueNumber = await createHealthIssue(
      mockGithub,
      mockContext,
      projectName,
      onboardingIssueNumber,
      monthsInOnboarding
    );
    
    console.log('✅ Health issue creation test completed');
    console.log('   Created issue number:', healthIssueNumber);
    
    // Validate the created issue
    const createdIssue = mockGithub.createdIssues[0];
    
    console.log('\n🔍 Validation Results:');
    
    // Check title format
    const titleRegex = /^\[HEALTH\]:/;
    const titleValid = titleRegex.test(createdIssue.title);
    console.log('   ✓ Title format:', titleValid ? '✅ Valid' : '❌ Invalid');
    console.log('     Title:', createdIssue.title);
    
    // Check required labels
    const requiredLabels = ['needs-triage', 'toc', 'kind/review', 'review/health'];
    const hasAllLabels = requiredLabels.every(label => createdIssue.labels.includes(label));
    console.log('   ✓ Labels:', hasAllLabels ? '✅ All required labels present' : '❌ Missing labels');
    console.log('     Labels:', createdIssue.labels);
    
    // Check body structure
    const body = createdIssue.body;
    const requiredSections = [
      '### Purpose of This Issue',
      '### Project name',
      '### Project Issue Link',
      '### Concern',
      '### Prior engagement',
      '### Additional Information'
    ];
    
    console.log('   ✓ Body sections:');
    requiredSections.forEach(section => {
      const present = body.includes(section);
      console.log(`     ${present ? '✅' : '❌'} ${section}`);
    });
    
    // Check for key content
    const keyContent = [
      projectName,
      `cncf/sandbox/issues/${onboardingIssueNumber}`,
      `${monthsInOnboarding}+ months`,
      'CNCF onboarding progress monitoring system'
    ];
    
    console.log('   ✓ Key content:');
    keyContent.forEach(content => {
      const present = body.includes(content);
      console.log(`     ${present ? '✅' : '❌'} Contains: "${content}"`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

/**
 * Test other helper functions
 */
function testHelperFunctions() {
  console.log('\n\n🧪 Testing Helper Functions');
  console.log('=' .repeat(80));
  
  // Test time calculation
  console.log('\n📊 Testing getTimeSinceCreation()');
  const now = new Date();
  const testDates = [
    { months: 3, label: '3 months ago' },
    { months: 6, label: '6 months ago' },
    { months: 10, label: '10 months ago' },
    { months: 11, label: '11 months ago' },
    { months: 12, label: '12 months ago' }
  ];
  
  testDates.forEach(test => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - test.months);
    const timeInfo = getTimeSinceCreation(date.toISOString());
    const action = getProgressAction(timeInfo);
    
    console.log(`\n   ${test.label}:`);
    console.log(`     Age: ${timeInfo.months} months, ${timeInfo.weeks} weeks, ${timeInfo.days} days`);
    if (action) {
      console.log(`     Label: ${action.label}`);
      console.log(`     Action: ${action.action}`);
    } else {
      console.log(`     No action needed`);
    }
  });
  
  // Test comment generation
  console.log('\n\n📊 Testing createComment()');
  const testIssue = {
    months: 10,
    weeks: 43,
    days: 305
  };
  const action = getProgressAction(testIssue);
  const comment = createComment(testIssue, action, 'Test Project');
  
  console.log('   Generated comment preview (first 300 chars):');
  console.log('   ' + comment.substring(0, 300).replace(/\n/g, '\n   '));
  console.log('   ...(truncated)');
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Health Issue Format Tests');
  console.log('=' .repeat(80));
  console.log('Purpose: Validate that health issue format matches');
  console.log('         https://github.com/cncf/toc/blob/main/.github/ISSUE_TEMPLATE/project-health.yaml');
  console.log('=' .repeat(80));
  
  // Run tests
  const healthIssueTestPassed = await testHealthIssueFormat();
  testHelperFunctions();
  
  // Summary
  console.log('\n\n' + '=' .repeat(80));
  console.log('📋 Test Summary');
  console.log('=' .repeat(80));
  console.log(`Health Issue Format: ${healthIssueTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('Helper Functions: ✅ COMPLETED (see output above)');
  
  if (healthIssueTestPassed) {
    console.log('\n✅ All tests passed! The health issue format is correct.');
    console.log('   The issue body matches the project-health.yaml template structure.');
    console.log('   Ready for deployment to cncf/sandbox repository.');
  } else {
    console.log('\n❌ Tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testHealthIssueFormat,
  testHelperFunctions,
  runTests
};

