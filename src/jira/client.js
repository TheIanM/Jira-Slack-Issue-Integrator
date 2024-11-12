'use strict';

const config = require('../config');

/**
 * Simple client for making Jira API calls
 * Handles authentication and basic error handling
 */
class JiraClient {
  constructor() {
    // Fix: Check if domain already includes .atlassian.net
    const domain = config.jira.domain.endsWith('.atlassian.net') 
      ? config.jira.domain 
      : `${config.jira.domain}.atlassian.net`;
      
    this.baseUrl = `https://${domain}/rest/api/3`;
    
    // Create base64 encoded credentials for Basic Auth
    this.authHeader = Buffer.from(
      `${config.jira.email}:${config.jira.token}`
    ).toString('base64');
  }

  /**
   * Make an authenticated request to Jira API
   * @param {string} endpoint - API endpoint (e.g., '/issue/PROJECT-123')
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Parsed JSON response
   */
  async makeRequest(endpoint, options = {}) {
    try {
      // Log the request details (but mask sensitive data)
      console.log('Making Jira request:', {
        url: `${this.baseUrl}${endpoint}`,
        method: options.method || 'GET',
        hasBody: !!options.body
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Basic ${this.authHeader}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // If response isn't ok, try to get error details from response
      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail;
        
        try {
          errorDetail = JSON.parse(errorText);
        } catch (e) {
          errorDetail = errorText;
        }

        throw new Error(`Jira API error: ${response.status} ${response.statusText}\nDetails: ${JSON.stringify(errorDetail, null, 2)}`);
      }

      // For successful requests, parse and return JSON
      return response.status === 204 ? null : await response.json();
    } catch (error) {
      console.error('Jira request failed:', error);
      throw error;
    }
  }

  /**
   * Get issue details from Jira
   * @param {string} issueKey - Jira issue key (e.g., 'PROJECT-123')
   * @returns {Promise<Object>} Issue details
   */
  async getIssue(issueKey) {
    return this.makeRequest(`/issue/${issueKey}`);
  }

  /**
   * Store Slack thread ID in Jira custom field
   * @param {string} issueKey - Jira issue key
   * @param {string} threadId - Slack thread ID
   * @param {string} customFieldId - ID of custom field for storing thread ID
   */
  async storeThreadId(issueKey, threadId, customFieldId) {
    // Format the field ID correctly - Jira expects "customfield_" prefix
    const fieldId = customFieldId.startsWith('customfield_') 
      ? customFieldId 
      : `customfield_${customFieldId}`;

    // Log the update attempt
    console.log(`Attempting to store thread ID ${threadId} in field ${fieldId} for issue ${issueKey}`);

    return this.makeRequest(`/issue/${issueKey}`, {
      method: 'PUT',
      body: JSON.stringify({
        fields: {
          [fieldId]: threadId
        }
      })
    });
  }
}

module.exports = new JiraClient();