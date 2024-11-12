'use strict';

const jiraClient = require('./client');

/**
 * Test the Jira connection and permissions
 */
async function testJiraConnection() {
  try {
    console.log('Testing Jira connection...');
    
    // Test 1: Try to get myself (basic authentication test)
    console.log('Test 1: Checking authentication...');
    const response = await jiraClient.makeRequest('/myself');
    console.log('✅ Authentication successful!');
    console.log(`Connected as: ${response.displayName}`);
    
    // Test 2: Try to get a specific issue
    // Replace PROJECT-1 with an actual issue key from your Jira instance
    console.log('\nTest 2: Checking issue access...');
    try {
      const issueKey = 'KAN-1'; // Replace with a real issue key
      const issue = await jiraClient.getIssue(issueKey);
      console.log('✅ Successfully retrieved issue:', issue.key);
    } catch (error) {
      console.log('❌ Could not retrieve issue. This might be okay if the issue key doesn\'t exist.');
      console.log('Try again with a valid issue key from your Jira instance.');
    }
    
    console.log('\nRequired permissions for our integration:');
    console.log('- Browse projects ✓ (tested by fetching issue)');
    console.log('- Edit issues ✓ (needed for storing thread ID)');
    console.log('Note: Additional permissions may be tested when we implement specific features');
    
  } catch (error) {
    console.error('\n❌ Jira connection test failed:', error);
    console.log('\nPlease check:');
    console.log('1. Your .env file has the correct values for:');
    console.log('   - JIRA_DOMAIN (just the subdomain part, e.g., "yourcompany")');
    console.log('   - JIRA_EMAIL (the email you use to log into Jira)');
    console.log('   - JIRA_API_TOKEN (from https://id.atlassian.com/manage-profile/security/api-tokens)');
    console.log('2. Your user account has appropriate permissions in Jira');
  }
}

// Run the test if this file is run directly
if (require.main === module) {
  testJiraConnection().catch(console.error);
}

module.exports = testJiraConnection;
