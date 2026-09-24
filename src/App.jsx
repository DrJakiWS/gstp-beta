import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Printer, RotateCcw, Download, AlertCircle, Mail } from "lucide-react";

/* =========================================================================
   GROUNDED SELF-TRUST PROFILE™: BETA v0.2 (Option 4.2: lead-gen funnel)
   =========================================================================
   Extended from the v0.1 technical prototype (gstp_v01_report.jsx). Kept:
   config-layer separation, pure scoring functions, print/PDF support,
   visual language. Changed, per the Study 2 findings and the Beta
   Development Pack / Lead-Gen Funnel doc:

   - ITEM_BANK slimmed from 29 items/5 constructs to 22 items/3 scored
     dimensions (18 scored + 4 unscored CC behavioural items), using the
     official Master Scoring Register numbering (IS/SO/PF/CO/STS ids),
     cross-checked against the actual v0.1 source code.
   - Identity Security, Comparison Orientation and Self-Trust Stability
     items are merged into one construct ("SEC", Security & Stability™),
     per the Study 2 higher-order finding (α = .835 on this exact item set).
   - No embedded A/B wording test in this ship, deliberately deferred
     (see chat) so the item count stays lean. All items below use their
     ORIGINAL wording.
   - Added: research-consent gate before starting; provisional score
     bands (sample-relative tertiles from the Study 2 data, NOT norms);
     per-dimension coaching-bridge copy; optional post-results email
     capture with a SEPARATE marketing-consent checkbox; a real submission
     to a Google Sheets backend (Apps Script web app) alongside the
     existing self-download.
   - Removed: the "researcher code" field (a closed-pilot artifact; this
     is an open funnel now).
   - NOT added (still true to the v0.1 brief's restraint): no overall
     GSTP score, no clinical language, no automated recommendations tied
     to a specific score.
   ========================================================================= */

// -------------------------------------------------------------------------
// >>> EDIT THIS ONCE YOU HAVE IT: your deployed Apps Script Web App URL <<<
// -------------------------------------------------------------------------
const SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwybLgTZyaaMKNIN4wZYxt08A-ctB7kwv7zC55saEZt5dg7KcqvyPIfW4yY-hoWfdcZBg/exec";

// >>> EDIT THIS: your discovery-call booking link (Calendly or similar) <<<
const COACHING_BOOKING_URL = "https://calendly.com/coachjakiws/15min";

// -------------------------------------------------------------------------
// CONFIG LAYER: item bank (22 items: 18 scored + 4 unscored CC items)
// Presented in a deliberately mixed order (construct codes are never
// shown to respondents), matching the original Scoring Register's note
// that items are presented in mixed order, not grouped by construct.
// -------------------------------------------------------------------------
const ITEM_BANK = [
  { item_id: "SO1", item_text: "I recognize when I have achieved something meaningful.", construct_id: "SO", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "CC1", item_text: "I volunteer for opportunities that interest me even when I am unsure how well I will perform.", construct_id: "CC", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "IS1", item_text: "I have a stable sense of who I am, even when things do not go as planned.", construct_id: "SEC", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "CO1", item_text: "Another person's success can make my own progress feel less significant.", construct_id: "SEC", reverse_scored: true, active: true, version: "0.2" },
  { item_id: "PF1", item_text: "I can learn from mistakes without questioning my abilities or skills.", construct_id: "PF", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "SO3", item_text: "I can identify the skills, effort, or decisions that contributed to my success.", construct_id: "SO", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "CO2", item_text: "I can celebrate another person's success while remaining connected to my own progress.", construct_id: "SEC", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "CC2", item_text: "I share ideas that may add value even when I am not completely certain they are correct.", construct_id: "CC", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "IS3", item_text: "Negative feedback can make me question who I am as a person, rather than simply what I could do differently.", construct_id: "SEC", reverse_scored: true, active: true, version: "0.2" },
  { item_id: "PF3", item_text: "I can produce high-quality work without needing it to be perfect.", construct_id: "PF", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "CO4", item_text: "I feel that I am falling behind when I see other people progressing.", construct_id: "SEC", reverse_scored: true, active: true, version: "0.2" },
  { item_id: "SO5", item_text: "I use my past successes as evidence of what I am capable of.", construct_id: "SO", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "CC3", item_text: "I avoid opportunities that would place my abilities under closer scrutiny.", construct_id: "CC", reverse_scored: true, active: true, version: "0.2" },
  { item_id: "STS3", item_text: "I second-guess my decisions long after I have made them.", construct_id: "SEC", reverse_scored: true, active: true, version: "0.2" },
  { item_id: "PF5", item_text: "When something I do does not work out as I hoped, I can adjust my approach and try a different way.", construct_id: "PF", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "IS5", item_text: "I am able to separate my value as a person from my successes and failures.", construct_id: "SEC", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "CO5", item_text: "I measure my progress primarily by how I compare with other people.", construct_id: "SEC", reverse_scored: true, active: true, version: "0.2" },
  { item_id: "CC4", item_text: "Concern about how others may judge me prevents me from contributing as fully as I could.", construct_id: "CC", reverse_scored: true, active: true, version: "0.2" },
  { item_id: "SO6", item_text: "When I succeed, I give myself credit for the part my own effort or decisions played in it.", construct_id: "SO", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "STS4", item_text: "After receiving negative feedback, I struggle to trust my judgement again.", construct_id: "SEC", reverse_scored: true, active: true, version: "0.2" },
  { item_id: "PF7", item_text: "When I make a mistake, I can focus on what I can learn from it.", construct_id: "PF", reverse_scored: false, active: true, version: "0.2" },
  { item_id: "IS6", item_text: "When I am not performing well, I tend to question my worth.", construct_id: "SEC", reverse_scored: true, active: true, version: "0.2" },
];

