/**
 * Grounded Self-Trust Profile™ — Beta backend (Google Apps Script)
 * Interpretation Engine v1 edition.
 *
 * SETUP (new Sheet):
 * 1. Extensions → Apps Script. Paste this whole file in and save.
 * 2. Run `setupSheets` once. It creates the Responses, Contacts and
 *    Reflections tabs with headers.
 * 3. Deploy → New deployment → Web app. Execute as: Me. Who has access:
 *    Anyone. Copy the Web app URL into SHEETS_WEBHOOK_URL in src/App.jsx.
 *
 * UPGRADING AN EXISTING SHEET to Engine v1:
 * 1. Paste this file in and save.
 * 2. Run `addEngineV1Columns` once. It appends the new columns to the end
 *    of the Responses and Reflections tabs. Existing rows are untouched.
 * 3. Deploy → Manage deployments → edit (pencil) → Version: New → Deploy.
 *    The Web app URL stays the same.
 *
 * Columns are always written by position, so header order here must match
 * the order of values in doPost.
 */

const RESPONSES_BASE = [
  "received_at", "respondent_id", "completed_at",
  "item_bank_version", "scoring_model_version", "research_consent", "source",
  "SEC_score", "SEC_n", "SEC_band",
  "SO_score", "SO_n", "SO_band",
  "PF_score", "PF_n", "PF_band",
  "item_level_data_json",
];
const RESPONSES_ENGINE_V1 = [
  "engine_version", "SEC_level", "SO_level", "PF_level",
  "sec_facet_note", "consistency_contradictions",
];
const REFLECTIONS_BASE = [
  "received_at", "respondent_id",
  "whole_profile_note",
  "noticing_1", "noticing_2", "noticing_3", "noticing_4",
];
const REFLECTIONS_ENGINE_V1 = [
  "SEC_accuracy", "SO_accuracy", "PF_accuracy",
  "cc_reflection", "quote_permission",
];

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let responses = ss.getSheetByName("Responses");
  if (!responses) responses = ss.insertSheet("Responses");
  if (responses.getLastRow() === 0) responses.appendRow(RESPONSES_BASE.concat(RESPONSES_ENGINE_V1));

  let contacts = ss.getSheetByName("Contacts");
  if (!contacts) contacts = ss.insertSheet("Contacts");
  if (contacts.getLastRow() === 0) {
    contacts.appendRow(["received_at", "respondent_id", "email", "marketing_consent", "submitted_at"]);
  }

  let reflections = ss.getSheetByName("Reflections");
  if (!reflections) reflections = ss.insertSheet("Reflections");
  if (reflections.getLastRow() === 0) reflections.appendRow(REFLECTIONS_BASE.concat(REFLECTIONS_ENGINE_V1));
}

/**
 * One-time upgrade for an existing Sheet: appends the Engine v1 columns
 * to the end of Responses and Reflections. Checks the current headers
 * first and stops without changing anything if they are not what it
 * expects. Safe to run more than once.
 */
function addEngineV1Columns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  appendColumns_(ss.getSheetByName("Responses"), RESPONSES_BASE, RESPONSES_ENGINE_V1);
  appendColumns_(ss.getSheetByName("Reflections"), REFLECTIONS_BASE, REFLECTIONS_ENGINE_V1);
}

function appendColumns_(sheet, base, extra) {
  const name = sheet.getName();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).trim(); })
    .filter(function (h) { return h !== ""; });

  if (headers.length === base.length + extra.length && headers[base.length] === extra[0]) {
    Logger.log(name + ": Engine v1 columns already there. Nothing to do.");
    return;
  }
  const baseMatches = headers.length === base.length &&
    base.every(function (h, i) { return headers[i] === h; });
  if (!baseMatches) {
    Logger.log(name + ": headers are not as expected, so nothing was changed. Found: " + headers.join(", "));
    return;
  }
  sheet.getRange(1, base.length + 1, 1, extra.length).setValues([extra]);
  Logger.log(name + ": added " + extra.join(", ") + ".");
}

function resultLine_(c) {
  const scoreText = (c.score !== null && c.score !== undefined) ? Number(c.score).toFixed(1) : "N/A";
  let label = "";
  if (c.level) label = c.level + (c.descriptor ? ": " + c.descriptor : "");
  else if (c.band) label = c.band + " so far";
  return c.construct_name + ": " + scoreText + " out of 5" + (label ? " (" + label + ")" : "");
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === "submit_response") {
      const sheet = ss.getSheetByName("Responses") || (setupSheets(), ss.getSheetByName("Responses"));
      const byId = {};
      (payload.construct_level_data || []).forEach((c) => { byId[c.construct_id] = c; });

      sheet.appendRow([
        new Date().toISOString(),
        payload.respondent_id || "",
        payload.completed_at || "",
        payload.item_bank_version || "",
        payload.scoring_model_version || "",
        payload.research_consent === true,
        payload.source || "direct",
        byId.SEC?.score ?? "", byId.SEC?.n_items ?? "", byId.SEC?.band ?? "",
        byId.SO?.score ?? "", byId.SO?.n_items ?? "", byId.SO?.band ?? "",
        byId.PF?.score ?? "", byId.PF?.n_items ?? "", byId.PF?.band ?? "",
        JSON.stringify(payload.item_level_data || []),
        // Engine v1 columns
        payload.engine_version || "",
        byId.SEC?.level ?? "", byId.SO?.level ?? "", byId.PF?.level ?? "",
        payload.sec_facet_note || "",
        payload.consistency_contradictions ?? "",
      ]);
    } else if (payload.action === "submit_contact") {
      const sheet = ss.getSheetByName("Contacts") || (setupSheets(), ss.getSheetByName("Contacts"));
      sheet.appendRow([
        new Date().toISOString(),
        payload.respondent_id || "",
        payload.email || "",
        payload.marketing_consent === true,
        payload.submitted_at || "",
      ]);

      if (payload.email) {
        const lines = (payload.construct_level_data || []).map(resultLine_);
        const body =
          "Hi,\n\n" +
          "Here's a saved copy of your results from the Grounded Self-Trust Profile (early-access version):\n\n" +
          lines.join("\n") + "\n\n" +
          "A reminder: this is an early-access version of a tool we're still refining through independent research, so treat it as a reflection prompt rather than a verdict.\n\n" +
          "If anything in your results is something you'd like to work through, you're welcome to book a free, no-pressure 20-minute conversation: https://calendly.com/coachjakiws/15min\n\n" +
          "Thank you for being one of the first to try this.";
        GmailApp.sendEmail(payload.email, "Your Grounded Self-Trust results, saved", body, { name: "Grounded Self-Trust Profile" });
      }
    } else if (payload.action === "submit_reflection") {
      // Overwrite-in-place per respondent, so repeated auto-saves update one row.
      const sheet = ss.getSheetByName("Reflections") || (setupSheets(), ss.getSheetByName("Reflections"));
      const notes = payload.noticing_notes || [];
      const acc = payload.accuracy || {};
      const quote = payload.quote_permission === true ? true
        : (payload.quote_permission === false ? false : "");
      const rowData = [
        new Date().toISOString(),
        payload.respondent_id || "",
        payload.whole_profile_note || "",
        notes[0] || "", notes[1] || "", notes[2] || "", notes[3] || "",
        // Engine v1 columns
        acc.SEC ?? "", acc.SO ?? "", acc.PF ?? "",
        payload.cc_reflection || "",
        quote,
      ];
      const data = sheet.getDataRange().getValues();
      let foundRow = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === payload.respondent_id) { foundRow = i + 1; break; }
      }
      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
