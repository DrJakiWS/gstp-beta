/**
 * Grounded Self-Trust Profile™ — Beta backend (Google Apps Script)
 *
 * SETUP:
 * 1. Open (or create) the Google Sheet you want responses to land in.
 * 2. Extensions → Apps Script. Delete any starter code, paste this whole
 *    file in, and save (name the project anything, e.g. "GSTP Beta Backend").
 * 3. Run the `setupSheets` function once (select it in the dropdown next
 *    to Run, click Run). It creates two tabs: "Responses" and "Contacts",
 *    with headers. The first run will ask you to authorize — that's normal,
 *    click through (Advanced → Go to project (unsafe) is expected for your
 *    own script; it's only "unsafe" in Google's generic warning sense).
 * 4. Deploy → New deployment → type "Web app". Execute as: Me. Who has
 *    access: Anyone. Click Deploy, authorize again if asked, and copy the
 *    Web app URL it gives you.
 * 5. Paste that URL into SHEETS_WEBHOOK_URL in src/App.jsx and rebuild.
 *
 * If you ever edit this script after deploying, you must create a NEW
 * deployment version (Deploy → Manage deployments → edit → Version: New)
 * for the changes to actually go live at the same URL.
 */

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let responses = ss.getSheetByName("Responses");
  if (!responses) responses = ss.insertSheet("Responses");
  if (responses.getLastRow() === 0) {
    responses.appendRow([
      "received_at", "respondent_id", "completed_at",
      "item_bank_version", "scoring_model_version", "research_consent",
      "SEC_score", "SEC_n", "SEC_band",
      "SO_score", "SO_n", "SO_band",
      "PF_score", "PF_n", "PF_band",
      "item_level_data_json",
    ]);
  }

  let contacts = ss.getSheetByName("Contacts");
  if (!contacts) contacts = ss.insertSheet("Contacts");
  if (contacts.getLastRow() === 0) {
    contacts.appendRow(["received_at", "respondent_id", "email", "marketing_consent", "submitted_at"]);
  }
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
        byId.SEC?.score ?? "", byId.SEC?.n_items ?? "", byId.SEC?.band ?? "",
        byId.SO?.score ?? "", byId.SO?.n_items ?? "", byId.SO?.band ?? "",
        byId.PF?.score ?? "", byId.PF?.n_items ?? "", byId.PF?.band ?? "",
        JSON.stringify(payload.item_level_data || []),
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
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