// -------------------------------------------------------------------------
// CONFIG LAYER: construct register (3 scored dimensions; CC is
// deliberately absent here, same pattern as v0.1; present in the item
// bank, never scored, because scoring only ever loops over this table)
// -------------------------------------------------------------------------
const CONSTRUCT_REGISTER = [
  {
    construct_id: "SEC",
    construct_name: "Security & Stability™",
    core_question: "How steady does my sense of self stay?",
    definition:
      "How steady your sense of self-worth stays when things don't go your way, when others succeed, or after criticism, and how quickly it recovers. (This dimension combines what earlier versions of the Grounded Self-Trust Profile™ measured as three separate constructs, Identity Security, Comparison Orientation, and Self-Trust Stability, which research across two independent studies showed are not empirically distinct from one another.)",
    reflection_question:
      "When something shakes my confidence, whether a setback, someone else's success, or criticism, what happens to how I see myself, and what helps me find my way back?",
    coaching_bridge:
      "If steadying your sense of self-worth, especially after setbacks or comparison with others, is something you'd like to work on intentionally, this is exactly the kind of thing coaching can help with.",
    display_order: 1,
    active: true,
    version: "0.2",
    accent: "#6B7A5E",
  },
  {
    construct_id: "SO",
    construct_name: "Success Ownership™",
    core_question: "What do I do with success?",
    definition:
      "The ability to recognize success, accurately acknowledge one's contribution to it, and integrate that evidence into one's understanding of what one is capable of, without allowing achievement to become one's identity.",
    reflection_question:
      "When I succeed, how readily do I recognize what I contributed to making that success possible?",
    coaching_bridge:
      "If you'd like support building a stronger habit of noticing and owning your wins, rather than brushing past them, coaching can help with that.",
    display_order: 2,
    active: true,
    version: "0.2",
    accent: "#B98A4E",
  },
  {
    construct_id: "PF",
    construct_name: "Performance Flexibility™",
    core_question: "What do I do with mistakes and imperfection?",
    definition:
      "The ability to respond to mistakes, setbacks and imperfection with learning and adaptation rather than self-condemnation.",
    reflection_question:
      "When I don't perform as well as I hoped, how do I learn from what happened without turning it into a judgement about myself?",
    coaching_bridge:
      "If adjusting course when something isn't working, or letting go of a mistake faster, is something you want to get better at, coaching offers a practical space to practise that.",
    display_order: 3,
    active: true,
    version: "0.2",
    accent: "#5C7A8A",
  },
];

// -------------------------------------------------------------------------
// CONFIG LAYER: scoring configuration
// -------------------------------------------------------------------------
const SCORING_CONFIG = {
  scale_min: 1,
  scale_max: 5,
  scoring_method: "mean",
  minimum_required_responses: ITEM_BANK.filter((i) => i.active).length, // auto: 22
  item_weights: null,
};

// -------------------------------------------------------------------------
// CONFIG LAYER: response scale.
// Sourced from the approved response-scale screenshot (not a placeholder).
// -------------------------------------------------------------------------
const RESPONSE_SCALE_LABELS = [
  { value: 1, label: "Not at all true" },
  { value: 2, label: "Slightly true" },
  { value: 3, label: "Moderately true" },
  { value: 4, label: "Very true" },
  { value: 5, label: "Extremely true" },
];

// -------------------------------------------------------------------------
// CONFIG LAYER: provisional score bands (PROVISIONAL, sample-relative
// tertiles from the Study 2 primary sample, N=390; NOT population norms,
// NOT clinical cutoffs. Recompute once beta data accumulates. See Beta
// Development Pack §2.6.
// -------------------------------------------------------------------------
const PROVISIONAL_BANDS = {
  SEC: { lowMax: 3.2, midMax: 4.0 },
  SO: { lowMax: 3.5, midMax: 4.25 },
  PF: { lowMax: 3.5, midMax: 4.25 },
};

function bandLabel(constructId, score) {
  if (typeof score !== "number") return null;
  const b = PROVISIONAL_BANDS[constructId];
  if (!b) return null;
  if (score < b.lowMax) return "Lower third";
  if (score < b.midMax) return "Middle third";
  return "Upper third";
}

const VERSION_INFO = {
  report_version: "GSTP Report v0.2 (Beta)",
  scoring_model_version: "GSTP Scoring Model v0.2",
  item_bank_version: "GSTP Item Bank v0.2",
};

// -------------------------------------------------------------------------
// SCORING ENGINE: pure functions, unchanged from v0.1, portable to a
// backend as-is.
// -------------------------------------------------------------------------
function reverseScoreValue(raw, scaleMin, scaleMax) {
  return scaleMin + scaleMax - raw;
}

