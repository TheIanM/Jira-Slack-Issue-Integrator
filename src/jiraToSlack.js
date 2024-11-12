// jiraToSlack.js
'use strict';

const config = {
  // Add webhook URL to your existing config.js or use env var
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  threadFieldId: '10038' // Your existing thread field ID
};

/**
 * Posts a message to Slack via webhook and returns the thread timestamp
 * @param {Object} payload - The message payload to send
 * @returns {Promise<string>} Thread timestamp from Slack's response
 */
async function postToSlack(payload) {
  try {
    const response = await fetch(config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook error: ${response.status} ${response.statusText}`);
    }

    // Webhook response contains thread_ts if message was posted successfully
    const result = await response.text();
    if (result === 'ok') {
      // Extract thread_ts from response headers or response
      // Some webhook responses include this in a special header
      const threadTs = response.headers.get('x-slack-thread-ts') || null;
      return threadTs;
    }
    
    throw new Error('Failed to post message to Slack');
  } catch (error) {
    console.error('Error posting to Slack:', error);
    throw error;
  }
}

/**
 * Formats a new issue notification
 * @param {Object} issue - Jira issue data
 * @returns {Object} Formatted Slack message payload
 */
function formatNewIssue(issue) {
  return {
    text: `🆕 New Issue Created: ${issue.key}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🆕 New Issue: ${issue.key}`,
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Title:*\n${issue.fields.summary}`
          },
          {
            type: "mrkdwn",
            text: `*Status:*\n${issue.fields.status.name}`
          },
          {
            type: "mrkdwn",
            text: `*Priority:*\n${issue.fields.priority?.name || 'None'}`
          },
          {
            type: "mrkdwn",
            text: `*Assignee:*\n${issue.fields.assignee?.displayName || 'Unassigned'}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:*\n${issue.fields.description || 'No description provided'}`
        }
      }
    ]
  };
}

/**
 * Formats an issue update notification
 * @param {Object} issue - Jira issue data
 * @param {Object} changelog - The changes made
 * @returns {Object} Formatted Slack message payload
 */
function formatIssueUpdate(issue, changelog) {
  const changes = changelog.items
    .map(item => `• ${item.field}: ${item.fromString} → ${item.toString}`)
    .join('\n');

  return {
    text: `📝 Updated: ${issue.key}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📝 *Issue ${issue.key} Updated*\n${changes}`
        }
      }
    ]
  };
}

/**
 * Formats a comment notification
 * @param {Object} issue - Jira issue data
 * @param {Object} comment - The comment data
 * @returns {Object} Formatted Slack message payload
 */
function formatComment(issue, comment) {
  return {
    text: `💬 New comment on ${issue.key}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `💬 *New comment on ${issue.key}*\nBy: ${comment.author.displayName}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: comment.body
        }
      }
    ]
  };
}

module.exports = {
  postToSlack,
  formatNewIssue,
  formatIssueUpdate,
  formatComment
};
