# AskToddy Mobile — Project Status

_Last updated: 2026-06-09_

## Current version

- **App:** v1.2.4, iOS build **49**, bundle `com.asktoddy.staging`
- **Branch:** `staging`
- **Edge function (`analyze-construction`):** v107 (v108 pending deploy)
- **Tests:** 310 passing, 35 suites

## Launch plan

- **iOS:** target end of May / June 2026
- **Android:** follows (June 2026)
- No investor meeting (dropped — see ADR-014). Focus on shipping a quality
  product and real users.

### Release scope (iOS)

- ✅ Core quoting flow (site notes → AI → quote → share)
- ✅ Freemium with RevenueCat payments
- ✅ PDF export, VAT breakdown, business details, legal notice
- ✅ Sign in with Apple, password reset, account deletion (App Store compliance)
- ❌ Voice-to-text (post-launch)
- ❌ Android (June)
- ❌ Analytics (post-launch)

## What's built

- Email/password + Sign in with Apple auth with verification & password reset
- Guided site assessment (dimensions, location, finish level, photos, voice)
- AI quote generation (Gemini 2.5 Flash) with 9 job types + template fallback
- Consistent quoting: deterministic generation config, trade-realistic
  materials/labour split, input-grounded confidence (ADR-017)
- Quote editing with live totals and per-line "your price"
- Auto-save drafts (1s debounce), saved-quote management
- Professional sharing: text + PDF, company branding, business contact details,
  VAT (ex-VAT storage, 20% at display), legal notice & quote validity
- RevenueCat SDK integrated (code complete)

## Launch readiness

| Area                                          | Status                                                     |
| --------------------------------------------- | ---------------------------------------------------------- |
| Core flow & AI quoting                        | ✅ Complete                                                |
| Professional quote output (VAT/PDF/branding)  | ✅ Complete                                                |
| Auth + App Store compliance                   | ✅ Complete                                                |
| Payments (RevenueCat)                         | ⚠️ Code complete — needs own ASC account + dashboard setup |
| Own iOS dev account                           | ⏳ DUNS received; enroll in Apple Developer Program        |
| App Store metadata (screenshots, copy)        | ⬜ Not started                                             |
| Landing page + privacy policy (asktoddy.com)  | ⬜ Required before review                                  |
| Gemini cost controls + per-user rate limiting | ⬜ See PRODUCTION_CHECKLIST.md                             |

## Known follow-ups

- **Deterministic multipliers (deferred):** size/location/spec multipliers are
  currently applied by the LLM via the prompt; move to deterministic
  server-side application for exactness (ADR-017).
- **ONS price index (parked):** data is XLSX-only and low-impact; scaffolding
  left dormant (ADR-016).
- See [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) for the full
  pre-launch hardening list.

> Detailed sprint plan, blockers, and ticket state live in `.claude-context/`
> (`current-session.json`, `work-log.md`, `decisions.md`, `linear-tickets.json`).