function scoreItem(item, rawValue, config) {
  if (rawValue === undefined || rawValue === null) return null;
  return item.reverse_scored ? reverseScoreValue(rawValue, config.scale_min, config.scale_max) : rawValue;
}

function buildItemLevelData(items, responses, config) {
  return items
    .filter((i) => i.active)
    .map((item) => {
      const raw = responses[item.item_id];
      return {
        item_id: item.item_id,
        item_text: item.item_text,
        construct_id: item.construct_id,
        reverse_scored: item.reverse_scored,
        raw_response: raw ?? null,
        scored_response: scoreItem(item, raw, config),
      };
    });
}

function computeConstructScores(itemLevelData, constructs, config) {
  const scores = {};
  constructs.forEach((construct) => {
    const constructItems = itemLevelData.filter(
      (row) => row.construct_id === construct.construct_id && row.scored_response !== null
    );
    if (constructItems.length === 0) {
      scores[construct.construct_id] = { value: null, n: 0 };
      return;
    }
    const sum = constructItems.reduce((acc, row) => acc + row.scored_response, 0);
    const value = config.scoring_method === "sum" ? sum : sum / constructItems.length;
    scores[construct.construct_id] = { value, n: constructItems.length };
  });
  return scores;
}

function generateRespondentId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `GSTP-${id}`;
}

