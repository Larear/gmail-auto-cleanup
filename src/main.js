/**
 * Gmail Cleanup Script (Full Version)
 * 
 * ✅ Logs all matched threads to a Google Sheet.
 * ✅ Organizes logs into a Drive folder structure by Year > Month.
 * ✅ Maintains an "Overview" sheet that tracks all debug runs.
 * ✅ Tracks run status: "Started", "Completed", or "Failed".
 * ✅ Supports src-mode logging with optional move-to-trash (commented).
 *
 * ✏️ To enable real deletion: uncomment ONE line marked CLEARLY below.
 */

function gmailCleanupDebug() {
  const now = new Date();
  let fileId = null; // Store the spreadsheet ID for status tracking

  try {
    // === Folder Setup ===
    const ROOT_FOLDER_NAME = "Gmail Auto Cleanup Logs";
    const DEBUG_SUBFOLDER_NAME = "Debug";

    // Create/find folders
    const rootFolder = getOrCreateFolderByName(ROOT_FOLDER_NAME, DriveApp.getRootFolder());
    const debugFolder = getOrCreateFolderByName(DEBUG_SUBFOLDER_NAME, rootFolder);
    const yearFolder = getOrCreateFolderByName(now.getFullYear().toString(), debugFolder);
    const monthFolder = getOrCreateFolderByName(now.toLocaleString("en-US", { month: "long" }), yearFolder);

    // === Create log spreadsheet ===
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH-mm-ss");
    const logSpreadsheet = SpreadsheetApp.create(`Gmail Cleanup Debug Log ${timestamp}`);
    fileId = logSpreadsheet.getId();
    DriveApp.getFileById(fileId).moveTo(monthFolder);

    // === Update overview log immediately (status: Started) ===
    updateDebugOverview(logSpreadsheet, now);

    // === Setup sheets ===
    const mainSheet = logSpreadsheet.getSheets()[0];
    mainSheet.setName("Run Log");
    mainSheet.appendRow([
      "Timestamp", "Rule Name", "Subject", "Email Date", "Reason", "Unread Messages Count",
      "Custom Labels", "Labels", "Gmail Category", "Action Taken", "ThreadID"
    ]);

    const fallbackSheet = logSpreadsheet.insertSheet("Fallback Log");
    fallbackSheet.appendRow(["Timestamp", "Issue", "Subject", "ThreadID", "Details"]);

    const keywordGroups = getSubjectKeywordGroups();

    // === Date thresholds ===
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const QUERY_OLD_UNREAD = `is:unread before:${formatDateForGmailSearch(sixMonthsAgo)}`;
    const QUERY_PROMO_UNREAD_30D = `category:promotions is:unread before:${formatDateForGmailSearch(thirtyDaysAgo)}`;

    // === Process batches ===
    processThreads(QUERY_OLD_UNREAD, "OldUnread", decisionFn("Unread and older than 6 months", true));
    processThreads(QUERY_PROMO_UNREAD_30D, "PromoUnread", decisionFn("Unread in Promotions and older than 30 days", true));
    processThreads("in:inbox", "KeywordMatch", (thread, _, __, ___, ____, subject) => {
      const match = matchSubjectKeywords(subject, keywordGroups);
      return match ? { delete: true, reason: `Keyword: ${match}` } : { skip: true };
    });

    // === Finalize ===
    updateRunStatus(fileId, "Completed");
    console.log("✅ Gmail Cleanup Debug completed.");

  } catch (e) {
    if (fileId) updateRunStatus(fileId, "Failed");
    console.error("❌ Script failed:", e);
    throw e;
  }

  // === Helper: Process threads ===
  /**
   * Process Gmail threads in batches and log decisions
   * @param {string} query - Gmail search query
   * @param {string} ruleName - Rule label for logs
   * @param {function} deciderFn - Returns {delete:bool, skip:bool, reason:string}
   */
  function processThreads(query, ruleName, deciderFn) {
    const BATCH_SIZE = 100;
    let start = 0, totalProcessed = 0;
    const mainSheet = SpreadsheetApp.openById(fileId).getSheetByName("Run Log");
    const fallbackSheet = SpreadsheetApp.openById(fileId).getSheetByName("Fallback Log");

    while (true) {
      const threads = GmailApp.search(query, start, BATCH_SIZE);
      if (threads.length === 0) break;

      for (const thread of threads) {
        totalProcessed++;
        try {
          const messages = thread.getMessages();
          const unreadMessages = messages.filter(m => m.isUnread());
          const unreadCount = unreadMessages.length;

          const msg = unreadCount > 0 ? unreadMessages[0] : messages[0];
          const subject = msg.getSubject() || "";
          const emailDate = msg.getDate();

          const labels = thread.getLabels();
          const labelNames = labels.map(l => l.getName());
          const customLabels = labels.filter(l => !/^CATEGORY_|INBOX|IMPORTANT|UNREAD|SENT|DRAFT|TRASH|SPAM/.test(l.getName())).map(l => l.getName());
          const gmailCategory = labelNames.find(n => n.startsWith("CATEGORY_")) || "";

          const decision = deciderFn(thread, labelNames, customLabels, unreadCount, gmailCategory, subject, emailDate);
          const action = decision.delete ? "Move To Bin" : "Skipped";

          // === Uncomment the next line to actually delete ===
          // if (decision.delete) thread.moveToTrash();

          mainSheet.appendRow([
            Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss"),
            ruleName,
            subject,
            Utilities.formatDate(emailDate, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss"),
            decision.reason || "",
            unreadCount,
            customLabels.join(", "),
            labelNames.join(", "),
            gmailCategory.replace("CATEGORY_", ""),
            action,
            '=HYPERLINK("https://mail.google.com/mail/u/0/#inbox/' + thread.getId() + '", "' + thread.getId() + '")'
          ]);

        } catch (e) {
          fallbackSheet.appendRow([
            Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss"),
            "ThreadException", "", thread.getId(), e.toString()
          ]);
        }
      }
      if (threads.length < BATCH_SIZE) break;
      start += BATCH_SIZE;
    }
  }

  /** Returns a decision function for basic unread rules */
  function decisionFn(reasonText, requireUnread) {
    return (thread, labelNames, customLabels, unreadCount) => {
      if (customLabels.length > 0) return { skip: true, reason: "Has user labels" };
      if (requireUnread && unreadCount === 0) return { skip: true, reason: "All read" };
      return { delete: true, reason: reasonText };
    };
  }
}

/**
 * Update or create the overview sheet that tracks all debug logs
 * @param {Spreadsheet} currentLogSpreadsheet - current run's sheet
 * @param {Date} now - run timestamp
 */
function updateDebugOverview(currentLogSpreadsheet, now) {
  const ROOT_FOLDER_NAME = "Gmail Auto Cleanup Logs";
  const DEBUG_SUBFOLDER_NAME = "Debug";

  const rootFolder = getOrCreateFolderByName(ROOT_FOLDER_NAME, DriveApp.getRootFolder());
  const debugFolder = getOrCreateFolderByName(DEBUG_SUBFOLDER_NAME, rootFolder);

  const overviewFiles = debugFolder.getFilesByName("Gmail Cleanup Debug Overview");
  let overviewSpreadsheet;
  if (overviewFiles.hasNext()) {
    overviewSpreadsheet = SpreadsheetApp.open(overviewFiles.next());
  } else {
    overviewSpreadsheet = SpreadsheetApp.create("Gmail Cleanup Debug Overview");
    DriveApp.getFileById(overviewSpreadsheet.getId()).moveTo(debugFolder);
    const sheet = overviewSpreadsheet.getSheets()[0];
    sheet.setName("Overview");
    sheet.appendRow(["Run Timestamp", "Log File Name", "Log File ID", "Link to Log", "Status"]);
  }

  const sheet = overviewSpreadsheet.getSheetByName("Overview");
  const fileId = currentLogSpreadsheet.getId();
  const runTimestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss");
  const fileUrl = `https://docs.google.com/spreadsheets/d/${fileId}`;

  // Avoid duplicates
  const existing = sheet.createTextFinder(fileId).findNext();
  if (!existing) {
    sheet.appendRow([runTimestamp, currentLogSpreadsheet.getName(), fileId, fileUrl, "Started"]);
    console.log("📌 Overview updated with: Started");
  }
}

/**
 * Update status of a run in the overview sheet ("Completed", "Failed")
 * @param {string} fileId - Spreadsheet ID of the run
 * @param {string} status - New status string
 */
function updateRunStatus(fileId, status) {
  const ROOT_FOLDER_NAME = "Gmail Auto Cleanup Logs";
  const DEBUG_SUBFOLDER_NAME = "Debug";
  const rootFolder = getOrCreateFolderByName(ROOT_FOLDER_NAME, DriveApp.getRootFolder());
  const debugFolder = getOrCreateFolderByName(DEBUG_SUBFOLDER_NAME, rootFolder);
  const overviewFiles = debugFolder.getFilesByName("Gmail Cleanup Debug Overview");
  if (!overviewFiles.hasNext()) return;

  const sheet = SpreadsheetApp.open(overviewFiles.next()).getSheetByName("Overview");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][2] === fileId) {
      sheet.getRange(i + 1, 5).setValue(status);
      break;
    }
  }
}

/**
 * Format date for Gmail query (YYYY/MM/DD)
 */
function formatDateForGmailSearch(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy/MM/dd");
}

/**
 * Get or create a Drive folder by name inside parent folder
 */
function getOrCreateFolderByName(name, parent) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

/**
 * Try to match subject keywords
 */
function matchSubjectKeywords(subject, keywordGroups) {
  if (!subject || !keywordGroups || keywordGroups.length === 0) return null;
  const lowerSubject = subject.toLowerCase();
  for (const group of keywordGroups) {
    const allPresent = group.every(word => lowerSubject.includes(word.toLowerCase()));
    if (allPresent) return group.join(" ");
  }
  return null;
}
