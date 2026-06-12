# Site Notes UX — Plan for Decision

_Drafted June 12, 2026. Three related ideas, scoped as two independent pieces of
work so they can be approved separately._

## DECISION (June 12, 2026)

- **Piece C — APPROVED & SHIPPED.** Read-only "Original brief" card on the viewed
  quote (`src/components/OriginalBriefCard.tsx`, wired into `TaskListScreen.tsx`
  behind `isViewingGenerated`). No data-model change. Tests in
  `src/components/__tests__/OriginalBriefCard.test.tsx`. Full suite green
  (340 tests / 40 suites).
- **Piece A+B — DEFERRED to backlog (ASK-208).** Note-chips + suggestion chips.
  Deliberately not done pre-launch: it reworks the most-used input screen and its
  auto-save (regression risk during launch crunch), and its elicitation payoff is
  better validated with real users post-launch. Build later via the Option-1 data
  shape; mind the uncommitted-input-buffer risk noted below.

## Background (how it works today)

- Site notes are captured as **one multiline free-text box** (`additionalNotes`),
  no character limit, **50-char minimum** to enable generation
  (`SiteNotesScreen.tsx` validation).
- On save, notes are concatenated with the voice transcript and stored as a
  single string `notes` field (`SiteNotesScreen.tsx:804`).
- The prompt interpolates it as `📝 DETAILED NOTES: <blob>` inside an
  untrusted-data delimiter block (`TaskListScreen.tsx:357`, re-wrapped server-side
  in `index.ts`). Structured fields (size/spec/property/construction) drive the
  pricing multipliers separately — notes are the "anything else" channel only.
- The form **already auto-saves** every 1s to AsyncStorage on any field change,
  saves again on unmount, and syncs offline-first via `useSyncQuotes`
  (`SiteNotesScreen.tsx:444-521`, `QuoteStorageService.ts`, `useSyncQuotes.ts`).
- A generated/completed quote **already retains** the full original brief —
  `notes`, `tasks`, `photos`, `voiceNotes`, and the entire nested `siteNotes`
  object (`TaskListScreen.tsx:153-171`, `Quote.ts`). The viewing path
  (`isViewingGenerated`) just doesn't display it — only address + job type +
  AI line items.

## What this does NOT do

- **It does not materially improve raw AI accuracy via format alone.** Bullets vs
  a paragraph carry near-identical signal to Gemini. The accuracy win is
  _elicitation_ — discrete entry + suggestions pull more complete, atomised facts
  out of the user. Framed honestly so we don't over-promise.
- **It does not improve offline/crash safety.** The 1s auto-save already covers
  that for the blob. Piece B must be built so it does not _regress_ safety (see
  risk note in B).

---

## Piece C — Read-only "Original brief" on a completed quote ⭐ recommended first

**Why:** Cheapest, safest, useful on its own. No data-model change, no migration —
the data is already stored, just not shown. Lets a user revisit a finished quote
and see _why_ it came out as it did, with zero edit/resubmit risk.

**Scope:**

- Add a collapsible, **read-only** "Original brief" / "Your notes" section to the
  viewed-quote screen (the `isViewingGenerated` branch of `TaskListScreen.tsx`,
  or a small new component rendered there).
- Display: notes text, selected tasks, property type / size / spec / construction
  method, photo thumbnails, and (if present) a voice-notes indicator.
- Collapsed by default so it doesn't clutter the line-item view; expand on tap.
- Strictly view-only — no inputs, no save, no resubmit. Reads from the already-
  stored `savedQuote.siteNotes` / top-level fields.

**Files:**

- `src/screens/TaskListScreen.tsx` — render the section in the view branch.
- Optionally a new `src/components/quote/OriginalBriefCard.tsx` for cleanliness.
- Styles via `designTokens` (match existing cards).

**Tests (per testing policy):**

- New colocated test: renders all present brief fields read-only; hides absent
  fields gracefully; no edit controls present; collapse/expand toggles.

