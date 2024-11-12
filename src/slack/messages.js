'use strict';

const config = require('../config');

/**
 * Posts a message to Slack and returns the thread ID
 * @param {Object} app - Slack Bolt app instance
 * @param {string} text - Message text to post
 * @returns {Promise<string>} Thread timestamp (thread ID)
 */
async function postMessage(app, text) {
  try {
    const result = await app.client.chat.postMessage({
      channel: config.slack.channelId,
      text: text,
    });
    
    if (!result.ok) {
      throw new Error(`Failed to post message: ${result.error}`);
    }
    
    return result.ts; // This is the thread ID
  } catch (error) {
    console.error('Error posting message:', error);
    throw error;
  }
}

/**
 * Posts a reply in a thread
 * @param {Object} app - Slack Bolt app instance
 * @param {string} text - Reply text
 * @param {string} threadTs - Thread timestamp to reply to
 */
async function postThreadReply(app, text, threadTs) {
  try {
    const result = await app.client.chat.postMessage({
      channel: config.slack.channelId,
      thread_ts: threadTs,
      text: text,
    });
    
    if (!result.ok) {
      throw new Error(`Failed to post reply: ${result.error}`);
    }
  } catch (error) {
    console.error('Error posting reply:', error);
    throw error;
  }
}

module.exports = {
  postMessage,
  postThreadReply
};
