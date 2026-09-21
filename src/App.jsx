import React, { useState, useMemo, useCallback } from "react";
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
// >>> EDIT THIS ONCE YOU HAVE IT: your deployed Apps Script Web App URL <
// -------------------------------------------------------------------------
const SHEETS_WEBHOOK_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

// >>> EDIT THIS: your discovery-call booking link (Calendly or similar) <
const COACHING_BOOKING_URL = "PASTE_YOUR_BOOKING_LINK_HERE";

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
  { item_id: "IS6",