// -------------------------------------------------------------------------
// BACKEND: fire-and-forget POST to the Google Sheets Apps Script web app.
// Uses text/plain to avoid a CORS preflight (Apps Script web apps don't
// handle OPTIONS preflight requests). Never blocks the UI on network
// failure; results are never gated on a successful save.
// -------------------------------------------------------------------------
async function postToSheet(payload) {
  if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL.startsWith("PASTE_")) {
    console.warn("SHEETS_WEBHOOK_URL not configured yet; response was not saved anywhere.");
    return { ok: false, reason: "not_configured" };
  }
  try {
    // Apps Script web apps respond via a redirect that browsers won't let
    // JavaScript read across origins. "no-cors" mode sends the request and
    // lets it execute server-side (the data still reaches the Sheet), it
    // just means we can't read anything back — which is fine here, since
    // we never read the response anyway.
    await fetch(SHEETS_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (err) {
    console.error("postToSheet failed", err);
    return { ok: false, reason: "network_error" };
  }
}

// =========================================================================
// UI SUBCOMPONENTS
// =========================================================================

function GroundLine({ score, scaleMin, scaleMax, accent, constructName }) {
  const width = 400;
  const height = 46;
  const padX = 24;
  const usableWidth = width - padX * 2;
  const hasScore = typeof score === "number";
  const pct = hasScore ? (score - scaleMin) / (scaleMax - scaleMin) : 0;
  const cx = padX + pct * usableWidth;

  const ticks = [];
  for (let v = scaleMin; v <= scaleMax; v++) {
    ticks.push(padX + ((v - scaleMin) / (scaleMax - scaleMin)) * usableWidth);
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label={
        hasScore
          ? `${constructName}: your result is ${score.toFixed(1)} on a scale from ${scaleMin} to ${scaleMax}.`
          : `${constructName}: result not available.`
      }
    >
      <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="#C9C4B4" strokeWidth="2" />
      {ticks.map((x, i) => (
        <line key={i} x1={x} y1={height / 2 - 5} x2={x} y2={height / 2 + 5} stroke="#B8B2A0" strokeWidth="1.5" />
      ))}
      <text x={padX} y={height - 4} fontSize="11" fill="#7A7563" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">
        {scaleMin}
      </text>
      <text x={width - padX} y={height - 4} fontSize="11" fill="#7A7563" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">
        {scaleMax}
      </text>
      {hasScore && (
        <>
          <circle cx={cx} cy={height / 2} r="8" fill={accent} stroke="#FFFFFF" strokeWidth="2" />
          <circle cx={cx} cy={height / 2} r="8" fill="none" stroke={accent} strokeWidth="1" opacity="0.4">
            <animate attributeName="r" values="8;13;8" dur="2.4s" repeatCount="1" />
            <animate attributeName="opacity" values="0.5;0;0" dur="2.4s" repeatCount="1" />
          </circle>
        </>
      )}
    </svg>
  );
}

function LikertRow({ item, index, total, value, onChange, hasError }) {
  return (
    <div
      id={`q-${item.item_id}`}
      className={`py-6 border-b ${hasError ? "border-red-200" : "border-[#E1DDCE]"} ${hasError ? "bg-[#FBF4F0]" : ""}`}
    >
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-xs text-[#9C9580] shrink-0 pt-0.5">
          {String(index + 1).padStart(2, "0")}/{total}
        </span>
        <p className="text-[15px] sm:text-base leading-relaxed text-[#2B2B24]">{item.item_text}</p>
      </div>
      <div role="radiogroup" aria-label={item.item_text} className="grid grid-cols-5 gap-1.5 sm:gap-2 pl-0">
        {RESPONSE_SCALE_LABELS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(item.item_id, opt.value)}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2.5 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7A5E] ${
                selected
                  ? "bg-[#3F4A36] border-[#3F4A36] text-[#F4F2E9]"
                  : "bg-white border-[#DAD5C4] text-[#5A5646] hover:border-[#9C9580]"
              }`}
            >
              <span className="font-mono text-sm sm:text-base font-medium">{opt.value}</span>
              <span className="text-[9px] sm:text-[10px] leading-tight hidden sm:block">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {hasError && (
        <p className="mt-2 text-xs text-[#A24B3B] flex items-center gap-1">
          <AlertCircle size={12} /> Please choose a response.
        </p>
      )}
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 h-[2px] bg-[#6B7A5E]" />
      <h2 className="font-display text-2xl sm:text-3xl text-[#23261F]">{children}</h2>
    </div>
  );
}

// =========================================================================
// MAIN APPLICATION
// =========================================================================
function getSourceTag() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("src") || "direct";
  } catch (e) {
    return "direct";
  }
}

export default function GSTPBeta() {
  const [screen, setScreen] = useState("intro");
  const [sourceTag] = useState(getSourceTag);
  const [researchConsent, setResearchConsent] = useState(false);
  const [respondentId] = useState(generateRespondentId);
  const [responses, setResponses] = useState({});
  const [erroredItems, setErroredItems] = useState([]);
  const [wholeProfileNote, setWholeProfileNote] = useState("");
  const [noticingNotes, setNoticingNotes] = useState(["", "", "", ""]);
  const [completedAt, setCompletedAt] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | failed

  const activeItems = useMemo(() => ITEM_BANK.filter((i) => i.active), []);
  const activeConstructs = useMemo(
    () => CONSTRUCT_REGISTER.filter((c) => c.active).sort((a, b) => a.display_order - b.display_order),
    []
  );

  const answeredCount = useMemo(
    () => activeItems.filter((i) => responses[i.item_id] !== undefined).length,
    [activeItems, responses]
  );
  const missingItems = useMemo(
    () => activeItems.filter((i) => responses[i.item_id] === undefined),
    [activeItems, responses]
  );
  const isComplete = answeredCount >= SCORING_CONFIG.minimum_required_responses && missingItems.length === 0;

  const itemLevelData = useMemo(
    () => buildItemLevelData(activeItems, responses, SCORING_CONFIG),
    [activeItems, responses]
  );
  const constructScores = useMemo(
    () => computeConstructScores(itemLevelData, activeConstructs, SCORING_CONFIG),
    [itemLevelData, activeConstructs]
  );

  const handleResponse = useCallback((itemId, value) => {
    setResponses((prev) => ({ ...prev, [itemId]: value }));
    setErroredItems((prev) => prev.filter((id) => id !== itemId));
  }, []);

  const handleSubmit = async () => {
    if (!isComplete) {
      setErroredItems(missingItems.map((i) => i.item_id));
      const firstMissing = missingItems[0];
      if (firstMissing) {
        const el = document.getElementById(`q-${firstMissing.item_id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    const now = new Date();
    setCompletedAt(now);
    setScreen("report");
    window.scrollTo({ top: 0, behavior: "smooth" });

    setSaveState("saving");
    const result = await postToSheet({
      action: "submit_response",
      respondent_id: respondentId,
      completed_at: now.toISOString(),
      item_bank_version: VERSION_INFO.item_bank_version,
      scoring_model_version: VERSION_INFO.scoring_model_version,
      research_consent: true,
      source: sourceTag,
      item_level_data: itemLevelData,
      construct_level_data: activeConstructs.map((c) => ({
        construct_id: c.construct_id,
        construct_name: c.construct_name,
        score: constructScores[c.construct_id]?.value ?? null,
        n_items: constructScores[c.construct_id]?.n ?? 0,
        band: bandLabel(c.construct_id, constructScores[c.construct_id]?.value),
      })),
    });
    setSaveState(result.ok ? "saved" : "failed");
  };

  const handleRestart = () => {
    setResponses({});
    setErroredItems([]);
    setWholeProfileNote("");
    setNoticingNotes(["", "", "", ""]);
    setCompletedAt(null);
    setResearchConsent(false);
    setSaveState("idle");
    setScreen("intro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExport = () => {
    const payload = {
      respondent_record: {
        respondent_id: respondentId,
        completed_at: completedAt ? completedAt.toISOString() : null,
        item_bank_version: VERSION_INFO.item_bank_version,
        scoring_model_version: VERSION_INFO.scoring_model_version,
      },
      item_level_data: itemLevelData,
      construct_level_data: activeConstructs.map((c) => ({
        construct_id: c.construct_id,
        construct_name: c.construct_name,
        score: constructScores[c.construct_id]?.value ?? null,
        n_items: constructScores[c.construct_id]?.n ?? 0,
      })),
      report_record: { report_version: VERSION_INFO.report_version, generated_at: new Date().toISOString() },
      whole_profile_reflection: wholeProfileNote,
      noticing_reflection: noticingNotes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${respondentId}_gstp_response_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#EFEDE2] text-[#2B2B24]" style={{ fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-brand { font-family: 'IBM Plex Mono', monospace; }
        @media print {
          .no-print { display: none !important; }
          .page-break { break-before: page; }
          body { background: white !important; }
        }
      `}</style>

      {screen === "intro" && (
        <IntroScreen
          researchConsent={researchConsent}
          setResearchConsent={setResearchConsent}
          onStart={() => {
            setScreen("questionnaire");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          itemCount={activeItems.length}
        />
      )}

      {screen === "questionnaire" && (
        <QuestionnaireScreen
          items={activeItems}
          responses={responses}
          onChange={handleResponse}
          erroredItems={erroredItems}
          answeredCount={answeredCount}
          totalCount={activeItems.length}
          onSubmit={handleSubmit}
          missingCount={missingItems.length}
        />
      )}

      {screen === "report" && (
        <ReportScreen
          constructs={activeConstructs}
          scores={constructScores}
          scaleMin={SCORING_CONFIG.scale_min}
          scaleMax={SCORING_CONFIG.scale_max}
          respondentId={respondentId}
          completedAt={completedAt}
          wholeProfileNote={wholeProfileNote}
          setWholeProfileNote={setWholeProfileNote}
          noticingNotes={noticingNotes}
          setNoticingNotes={setNoticingNotes}
          onRestart={handleRestart}
          onExport={handleExport}
          saveState={saveState}
          respondentId2={respondentId}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------------------
// SCREEN: INTRO
// -------------------------------------------------------------------------
function IntroScreen({ researchConsent, setResearchConsent, onStart, itemCount }) {
  return (
    <div className="max-w-xl mx-auto px-6 py-16 sm:py-24">
      <div className="mb-10">
        <div className="w-10 h-[3px] bg-[#6B7A5E] mb-6" />
        <h1 className="font-display text-3xl sm:text-4xl font-medium leading-tight text-[#23261F]">
          Grounded Self-Trust Profile™
        </h1>
        <p className="mt-4 text-[#5A5646] leading-relaxed">
          Free, early-access. You're about to complete {itemCount} short statements about how you relate
          to yourself: your sense of self-worth, how you own your successes, and how you handle mistakes
          and setbacks. Most people take 8–10 minutes.
        </p>
        <p className="mt-4 text-[#5A5646] leading-relaxed">
          There are no right or wrong answers. Respond with whatever feels most true for you, generally,
          rather than thinking too long about any one statement.
        </p>
        <p className="mt-4 text-[#5A5646] leading-relaxed">
          You'll get your results immediately, at no cost. This is an early-access tool, still being
          refined, not a finished, clinically validated assessment.
        </p>
      </div>

      <label className="flex items-start gap-3 mb-8 cursor-pointer">
        <input
          type="checkbox"
          checked={researchConsent}
          onChange={(e) => setResearchConsent(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-[#DAD5C4] text-[#3F4A36] focus:ring-[#6B7A5E]"
        />
        <span className="text-sm text-[#5A5646] leading-relaxed">
          I consent to my anonymised responses being used for ongoing research and development of this
          tool. I understand this is a research-stage assessment, not a validated clinical instrument,
          and that I can withdraw at any time.
        </span>
      </label>

      <button
        onClick={onStart}
        disabled={!researchConsent}
        className={`w-full sm:w-auto px-8 py-3.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3F4A36] ${
          researchConsent
            ? "bg-[#3F4A36] text-[#F4F2E9] hover:bg-[#333D2C] cursor-pointer"
            : "bg-[#DAD5C4] text-[#9C9580] cursor-not-allowed"
        }`}
      >
        Begin
      </button>
      {!researchConsent && (
        <p className="mt-2 text-xs text-[#9C9580]">Please confirm the checkbox above to continue.</p>
      )}

      <p className="mt-10 text-xs text-[#9C9580] leading-relaxed">
        This is a research-stage tool. Your responses are recorded to help develop and validate the
        Grounded Self-Trust Profile™. Individual responses remain confidential.
      </p>
    </div>
  );
}

// -------------------------------------------------------------------------
// SCREEN: QUESTIONNAIRE
// -------------------------------------------------------------------------
function QuestionnaireScreen({ items, responses, onChange, erroredItems, answeredCount, totalCount, onSubmit, missingCount }) {
  const pct = Math.round((answeredCount / totalCount) * 100);
  return (
    <div className="pb-32">
      <div className="sticky top-0 z-10 bg-[#EFEDE2]/95 backdrop-blur border-b border-[#DAD5C4]">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex-1 h-1.5 rounded-full bg-[#DAD5C4] overflow-hidden">
            <div className="h-full bg-[#6B7A5E] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono-brand text-xs text-[#5A5646] shrink-0">
            {answeredCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6">
        {items.map((item, i) => (
          <LikertRow
            key={item.item_id}
            item={item}
            index={i}
            total={totalCount}
            value={responses[item.item_id]}
            onChange={onChange}
            hasError={erroredItems.includes(item.item_id)}
          />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#EFEDE2]/95 backdrop-blur border-t border-[#DAD5C4]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {missingCount > 0 && erroredItems.length > 0 ? (
            <p className="text-sm text-[#A24B3B] flex items-center gap-1.5">
              <AlertCircle size={14} /> {missingCount} statement{missingCount === 1 ? "" : "s"} left
            </p>
          ) : (
            <span className="text-sm text-[#7A7563]">Answer all statements to see your results.</span>
          )}
          <button
            onClick={onSubmit}
            className="shrink-0 px-6 py-3 rounded-lg bg-[#3F4A36] text-[#F4F2E9] font-medium hover:bg-[#333D2C] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3F4A36]"
          >
            See my results
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// SCREEN: REPORT (results + coaching bridge + email capture)
// -------------------------------------------------------------------------
function ReportScreen({
  constructs,
  scores,
  scaleMin,
  scaleMax,
  respondentId,
  completedAt,
  wholeProfileNote,
  setWholeProfileNote,
  noticingNotes,
  setNoticingNotes,
  onRestart,
  onExport,
  saveState,
}) {
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [contactState, setContactState] = useState("idle"); // idle | saving | saved | failed

  // ---- Auto-capture the reflection text (Section: "What are you noticing?"
  // and "Looking across your results") ----
  // These prompts already exist as part of the reflection experience, not
  // as an added research question, but the answers were previously only
  // included in the manual JSON download and otherwise discarded. This
  // saves them to a "Reflections" sheet automatically: a few seconds after
  // the person stops typing, and again as a safety net the moment they
  // leave the page, so nothing requires an extra click or a new question.
  const reflectionRef = useRef({ wholeProfileNote, noticingNotes });
  useEffect(() => {
    reflectionRef.current = { wholeProfileNote, noticingNotes };
  }, [wholeProfileNote, noticingNotes]);

  useEffect(() => {
    const hasContent = wholeProfileNote || noticingNotes.some((n) => n);
    if (!hasContent) return;
    const timer = setTimeout(() => {
      postToSheet({
        action: "submit_reflection",
        respondent_id: respondentId,
        whole_profile_note: wholeProfileNote,
        noticing_notes: noticingNotes,
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [wholeProfileNote, noticingNotes, respondentId]);

  useEffect(() => {
    function flush() {
      const current = reflectionRef.current;
      const hasContent = current.wholeProfileNote || current.noticingNotes.some((n) => n);
      if (!hasContent) return;
      if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL.startsWith("PASTE_")) return;
      const payload = JSON.stringify({
        action: "submit_reflection",
        respondent_id: respondentId,
        whole_profile_note: current.wholeProfileNote,
        noticing_notes: current.noticingNotes,
      });
      navigator.sendBeacon(SHEETS_WEBHOOK_URL, new Blob([payload], { type: "text/plain;charset=utf-8" }));
    }
    function handleVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [respondentId]);

  const dateStr = completedAt
    ? completedAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "";

  const noticingPrompts = [
    "What did you recognise about yourself while completing this?",
    "What, if anything, surprised you?",
    "Where do you notice yourself becoming less grounded?",
    "What would you like to understand or explore further?",
  ];

  const handleSaveContact = async () => {
    if (!email) return;
    setContactState("saving");
    const result = await postToSheet({
      action: "submit_contact",
      respondent_id: respondentId,
      email,
      marketing_consent: marketingConsent,
      submitted_at: new Date().toISOString(),
      // Included so the backend can actually email a saved copy back,
      // rather than just recording the address with nothing to send.
      construct_level_data: constructs.map((c) => ({
        construct_id: c.construct_id,
        construct_name: c.construct_name,
        score: scores[c.construct_id]?.value ?? null,
        band: bandLabel(c.construct_id, scores[c.construct_id]?.value),
      })),
    });
    setContactState(result.ok ? "saved" : "failed");
  };

  return (
    <div>
      {/* Toolbar: not printed */}
      <div className="no-print sticky top-0 z-10 bg-[#23261F] text-[#F4F2E9]">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <span className="text-xs text-[#B8B2A0] font-mono-brand">
            Beta report: v0.2{saveState === "saving" ? " · saving…" : saveState === "failed" ? " · not saved (offline?)" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-transparent border border-[#4B5040] hover:bg-[#2E3227] transition-colors"
            >
              <Download size={13} /> Download data (JSON)
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-transparent border border-[#4B5040] hover:bg-[#2E3227] transition-colors"
            >
              <Printer size={13} /> Print / Save as PDF
            </button>
            <button
              onClick={onRestart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-transparent border border-[#4B5040] hover:bg-[#2E3227] transition-colors"
            >
              <RotateCcw size={13} /> Start again
            </button>
          </div>
        </div>
      </div>

      {/* COVER */}
      <section className="bg-[#3F4A36] text-[#F4F2E9] px-6 py-20 sm:py-28">
        <div className="max-w-xl mx-auto">
          <div className="w-10 h-[3px] bg-[#C9B98A] mb-8" />
          <h1 className="font-display text-4xl sm:text-5xl font-medium leading-tight">
            Grounded Self-Trust Profile™
          </h1>
          <p className="font-display text-xl sm:text-2xl italic text-[#D9D4C0] mt-2">Your Results</p>

          <div className="mt-10 font-mono-brand text-xs text-[#B8B2A0] space-y-1">
            <p>Respondent ID: {respondentId}</p>
            {dateStr && <p>Completed: {dateStr}</p>}
          </div>

          <p className="mt-10 text-base sm:text-lg leading-relaxed text-[#EDEAD9] max-w-md">
            Your results offer a snapshot of how you tend to relate to yourself across experiences such
            as achievement, mistakes, comparison, uncertainty and setbacks.
          </p>

          <div className="mt-10 pt-8 border-t border-[#5B6650]">
            <p className="font-display text-xl sm:text-2xl italic">Your results are a snapshot, not a verdict.</p>
          </div>
        </div>
      </section>

      {/* WHAT THIS IS / ISN'T */}
      <section className="px-6 py-10 bg-[#E7E4D4]">
        <div className="max-w-xl mx-auto text-sm text-[#5A5646] leading-relaxed space-y-2">
          <p>
            <strong className="text-[#3A3A2E]">What this is:</strong> an early-access reflection tool based on a
            framework we're actively testing, built from real data across two independent studies so far.
          </p>
          <p>
            <strong className="text-[#3A3A2E]">What this isn't:</strong> a clinical or diagnostic assessment, a fixed
            personality "type," or a finished, fully validated instrument.
          </p>
        </div>
      </section>

      {/* UNDERSTANDING YOUR RESULTS */}
      <section className="page-break px-6 py-16 max-w-xl mx-auto">
        <Eyebrow>Understanding your results</Eyebrow>
        <p className="mt-4 text-[#3A3A2E] leading-relaxed">
          Grounded self-trust is about how we remain connected to ourselves as we navigate the
          experiences that can strengthen, challenge or shake our confidence in ourselves.
        </p>
        <p className="mt-4 text-[#3A3A2E] leading-relaxed">
          It does not mean always feeling confident. It does not mean never doubting yourself. And it
          does not mean being unaffected by success, failure, criticism or comparison.
        </p>
        <p className="mt-4 text-[#3A3A2E] leading-relaxed">
          Rather, it concerns how you relate to yourself when these experiences occur.
        </p>

        <div className="mt-10 space-y-4">
          {constructs.map((c) => (
            <div key={c.construct_id} className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: c.accent }} />
              <div>
                <p className="font-medium text-[#23261F]">{c.construct_name}</p>
                <p className="text-sm text-[#7A7563] italic">{c.core_question}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RESULTS AT A GLANCE */}
      <section className="page-break px-6 py-16 bg-[#E7E4D4]">
        <div className="max-w-xl mx-auto">
          <Eyebrow>Your results at a glance</Eyebrow>
          <p className="mt-3 text-sm text-[#7A7563]">
            Each marker shows where your responses placed you on a {scaleMin}–{scaleMax} scale.
            Position on the line does not indicate better or worse; it only shows where your responses currently sit.
          </p>
          <div className="mt-8 space-y-7">
            {constructs.map((c) => (
              <div key={c.construct_id}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="font-medium text-[#23261F]">{c.construct_name}</span>
                  <span className="font-mono-brand text-sm text-[#5A5646]">
                    {scores[c.construct_id]?.value != null ? scores[c.construct_id].value.toFixed(1) : "N/A"}
                  </span>
                </div>
                <GroundLine
                  score={scores[c.construct_id]?.value}
                  scaleMin={scaleMin}
                  scaleMax={scaleMax}
                  accent={c.accent}
                  constructName={c.construct_name}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDIVIDUAL CONSTRUCT SECTIONS */}
      {constructs.map((c) => {
        const score = scores[c.construct_id]?.value;
        const band = bandLabel(c.construct_id, score);
        return (
          <section key={c.construct_id} className="page-break px-6 py-16 max-w-xl mx-auto border-t border-[#DAD5C4]">
            <div className="w-2.5 h-2.5 rounded-full mb-4" style={{ backgroundColor: c.accent }} />
            <h2 className="font-display text-2xl sm:text-3xl text-[#23261F]">{c.construct_name}</h2>
            <p className="mt-1 text-[#7A7563] italic">{c.core_question}</p>

            <p className="mt-8 text-xs uppercase tracking-wide text-[#9C9580] font-medium">
              What this dimension explores
            </p>
            <p className="mt-2 text-[#3A3A2E] leading-relaxed">{c.definition}</p>

            <p className="mt-8 text-xs uppercase tracking-wide text-[#9C9580] font-medium">Your result</p>
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <span className="font-mono-brand text-3xl text-[#23261F]">
                {score != null ? score.toFixed(1) : "N/A"}
              </span>
              <span className="text-sm text-[#7A7563]">out of {scaleMax}</span>
              {band && (
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${c.accent}22`, color: c.accent }}
                >
                  {band} so far
                </span>
              )}
            </div>
            <div className="mt-3 max-w-xs">
              <GroundLine score={score} scaleMin={scaleMin} scaleMax={scaleMax} accent={c.accent} constructName={c.construct_name} />
            </div>
            <p className="mt-2 text-xs text-[#9C9580] leading-relaxed max-w-sm">
              This reflects where you land compared with other people who've taken this early-access
              version so far, not a fixed scale or a clinical range.
            </p>

            <div className="mt-8 pl-4 border-l-2" style={{ borderColor: c.accent }}>
              <p className="text-xs uppercase tracking-wide text-[#9C9580] font-medium mb-1.5">Consider</p>
              <p className="text-[#3A3A2E] leading-relaxed">{c.reflection_question}</p>
            </div>

            <div className="mt-6 rounded-lg bg-[#F4F2E9] border border-[#E1DDCE] px-5 py-4">
              <p className="text-[#5A5646] leading-relaxed text-[15px]">{c.coaching_bridge}</p>
            </div>
          </section>
        );
      })}

      {/* WHOLE-RESULTS SECTION */}
      <section className="page-break px-6 py-16 max-w-xl mx-auto bg-[#E7E4D4]">
        <Eyebrow>Looking across your results</Eyebrow>
        <p className="mt-4 text-[#3A3A2E] leading-relaxed">
          These dimensions describe different aspects of how you relate to yourself. They may interact
          with one another, but your results are not intended to produce a single overall measure of your
          worth, capability or "groundedness."
        </p>

        <p className="mt-8 font-display text-xl text-[#23261F]">What stands out?</p>
        <ul className="mt-4 space-y-2.5 text-[#3A3A2E]">
          {[
            "Which result feels most recognisable?",
            "Which result surprises you?",
            "Is there a result you would like to understand better?",
            "Do you notice any connection between the different dimensions?",
          ].map((q, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="text-[#9C9580]">–</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>

        <label className="block mt-6">
          <span className="text-xs uppercase tracking-wide text-[#9C9580] font-medium">
            Space for reflection (optional)
          </span>
          <textarea
            value={wholeProfileNote}
            onChange={(e) => setWholeProfileNote(e.target.value)}
            rows={4}
            className="no-print-border mt-2 w-full rounded-lg border border-[#DAD5C4] bg-white px-4 py-3 text-[#2B2B24] leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7A5E]"
            placeholder="Write as much or as little as you like…"
          />
        </label>
      </section>

      {/* REFLECTION */}
      <section className="page-break px-6 py-16 max-w-xl mx-auto">
        <Eyebrow>What are you noticing?</Eyebrow>
        <div className="mt-6 space-y-8">
          {noticingPrompts.map((prompt, i) => (
            <label key={i} className="block">
              <span className="text-[#23261F] font-medium leading-relaxed">
                {i + 1}. {prompt}
              </span>
              <textarea
                value={noticingNotes[i]}
                onChange={(e) => {
                  const next = [...noticingNotes];
                  next[i] = e.target.value;
                  setNoticingNotes(next);
                }}
                rows={3}
                className="mt-2 w-full rounded-lg border border-[#DAD5C4] bg-white px-4 py-3 text-[#2B2B24] leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7A5E]"
                placeholder="Optional, not scored"
              />
            </label>
          ))}
        </div>
      </section>

      {/* SAVE RESULTS + COACHING CTA (no-print: this is a live-page action, not part of the PDF) */}
      <section className="no-print page-break px-6 py-16 max-w-xl mx-auto">
        <Eyebrow>Want to keep this, or go further?</Eyebrow>

        <div className="mt-6 rounded-lg border border-[#DAD5C4] bg-white px-5 py-5">
          <p className="text-[#23261F] font-medium flex items-center gap-2">
            <Mail size={16} /> Email me a saved copy of my results
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-3 w-full rounded-lg border border-[#DAD5C4] bg-white px-4 py-2.5 text-[#2B2B24] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B7A5E]"
          />
          <label className="flex items-start gap-2.5 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#DAD5C4] text-[#3F4A36] focus:ring-[#6B7A5E]"
            />
            <span className="text-xs text-[#7A7563] leading-relaxed">
              I'd also like occasional emails about my results and related coaching resources. Unsubscribe
              anytime; declining has no effect on receiving my saved results.
            </span>
          </label>
          <button
            onClick={handleSaveContact}
            disabled={!email || contactState === "saving"}
            className="mt-4 px-5 py-2.5 rounded-lg bg-[#3F4A36] text-[#F4F2E9] text-sm font-medium hover:bg-[#333D2C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {contactState === "saved" ? "Saved ✓" : contactState === "saving" ? "Saving…" : "Save my results"}
          </button>
          {contactState === "failed" && (
            <p className="mt-2 text-xs text-[#A24B3B]">Couldn't save right now; please try again in a moment.</p>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-[#3F4A36] text-[#F4F2E9] px-5 py-6">
          <p className="leading-relaxed">
            Want to explore any of this further? Book a free 20-minute conversation. No pressure, no
            pitch, just a chance to talk through what might help.
          </p>
          <a
            href={COACHING_BOOKING_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-[#F4F2E9] text-[#23261F] text-sm font-medium hover:bg-white transition-colors"
          >
            Book your free discovery call
          </a>
        </div>
      </section>

      {/* CLOSING */}
      <section className="page-break bg-[#3F4A36] text-[#F4F2E9] px-6 py-20">
        <div className="max-w-xl mx-auto">
          <p className="font-display text-2xl sm:text-3xl leading-snug">
            Grounded self-trust is not the absence of doubt.
          </p>
          <p className="mt-6 text-[#D9D4C0] leading-relaxed">
            It is not about always feeling confident, always succeeding or never being shaken. It is
            about being able to remain connected to yourself: your worth, your capability and your
            capacity to learn, as you move through success, failure, uncertainty, comparison and change.
          </p>
          <p className="mt-8 font-display text-xl italic text-[#EDEAD9]">
            Your results are a snapshot, not a verdict.
          </p>
          <p className="mt-6 text-[#D9D4C0] leading-relaxed">
            What matters is what you notice, what you learn and what you choose to do with that
            awareness.
          </p>

          <div className="mt-16 pt-6 border-t border-[#5B6650] flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium">Grounded Self-Trust Profile™</p>
              <p className="text-sm text-[#B8B2A0] italic">Part of the Grounded Ecosystem</p>
            </div>
            <p className="font-mono-brand text-[10px] text-[#8A907E]">
              {VERSION_INFO.report_version} · {VERSION_INFO.scoring_model_version} · {VERSION_INFO.item_bank_version}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
