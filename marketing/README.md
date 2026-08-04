# AskToddy marketing site

Self-contained static site for the AskToddy landing page + the App-Store-required
legal/support pages. No build step — plain HTML/CSS.

## Pages

- `index.html` — landing page (hero, features, pricing)
- `privacy.html` — Privacy Policy (**required by Apple**) — mirrors the in-app text
- `terms.html` — Terms & Conditions — mirrors the in-app text
- `support.html` — Support page (**required by Apple**)
- `styles.css` — shared styles (brand: Toddy Orange `#FF6B35`, Navy `#2C3E50`)

## Deploy (pick one)

**Vercel:** `cd marketing && vercel --prod` (framework preset: "Other"; output dir = this folder).
**Netlify:** drag this folder onto app.netlify.com, or `netlify deploy --prod --dir=marketing`.
**GitHub Pages:** push this folder to a `gh-pages` branch / `/docs`.

Point `asktoddy.co.uk` at the deployment. Then the URLs App Store Connect needs are:

- Privacy Policy URL: `https://asktoddy.co.uk/privacy.html`
- Support URL: `https://asktoddy.co.uk/support.html`

## Before go-live — TODOs left in the markup

1. `index.html` — replace the `href="#"` on the **Download for iOS** button with the
   real App Store URL once the listing is live (search `TODO` in the file).
2. **Legal entity:** resolved — the entity is **Oakhouse Woodbridge Ltd** (applied to the
   in-app Terms/Privacy and to `terms.html`/`privacy.html` + copyright footers).
