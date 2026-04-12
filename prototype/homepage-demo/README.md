# PaperBites home layout — static prototype

This folder is a **standalone front-end demo** of the Ground News–inspired home structure (promise → featured papers → weekly briefing → top papers → feed). It does **not** import or modify the PaperBites app under `apps/web`.

## View it

- **Easiest:** open `index.html` in a browser (double-click or drag into Chrome/Edge/Firefox).
- **Optional local server** (avoids any file-URL quirks):

```bash
npx --yes serve .
```

Then open the URL shown (usually `http://localhost:3000`).

## What’s included

- Glass-style dashboard + skim mode + topic chips (mock)
- Three-up featured hero (mock copy)
- Weekly briefing band with metrics + lead + bullets + CTA
- Numbered “Top papers” list with journal / year / design / topic lines
- Grid of feed cards + disabled “Load more”
- Dark / light toggle (persists in `localStorage` as `pb-proto-theme`)

## Next steps (when you integrate)

Wire sections to `loadFeedPage`, `loadWeeklyFeed`, and real routes in the Next.js app; replace mock ranking with your scoring.
