#!/usr/bin/env node

/**
 * Test Issue Setup Script
 * 
 * Creates test onboarding issues with various ages to test the onboarding monitor.
 * This script helps set up a test environment by creating issues that simulate
 * different stages of the onboarding process.
 * 
 * Usage:
 *   node scripts/setup-test-issues.js --repo owner/repo --token YOUR_TOKEN
 *   node scripts/setup-test-issues.js --repo owner/repo --token YOUR_TOKEN --dry-run
 */

const { Octokit } = require('@octokit/rest');

// Configuration
const TEST_PROJECTS = [
  'Test Project Alpha',
  'Test Project Beta', 
  'Test Project Gamma',
  'Test Project Delta',
  'Test Project Epsilon'
];

// Test scenarios with different ages (in days)
const TEST_SCENARIOS = [
  { name: 'Fresh (1 day)', days: 1, description: 'Just created - should not trigger any actions' },
  { name: 'New (30 days)', days: 30, description: '1 month old - should trigger incomplete label' },
  { name: 'Stale (180 days)', days: 180, description: '6 months old - should trigger stale label' },
  { name: 'Warning (270 days)', days: 270, description: '9 months old - should trigger warning label' },
  { name: 'Critical (305 days)', days: 305, description: '10 months old - should create health issue' },
  { name: 'Urgent (335 days)', days: 335, description: '11 months old - should trigger weekly warnings' },
  { name: 'Archival (365 days)', days: 365, description: '12 months old - should trigger archival' }
];

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    repo: null,
    token: null,
    dryRun: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--repo':
        options.repo = args[++i];
        break;
      case '--token':
        options.token = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }
  
  return options;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Test Issue Setup Script

Creates test onboarding issues with various ages to test the onboarding monitor.

Usage:
  node scripts/setup-test-issues.js --repo owner/repo --token YOUR_TOKEN
  node scripts/setup-test-test-issues.js --repo owner/repo --token YOUR_TOKEN --dry-run

Options:
  --repo <owner/repo>    GitHub repository (required)
  --token <token>        GitHub Personal Access Token (required)
  --dry-run              Show what would be created without actually creating issues
  --help, -h             Show this help message

Examples:
  # Create test issues in your test repo
  node scripts/setup-test-issues.js --repo your-username/sandbox-test --token ghp_xxxxx
  
  # See what would be created without actually creating
  node scripts/setup-test-issues.js --repo your-username/sandbox-test --token ghp_xxxxx --dry-run

Test Scenarios Created:
${TEST_SCENARIOS.map(s => `  - ${s.name}: ${s.description}`).join('\n')}

Note: Issues will be created with creation dates that appear to be in the past.
GitHub doesn't allow backdating, but the onboarding monitor uses test mode to simulate older ages.
`);
}

/**
 * Calculate the creation date for a test scenario
 */
function getCreationDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

/**
 * Create a test issue
 */
async function createTestIssue(octokit, owner, repo, projectName, scenario) {
  const title = `[PROJECT ONBOARDING] ${projectName}`;
  const creationDate = getCreationDate(scenario.days);
  
  const body = `# Test Onboarding Issue

This is a **test issue** created by the setup script to test the onboarding monitor.

## Test Scenario: ${scenario.name}
- **Simulated Age:** ${scenario.days} days (${Math.floor(scenario.days / 30)} months)
- **Expected Action:** ${scenario.description}
- **Created:** ${creationDate}

## Test Checklist

This is a test issue with a simulated checklist:

- [ ] Test task 1
- [ ] Test task 2  
- [ ] Test task 3
- [ ] Test task 4
- [ ] Test task 5

## Notes

- This issue was created for testing purposes
- It simulates an onboarding issue that is ${scenario.days} days old
- The onboarding monitor should process this issue according to its age
- You can safely delete this issue after testing

---

