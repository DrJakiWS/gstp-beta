# Grounded Self-Trust Profile™ — Beta (v0.2)

Extends the v0.1 prototype: 22 items (18 scored across Security & Stability,
Success Ownership, and Performance Flexibility; 4 unscored behavioural
items), research-consent gate, provisional score bands, per-dimension
coaching bridge, optional email capture, and real submission to a Google
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

1. Push this whole folder to your new GitHub repo (`git init`, `git add .`,
   `git commit -m "GSTP beta v0.2"`, then follow GitHub's instructions to
   push to your empty repo).
2. In Netlify: Link repository → GitHub → select the repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Deploy. Netlify will now auto-deploy on every push to `main`.

## What's deliberately NOT in this build

- No overall/combined score across the three dimensions.
- No clinical language, diagnostic categories, or automated
  recommendations tied to a specific score.
- No A/B wording test (see project chat for why — the items needing
  revised wording aren't in this slimmed set; planned as a smaller,
  separate follow-up).

## Files

- `src/App.jsx` — the whole app (config layers + scoring engine + UI).
- `apps-script.gs` — paste into Google Sheets' Apps Script editor.
- `PROVISIONAL_BANDS` and the response-scale labels inside `App.jsx` are
  both explicitly labelled in comments as provisional — recompute the
  bands once real beta data accumulates.
