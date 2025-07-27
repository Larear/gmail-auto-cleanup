# Gmail Auto-Cleanup Script

A Google Apps Script that helps manage your Gmail inbox by automatically identifying and logging emails that match specific cleanup rules. The script runs in debug mode by default, logging matches without deleting them.

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

## Usage

1. Set up your keyword rules in `Config.js`
2. Run `gmailCleanupDebug()` to start a debug run
3. Review the generated logs in Google Drive under "Gmail Auto Cleanup Logs/Debug"
4. To enable actual deletion, uncomment the marked line in the script

## Important Notes

- The script requires appropriate Google Apps Script permissions
- All matched emails are logged before any action is taken
- Default operation is read-only (debug mode)
- Each run creates a new log spreadsheet for transparency