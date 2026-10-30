/**
 * CAL — Contact + "Post about us" forms -> Google Sheet
 *
 * Paste this whole file into the Apps Script project behind the web app
 * (script.google.com -> your project -> Code.gs), replacing any old doPost/doGet.
 *
 * SETUP
 *  1. Open the Google Sheet you want the rows in -> Extensions -> Apps Script, and paste this there
 *     (then getActiveSpreadsheet() just works). If the script is standalone instead, put the
 *     sheet's ID in SHEET_ID below.
 *  2. Deploy -> Manage deployments -> edit the existing deployment -> Version: "New version" -> Deploy.
 *     Execute as: Me.  Who has access: Anyone.   (The /exec URL stays the same.)
 *
 * The website POSTs form-encoded data. Two tabs are created automatically:
 *   "Contact"         <- form=contact          (name, email, company, topic, message)
 *   "Rewards"         <- form=post-about-us    (link, name, email, platform, ref, note)
 * Anything else lands in "Other" so nothing is ever lost.
 */
var SHEET_ID = '';   // optional: only needed if this script is NOT bound to the spreadsheet

var TABS = {
  'contact': {
    name: 'Contact',
    head: ['Received', 'Name', 'Email', 'Company', 'Topic', 'Message', 'Source page'],
    row: function (p) { return [new Date(), c_(p.name), c_(p.email), c_(p.company), c_(p.topic), c_(p.message, 5000), c_(p.source)]; }
  },
  'post-about-us': {
    name: 'Rewards',
    head: ['Received', 'Post link', 'Name', 'Email', 'Platform', 'Referral code', 'Note', 'Consent', 'Status', 'Reward', 'Source page'],
    row: function (p) { return [new Date(), c_(p.link), c_(p.name), c_(p.email), c_(p.platform), c_(p.ref).toUpperCase(), c_(p.note, 2000), p.consent === 'true' ? 'yes' : 'no', 'New', '', c_(p.source)]; }
  }
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var p = normalize_((e && e.parameter) || {});
    var tab = TABS[p.form];
    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    var sh;
    if (tab) {
      sh = ss.getSheetByName(tab.name) || ss.insertSheet(tab.name);
      if (sh.getLastRow() === 0) { sh.appendRow(tab.head); sh.setFrozenRows(1); sh.getRange(1, 1, 1, tab.head.length).setFontWeight('bold'); }
      sh.appendRow(tab.row(p));
    } else {
      sh = ss.getSheetByName('Other') || ss.insertSheet('Other');
      if (sh.getLastRow() === 0) { sh.appendRow(['Received', 'Form', 'Raw data']); sh.setFrozenRows(1); }
      sh.appendRow([new Date(), c_(p.form), c_(JSON.stringify(p), 5000)]);
    }
    return json_({ result: 'success' });
  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// Opening the /exec URL in a browser should say it is alive (handy for checking the deployment).
function doGet() { return json_({ result: 'success', message: 'CAL forms endpoint is running' }); }

// Accepts both the website's field names (form, name, link, ref...) and the alternative style
// (formType, Name, PostLink, ReferralCode, Subject, Consent=Yes/No) so either front end works.
function normalize_(raw) {
  var p = {}, k;
  for (k in raw) p[k.toLowerCase()] = raw[k];
  var f = String(p.form || p.formtype || '').toLowerCase();
  if (f === 'reward' || f === 'rewards' || f === 'post') f = 'post-about-us';
  p.form = f;
  p.link = p.link || p.postlink;
  p.ref = p.ref || p.referralcode;
  p.topic = p.topic || p.subject;
  p.consent = String(p.consent).toLowerCase() === 'yes' ? 'true' : String(p.consent).toLowerCase();
  return p;
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Trim + block spreadsheet formula injection (=, +, -, @ at the start of a cell).
function c_(v, max) { v = String(v == null ? '' : v).trim().slice(0, max || 1000); return /^[=+\-@]/.test(v) ? "'" + v : v; }
