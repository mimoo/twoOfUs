/* ============================================================
   engine.js — runtime for the "Two of Us" quiz trilogy.

   Each quiz HTML defines a global QUIZ config (see relationship-
   quiz.html for the canonical shape) and includes this script.

   Flow (always solo):
     1. Take the quiz from your point of view.
     2. Get a personal "#me=…" link to send to your partner.
     3. Either: paste their link into the compare box → 4-dot view.
        Or:    they open your link, take it from their side, and
               the page auto-merges into the 4-dot view.

   URL hash payloads (base64url-encoded JSON):
     #me=…  { v, m:"me", q, n1, n2, a1, a2 }
              n1 = answerer, n2 = partner.
              a1 = answerer's view of self, a2 = answerer's view of partner.
     #us=…  { v, m:"us", q, n1, n2, a1byA, a2byA, a1byB, a2byB }
              A = first to take it (n1), B = second.
              aXbyY = view of person X according to person Y.

   Back-compat: legacy #invite=/#results= links from earlier builds
   still load (they share the field shape).
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

  // ─── Quiz config ─────────────────────────────────────────────
  if (typeof window.QUIZ === 'undefined') {
    console.error('engine.js: window.QUIZ is not defined.');
    return;
  }
  const Q = window.QUIZ;
  Q.axisOrder = [Q.axes.y.pos, Q.axes.y.neg, Q.axes.x.pos, Q.axes.x.neg];
  Q.archetypes = Q.archetypes || {};

  // ─── State ───────────────────────────────────────────────────
  // Always solo: name1 = you (the answerer), name2 = your partner.
  // scores[1] = your view of yourself, scores[2] = your view of partner.
  const State = {
    name1: '',
    name2: '',
    qIndex: 0,
    scores: blankScores(),
    partnerPayload: null,   // #me= data loaded from a partner's link
    viewingTheirs: false,   // we opened a partner's link and are previewing it
  };

  function blankScores() {
    const s = { 1: {}, 2: {} };
    Q.axisOrder.forEach((k) => { s[1][k] = 0; s[2][k] = 0; });
    return s;
  }

  function scoreToArray(s) {
    return Q.axisOrder.map((k) => s[k] || 0);
  }
  function arrayToScore(arr) {
    const s = {};
    Q.axisOrder.forEach((k, i) => { s[k] = (arr && arr[i]) || 0; });
    return s;
  }

  // ─── Net scores → quadrant booleans / archetype ──────────────
  function netY(s) { return (s[Q.axes.y.pos] || 0) - (s[Q.axes.y.neg] || 0); }
  function netX(s) { return (s[Q.axes.x.pos] || 0) - (s[Q.axes.x.neg] || 0); }

  function archetypeKey(yPos, xPos) {
    return (yPos ? Q.axes.y.pos : Q.axes.y.neg) + '+' + (xPos ? Q.axes.x.pos : Q.axes.x.neg);
  }
  function archetypeFor(yPos, xPos) {
    return Q.archetypes[archetypeKey(yPos, xPos)] || {
      emoji: '✨', name: 'Unclassifiable',
      blurb: 'Unique. Charts off the map.', klass: 'unknown',
    };
  }
  function tagFor(yPos, xPos) {
    return (yPos ? Q.axes.y.posLabel : Q.axes.y.negLabel) + ' · ' +
           (xPos ? Q.axes.x.posLabel : Q.axes.x.negLabel);
  }

  /**
   * Whoever has the higher net Y gets yPos=true; same for X.
   * Ties broken by raw count, then by P1.
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

    return { p1: { yPos: p1Y, xPos: p1X }, p2: { yPos: !p1Y, xPos: !p1X } };
  }

  // ─── Plotting ────────────────────────────────────────────────
  function plotPercent(s) {
    const margin = 12;
    const yNet = Math.max(-1, Math.min(1, netY(s) / 6));
    const xNet = Math.max(-1, Math.min(1, netX(s) / 6));
    return { x: 50 + xNet * (50 - margin), y: 50 - yNet * (50 - margin) };
  }

  // ─── Hash routing ────────────────────────────────────────────
  function readHashPayload() {
    return parseHashFragment((window.location.hash || '').slice(1));
  }

  function parseHashFragment(frag) {
    if (!frag) return null;
    const eq = frag.indexOf('=');
    if (eq < 0) return null;
    const kind = frag.slice(0, eq).toLowerCase();
    const value = frag.slice(eq + 1);
    const data = b64urlDecode(value);
    if (!data) return null;
    if (data.q && data.q !== Q.id) return null;

    if (kind === 'me' && data.m === 'me') return { kind: 'me', data };
    if (kind === 'us' && data.m === 'us') return { kind: 'us', data };

    // Back-compat with the old scheme.
    if (kind === 'invite' && data.m === 'invite') {
      return { kind: 'me', data: Object.assign({}, data, { m: 'me' }) };
    }
    if (kind === 'results') {
      if (data.m === 'together') {
        return { kind: 'me', data: Object.assign({}, data, { m: 'me' }) };
      }
      if (data.m === 'results') {
        return { kind: 'us', data: Object.assign({}, data, { m: 'us' }) };
      }
    }
    return null;
  }

  // Given an arbitrary string the user might paste (URL, hash, fragment), return the route.
  function parseAnyInput(raw) {
    if (!raw) return null;
    let frag = String(raw).trim();
    const idx = frag.indexOf('#');
    if (idx >= 0) frag = frag.slice(idx + 1);
    return parseHashFragment(frag);
  }

  // ─── Question rendering ──────────────────────────────────────
  function renderQuestion() {
    const q = Q.questions[State.qIndex];
    $('qText').textContent = q.text;
    $('opt1').textContent = State.name1;
    $('opt2').textContent = State.name2;
    $('qCount').textContent =
      String(State.qIndex + 1).padStart(2, '0') + ' / ' +
      String(Q.questions.length).padStart(2, '0');
    $('progBar').style.width = (State.qIndex / Q.questions.length * 100) + '%';

    const pov = $('qPov');
    if (pov) {
      pov.textContent = 'From your honest point of view.';
      pov.style.display = '';
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
    const n1 = ($('name1') ? $('name1').value : '').trim();
    const n2 = ($('name2') ? $('name2').value : '').trim();
    State.name1 = n1 || 'You';
    State.name2 = n2 || 'Partner';
    State.qIndex = 0;
    State.scores = blankScores();
    renderQuestion();
    show('screen-question');
  }

  // Called when the user is on a partner's #me= preview and clicks "Take it from your side".
  function startQuizFromTheirLink() {
    const p = State.partnerPayload;
    if (!p) { startQuiz(); return; }
    // In their payload, n1 = them, n2 = us.
    State.name1 = p.n2 || 'You';
    State.name2 = p.n1 || 'Partner';
    State.qIndex = 0;
    State.scores = blankScores();
    renderQuestion();
    show('screen-question');
  }

  function restart() {
    window.location.href = window.location.pathname + window.location.search;
  }

  // ─── Finish ──────────────────────────────────────────────────
  function finishQuiz() {
    if (State.partnerPayload) {
      // We took the quiz after opening a partner's link → auto-combine.
      const us = combineMeAndMe(State.partnerPayload, mySoloPayload());
      const url = '#us=' + b64urlEncode(us);
      history.replaceState(null, '', window.location.pathname + window.location.search + url);
      renderComparisonResults({ fromPayload: us });
    } else {
      renderPersonalResults({ fromState: true });
    }
  }

  function mySoloPayload() {
    return {
      v: VERSION, m: 'me', q: Q.id,
      n1: State.name1, n2: State.name2,
      a1: scoreToArray(State.scores[1]),
      a2: scoreToArray(State.scores[2]),
    };
  }

  /**
   * Merge two #me= payloads into one #us= payload.
   * meA: the first answerer's data ({n1, n2, a1, a2}).
   * meB: the second answerer's data — note their n1/n2 are mirrored from meA.
   */
  function combineMeAndMe(meA, meB) {
    return {
      v: VERSION, m: 'us', q: Q.id,
      n1: meA.n1, n2: meA.n2,
      a1byA: meA.a1, a2byA: meA.a2,
      a1byB: meB.a2,    // B's view of A = meB's "view of partner"
      a2byB: meB.a1,    // B's view of B = meB's "view of self"
    };
  }

  // ─── Personal results (2 dots, your view) ────────────────────
  function renderPersonalResults(opts) {
    let n1, n2, s1, s2, mine;
    if (opts.fromState) {
      n1 = State.name1; n2 = State.name2;
      s1 = State.scores[1]; s2 = State.scores[2];
      mine = true;
    } else {
      const d = opts.fromPayload;
      n1 = d.n1; n2 = d.n2;
      s1 = arrayToScore(d.a1);
      s2 = arrayToScore(d.a2);
      mine = false;
      State.viewingTheirs = true;
    }

    const assigned = assignQuadrants(s1, s2);
    const a1 = archetypeFor(assigned.p1.yPos, assigned.p1.xPos);
    const a2 = archetypeFor(assigned.p2.yPos, assigned.p2.xPos);
    const p1Pos = plotPercent(s1);
    const p2Pos = plotPercent(s2);

    const eyebrow = mine ? 'Your view recorded' : `${escapeHtml(n1)} took the quiz`;
    const titleHtml = mine
      ? "Here's your <em>read</em>."
      : `<em>${escapeHtml(n1)}</em>'s side of it.`;

    // "me" payload for the link to share / combine.
    const mePayload = mine ? mySoloPayload() : {
      v: VERSION, m: 'me', q: Q.id, n1, n2,
      a1: scoreToArray(s1), a2: scoreToArray(s2),
    };
    const meUrl = location.origin + location.pathname + '#me=' + b64urlEncode(mePayload);

    let actionsHtml;
    if (mine) {
      actionsHtml = `
        ${shareBlockHtml('Send your link to ' + n2)}
        ${compareBlockHtml('Got their link? Paste it to compare.')}
        <button class="btn secondary" id="restartBtn2">Take it again</button>
      `;
    } else {
      actionsHtml = `
        <div class="cta-take-it">
          <button class="btn" id="takeItBtn">Take it from your side →</button>
          <p class="cta-hint">Answer the same twenty-four questions honestly. We'll merge into a 4-dot comparison automatically.</p>
        </div>
        ${compareBlockHtml('Already took it? Paste your link instead.')}
      `;
    }

    const html = `
      <div class="eyebrow">${eyebrow}</div>
      <h2 class="results-title">${titleHtml}</h2>

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

      ${actionsHtml}

      <p class="footer-note">${(Q.copy && Q.copy.footerNote) ? Q.copy.footerNote : 'Diagnosis is non-binding. Probably.'}</p>
    `;

    $('resultsContainer').innerHTML = html;
    show('screen-results');

    requestAnimationFrame(() => positionDot('d1', p1Pos));
    requestAnimationFrame(() => positionDot('d2', p2Pos));

    if (mine) {
      mountShareBlock(meUrl);
    } else {
      const takeBtn = $('takeItBtn');
      if (takeBtn) takeBtn.addEventListener('click', startQuizFromTheirLink);
    }
    mountCompareBlock(mePayload);

    const restartBtn = $('restartBtn2');
    if (restartBtn) restartBtn.addEventListener('click', restart);
  }

  // ─── Comparison results (4 dots) ────────────────────────────
  function renderComparisonResults(opts) {
    const d = opts.fromPayload;
    const n1 = d.n1, n2 = d.n2;
    const sAA = arrayToScore(d.a1byA);
    const sBA = arrayToScore(d.a2byA);
    const sAB = arrayToScore(d.a1byB);
    const sBB = arrayToScore(d.a2byB);

    const pAA = plotPercent(sAA);
    const pBA = plotPercent(sBA);
    const pAB = plotPercent(sAB);
    const pBB = plotPercent(sBB);

    const viewA = assignQuadrants(sAA, sBA);
    const viewB = assignQuadrants(sAB, sBB);
    const archA_byA = archetypeFor(viewA.p1.yPos, viewA.p1.xPos);
    const archB_byA = archetypeFor(viewA.p2.yPos, viewA.p2.xPos);
    const archA_byB = archetypeFor(viewB.p1.yPos, viewB.p1.xPos);
    const archB_byB = archetypeFor(viewB.p2.yPos, viewB.p2.xPos);

    const dots = [
      { id: 'd-aa', cls: 'p1',         label: n1, x: pAA.x, y: pAA.y },
      { id: 'd-ba', cls: 'p2',         label: n2, x: pBA.x, y: pBA.y },
      { id: 'd-ab', cls: 'p1 hollow',  label: n1, x: pAB.x, y: pAB.y },
      { id: 'd-bb', cls: 'p2 hollow',  label: n2, x: pBB.x, y: pBB.y },
    ];
    const connectors = [
      { from: pAA, to: pAB },
      { from: pBA, to: pBB },
    ];
    const agreement = buildAgreementBullets(
      n1, n2, viewA, viewB, archA_byA, archB_byA, archA_byB, archB_byB
    );

    const usPayload = {
      v: VERSION, m: 'us', q: Q.id,
      n1, n2,
      a1byA: d.a1byA, a2byA: d.a2byA,
      a1byB: d.a1byB, a2byB: d.a2byB,
    };
    const url = location.origin + location.pathname + '#us=' + b64urlEncode(usPayload);

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

      ${shareBlockHtml('Share this comparison')}
      <button class="btn secondary" id="restartBtn2">Take it again</button>
      <p class="footer-note">${(Q.copy && Q.copy.footerNote) ? Q.copy.footerNote : 'Diagnosis is non-binding. Probably.'}</p>
    `;

    $('resultsContainer').innerHTML = html;
    show('screen-results');

    requestAnimationFrame(() => {
      dots.forEach((d) => positionDot(d.id, { x: d.x, y: d.y }));
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
    window.addEventListener('resize', () => drawConnectors(connectors));

    mountShareBlock(url);
    $('restartBtn2').addEventListener('click', restart);
  }

  // ─── Chart HTML, dot positioning, connectors ─────────────────
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
    if (dot) { dot.style.left = pos.x + '%'; dot.style.top = pos.y + '%'; }
    if (lbl) { lbl.style.left = pos.x + '%'; lbl.style.top = pos.y + '%'; }
  }

  function drawConnectors(pairs) {
    const chart = $('chart');
    if (!chart) return;
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

  // ─── Compare block (paste-and-merge) ─────────────────────────
  function compareBlockHtml(label) {
    return `
      <div class="compare-block">
        <div class="compare-label">${escapeHtml(label)}</div>
        <div class="share-row">
          <input type="url" class="share-url" id="compareInput" placeholder="paste their link here" autocomplete="off">
          <button class="share-copy compare-go" id="compareGo" type="button">Compare</button>
        </div>
        <div class="compare-msg" id="compareMsg"></div>
      </div>
    `;
  }

  function mountCompareBlock(myExistingPayload) {
    const input = $('compareInput');
    const btn = $('compareGo');
    const msg = $('compareMsg');
    if (!input || !btn) return;

    function setMsg(text, isError) {
      if (!msg) return;
      msg.textContent = text || '';
      msg.classList.toggle('error', !!isError);
    }

    function go() {
      const raw = input.value;
      if (!raw || !raw.trim()) { setMsg("Paste a link first.", true); return; }
      const route = parseAnyInput(raw);
      if (!route) {
        setMsg("That doesn't look like a quiz link from this site.", true);
        return;
      }

      if (route.kind === 'us') {
        // It's already a comparison link → just navigate to it.
        location.hash = '#us=' + b64urlEncode(route.data);
        return;
      }

      // route.kind === 'me' — combine with what we have on this page.
      if (!myExistingPayload) {
        location.hash = '#me=' + b64urlEncode(route.data);
        return;
      }
      const us = combineMeAndMe(myExistingPayload, route.data);
      location.hash = '#us=' + b64urlEncode(us);
    }

    btn.addEventListener('click', go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  }

  // ─── Boot ────────────────────────────────────────────────────
  function boot() {
    if ($('introEyebrow') && Q.copy && Q.copy.eyebrow) $('introEyebrow').textContent = Q.copy.eyebrow;
    if ($('introTitle') && Q.title) $('introTitle').innerHTML = Q.title;
    if ($('introLede') && Q.intro) $('introLede').textContent = Q.intro;

    // Hashchange (e.g. compare-block writes #us=… to navigate) → reload to re-route.
    window.addEventListener('hashchange', () => { window.location.reload(); });

    const route = readHashPayload();
    if (route && route.kind === 'us') {
      renderComparisonResults({ fromPayload: route.data });
      return;
    }
    if (route && route.kind === 'me') {
      State.partnerPayload = route.data;
      renderPersonalResults({ fromPayload: route.data });
      return;
    }

    const beginBtn = $('beginBtn');
    if (beginBtn) beginBtn.addEventListener('click', startQuiz);

    const opt1 = $('opt1');
    const opt2 = $('opt2');
    if (opt1) opt1.addEventListener('click', () => answer(1));
    if (opt2) opt2.addEventListener('click', () => answer(2));
    const tie = $('tieBtn');
    if (tie) tie.addEventListener('click', () => answer(0));

    show('screen-intro');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.QuizEngine = { answer, startQuiz };
})();
