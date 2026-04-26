/* ============================================================
   engine.js — runtime for the "Two of Us" quiz trilogy.

   Each quiz HTML defines a global `QUIZ` config (see relationship-
   quiz.html for the canonical shape) and includes this script.

   Modes:
     - together                : both partners answer on one device
     - solo-sender             : I answer from my POV, then share a link
     - solo-receiver           : opened via #invite=…, partner now answers
     - results-only            : opened via #results=…, no quiz needed

   URL hash payloads (base64url-encoded JSON):
     #invite=…   { v, m:"invite",   q, n1, n2, a1, a2 }
     #results=…  { v, m:"results",  q, n1, n2, a1byA, a2byA, a1byB, a2byB }
                 { v, m:"together", q, n1, n2, a1, a2 }

     where aX = [count for axis 0, axis 1, axis 2, axis 3]
     in the order Q.axisOrder (see below).
   ============================================================ */

(function () {
  'use strict';

  const VERSION = 1;

  // ─── DOM helpers ─────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function show(id) {
    $$('.screen').forEach((s) => s.classList.remove('active'));
    const el = $(id);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ─── base64url JSON encoding ─────────────────────────────────
  function b64urlEncode(obj) {
    const json = JSON.stringify(obj);
    // Use unescape/encodeURIComponent trick for unicode safety.
    const utf8 = unescape(encodeURIComponent(json));
    let b64;
    try { b64 = btoa(utf8); } catch (e) { b64 = btoa(json); }
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlDecode(str) {
    let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    let utf8;
    try { utf8 = atob(s); } catch (e) { return null; }
    let json;
    try { json = decodeURIComponent(escape(utf8)); } catch (e) { json = utf8; }
    try { return JSON.parse(json); } catch (e) { return null; }
  }

  // ─── Quiz config validation ──────────────────────────────────
  if (typeof window.QUIZ === 'undefined') {
    console.error('engine.js: window.QUIZ is not defined.');
    return;
  }
  const Q = window.QUIZ;

  // canonical axis order: [yPos, yNeg, xPos, xNeg]
  // (top, bottom, right, left of chart)
  Q.axisOrder = [Q.axes.y.pos, Q.axes.y.neg, Q.axes.x.pos, Q.axes.x.neg];

  // map each archetype key "yKey+xKey" to its data; fallback {} just in case
  Q.archetypes = Q.archetypes || {};

  // ─── State ───────────────────────────────────────────────────
  const State = {
    mode: 'together',   // 'together' | 'solo-sender' | 'solo-receiver' | 'results-only'
    name1: '',          // person 1 name
    name2: '',          // person 2 name
    qIndex: 0,
    // In together mode: scores[1] = scores P1 received, scores[2] = P2 received.
    // In solo-sender:   scores[1] = answerer's view of P1 (themself),
    //                   scores[2] = answerer's view of P2 (their partner).
    //                   answererIs is 1 (sender is P1) by convention.
    // In solo-receiver: same scores object for what THIS person is answering.
    //                   inviteData carries the original sender's answers.
    scores: blankScores(),
    inviteData: null,   // decoded #invite= payload while taking solo-receiver quiz
  };

  function blankScores() {
    const s = { 1: {}, 2: {} };
    Q.axisOrder.forEach((k) => { s[1][k] = 0; s[2][k] = 0; });
    return s;
  }

  function scoreToArray(s) {
    // [yPos, yNeg, xPos, xNeg]
    return Q.axisOrder.map((k) => s[k] || 0);
  }
  function arrayToScore(arr) {
    const s = {};
    Q.axisOrder.forEach((k, i) => { s[k] = (arr && arr[i]) || 0; });
    return s;
  }

  // ─── Net scores → quadrant booleans / archetype ──────────────
  function netY(scoreObj) {
    return (scoreObj[Q.axes.y.pos] || 0) - (scoreObj[Q.axes.y.neg] || 0);
  }
  function netX(scoreObj) {
    return (scoreObj[Q.axes.x.pos] || 0) - (scoreObj[Q.axes.x.neg] || 0);
  }

  function archetypeKey(yPos, xPos) {
    return (yPos ? Q.axes.y.pos : Q.axes.y.neg) + '+' + (xPos ? Q.axes.x.pos : Q.axes.x.neg);
  }
  function archetypeFor(yPos, xPos) {
    return Q.archetypes[archetypeKey(yPos, xPos)] || {
      emoji: '✨',
      name: 'Unclassifiable',
      blurb: 'Unique. Charts off the map.',
      klass: 'unknown',
    };
  }
  function tagFor(yPos, xPos) {
    return (yPos ? Q.axes.y.posLabel : Q.axes.y.negLabel) +
           ' · ' +
           (xPos ? Q.axes.x.posLabel : Q.axes.x.negLabel);
  }

  /**
   * Assigns each person to a quadrant based on RELATIVE net scores.
   * Whoever is more "yPos" gets yPos=true, the other gets yPos=false.
   * Same for x-axis. Ties broken by raw count, then by P1 by default.
   * Returns { p1: {yPos, xPos}, p2: {yPos, xPos} }.
   */
  function assignQuadrants(s1, s2) {
    const yN1 = netY(s1), yN2 = netY(s2);
    let p1Y;
    if (yN1 > yN2) p1Y = true;
    else if (yN1 < yN2) p1Y = false;
    else p1Y = (s1[Q.axes.y.pos] || 0) >= (s2[Q.axes.y.pos] || 0);

    const xN1 = netX(s1), xN2 = netX(s2);
    let p1X;
    if (xN1 > xN2) p1X = true;
    else if (xN1 < xN2) p1X = false;
    else p1X = (s1[Q.axes.x.pos] || 0) >= (s2[Q.axes.x.pos] || 0);

    return {
      p1: { yPos: p1Y, xPos: p1X },
      p2: { yPos: !p1Y, xPos: !p1X },
    };
  }

  // ─── Plotting ────────────────────────────────────────────────
  // Returns {x:%, y:%} from a single-person score object.
  // Each axis has up to 6 questions → net ranges -6..+6 → -1..+1.
  function plotPercent(scoreObj) {
    const margin = 12;
    const yNet = Math.max(-1, Math.min(1, netY(scoreObj) / 6));
    const xNet = Math.max(-1, Math.min(1, netX(scoreObj) / 6));
    return {
      x: 50 + xNet * (50 - margin),
      y: 50 - yNet * (50 - margin),
    };
  }

  // ─── Mode picker UI ──────────────────────────────────────────
  function bindModeButtons() {
    $$('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.mode-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        const mode = btn.dataset.mode;
        State.mode = mode;
        updateNameFieldsForMode();
      });
    });
  }

  function updateNameFieldsForMode() {
    const labelP1 = $('label-name1');
    const labelP2 = $('label-name2');
    const inputP1 = $('name1');
    const inputP2 = $('name2');
    if (!labelP1 || !labelP2 || !inputP1 || !inputP2) return;
    if (State.mode === 'solo-sender') {
      labelP1.textContent = 'Your name';
      labelP2.textContent = 'Their name';
      inputP1.placeholder = 'You';
      inputP2.placeholder = 'Your partner';
    } else {
      labelP1.textContent = 'Person 1';
      labelP2.textContent = 'Person 2';
      inputP1.placeholder = 'Their name';
      inputP2.placeholder = 'Your name';
    }
  }

  // ─── Hash routing ────────────────────────────────────────────
  function readHashPayload() {
    const h = window.location.hash || '';
    if (h.startsWith('#invite=')) {
      const data = b64urlDecode(h.slice('#invite='.length));
      if (data && data.m === 'invite' && data.q === Q.id) return { type: 'invite', data };
    }
    if (h.startsWith('#results=')) {
      const data = b64urlDecode(h.slice('#results='.length));
      if (data && (data.m === 'results' || data.m === 'together') && data.q === Q.id) {
        return { type: 'results', data };
      }
    }
    return null;
  }

  // ─── Question rendering ──────────────────────────────────────
  function renderQuestion() {
    const q = Q.questions[State.qIndex];
    $('qText').textContent = q.text;

    // Option labels depend on mode.
    if (State.mode === 'solo-sender' || State.mode === 'solo-receiver') {
      // The answerer is always picking "which of us is more X".
      // From the answerer's perspective, P1 is themself, P2 is their partner.
      // But the labels we want to show are the names so they pick a person.
      $('opt1').textContent = State.name1;
      $('opt2').textContent = State.name2;
    } else {
      $('opt1').textContent = State.name1;
      $('opt2').textContent = State.name2;
    }

    $('qCount').textContent =
      String(State.qIndex + 1).padStart(2, '0') + ' / ' +
      String(Q.questions.length).padStart(2, '0');
    $('progBar').style.width = (State.qIndex / Q.questions.length * 100) + '%';

    // POV note (solo only)
    const pov = $('qPov');
    if (pov) {
      if (State.mode === 'solo-sender' || State.mode === 'solo-receiver') {
        pov.textContent = 'From your honest point of view.';
        pov.style.display = '';
      } else {
        pov.style.display = 'none';
      }
    }
  }

  function answer(person) {
    if (person === 1 || person === 2) {
      const q = Q.questions[State.qIndex];
      State.scores[person][q.axis] = (State.scores[person][q.axis] || 0) + 1;
    }
    State.qIndex++;
    if (State.qIndex >= Q.questions.length) {
      $('progBar').style.width = '100%';
      setTimeout(finishQuiz, 280);
    } else {
      renderQuestion();
    }
  }

  // ─── Start / restart ─────────────────────────────────────────
  function startQuiz() {
    const n1 = $('name1').value.trim();
    const n2 = $('name2').value.trim();

    if (State.mode === 'solo-sender') {
      State.name1 = n1 || 'You';     // sender = P1 by convention
      State.name2 = n2 || 'Partner';
    } else {
      State.name1 = n1 || 'Person 1';
      State.name2 = n2 || 'Person 2';
    }

    State.qIndex = 0;
    State.scores = blankScores();
    renderQuestion();
    show('screen-question');
  }

  function startReceiverQuiz() {
    State.qIndex = 0;
    State.scores = blankScores();
    renderQuestion();
    show('screen-question');
  }

  function restart() {
    // If the intro was overwritten (receiver flow) or we arrived via #results=,
    // the cleanest reset is a reload to the natural intro.
    const introHasMode = !!document.querySelector('.mode-btn');
    if (!introHasMode || State.mode === 'results-only' || State.mode === 'solo-receiver') {
      window.location.href = window.location.pathname + window.location.search;
      return;
    }
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    State.mode = 'together';
    $$('.mode-btn').forEach((b) => b.classList.remove('selected'));
    const tBtn = document.querySelector('.mode-btn[data-mode="together"]');
    if (tBtn) tBtn.classList.add('selected');
    updateNameFieldsForMode();
    if (State.name1 && State.name1 !== 'Person 1' && State.name1 !== 'You') $('name1').value = State.name1;
    if (State.name2 && State.name2 !== 'Person 2' && State.name2 !== 'Partner') $('name2').value = State.name2;
    show('screen-intro');
  }

  // ─── Finish: dispatches based on mode ────────────────────────
  function finishQuiz() {
    if (State.mode === 'solo-sender') {
      renderSenderShareScreen();
    } else if (State.mode === 'solo-receiver') {
      renderComparisonResults();
    } else {
      renderTogetherResults();
    }
  }

  // ─── Sender's "your view" + share invite screen ──────────────
  function renderSenderShareScreen() {
    // Build payload. Sender is P1 (a1=self), partner is P2 (a2=partner).
    const payload = {
      v: VERSION,
      m: 'invite',
      q: Q.id,
      n1: State.name1,
      n2: State.name2,
      a1: scoreToArray(State.scores[1]),
      a2: scoreToArray(State.scores[2]),
    };
    const url = location.origin + location.pathname + '#invite=' + b64urlEncode(payload);

    // Quick "your view" of who you are vs who they are.
    const assigned = assignQuadrants(State.scores[1], State.scores[2]);
    const a1 = archetypeFor(assigned.p1.yPos, assigned.p1.xPos);
    const a2 = archetypeFor(assigned.p2.yPos, assigned.p2.xPos);

    const senderHtml = `
      <div class="eyebrow">Your view recorded</div>
      <h2 class="results-title">Now send it to <em>${escapeHtml(State.name2)}</em>.</h2>

      <div class="your-view-card">
        <h3>Your honest take</h3>
        <p>Here's how you see things from your side. Don't show ${escapeHtml(State.name2)} this part — let them answer freely first.</p>
        <div class="mini-pair">
          <div class="row">
            <span class="swatch p1"></span>
            You see <strong>${escapeHtml(State.name1)}</strong> as <strong>${escapeHtml(a1.name)}</strong>
          </div>
          <div class="row">
            <span class="swatch p2"></span>
            You see <strong>${escapeHtml(State.name2)}</strong> as <strong>${escapeHtml(a2.name)}</strong>
          </div>
        </div>
      </div>

      ${shareBlockHtml('Send this link to ' + State.name2)}
      <button class="btn secondary" id="restartBtn2">Take it again</button>
      <p class="footer-note">${Q.copy && Q.copy.footerNote ? Q.copy.footerNote : 'Diagnosis is non-binding. Probably.'}</p>
    `;

    const container = $('resultsContainer');
    container.innerHTML = senderHtml;
    show('screen-results');

    mountShareBlock(url);
    $('restartBtn2').addEventListener('click', restart);
  }

  // ─── Together-mode results (2 dots, 2 verdict cards) ─────────
  function renderTogetherResults(opts) {
    opts = opts || {};
    const s1 = opts.s1 || State.scores[1];
    const s2 = opts.s2 || State.scores[2];
    const n1 = opts.n1 || State.name1;
    const n2 = opts.n2 || State.name2;

    const assigned = assignQuadrants(s1, s2);
    const a1 = archetypeFor(assigned.p1.yPos, assigned.p1.xPos);
    const a2 = archetypeFor(assigned.p2.yPos, assigned.p2.xPos);

    const p1Pos = plotPercent(s1);
    const p2Pos = plotPercent(s2);

    const html = `
      <div class="eyebrow">The verdict is in</div>
      <h2 class="results-title">${Q.copy && Q.copy.resultsHead ? Q.copy.resultsHead : "Here's the <em>truth</em>."}</h2>

      ${chartHtml([
        { id: 'd1', cls: 'p1', label: n1, x: p1Pos.x, y: p1Pos.y },
        { id: 'd2', cls: 'p2', label: n2, x: p2Pos.x, y: p2Pos.y },
      ], [])}

      <div class="verdict ${a1.klass}">
        <div class="v-emoji">${a1.emoji}</div>
        <div class="v-name">${escapeHtml(n1)}</div>
        <div class="v-tags">${tagFor(assigned.p1.yPos, assigned.p1.xPos)}</div>
        <div class="v-archetype">${escapeHtml(a1.name)}</div>
        <p class="v-blurb">${a1.blurb}</p>
        ${scoresLine(s1)}
      </div>
      <div class="verdict ${a2.klass}">
        <div class="v-emoji">${a2.emoji}</div>
        <div class="v-name">${escapeHtml(n2)}</div>
        <div class="v-tags">${tagFor(assigned.p2.yPos, assigned.p2.xPos)}</div>
        <div class="v-archetype">${escapeHtml(a2.name)}</div>
        <p class="v-blurb">${a2.blurb}</p>
        ${scoresLine(s2)}
      </div>

      ${shareBlockHtml('Share these results')}
      <button class="btn secondary" id="restartBtn2">Take it again</button>
      <p class="footer-note">${Q.copy && Q.copy.footerNote ? Q.copy.footerNote : 'Diagnosis is non-binding. Probably.'}</p>
    `;

    const container = $('resultsContainer');
    container.innerHTML = html;
    show('screen-results');

    // Animate dots into place after layout.
    requestAnimationFrame(() => positionDot('d1', p1Pos));
    requestAnimationFrame(() => positionDot('d2', p2Pos));

    // Build & wire share link.
    const payload = {
      v: VERSION, m: 'together', q: Q.id,
      n1: n1, n2: n2,
      a1: scoreToArray(s1), a2: scoreToArray(s2),
    };
    const url = location.origin + location.pathname + '#results=' + b64urlEncode(payload);
    mountShareBlock(url);
    $('restartBtn2').addEventListener('click', restart);
  }

  // ─── Comparison results (4 dots) ────────────────────────────
  function renderComparisonResults(opts) {
    opts = opts || {};

    let n1, n2, sAA, sBA, sAB, sBB;
    // sXY = score for person X as seen BY person Y (where A=sender, B=receiver).
    if (opts.fromPayload) {
      const d = opts.fromPayload;
      n1 = d.n1; n2 = d.n2;
      sAA = arrayToScore(d.a1byA); sBA = arrayToScore(d.a2byA);
      sAB = arrayToScore(d.a1byB); sBB = arrayToScore(d.a2byB);
    } else {
      // We're the receiver finishing the quiz.
      // inviteData: a1 = sender's view of self, a2 = sender's view of partner (us).
      // State.scores: 1 = receiver's view of P1 (sender), 2 = receiver's view of P2 (self).
      const inv = State.inviteData;
      n1 = inv.n1; n2 = inv.n2;
      sAA = arrayToScore(inv.a1);            // sender (n1) by sender
      sBA = arrayToScore(inv.a2);            // partner (n2) by sender
      sAB = State.scores[1];                 // sender (n1) by receiver
      sBB = State.scores[2];                 // partner (n2) by receiver
    }

    // Plot all four dots.
    const pAA = plotPercent(sAA);
    const pBA = plotPercent(sBA);
    const pAB = plotPercent(sAB);
    const pBB = plotPercent(sBB);

    // Archetypes:
    //   - A's view: who's where, A vs B as seen by A
    //   - B's view: who's where, A vs B as seen by B
    const viewA = assignQuadrants(sAA, sBA);
    const viewB = assignQuadrants(sAB, sBB);
    const archA_byA = archetypeFor(viewA.p1.yPos, viewA.p1.xPos);
    const archB_byA = archetypeFor(viewA.p2.yPos, viewA.p2.xPos);
    const archA_byB = archetypeFor(viewB.p1.yPos, viewB.p1.xPos);
    const archB_byB = archetypeFor(viewB.p2.yPos, viewB.p2.xPos);

    const dots = [
      { id: 'd-aa', cls: 'p1',         label: n1,           x: pAA.x, y: pAA.y },
      { id: 'd-ba', cls: 'p2',         label: n2,           x: pBA.x, y: pBA.y },
      { id: 'd-ab', cls: 'p1 hollow',  label: n1,           x: pAB.x, y: pAB.y, hollow: true },
      { id: 'd-bb', cls: 'p2 hollow',  label: n2,           x: pBB.x, y: pBB.y, hollow: true },
    ];
    const connectors = [
      { from: pAA, to: pAB },
      { from: pBA, to: pBB },
    ];

    const agreement = buildAgreementBullets(
      n1, n2, viewA, viewB, archA_byA, archB_byA, archA_byB, archB_byB
    );

    const html = `
      <div class="eyebrow">Both views in</div>
      <h2 class="results-title">${escapeHtml(n1)} vs <em>${escapeHtml(n2)}</em>.</h2>

      ${chartHtml(dots, connectors)}

      <div class="legend">
        <div class="legend-row"><span class="legend-swatch p1"></span>${escapeHtml(n1)} — ${escapeHtml(n1)}'s view</div>
        <div class="legend-row"><span class="legend-swatch p2"></span>${escapeHtml(n2)} — ${escapeHtml(n1)}'s view</div>
        <div class="legend-row"><span class="legend-swatch p1 hollow"></span>${escapeHtml(n1)} — ${escapeHtml(n2)}'s view</div>
        <div class="legend-row"><span class="legend-swatch p2 hollow"></span>${escapeHtml(n2)} — ${escapeHtml(n2)}'s view</div>
      </div>

      <div class="agreement">
        <h3>What you both see — and don't</h3>
        <ul>${agreement.map((b) => '<li>' + b + '</li>').join('')}</ul>
      </div>

      ${shareBlockHtml('Share these results')}
      <button class="btn secondary" id="restartBtn2">Take it again</button>
      <p class="footer-note">${Q.copy && Q.copy.footerNote ? Q.copy.footerNote : 'Diagnosis is non-binding. Probably.'}</p>
    `;

    const container = $('resultsContainer');
    container.innerHTML = html;
    show('screen-results');

    requestAnimationFrame(() => {
      dots.forEach((d) => positionDot(d.id, { x: d.x, y: d.y }));
      // Defer connector draw until the chart has real dimensions.
      const tryDraw = () => {
        const chart = $('chart');
        if (chart && chart.getBoundingClientRect().width > 0) {
          drawConnectors(connectors);
        } else {
          setTimeout(tryDraw, 60);
        }
      };
      tryDraw();
    });

    // Watch resize, redraw connectors.
    window.addEventListener('resize', () => drawConnectors(connectors));

    // Build the shareable "results" payload (4 dots → permanent link).
    const payload = {
      v: VERSION, m: 'results', q: Q.id,
      n1, n2,
      a1byA: scoreToArray(sAA), a2byA: scoreToArray(sBA),
      a1byB: scoreToArray(sAB), a2byB: scoreToArray(sBB),
    };
    const url = location.origin + location.pathname + '#results=' + b64urlEncode(payload);
    mountShareBlock(url);
    $('restartBtn2').addEventListener('click', restart);
  }

  // ─── Helpers: chart HTML, dot positioning, connectors ────────
  function chartHtml(dots, connectors) {
    const yTop = Q.axes.y.posLabel;
    const yBot = Q.axes.y.negLabel;
    const xLeft = Q.axes.x.negLabel;
    const xRight = Q.axes.x.posLabel;
    const ql = Q.quadLabels || { tl: '', tr: '', bl: '', br: '' };

    const dotsHtml = dots.map((d) => `
      <div class="dot ${d.cls}" id="${d.id}"></div>
      <div class="dot-label ${d.cls}" id="${d.id}-label">${escapeHtml(d.label)}</div>
    `).join('');

    return `
      <div class="chart-wrap">
        <div class="chart-axis-top">${escapeHtml(yTop)}</div>
        <div class="chart-row">
          <div class="chart-axis-side left">${escapeHtml(xLeft)}</div>
          <div class="chart-grid" id="chart">
            <div class="quadrant tl"><span class="qname">${escapeHtml(ql.tl || '')}</span></div>
            <div class="quadrant tr"><span class="qname">${escapeHtml(ql.tr || '')}</span></div>
            <div class="quadrant bl"><span class="qname">${escapeHtml(ql.bl || '')}</span></div>
            <div class="quadrant br"><span class="qname">${escapeHtml(ql.br || '')}</span></div>
            <div class="grid-line h"></div>
            <div class="grid-line v"></div>
            ${dotsHtml}
          </div>
          <div class="chart-axis-side right">${escapeHtml(xRight)}</div>
        </div>
        <div class="chart-axis-bottom">${escapeHtml(yBot)}</div>
      </div>
    `;
  }

  function positionDot(id, pos) {
    const dot = $(id);
    const lbl = $(id + '-label');
    if (dot) {
      dot.style.left = pos.x + '%';
      dot.style.top = pos.y + '%';
    }
    if (lbl) {
      lbl.style.left = pos.x + '%';
      lbl.style.top = pos.y + '%';
    }
  }

  function drawConnectors(pairs) {
    const chart = $('chart');
    if (!chart) return;
    // Remove old connectors.
    chart.querySelectorAll('.connector').forEach((el) => el.remove());

    const rect = chart.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    pairs.forEach((p) => {
      const x1 = p.from.x / 100 * w;
      const y1 = p.from.y / 100 * h;
      const x2 = p.to.x / 100 * w;
      const y2 = p.to.y / 100 * h;
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const conn = document.createElement('div');
      conn.className = 'connector';
      conn.style.left = x1 + 'px';
      conn.style.top = y1 + 'px';
      conn.style.width = len + 'px';
      conn.style.transform = 'rotate(' + angle + 'deg)';
      chart.appendChild(conn);
    });
  }

  // ─── Agreement bullets ───────────────────────────────────────
  function buildAgreementBullets(n1, n2, viewA, viewB, aA_byA, aB_byA, aA_byB, aB_byB) {
    const bullets = [];

    // 1. Y-axis agreement on each person.
    // viewA.p1.yPos: A thinks P1 is more yPos. viewB.p1.yPos: B thinks so.
    const yPosLabel = Q.axes.y.posLabel;
    const yNegLabel = Q.axes.y.negLabel;
    const xPosLabel = Q.axes.x.posLabel;
    const xNegLabel = Q.axes.x.negLabel;

    const agreesP1Y = viewA.p1.yPos === viewB.p1.yPos;
    const agreesP2Y = viewA.p2.yPos === viewB.p2.yPos;
    const agreesP1X = viewA.p1.xPos === viewB.p1.xPos;
    const agreesP2X = viewA.p2.xPos === viewB.p2.xPos;

    if (agreesP1Y && agreesP2Y) {
      bullets.push(
        `You both see <strong>${escapeHtml(n1)}</strong> as the more <strong>${escapeHtml(viewA.p1.yPos ? yPosLabel : yNegLabel)}</strong> one. ` +
        `No disagreement there.`
      );
    } else {
      bullets.push(
        `Disagreement on the <strong>${escapeHtml(yPosLabel)}/${escapeHtml(yNegLabel)}</strong> axis: ` +
        `${escapeHtml(n1)} thinks ${escapeHtml(viewA.p1.yPos ? n1 : n2)} is the ${escapeHtml(yPosLabel)} one, ` +
        `${escapeHtml(n2)} thinks it's ${escapeHtml(viewB.p1.yPos ? n1 : n2)}. Interesting.`
      );
    }

    if (agreesP1X && agreesP2X) {
      bullets.push(
        `You both put <strong>${escapeHtml(n1)}</strong> on the <strong>${escapeHtml(viewA.p1.xPos ? xPosLabel : xNegLabel)}</strong> side. Aligned.`
      );
    } else {
      bullets.push(
        `Disagreement on the <strong>${escapeHtml(xPosLabel)}/${escapeHtml(xNegLabel)}</strong> axis — you each see this one differently.`
      );
    }

    // 2. Archetype mismatches per person.
    if (aA_byA.name !== aA_byB.name) {
      bullets.push(
        `<strong>${escapeHtml(n1)}</strong> sees themself as <strong>${escapeHtml(aA_byA.name)}</strong>, ` +
        `but <strong>${escapeHtml(n2)}</strong> sees them as <strong>${escapeHtml(aA_byB.name)}</strong>. ` +
        `Worth a chat.`
      );
    } else {
      bullets.push(
        `You both agree <strong>${escapeHtml(n1)}</strong> is <strong>${escapeHtml(aA_byA.name)}</strong>. Settled.`
      );
    }

    if (aB_byA.name !== aB_byB.name) {
      bullets.push(
        `<strong>${escapeHtml(n2)}</strong> sees themself as <strong>${escapeHtml(aB_byB.name)}</strong>, ` +
        `but <strong>${escapeHtml(n1)}</strong> sees them as <strong>${escapeHtml(aB_byA.name)}</strong>. ` +
        `Hmm.`
      );
    } else {
      bullets.push(
        `You both agree <strong>${escapeHtml(n2)}</strong> is <strong>${escapeHtml(aB_byA.name)}</strong>. Locked in.`
      );
    }

    return bullets;
  }

  // ─── Score line under verdict ────────────────────────────────
  function scoresLine(s) {
    const yPos = Q.axes.y.posLabel[0];
    const yNeg = Q.axes.y.negLabel[0];
    const xPos = Q.axes.x.posLabel[0];
    const xNeg = Q.axes.x.negLabel[0];
    return `<div class="v-scores">
      <span>${yPos} ${s[Q.axes.y.pos] || 0} · ${yNeg} ${s[Q.axes.y.neg] || 0}</span>
      <span>${xPos} ${s[Q.axes.x.pos] || 0} · ${xNeg} ${s[Q.axes.x.neg] || 0}</span>
    </div>`;
  }

  // ─── Sharing ─────────────────────────────────────────────────
  function shareBlockHtml(label) {
    return `
      <div class="share-block">
        <div class="share-label">${escapeHtml(label)}</div>
        <div class="share-row">
          <input type="text" class="share-url" id="shareUrl" readonly>
          <button class="share-copy" id="shareCopy" type="button">Copy</button>
        </div>
      </div>
    `;
  }

  function mountShareBlock(url) {
    const input = $('shareUrl');
    const btn = $('shareCopy');
    if (!input || !btn) return;
    input.value = url;
    const selectAll = () => { try { input.select(); input.setSelectionRange(0, url.length); } catch (e) {} };
    input.addEventListener('focus', selectAll);
    input.addEventListener('click', selectAll);
    btn.addEventListener('click', () => {
      copyToClipboard(url, () => {
        btn.classList.add('copied');
        const original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = original;
        }, 1800);
      });
    });
  }

  function copyToClipboard(url, onDone) {
    const done = onDone || (() => {});
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, () => fallbackCopy(url, done));
    } else {
      fallbackCopy(url, done);
    }
  }

  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    if (cb) cb();
  }

  function stripTags(s) {
    return String(s || '').replace(/<[^>]*>/g, '');
  }

  // ─── Receiver intro screen (#invite=…) ───────────────────────
  function showReceiverIntro(invite) {
    State.mode = 'solo-receiver';
    State.inviteData = invite;
    State.name1 = invite.n1;     // sender
    State.name2 = invite.n2;     // receiver (you)

    const el = $('screen-intro');
    el.innerHTML = `
      <div class="eyebrow">An honest comparison</div>
      <h1 class="title"><em>${escapeHtml(invite.n1)}</em> wants your side.</h1>
      <p class="lede">${escapeHtml(invite.n1)} took the ${stripTags(Q.title)} quiz from their point of view, and now wants yours. Answer the same twenty-four questions honestly — at the end you'll see four dots: how each of you sees both of you.</p>
      <button class="btn" id="receiverStartBtn">Begin →</button>
    `;
    show('screen-intro');
    $('receiverStartBtn').addEventListener('click', startReceiverQuiz);
  }

  // ─── Boot ────────────────────────────────────────────────────
  function boot() {
    // Inject quiz title / lede / eyebrow / footer copy if placeholders exist.
    if ($('introEyebrow') && Q.copy && Q.copy.eyebrow) {
      $('introEyebrow').textContent = Q.copy.eyebrow;
    }
    if ($('introTitle') && Q.title) {
      $('introTitle').innerHTML = Q.title;
    }
    if ($('introLede') && Q.intro) {
      $('introLede').textContent = Q.intro;
    }

    // Listen for hash route.
    const route = readHashPayload();
    if (route && route.type === 'invite') {
      showReceiverIntro(route.data);
      return;
    }
    if (route && route.type === 'results') {
      const d = route.data;
      if (d.m === 'together') {
        State.mode = 'results-only';
        State.name1 = d.n1; State.name2 = d.n2;
        renderTogetherResults({
          n1: d.n1, n2: d.n2,
          s1: arrayToScore(d.a1),
          s2: arrayToScore(d.a2),
        });
      } else if (d.m === 'results') {
        State.mode = 'results-only';
        renderComparisonResults({ fromPayload: d });
      }
      return;
    }

    // Normal intro flow.
    bindModeButtons();
    updateNameFieldsForMode();

    // Wire begin button (lives in HTML).
    const beginBtn = $('beginBtn');
    if (beginBtn) beginBtn.addEventListener('click', startQuiz);

    // Wire option buttons + tie.
    $('opt1').addEventListener('click', () => answer(1));
    $('opt2').addEventListener('click', () => answer(2));
    const tie = $('tieBtn');
    if (tie) tie.addEventListener('click', () => answer(0));

    show('screen-intro');
  }

  // Expose limited API for any inline handlers (and for debugging).
  window.QuizEngine = {
    answer: answer,
    startQuiz: startQuiz,
    restart: restart,
  };

  // DOM ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
