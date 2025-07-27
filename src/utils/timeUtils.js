/**
 * Get the user's timezone from their Google Calendar settings
 * @returns {string} The user's timezone
 */
function getUserTimezone() {
    return Session.getScriptTimeZone() ||
        CalendarApp.getDefaultCalendar().getTimeZone() ||
        'UTC';
}

/**
 * Convert a date to user's local timezone
 * @param {Date} date - The date to convert
 * @returns {Date} The date in user's timezone
 */
function convertToUserTimezone(date) {
    const userTimezone = getUserTimezone();
    return Utilities.formatDate(date, userTimezone, 'yyyy-MM-dd HH:mm:ss');
}
