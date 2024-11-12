'use strict';

const jiraClient = require('./client');
const { postMessage, postThreadReply } = require('../slack/messages');
const { formatNewIssue, formatIssueUpdate, formatComment } = require('../slack/format');

/**
 * Handles incoming webhooks from both Jira and Slack-formatted payloads
 */
class JiraWebhookHandler {
  constructor(app, threadFieldId) {
    this.app = app;
    this.threadFieldId = threadFieldId;
  }

  /**
   * Determines if payload is in Slack format
   * @param {Object} payload - The webhook payload
   * @returns {boolean} True if payload is Slack formatted
   */
  isSlackFormatted(payload) {
    return payload.hasOwnProperty('channel') && 
           payload.hasOwnProperty('blocks');
  }

  /**
   * Processes a Slack-formatted payload
   * @param {Object} payload - Slack formatted payload
   */
  async handleSlackPayload(payload) {
    try {
      // Extract thread_ts if it exists (for replies)
      const threadTs = payload.thread_ts || null;
      
      // Post message or reply
      if (threadTs) {
        await postThreadReply(this.app, payload.text, threadTs);
      } else {
        await postMessage(this.app, payload.text);
      }
      
      console.log('Processed Slack-formatted payload successfully');
    } catch (error) {
      console.error('Error processing Slack payload:', error);
      throw error;
    }
  }

  /**
   * Get update message based on event type and data
   * @param {string} eventType - The issue event type name
   * @param {Object} issue - The issue object from webhook
   * @returns {string} Formatted message
   */
  getUpdateMessage(eventType, issue) {
    switch (eventType) {
      case 'issue_assigned':
        const assignee = issue.fields.assignee ? 
          issue.fields.assignee.displayName : 
          'Unassigned';
        return `👤 [${issue.key}] Issue assigned to ${assignee}`;
        
      case 'issue_generic':
      case 'issue_updated':
        // Handle general updates (status, priority, etc.)
        const changes = [];
        if (issue.fields.status) {
          changes.push(`Status: ${issue.fields.status.name}`);
        }
        if (issue.fields.priority) {
          changes.push(`Priority: ${issue.fields.priority.name}`);
        }
        return changes.length > 0 ?
          `📝 [${issue.key}] Updated\n${changes.join('\n')}` :
          `📝 [${issue.key}] Issue updated`;

      default:
        return `📝 [${issue.key}] Issue updated (${eventType})`;
    }
  }

  /**
   * Main handler for incoming webhooks
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleWebhook(req, res) {
    try {
      // Debug: Log the entire request body
      console.log('Received webhook payload:', JSON.stringify(req.body, null, 2));
      
      if (!req.body) {
        console.log('No request body received');
        return res.status(400).send('No payload received');
      }

      // Determine payload format and handle accordingly
      if (this.isSlackFormatted(req.body)) {
        console.log('Processing Slack-formatted payload');
        await this.handleSlackPayload(req.body);
        return res.status(200).send('Slack payload processed');
      }

      // Handle Jira-formatted payload
      const { webhookEvent, issue, comment } = req.body;

      // Debug: Log the parsed event
      console.log('Processing Jira webhook event:', webhookEvent);
      console.log('Event type:', req.body.issue_event_type_name);

      switch (webhookEvent) {
        case 'jira:issue_created':
          await this.handleIssueCreated(issue);
          break;

        case 'jira:issue_updated':
          await this.handleIssueUpdated(issue, req.body.issue_event_type_name);
          break;

        case 'comment_created':
          await this.handleCommentCreated(issue, comment);
          break;

        default:
          console.log(`Unhandled webhook event: ${webhookEvent}`);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing webhook:', error);
      console.error('Full error:', error.stack);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Handle issue creation events
   * @param {Object} issue - Issue data from webhook
   */
  async handleIssueCreated(issue) {
    const message = formatNewIssue(issue);
    const threadId = await postMessage(this.app, message);
    await jiraClient.storeThreadId(issue.key, threadId, this.threadFieldId);
    console.log(`Created Slack thread ${threadId} for issue ${issue.key}`);
  }

  /**
   * Handle issue update events
   * @param {Object} issue - Issue data from webhook
   * @param {string} eventType - Type of update event
   */
  async handleIssueUpdated(issue, eventType) {
    console.log('Processing issue update:', eventType);
    
    const updatedIssue = await jiraClient.getIssue(issue.key);
    const threadId = updatedIssue.fields[this.threadFieldId];

    if (!threadId) {
      console.log(`No thread ID found for issue ${issue.key}`);
      return;
    }

    const updateMessage = this.getUpdateMessage(eventType, updatedIssue);
    await postThreadReply(this.app, updateMessage, threadId);
    
    console.log(`Posted update to thread ${threadId} for issue ${issue.key}`);
  }

  /**
   * Handle comment creation events
   * @param {Object} issue - Issue data from webhook
   * @param {Object} comment - Comment data
   */
  async handleCommentCreated(issue, comment) {
    const updatedIssue = await jiraClient.getIssue(issue.key);
    const threadId = updatedIssue.fields[this.threadFieldId];

    if (!threadId) {
      console.log(`No thread ID found for issue ${issue.key}`);
      return;
    }

    const commentMessage = formatComment(comment, issue.key);
    await postThreadReply(this.app, commentMessage, threadId);
    console.log(`Posted comment to thread ${threadId} for issue ${issue.key}`);
  }
}

module.exports = JiraWebhookHandler;