/**
 * OPTIONAL. The "Post about us" form already works with your existing waitlist script and the SAME sheet:
 * it sends the waitlist fields (email, use, consent, source, form) and `use` holds a one-line summary
 * ("POST ABOUT US | link | name | platform | ref CODE | note"), with form = "post-about-us".
 *
 * If you want the post details in their own columns, add this branch at the top of your existing doPost(e)
 * (do not replace the script) and it will write to a "Post about us" tab of the same spreadsheet.
 */
function postAboutUsRow_(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Post about us') || ss.insertSheet('Post about us');
  if (sh.getLastRow() === 0) { sh.appendRow(['Received', 'Post link', 'Name', 'Email', 'Platform', 'Referral code', 'Note', 'Consent', 'Status', 'Reward', 'Source']); sh.setFrozenRows(1); }
  sh.appendRow([new Date(), c_(p.link), c_(p.name), c_(p.email), c_(p.platform), c_(p.ref).toUpperCase(), c_(p.note), p.consent === 'true' ? 'yes' : 'no', 'New', '', c_(p.source)]);
}
function c_(v) { v = String(v == null ? '' : v).trim().slice(0, 1000); return /^[=+\-@]/.test(v) ? "'" + v : v; } // blocks formula injection

/* In your existing doPost(e):
 *   if (e.parameter.form === 'post-about-us') postAboutUsRow_(e.parameter);   // then continue as normal
 */
