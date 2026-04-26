# Two of Us

A trilogy of honest relationship diagnostics — three short, opinionated quizzes that
plot two people on a 2x2 chart. Take a quiz from your own point of view, get a `#me=`
link to send to your partner, and either of you can paste the other's link into the
"compare" box on the results screen to see all four dots at once: how each of you
sees both of you. Once you've done all three, `combo.html` shows where you both land
across all three at once — a single shareable summary. Vanilla HTML/CSS/JS, no build
step, no backend; results travel inside the URL hash.

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
engine.js               Quiz runtime — scoring, hash routing, share + compare blocks.
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
#me=…    { v, m:"me", q, n1, n2, a1, a2 }
           — n1 = answerer, n2 = partner; a1 = answerer's view of self, a2 = of partner.
#us=…    { v, m:"us", q, n1, n2, a1byA, a2byA, a1byB, a2byB }
           — combined 4-dot comparison; aXbyY = view of person X according to person Y.
#trio=…  { v, m:"trio", n1, n2,
           relationship: <sub>, leader: <sub>, grownup: <sub> }
```

Each `<sub>` in `#trio=` is either `{ a1, a2 }` (one person's view) or
`{ a1byA, a2byA, a1byB, a2byB }` (4-dot). Any of the three keys may be omitted —
combo.html shows a "not yet taken" placeholder for missing quizzes. `q` is the quiz
id: `relationship` | `leader` | `grownup`. Each `aN` is `[yPos, yNeg, xPos, xNeg]`
counts (axis order from `window.QUIZ.axisOrder`).

Legacy `#invite=` (= `#me=`) and `#results=` (= `#us=` or `#me=` depending on `m:`)
links from earlier builds still load; the engine and the index paste-router both
accept them.

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
