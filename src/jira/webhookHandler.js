'use strict';

const jiraClient = require('./client');
const { postMessage, postThreadReply } = require('../slack/messages');
const { formatNewIssue, formatIssueUpdate, formatComment } = require('../slack/format');

/**
 * Webhook handler for both Jira and Slack-formatted events
 */
class WebhookHandler {
  constructor(app, threadFieldId) {
    this.app = app;
    this.threadFieldId = threadFieldId;
  }

  /**
   * Determine if payload is Slack-formatted
   */
  isSlackPayload(payload) {
    return payload?.channel && payload?.blocks;
  }

  /**
   * Handle Slack-formatted payload (used for comments)
   */
  async handleSlackPayload(payload) {
    try {
      const threadTs = payload.thread_ts;
      if (threadTs) {
        await postThreadReply(this.app, payload.text, threadTs);
        console.log('Posted reply to thread:', threadTs);
      } else {
        await postMessage(this.app, payload.text);
        console.log('Posted new message');
      }
    } catch (error) {
      console.error('Failed to handle Slack payload:', error);
      throw error;
    }
  }

  /**
   * Handle a new issue being created
   */
  async handleNewIssue(issue) {
    try {
      const message = formatNewIssue(issue);
      const threadId = await postMessage(this.app, message);
      await jiraClient.storeThreadId(issue.key, threadId, this.threadFieldId);
      console.log(`Created Slack thread ${threadId} for issue ${issue.key}`);
    } catch (error) {
      console.error(`Failed to handle new issue ${issue.key}:`, error);
      throw error;
    }
  }

  /**
   * Handle an issue being updated
   */
  async handleIssueUpdate(issue, changelog) {
    try {
      // Skip if this is just the thread ID being stored
      if (changelog?.items?.length === 1 && 
          changelog.items[0].fieldId === this.threadFieldId) {
        return;
      }

      const updatedIssue = await jiraClient.getIssue(issue.key);
      const threadId = updatedIssue.fields[this.threadFieldId];
      
      if (!threadId) {
        console.log(`No thread found for issue ${issue.key}`);
        return;
      }

      const message = formatIssueUpdate(null, updatedIssue);
      await postThreadReply(this.app, message, threadId);
      console.log(`Posted update to thread ${threadId} for issue ${issue.key}`);
    } catch (error) {
      console.error(`Failed to handle update for issue ${issue.key}:`, error);
      throw error;
    }
  }

  /**
   * Handle a new comment being added
   */
  async handleNewComment(issue, comment) {
    try {
      const updatedIssue = await jiraClient.getIssue(issue.key);
      const threadId = updatedIssue.fields[this.threadFieldId];

      if (!threadId) {
        console.log(`No thread found for issue ${issue.key}`);
        return;
      }

      const message = formatComment(comment, issue.key);
      await postThreadReply(this.app, message, threadId);
      console.log(`Posted comment to thread ${threadId} for issue ${issue.key}`);
    } catch (error) {
      console.error(`Failed to handle comment for issue ${issue.key}:`, error);
      throw error;
    }
  }

  /**
   * Main webhook handler - routes Jira events and Slack payloads
   */
  async handleWebhook(req, res) {
    try {
      const payload = req.body;

      // Handle missing payload
      if (!payload) {
        console.log('No payload received');
        return res.status(400).send('No payload received');
      }

      // Log webhook receipt
      console.log('Received webhook payload type:', 
        this.isSlackPayload(payload) ? 'Slack' : payload.webhookEvent);

      // Route based on payload type
      if (this.isSlackPayload(payload)) {
        await this.handleSlackPayload(payload);
        return res.status(200).send('Slack payload processed');
      }

      // Handle Jira events
      const { webhookEvent, issue, comment, changelog } = payload;

      switch (webhookEvent) {
        case 'jira:issue_created':
          await this.handleNewIssue(issue);
          break;

        case 'jira:issue_updated':
          await this.handleIssueUpdate(issue, changelog);
          break;

        case 'comment_created':
          await this.handleNewComment(issue, comment);
          break;

        default:
          console.log(`Ignoring unhandled webhook event: ${webhookEvent}`);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook handling failed:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = WebhookHandler;