*Created by test setup script on ${new Date().toISOString()}*`;

  const labels = ['project onboarding', 'sandbox', 'test'];

  return {
    title,
    body,
    labels,
    creationDate,
    scenario
  };
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }
  
  if (!options.repo || !options.token) {
    console.error('❌ Error: --repo and --token are required');
    console.error('Use --help for usage information');
    process.exit(1);
  }
  
  const [owner, repo] = options.repo.split('/');
  if (!owner || !repo) {
    console.error('❌ Error: Repository must be in format "owner/repo"');
    process.exit(1);
  }
  
  console.log('🚀 Test Issue Setup Script');
  console.log('=' .repeat(50));
  console.log(`Repository: ${owner}/${repo}`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN (no issues will be created)' : 'LIVE (issues will be created)'}`);
  console.log('');
  
  // Initialize GitHub client
  const octokit = new Octokit({
    auth: options.token
  });
  
  // Verify repository access
  try {
    console.log('🔍 Verifying repository access...');
    await octokit.rest.repos.get({ owner, repo });
    console.log('✅ Repository access confirmed');
  } catch (error) {
    console.error('❌ Error accessing repository:', error.message);
    process.exit(1);
  }
  
  console.log('');
  console.log('📋 Test Issues to Create:');
  console.log('');
  
  const issuesToCreate = [];
  
  // Generate test issues
  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const scenario = TEST_SCENARIOS[i];
    const projectName = TEST_PROJECTS[i] || `Test Project ${String.fromCharCode(65 + i)}`;
    
    const issueData = await createTestIssue(octokit, owner, repo, projectName, scenario);
    issuesToCreate.push(issueData);
    
    console.log(`${i + 1}. ${issueData.title}`);
    console.log(`   Age: ${scenario.days} days (${Math.floor(scenario.days / 30)} months)`);
    console.log(`   Expected: ${scenario.description}`);
    console.log(`   Labels: ${issueData.labels.join(', ')}`);
    console.log('');
  }
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN COMPLETE');
    console.log('No issues were created. Use without --dry-run to create them.');
    return;
  }
  
  // Create issues
  console.log('📝 Creating test issues...');
  console.log('');
  
  const createdIssues = [];
  
  for (const issueData of issuesToCreate) {
    try {
      console.log(`Creating: ${issueData.title}`);
      
      const response = await octokit.rest.issues.create({
        owner,
        repo,
        title: issueData.title,
        body: issueData.body,
        labels: issueData.labels
      });
      
      const issueNumber = response.data.number;
      const issueUrl = response.data.html_url;
      
      createdIssues.push({
        number: issueNumber,
        url: issueUrl,
        title: issueData.title,
        scenario: issueData.scenario
      });
      
      console.log(`  ✅ Created issue #${issueNumber}`);
      console.log(`  🔗 ${issueUrl}`);
      console.log('');
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  ❌ Failed to create issue: ${error.message}`);
      console.error('');
    }
  }
  
  // Summary
  console.log('🎉 Setup Complete!');
  console.log('=' .repeat(50));
  console.log(`Created ${createdIssues.length} test issues:`);
  console.log('');
  
  createdIssues.forEach(issue => {
    console.log(`#${issue.number}: ${issue.title}`);
    console.log(`   Age: ${issue.scenario.days} days - ${issue.scenario.description}`);
    console.log(`   URL: ${issue.url}`);
    console.log('');
  });
  
  console.log('🧪 Next Steps:');
  console.log('');
  console.log('1. Run the onboarding monitor with test mode:');
  console.log('   - Go to Actions → Onboarding Progress Monitor');
  console.log('   - Click "Run workflow"');
  console.log('   - Set test_mode: true');
  console.log('   - Set test_offset_days: 0 (or adjust as needed)');
  console.log('   - Set check_all: true');
  console.log('');
  console.log('2. Check the results:');
  console.log('   - Review workflow logs');
  console.log('   - Check that appropriate labels were applied');
  console.log('   - Verify health issues were created (if applicable)');
  console.log('');
  console.log('3. Clean up:');
  console.log('   - Delete test issues when done');
  console.log('   - Or close them with a comment');
  console.log('');
  console.log('💡 Test Mode Notes:');
  console.log('- Test mode simulates older issues by adding days to current date');
  console.log('- Use test_offset_days to adjust the simulation');
  console.log('- Issues created today will appear older based on the offset');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  createTestIssue,
  TEST_SCENARIOS,
  TEST_PROJECTS
};
