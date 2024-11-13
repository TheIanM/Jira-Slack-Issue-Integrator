'use strict';

const jiraClient = require('./jira/client');
const { App } = require('@slack/bolt');
const config = require('./config');

/**
 * Test both Jira and Slack connections
 */
async function testConnections() {
  try {
    // Test Jira connection first
    console.log('1️⃣ Testing Jira connection...');
    const response = await jiraClient.makeRequest('/myself');
    console.log('✅ Jira authentication successful!');
    console.log(`Connected as: ${response.displayName}\n`);
    
    // Initialize Slack app
    const app = new App({
      token: config.slack.token,
      signingSecret: config.slack.signingSecret
    });
    
    // Test Slack connection
    console.log('2️⃣ Testing Slack connection...');
    try {
      // Try to post a test message
      const result = await app.client.chat.postMessage({
        channel: config.slack.channelId,
        text: '🔄 Testing Slack integration...'
      });
      
      if (result.ok) {
        console.log('✅ Successfully posted to Slack!');
        console.log(`Channel: ${result.channel}`);
        console.log(`Message TS: ${result.ts}\n`);
        
        // Clean up test message
        await app.client.chat.delete({
          channel: result.channel,
          ts: result.ts
        });
      } else {
        console.log('❌ Failed to post to Slack:', result.error);
      }
    } catch (slackError) {
      console.log('\n❌ Slack connection failed!');
      console.log('Error:', slackError.message);
      console.log('\nPlease check:');
      console.log('1. Your bot token starts with xoxb-');
      console.log('2. The bot is invited to the channel');
      console.log('3. The channel ID is correct');
      console.log(`4. Current channel ID: ${config.slack.channelId}`);
      console.log('5. Bot has chat:write permission');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test if this file is run directly
if (require.main === module) {
  testConnections().catch(console.error);
}

module.exports = testConnections;
