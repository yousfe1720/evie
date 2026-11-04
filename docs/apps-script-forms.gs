/**
 * Callistox Forms — Contact + Rewards -> Google Sheet  (matches the existing sheet columns)
 *
 *  Contact tab : Name | Email | Company | Subject | Message | Date
 *  Rewards tab : Date | PostLink | Name | Email | Platform | ReferralCode | Note | Consent
 *
 * The website sends: form = "contact" | "post-about-us", with lowercase fields
 * (name, email, company, topic, message / link, name, email, platform, ref, note, consent=true|false).
 * The older style (formType = "contact" | "reward", Name, Email, PostLink, ReferralCode, Consent=Yes|No)
 * is accepted too.
 *
 * After pasting: Deploy -> Manage deployments -> pencil -> Version: New version -> Deploy.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var p = normalize_(e && e.parameter);
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date(), sheet, row;

    if (p.form === 'contact') {
      sheet = doc.getSheetByName('Contact');
      row = [c_(p.name), c_(p.email), c_(p.company), c_(p.subject), c_(p.message, 5000), now];
    } else if (p.form === 'reward') {
      sheet = doc.getSheetByName('Rewards');
      row = [now, c_(p.postlink), c_(p.name), c_(p.email), c_(p.platform), c_(p.referralcode).toUpperCase(), c_(p.note, 2000), p.consent];
    } else {
      return json_({ result: 'error', message: 'Unknown form type' });
    }
    if (!sheet) return json_({ result: 'error', message: 'Sheet tab not found for ' + p.form });

    sheet.appendRow(row);
    return json_({ result: 'success' });
  } catch (error) {
    return json_({ result: 'error', message: error.message });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// Opening the /exec URL in a browser confirms the deployment is live.
function doGet() { return json_({ result: 'success', message: 'Callistox forms endpoint is running' }); }

// Lower-case every key and map the site's names onto the sheet's names.
function normalize_(raw) {
  var p = {}, k, r = raw || {};
  for (k in r) p[k.toLowerCase()] = r[k];
  var f = String(p.form || p.formtype || '').toLowerCase();
  p.form = (f === 'post-about-us' || f === 'post' || f === 'rewards' || f === 'reward') ? 'reward' : f;
  p.postlink = p.postlink || p.link;
  p.referralcode = p.referralcode || p.ref;
  p.subject = p.subject || p.topic;
  var c = String(p.consent == null ? '' : p.consent).toLowerCase();
  p.consent = (c === 'true' || c === 'yes') ? 'Yes' : 'No';
  return p;
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Trim, cap length, and stop spreadsheet formula injection (= + - @ at the start of a cell).
function c_(v, max) { v = String(v == null ? '' : v).trim().slice(0, max || 1000); return /^[=+\-@]/.test(v) ? "'" + v : v; }
