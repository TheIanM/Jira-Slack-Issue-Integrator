# Jira-Slack Issue Integrator 🔄

Hi there! 👋 Welcome to my first real project beyond learning exercises. This app creates a bridge between Jira and Slack, making it easier for teams to stay in sync without constantly switching between apps.

## What does it do? 🤔

This MVP (Minimum Viable Product) integration:
- Creates a Slack thread whenever a new Jira issue is created
- Posts updates to the thread when the issue is modified
- Syncs comments from Jira to the Slack thread

The idea is to keep everyone in the loop without leaving Slack!

## Setup Guide 🛠️

### Prerequisites
- Node.js (version 18.0.0 or higher)
- A Slack workspace where you can add apps
- A Jira Cloud instance
- Basic familiarity with running Node.js applications

### Step 1: Slack Setup
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"or use manifest in /examples/
3. Name your app and select your workspace
4. Under "Basic Information", note down:
   - Signing Secret
   - Bot User OAuth Token (You'll need to install the app to your workspace first)
5. OPTIONAL (for future expansion to sync from slack to Jira)
 Under "Event Subscriptions":
   - Enable events (you'll add the URL after setting up the app)
   - Subscribe to bot events: `message.channels`
6. Getting your Channel ID:
   - Open Slack in your browser
   - Navigate to the channel where you want the bot to post
   - The URL will look like: `https://your-workspace.slack.com/archives/C0123ABCD`
   - The last part (starting with C) is your Channel ID
   - Note: If using the Slack app, right-click the channel and select "Copy Link" - the Channel ID will be the last part of the URL

### Step 2: Jira Setup
1. Go to [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create a new API token and note it down
3. In Jira, create a custom field:
   - Type: Text Field (single line)
   - Name: "Slack Thread ID"
   - Note down the field ID (it will look like `customfield_10039` or you can grab it from the URL.)

### Step 3: Environment Setup
1. Clone this repository
2. Create a `.env` file in the root directory with:
```
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_CHANNEL_ID=C0123ABCD  # The ID from the channel URL
JIRA_API_TOKEN=your-api-token
JIRA_DOMAIN=your-domain      # Just the subdomain part (e.g., "yourcompany") 
JIRA_EMAIL=your-jira-email
JIRA_THREAD_FIELD_ID=customfield_10039
```

### Step 4: Installation & Running
1. Install dependencies:
```bash
npm install
```

2. Run the test script to verify your Jira connection:
```bash
node src/test.js
```

3. Start the application:
```bash
npm start
```

4. (For development) Use ngrok to create a public URL:
```bash
npx ngrok http 3000
```

5. Update your Slack app's Event Subscription URL with:
   `your-ngrok-url/slack/events`

## Maybe in the Future... 🚀

These features aren't in the MVP but could be cool additions:
- Support for multiple Slack channels
- Interactive buttons in Slack messages
- User mention/notification system
- Custom slash commands
- Two-way sync (posting Slack comments back to Jira)
- File attachment syncing
- Comment reactions/emoji support
- Thread archival system
- Support for complex Jira workflows
- Historical data synchronization

## Contributing 🤝

This is my first real project, so I'd love to hear your thoughts and suggestions! Feel free to:
- Open issues if you find bugs
- Suggest improvements
- Submit pull requests if you want to help add features

## Questions? 🤔

If something isn't clear or you run into issues, please open an issue! I'm learning too, and would love to help others get this running in their environments.

## License

This project is licensed under the GPL-3.0 License - see the LICENSE file for details.

## Disclamer 

I have worked with devs for years and have picked up a clever trick or two, but I am a newb so any oddities are the result of me banging my head against a wall until it worked. 
