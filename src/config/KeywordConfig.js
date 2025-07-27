/**
 * List of subject keyword groups to auto-delete emails by.
 * 
 * Use the following format:
 * 
 * ["unsubscribe"]               — Matches if subject contains "unsubscribe"
 * ["weekly", "digest"]          — Matches if subject contains *both* words (any order)
 * ["monthly report"]            — Matches if subject contains the *exact phrase* "monthly report"
 * 
 * Add each group as a new line without double slashes in square brackets, followed by a comma.
 * Double slashes are just used to comment examples, anything with double slashes infront has no effect.
 */
function getSubjectKeywordGroups() {
  return [ 
    // Example entries:
    // ["unsubscribe"],
    // ["weekly", "digest"],
    // ["monthly report"],


  ];
}
