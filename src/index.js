'use strict';

const { App, ExpressReceiver } = require('@slack/bolt');
const config = require('./config');
const JiraWebhookHandler = require('./jira/webhookHandler');

// Initialize the receiver with JSON parsing
const receiver = new ExpressReceiver({
  signingSecret: config.slack.signingSecret,
  endpoints: {
    events: '/slack/events'
  },
  processBeforeResponse: true
});

// Enable JSON body parsing
receiver.router.use(require('express').json());

// Initialize the Bolt app with the receiver
const app = new App({
  token: config.slack.token,
  receiver
});

// Initialize webhook handler with config
const webhookHandler = new JiraWebhookHandler(app, config.jira.threadFieldId);

// Handle incoming webhooks from Jira
receiver.router.post('/api/jira/webhook', (req, res) => 
  webhookHandler.handleWebhook(req, res)
);

(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Jira-Slack integration is running!');
    console.log('🎯 Webhook endpoint ready at /api/jira/webhook');
  } catch (error) {
    console.error('Failed to start app:', error);
    process.exit(1);
  }
})();