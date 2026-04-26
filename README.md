# Two of Us

A trilogy of honest relationship diagnostics — three short, opinionated quizzes
that plot two people on a 2×2 chart. Take a quiz from your own point of view,
get a `#me=` link to send to your partner, and either of you can paste the
other's link into the "compare" box on the results screen to see all four dots
at once: how each of you sees both of you. Once you've done all three,
`/combo/` shows where you both land across all three at once — a single
shareable summary.

Built as a static **Next.js 15 (App Router) + TypeScript + Tailwind CSS** site;
no backend, no database — results travel inside the URL hash. Deployed via
**static export** to GitHub Pages (or any static host).

## Tech

- **Next.js 15** (App Router) with `output: "export"` (fully static).
- **TypeScript** strict.
- **Tailwind CSS v3** — the design system mostly lives in `app/globals.css`
  as plain CSS (the brutalist look needs precise pixel-shadow rules that are
  awkward to do via utility classes); per-quiz colour palettes are exposed as
  CSS variables.
- **Google Fonts** — Fraunces (italic serif accents) + DM Sans (body), wired
  via `next/font/google` in `app/layout.tsx`.

## Layout

```
app/
  layout.tsx               Root: Google Fonts + body bg.
  page.tsx                 Landing page (3 cards + paste-link router).
  globals.css              Design system + per-quiz CSS-variable defaults.
  relationship/page.tsx    Reference quiz page (Wave 1).
  leader/page.tsx          Wave 2.
  grownup/page.tsx         Wave 2.
  combo/page.tsx           Wave 2 (or later).

components/
  Quiz.tsx                 Big client component: intro → question → results.
  QuadrantChart.tsx        2- or 4-dot chart with optional dashed connectors.
  ShareBlock.tsx           Readonly URL input + Copy button (no native share).
  CompareBlock.tsx         Paste-input + Compare button → merges into #us=.
  AgreementPanel.tsx       Auto-generated bullets under the 4-dot chart.
  QuizCard.tsx             One card on the landing page.
  PasteRouter.tsx          Landing-page paste-link → quiz-page redirect.

lib/
  hash.ts                  base64url JSON encode/decode + fragment parsing.
  scoring.ts               blankScores, plotPercent, assignQuadrants, etc.
  types.ts                 QuizConfig, MePayload, UsPayload, TrioPayload, …

quizzes/
  relationship.ts          Quiz config + per-quiz palette (Wave 1).
  leader.ts                Wave 2.
  grownup.ts               Wave 2.

public/
  .nojekyll                So GitHub Pages doesn't strip _next/.
```

## Develop

```sh
npm install
npm run dev          # http://localhost:3000
```

## Build (static export)

```sh
npm run build        # writes out/ — fully static HTML/JS/CSS.
```

The output goes to `out/`. You can serve it with anything — `npx serve out`
or `python3 -m http.server -d out 8000`.

## Deploy to GitHub Pages

If your repo is `username.github.io/two-of-us/`, the site lives at a base
path. Set `NEXT_PUBLIC_BASE_PATH` at build time:

```sh
NEXT_PUBLIC_BASE_PATH=/two-of-us npm run build
```

This wires both `basePath` and `assetPrefix`. We also set
`trailingSlash: true` in `next.config.ts` so GitHub Pages can serve
`/relationship/index.html` for the URL `/relationship/`.

If you're deploying to the root of a domain (apex or `username.github.io`),
leave `NEXT_PUBLIC_BASE_PATH` unset:

```sh
npm run build
```

A `.nojekyll` file in `public/` keeps GitHub Pages from interfering with
Next.js's `_next/` directory.

## URL hash schemes

All payloads are versioned (`v: 1`) JSON, base64url-encoded onto the page
hash (`+` → `-`, `/` → `_`, padding stripped).

```
#me=…    { v, m:"me", q, n1, n2, a1, a2 }
           — n1 = answerer, n2 = partner; a1 = answerer's view of self,
             a2 = answerer's view of partner.
#us=…    { v, m:"us", q, n1, n2, a1byA, a2byA, a1byB, a2byB }
           — combined 4-dot comparison; aXbyY = view of person X
             according to person Y.
#trio=…  { v, m:"trio", n1, n2,
           relationship: <sub>, leader: <sub>, grownup: <sub> }
```

Each `<sub>` in `#trio=` is either `{ a1, a2 }` (one person's view) or
`{ a1byA, a2byA, a1byB, a2byB }` (4-dot). Any of the three keys may be
omitted — the combo page shows a "not yet taken" placeholder.
`q` is the quiz id: `relationship` | `leader` | `grownup`. Each `aN` is
`[yPos, yNeg, xPos, xNeg]` counts (axis order from `lib/scoring.ts`).

This rewrite **does not** support the legacy `#invite=` / `#results=`
hashes — they were dropped along with the "Together mode" flow.

## How to add a quiz

Each quiz is two files:

1. **`quizzes/<id>.ts`** — exports a default `QuizConfig` (see
   `quizzes/relationship.ts` as the reference). The `palette` field is a map
   of CSS variables (`--accent`, `--quad-tl`, `--bg-glow-1`, etc.) — those
   variables are read by `app/globals.css` rules to repaint the design
   system. Add per-archetype tints (e.g. `.verdict.matriarch { ... }`) to
   `globals.css` if your archetype klasses aren't already covered.
2. **`app/<id>/page.tsx`** — five-line wrapper. Imports the config, exports
   `metadata`, and renders `<Quiz quiz={config} />` inside a `<main>` whose
   inline `style` injects the palette variables.

Then add a `<QuizCard>` to `app/page.tsx` linking to `/<id>/`.

## OG / share images

Each page declares Open Graph + Twitter Card metadata pointing at images
that don't yet ship. Drop these PNGs (1200×630) into `public/` and they
get picked up automatically:

- `og-cover.png` — landing page
- `og-relationship.png` — Part I
- `og-leader.png` — Part II
- `og-grownup.png` — Part III
- `og-combo.png` — combo page

## Notes / not yet built

- Combo page (`/combo/`) — Wave 2 / 3.
- OG preview images (placeholders only).
- LocalStorage history of past results.
- A `/trio/` vanity URL or URL-shortener for long share links.
- Per-quiz QR-code option on the share screen.