**Risk:** Very low. Pure additive UI over existing data.
**Est. size:** Small (½ day incl. tests).

---

## Piece A+B — Note chips + suggestion chips (combined)

Treated as one piece because both depend on the same `notes` data-shape change.

### A. Note-chip entry

- Replace the single blob input with: a text input + **Add** button; each added
  note renders as a chip/row below with a delete (×).
- Notes become an **array of strings** in form state.
- **Soft cap, not hard:** gentle guidance ("Keep it to your key points") with a
  generous hard ceiling (~15) to prevent abuse — avoids silently truncating a
  genuinely complex job (listed + party wall + asbestos + access + drainage is
  already 5).

### B. Suggestion chips (the real accuracy lever)

- In the empty/low-state, show tappable, job-type-aware suggestion chips that
  seed high-value facts the model otherwise never hears, e.g.:
  _Access/parking? · Listed or conservation area? · Existing condition? ·
  Asbestos/hazards? · Who removes waste?_
- Tapping pre-fills the input (user edits then Adds) rather than auto-committing a
  bare label — keeps notes specific.

### Data shape & compatibility

- `SiteNote.notes` is currently `string`. Two options:
  - **Option 1 (minimal blast radius):** keep `notes: string` on the persisted
    type; store the array only in form state and **join with newlines** on save.
    Prompt still renders fine; saved drafts and the edge-function regex (which
    only reads structured fields) are untouched. Read-only view (Piece C) can
    split on newline to show bullets.
  - **Option 2 (cleaner, more work):** add `notesList?: string[]` to the type,
    persist both, migrate old `notes` strings → single-item list on load.
  - **Recommendation: Option 1.** Smallest change, no migration, backwards-
    compatible with every saved quote already on devices and the server.
- Prompt rendering: join notes as a bulleted list under `📝 DETAILED NOTES:`.

### Prompt change

- `TaskListScreen.tsx:357` — render notes as `- item\n- item` instead of a blob.
  Keep the untrusted-data delimiters and the 50-char-equivalent gate (switch the
  validation to "≥1 note OR ≥50 chars total OR tasks selected").

### Offline-safety risk (must handle)

- Chips introduce a new failure mode: text typed but **not yet Added** lives only
  in the input's local state. Naive persistence (chips array only) could lose it
  on a crash — a regression vs today's blob.
- **Required mitigation:** also persist the in-progress input buffer in the 1s
  auto-save, **or** auto-commit a non-empty input on blur/background. With this,
  chips are at least as safe as the blob.

**Files:**

- `src/screens/SiteNotesScreen.tsx` — input UX, chips list, soft cap, suggestion
  chips, validation, auto-save of the input buffer, join-on-save.
- `src/screens/TaskListScreen.tsx` — bulleted prompt rendering.
- Suggestion-chip config (job-type → suggested prompts), small new constants file.

**Tests:**

- Add/delete chips; soft-cap guidance; suggestion chip pre-fills input; join-on-
  save produces expected `notes` string; validation accepts ≥1 note; auto-save
  persists uncommitted input (no data loss on simulated unmount).

**Risk:** Medium — touches the most-used input screen and its auto-save. The
uncommitted-buffer mitigation is the main correctness concern.
**Est. size:** Medium (1.5–2 days incl. tests).

---

## Recommended sequencing

1. **Piece C now** — cheap, safe, independently valuable, and it makes the
   notes-as-bullets display ready for later.
2. **Piece A+B next** — only if we want the elicitation win; ship behind the
   Option-1 data shape so nothing breaks for existing quotes.

## Open decisions for you

- Do C only, A+B only, or both?
- Soft cap value (proposed ~15 hard ceiling, guidance ~10).
- Suggestion-chip set per job type — want input on the wording, or happy for me
  to draft a first pass per the 9 job types?
- Option 1 vs Option 2 for the data shape (recommend Option 1).
