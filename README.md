# Grounded Self-Trust Profile™ — Beta (v0.3)

Extends the v0.1 prototype: 22 items (18 scored across Security & Stability,
Success Ownership, and Performance Flexibility; 4 unscored behavioural
items), research-consent gate, score bands disabled pending recalculation for the corrected item bank, optional email capture, and real submission to a Google
Sheet. No embedded A/B wording test in this ship (deliberately deferred).

## 1. Set up the Google Sheets backend

1. Create a new Google Sheet (or use an existing one you want responses in).
2. Extensions → Apps Script. Paste in the contents of `apps-script.gs` from
   this folder.
3. Run `setupSheets` once from the Apps Script editor (creates the
   "Responses" and "Contacts" tabs). Authorize when prompted.
4. Deploy → New deployment → Web app → Execute as: Me → Who has access:
   Anyone → Deploy. Copy the URL it gives you.

## 2. Wire up the frontend

1. Open `src/App.jsx`.
2. Near the top, set:
   ```js
   const SHEETS_WEBHOOK_URL = "<the URL from step 1.4>";
   const COACHING_BOOKING_URL = "<your Calendly or booking link>";
   ```
3. `npm install`
4. `npm run build` — outputs a production build to `dist/`.
5. `npm run dev` if you want to preview it locally first (opens on
   localhost).

## 3. Deploy to Netlify via GitHub

1. Review the v0.3 changes and commit the corrected files to the existing
   `DrJakiWS/gstp-beta` repository. Keep the existing repository structure and
   configuration; do not initialise a new repository over it.
2. The connected Netlify project should build from the repository after the
   change is pushed. Verify the deploy preview before publishing to the live
   domain.
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Deploy. Netlify will now auto-deploy on every push to `main`.

## What's deliberately NOT in this build

- No overall/combined score across the three dimensions.
- No clinical language, diagnostic categories, or automated
  recommendations tied to a specific score.
- No A/B wording test in this release. Any wording experiment should be planned and versioned separately.

## Files

- `src/App.jsx` — the whole app (config layers + scoring engine + UI).
- `apps-script.gs` — paste into Google Sheets' Apps Script editor.
- `PROVISIONAL_BANDS` is intentionally empty in v0.3. Recalculate and document score-band thresholds for the corrected item bank before enabling bands. The response-scale instructions define the meaning of each response from 1 to 5.


## v0.3 correction notes

- Corrected item IDs, wording, domain assignments, and reverse-scoring flags to the agreed Research Beta specification.
- Version strings updated to `GSTP Item Bank v0.3`, `GSTP Scoring Model v0.3`, and `GSTP Report v0.3 (Beta)`.
- Score bands disabled pending recalculation for the corrected item bank.
- Added clear 1–5 response-scale instructions before and during the questionnaire.
- Replaced repetitive follow-up reflection prompts with action-oriented prompts.
- Removed per-domain coaching prompts; a single optional invitation remains at the end of the report.
- Existing v0.2 responses must remain labelled v0.2 and must not be reinterpreted as v0.3 data.
