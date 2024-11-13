'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Debug: Print current directory and env file path
const envPath = path.join(__dirname, '..', '.env');
console.log('Current directory:', __dirname);
console.log('Looking for .env file at:', envPath);

// Try to read the .env file contents directly
const fs = require('fs');
try {
    const envFileExists = fs.existsSync(envPath);
    console.log('.env file exists:', envFileExists);
    if (envFileExists) {
        console.log('.env file contents:');
        const envContents = fs.readFileSync(envPath, 'utf8');
        // Print each line without the actual values
        envContents.split('\n').forEach(line => {
            const [key] = line.split('=');
            console.log(key ? `${key}=<value>` : line);
        });
    }
} catch (err) {
    console.log('Error reading .env file:', err);
}

// Load environment variables
const result = dotenv.config({
    path: envPath
});

if (result.error) {
    console.error('Error loading .env file:', result.error);
    throw new Error('Failed to load .env file');
}

// Debug: Print loaded environment variables (safely)
console.log('\nLoaded environment variables:');
Object.keys(process.env).forEach(key => {
    if (key.startsWith('SLACK_') || key.startsWith('JIRA_')) {
        console.log(`${key}=${key.includes('TOKEN') || key.includes('SECRET') || key.includes('EMAIL') || key.includes('WEBHOOK')'<hidden>' : process.env[key]}`);
    }
});

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
        threadFieldId: process.env.JIRA_THREAD_FIELD_ID || 'customfield_10039'
    }
};

// Configuration validation
const requiredConfigs = [
    ['slack.token', config.slack.token],
    ['slack.signingSecret', config.slack.signingSecret],
    ['slack.channelId', config.slack.channelId],
    ['jira.token', config.jira.token],
    ['jira.domain', config.jira.domain],
    ['jira.email', config.jira.email]
];

const missingConfigs = requiredConfigs
    .filter(([key, value]) => !value)
    .map(([key]) => key);

if (missingConfigs.length > 0) {
    console.error('\nMissing required configuration values:', missingConfigs);
    throw new Error(`Missing required configuration: ${missingConfigs.join(', ')}`);
}

module.exports = config;