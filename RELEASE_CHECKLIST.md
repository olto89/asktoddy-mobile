# AskToddy — Release Checklist (v1 iOS)

Feature-complete → tidy-up → prod switchover with controls → App Store release.
Owners: **[you]** = requires Apple / dashboard / DNS / billing access · **[claude]** = in-repo / scriptable.
Detail for the backend cutover lives in `PRODUCTION_CUTOVER.md`.

## ✅ Done (baseline)

- [x] Server-side free-tier usage limits (quote_usage + RPC) — staging
- [x] Pro-exemption RevenueCat webhook — staging
- [x] Website live + Privacy + Support pages (asktoddy.co.uk)
- [x] Prod Supabase rebuilt & baselined (`rdlnlvtfwzntxiyugcuk`, un-paused)
- [x] Prod GEMINI_API_KEY set & verified
- [x] Offline / flight-mode launch fix (AuthContext timeout guard) — code + test
- [x] Tidy-up: removed dead `support@asktoddy.com` refs → `.co.uk` (incl. Privacy/Terms)
- [x] Tidy-up: App Info version now dynamic (was hardcoded v1.0.1)

## 🔴 Phase 0 — Protect & unblock

- [ ] **[you]** Gemini cost controls on prod GCP project `asktoddy mobile prod`: billing card + budget + alerts at 50/75/90% — _bill-shock blocker_
- [ ] **[you/claude]** Prod keep-alive decision — free-tier re-pauses after ~7 days idle. Keep-warm cron vs Supabase Pro. (claude can set up a keep-warm ping)

## 🟠 Phase 1 — Prod payments switchover

- [ ] **[you]** Create prod RevenueCat app on `com.oakhouse.asktoddy` + own iOS API key
- [ ] **[claude]** Swap prod RC iOS key into `eas.json` prod profile (still the partner's `appl_fzMpe…`)
- [ ] **[you]** Prod ASC subscription `asktoddy_pro_monthly` created & **Approved**
- [ ] **[you]** Prod RC webhook → `https://rdlnlvtfwzntxiyugcuk.supabase.co/functions/v1/revenuecat-webhook`, auth = prod secret (set)
- [ ] **[claude]** Verify prod backend parity — 10 edge fns + migrations + secrets current _(needs a fresh Supabase PAT)_

## 🟡 Phase 2 — Tidy up (parallel with Phase 1)

- [x] **[claude]** Remaining "coming soon" placeholders — none left (verified)
- [ ] **[claude]** Branded email templates → prod (`apply-templates.mjs`) _(needs PAT)_
- [ ] **[you+claude]** Custom SMTP (Resend) — finish `send.asktoddy.co.uk` DNS/verify (you), apply staging then prod (claude)
- [ ] **[you+claude]** App Store metadata — copy + IAP + screenshots. Draft ready in `docs/APP_STORE_METADATA.md`; you capture/upload screenshots & set demo account

## 🟢 Phase 3 — Merge, build, verify

- [ ] **[claude]** Merge `staging` → `main`
- [ ] **[claude]** Bump buildNumber, prod EAS build (`--profile production`)
- [ ] **[you]** On-device QA: sandbox purchase end-to-end · offline/flight-mode launch · regression across all 9 job types

## 🔵 Phase 4 — Submit & launch

- [ ] **[you]** Submit to App Store review (attach IAP, demo account, review notes)
- [ ] **[you+claude]** Address review feedback → **release**

---

**Critical path:** Phase 0 → (RC + ASC + webhook in parallel) → key swap + parity → merge + build → device QA → submit.
