require('dotenv').config();

const config = {
  slack: {
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    channelId: process.env.SLACK_CHANNEL_ID
  },
  jira: {
    token: process.env.JIRA_API_TOKEN,
    domain: process.env.JIRA_DOMAIN,
    email: process.env.JIRA_EMAIL,
    threadFieldId: process.env.JIRA_THREAD_FIELD_ID || 'customfield_10039'  // Default to current value but allow override
  }
};

// Configuration validation
const requiredConfigs = [
  ['slack.token', config.slack.token],
  ['slack.signingSecret', config.slack.signingSecret],
  ['slack.channelId', config.slack.channelId],
  ['jira.token', config.jira.token],
  ['jira.domain', config.jira.domain],
  ['jira.email', config.jira.email],
  ['jira.threadFieldId', config.jira.threadFieldId]
];

for (const [key, value] of requiredConfigs) {
  if (!value) {
    throw new Error(`Missing required configuration: ${key}`);
  }
}

module.exports = config;