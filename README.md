# Gmail Auto-Cleanup Script

A Google Apps Script that helps manage your Gmail inbox by automatically identifying and logging emails that match specific cleanup rules. The script runs in debug mode by default, logging matches without deleting them.

## Disclaimer

⚠️ **Use at Your Own Risk**

This script is provided "as is", without warranty of any kind, express or implied. By using this script, you acknowledge and agree that:

- The author accepts no liability for any damage, data loss, or issues arising from the use of this script
- You are using this script voluntarily and at your own risk
- It is your responsibility to backup your data before using this script
- The author is not responsible for any direct, indirect, incidental, special, exemplary, or consequential damages
- The script may interact with your Google Workspace environment; use with caution in production environments
- You should test the script in a non-production environment first
- The functionality may break due to changes in Google's APIs or services

You are strongly advised to:
- Review the code before running it
- Test in a safe environment first
- Maintain proper backups
- Verify the results

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

## Features

### Automated Email Processing
- Identifies unread emails older than 6 months
- Finds unread promotional emails older than 30 days
- Supports custom keyword-based filtering through subject line matching
- Processes emails in batches of 100 for efficient handling

### Smart Protection
- Preserves emails with custom labels
- Debug mode (dry run) by default - logs matches without deletion
- Detailed logging of all decisions and actions

### Comprehensive Logging System
- Creates detailed spreadsheet logs for each run
- Organizes logs in Google Drive folders (Year > Month structure)
- Maintains an overview sheet tracking all debug runs
- Records run status (Started, Completed, Failed)

### Log Details Include
- Timestamp
- Applied rule
- Email subject
- Original email date
- Reason for match
- Number of unread messages
- Custom labels
- Gmail categories
- Action taken
- Direct link to email thread

## Configuration

### Subject Keyword Rules
Configure keyword matching in `Config.js`. Supports:
- Single keyword matching
- Multiple keyword matching (ALL words must be present)
- Exact phrase matching

Example configuration:
```
javascript
function getSubjectKeywordGroups() {
return [
["unsubscribe"],
["weekly", "digest"],
["monthly report"]
];
}
```
## Safety Features
- Debug mode enabled by default
- Requires explicit activation for actual deletion
- Fallback logging for error handling
- Protection for emails with custom labels

## Setup and Usage in Google Apps Script

1. **Open Script Editor**:
    - Go to [script.google.com](https://script.google.com)
    - Create a new project
    - Copy and paste all files from the `src` folder into your project

2. **Configure Settings**:
    - Open `Config.js` and adjust the settings according to your needs
    - Make sure to set up your timezone correctly in `appsscript.json`

3. **Set up Time-Based Trigger**:
    - In the Apps Script editor, click on "Triggers" (clock icon) in the left sidebar
    - Click "+ Add Trigger" button at the bottom right
    - Configure the trigger with these settings:
        - Choose which function to run: `main`
        - Select event source: "Time-driven"
        - Select type of time trigger: "Hour timer" (or your preferred interval)
        - Select hour interval: Choose how often you want the script to run
        - Click "Save"

4. **Authorization**:
    - Run the script manually first time
    - Grant necessary permissions when prompted
    - The trigger will now run automatically at your specified intervals
   
5. **Activating deletion**
    - Search for // if (decision.delete) thread.moveToTrash(); within main.js
    - Remove the double slashes (//) 
    - To undo the removal of your mails from your inbox add the double slashes back
    - Save after changes

**Note**: Make sure your Google account has sufficient quota for the number of executions you plan to run per day. Check [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas) for more details.
## Important Notes

- The script requires appropriate Google Apps Script permissions
- All matched emails are logged before any action is taken
- Default operation is read-only (debug mode)
- Each run creates a new log spreadsheet for transparency