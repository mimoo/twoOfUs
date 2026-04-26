# Two of Us

A trilogy of honest relationship diagnostics — three short, opinionated quizzes that
plot two people on a 2x2 chart. Take them together on one device, or solo and pass
a link to your partner so each of you answers from your own point of view (you'll
each see four dots: how each of you sees both of you). Once you've done all three,
`combo.html` shows where you both land across all three at once — a single shareable
summary. Vanilla HTML/CSS/JS, no build step, no backend; results travel inside the
URL hash.

## Files

```
index.html              Landing page. Card deck of three quizzes + a "paste your
                        link" helper that routes to the right page.
relationship-quiz.html  Part I — mother / baby × tyrant / serf.
leader-quiz.html        Part II — dom / sub × fun / boring.
grownup-quiz.html       Part III — mature / immature × aware / unaware.
combo.html              Three mini quadrant charts on one page, accepts a #trio= hash.
shared.css              Design system: cream bg, ink borders, hard shadows, Fraunces
                        italic + DM Sans.
engine.js               Quiz runtime (modes, scoring, hash routing, plotting).
```

## Run locally

Just open `index.html` in a browser. No server, no build. The whole site is static.

## Deploy

- **Netlify** — drag-and-drop the folder onto netlify.com, or `netlify deploy --dir=.`
- **Vercel** — `vercel` from inside this folder; accept the defaults (it's a static site).
- **GitHub Pages** — push to a repo, enable Pages, source = root of the default branch.

## URL hash schemes

All payloads are versioned (`v: 1`) JSON, base64url-encoded onto the page hash.

```
#invite=…   { v, m:"invite",   q, n1, n2, a1, a2 }            (sender's view, awaiting partner)
#results=…  { v, m:"results",  q, n1, n2, a1byA, a2byA, a1byB, a2byB }   (4-dot comparison)
#results=…  { v, m:"together", q, n1, n2, a1, a2 }            (both answered on one device)
#trio=…     { v, m:"trio",     n1, n2,
              relationship: <sub>, leader: <sub>, grownup: <sub> }
```

Each `<sub>` in `#trio=` is either `{ a1, a2 }` (together-mode) or
`{ a1byA, a2byA, a1byB, a2byB }` (compared-mode). Any of the three keys may be omitted
— combo.html shows a "not yet taken" placeholder for missing quizzes. `q` is the quiz
id: `relationship` | `leader` | `grownup`. Each `aN` is `[yPos, yNeg, xPos, xNeg]`
counts. Quiz-specific axes/archetypes live inside each quiz HTML's `window.QUIZ`.

## OG / share images

Each page ships with Open Graph + Twitter Card meta tags but no actual images yet.
Add these PNGs (1200×630) and they'll be picked up automatically:

- `og-cover.png` — landing page (`index.html`)
- `og-relationship.png` — Part I
- `og-leader.png` — Part II
- `og-grownup.png` — Part III
- `og-combo.png` — combo page

Also fill in `<meta property="og:url" content="">` on every page once you know your domain.

## Ideas / not yet built

- OG preview images (placeholders only).
- LocalStorage history of past results so a returning user can see what they took.
- A `/trio/` vanity URL or a tiny URL-shortener endpoint (links get long).
- Per-quiz "send your link to" QR code on the share screen.
- A way to overlay your couple onto an aggregated population mean.
