'use strict';

/**
 * Format a new issue message for Slack
 * @param {Object} issue - Jira issue object
 * @returns {string} Formatted message
 */
function formatNewIssue(issue) {
  return `🆕 [${issue.key}] New Issue Created: ${issue.fields.summary}
Priority: ${issue.fields.priority?.name || 'Not set'}
Status: ${issue.fields.status.name}
${issue.fields.assignee ? `Assignee: ${issue.fields.assignee.displayName}` : ''}
Description: ${issue.fields.description || 'No description provided'}`;
}

/**
 * Format an issue update message for Slack based on fields that changed
 * @param {Object} oldIssue - Previous issue state
 * @param {Object} newIssue - New issue state
 * @returns {string} Formatted message
 */
function formatIssueUpdate(oldIssue, newIssue) {
  const changes = [];
  
  // Compare key fields
  if (oldIssue.fields.status?.name !== newIssue.fields.status?.name) {
    changes.push(`Status: ${oldIssue.fields.status?.name || 'None'} → ${newIssue.fields.status?.name}`);
  }
  
  if (oldIssue.fields.priority?.name !== newIssue.fields.priority?.name) {
    changes.push(`Priority: ${oldIssue.fields.priority?.name || 'None'} → ${newIssue.fields.priority?.name}`);
  }

  const oldAssignee = oldIssue.fields.assignee?.displayName || 'Unassigned';
  const newAssignee = newIssue.fields.assignee?.displayName || 'Unassigned';
  if (oldAssignee !== newAssignee) {
    changes.push(`Assignee: ${oldAssignee} → ${newAssignee}`);
  }

  return changes.length > 0 ?
    `📝 [${newIssue.key}] Updated\n${changes.join('\n')}` :
    `📝 [${newIssue.key}] Issue updated`;
}

/**
 * Format a comment message for Slack
 * @param {Object} comment - Jira comment object
 * @param {string} issueKey - Jira issue key
 * @returns {string} Formatted message
 */
function formatComment(comment, issueKey) {
  return `💬 [${issueKey}] Comment by ${comment.author.displayName}:
${comment.body}`;
}

module.exports = {
  formatNewIssue,
  formatIssueUpdate,
  formatComment
};