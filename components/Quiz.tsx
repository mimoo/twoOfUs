"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  arrayToScore,
  archetypeFor,
  assignQuadrants,
  blankScores,
  buildMePayload,
  combineMeAndMe,
  plotPercent,
  tagFor,
} from "@/lib/scoring";
import { b64urlEncode, parseHashFragment } from "@/lib/hash";
import type {
  MePayload,
  QuizConfig,
  Score,
  UsPayload,
} from "@/lib/types";
import QuadrantChart, { ChartConnector, ChartDot } from "./QuadrantChart";
import ShareBlock from "./ShareBlock";
import CompareBlock from "./CompareBlock";
import AgreementPanel from "./AgreementPanel";

type Stage =
  | { kind: "intro" }
  | { kind: "question" }
  | { kind: "personal-mine" } // results: I just finished, showing my view
  | { kind: "personal-theirs"; payload: MePayload } // viewing partner's #me=
  | { kind: "comparison"; payload: UsPayload }; // 4-dot view

interface Props {
  quiz: QuizConfig;
}

export default function Quiz({ quiz }: Props) {
  // ─── Intro inputs ─────────────────────────────────────────────
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");

  // ─── Quiz state ───────────────────────────────────────────────
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [qIndex, setQIndex] = useState(0);
  const [scores, setScores] = useState<{ 1: Score; 2: Score }>(() =>
    blankScores(quiz),
  );
  /** When set, finishing the quiz auto-merges into a 4-dot view. */
  const [partnerPayload, setPartnerPayload] = useState<MePayload | null>(null);
  /** The active answerer's name, captured at quiz start. */
  const [activeNames, setActiveNames] = useState<{ n1: string; n2: string }>({
    n1: "",
    n2: "",
  });

  // ─── Hash routing on mount + on hashchange ───────────────────
  useEffect(() => {
    function applyHash() {
      const frag = (window.location.hash || "").slice(1);
      const route = parseHashFragment(frag, quiz.id);
      if (!route) {
        // No (or invalid) hash → leave at intro.
        setStage({ kind: "intro" });
        setPartnerPayload(null);
        return;
      }
      if (route.kind === "us") {
        setStage({ kind: "comparison", payload: route.data });
        setPartnerPayload(null);
        return;
      }
      if (route.kind === "me") {
        setPartnerPayload(route.data);
        setStage({ kind: "personal-theirs", payload: route.data });
      }
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [quiz.id]);

  // ─── Intro → start the quiz ──────────────────────────────────
  function startQuiz() {
    const n1 = (name1 || "You").trim() || "You";
    const n2 = (name2 || "Partner").trim() || "Partner";
    setActiveNames({ n1, n2 });
    setQIndex(0);
    setScores(blankScores(quiz));
    setStage({ kind: "question" });
  }

  // Called from the partner-preview screen when the partner clicks
  // "Take it from your side". n1/n2 swap (their n2 is us).
  function startQuizFromTheirLink() {
    if (!partnerPayload) {
      startQuiz();
      return;
    }
    const n1 = partnerPayload.n2 || "You";
    const n2 = partnerPayload.n1 || "Partner";
    setActiveNames({ n1, n2 });
    setQIndex(0);
    setScores(blankScores(quiz));
    setStage({ kind: "question" });
  }

  function answer(person: 0 | 1 | 2) {
    // Guard against extra clicks after the last question while the
    // 280ms transition to the results screen is still in flight.
    if (qIndex >= quiz.questions.length) return;
    const q = quiz.questions[qIndex];
    const next = {
      1: { ...scores[1] },
      2: { ...scores[2] },
    };
    if (person === 1 || person === 2) {
      next[person][q.axis] = (next[person][q.axis] || 0) + 1;
    }
    setScores(next);

    const newIdx = qIndex + 1;
    if (newIdx >= quiz.questions.length) {
      setQIndex(newIdx);
      // small delay to let the progress bar fill
      window.setTimeout(() => finishQuiz(next), 280);
    } else {
      setQIndex(newIdx);
    }
  }

  function finishQuiz(finalScores: { 1: Score; 2: Score }) {
    if (partnerPayload) {
      // Partner already submitted — merge to 4-dot.
      const myMe = buildMePayload(
        quiz,
        activeNames.n1,
        activeNames.n2,
        finalScores[1],
        finalScores[2],
      );
      const us = combineMeAndMe(quiz, partnerPayload, myMe);
      const encoded = b64urlEncode(us);
      // Update URL without triggering a re-route loop.
      const path =
        window.location.pathname + window.location.search + "#us=" + encoded;
      window.history.replaceState(null, "", path);
      setStage({ kind: "comparison", payload: us });
    } else {
      setStage({ kind: "personal-mine" });
    }
  }

  function restart() {
    // Clear hash + re-mount.
    window.location.href = window.location.pathname + window.location.search;
  }

  // ─── Render switch ────────────────────────────────────────────
  return (
    <div className="stage">
      <nav className="quiz-nav">
        <Link href="/" className="back-link">
          ← All three quizzes
        </Link>
      </nav>
      {stage.kind === "intro" && (
        <Intro
          quiz={quiz}
          name1={name1}
          name2={name2}
          setName1={setName1}
          setName2={setName2}
          onBegin={startQuiz}
        />
      )}

      {stage.kind === "question" && (
        <Question
          quiz={quiz}
          qIndex={qIndex}
          n1={activeNames.n1}
          n2={activeNames.n2}
          onPick={answer}
        />
      )}

      {stage.kind === "personal-mine" && (
        <PersonalResults
          quiz={quiz}
          mine={true}
          n1={activeNames.n1}
          n2={activeNames.n2}
          s1={scores[1]}
          s2={scores[2]}
          onRestart={restart}
          onTakeIt={null}
        />
      )}

      {stage.kind === "personal-theirs" && (
        <PersonalResults
          quiz={quiz}
          mine={false}
          n1={stage.payload.n1}
          n2={stage.payload.n2}
          s1={arrayToScore(quiz, stage.payload.a1)}
          s2={arrayToScore(quiz, stage.payload.a2)}
          onRestart={restart}
          onTakeIt={startQuizFromTheirLink}
        />
      )}

      {stage.kind === "comparison" && (
        <ComparisonResults
          quiz={quiz}
          payload={stage.payload}
          onRestart={restart}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Intro screen
// ────────────────────────────────────────────────────────────────
function Intro({
  quiz,
  name1,
  name2,
  setName1,
  setName2,
  onBegin,
}: {
  quiz: QuizConfig;
  name1: string;
  name2: string;
  setName1: (v: string) => void;
  setName2: (v: string) => void;
  onBegin: () => void;
}) {
  return (
    <section className="screen">
      <div className="eyebrow">{quiz.copy.eyebrow}</div>
      <h1
        className="title"
        dangerouslySetInnerHTML={{ __html: quiz.title }}
      />
      <p className="lede">{quiz.intro}</p>

      <div className="name-fields">
        <div className="field">
          <label htmlFor="name1">Your name</label>
          <input
            id="name1"
            type="text"
            placeholder="You"
            maxLength={18}
            autoComplete="off"
            value={name1}
            onChange={(e) => setName1(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="name2">Their name</label>
          <input
            id="name2"
            type="text"
            placeholder="Your partner"
            maxLength={18}
            autoComplete="off"
            value={name2}
            onChange={(e) => setName2(e.target.value)}
          />
        </div>
      </div>
      <button className="btn" onClick={onBegin}>
        Begin →
      </button>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────
// Question screen
// ────────────────────────────────────────────────────────────────
function Question({
  quiz,
  qIndex,
  n1,
  n2,
  onPick,
}: {
  quiz: QuizConfig;
  qIndex: number;
  n1: string;
  n2: string;
  onPick: (person: 0 | 1 | 2) => void;
}) {
  const total = quiz.questions.length;
  const done = qIndex >= total;
  const safeIdx = Math.min(qIndex, total - 1);
  const q = quiz.questions[safeIdx];
  const progress = (qIndex / total) * 100;

  return (
    <section className="screen">
      <div className="q-header">
        <div className="q-count">
          {String(safeIdx + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </div>
        <div className="progress">
          <div
            className="progress-bar"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      <div className="q-pov">From your honest point of view.</div>
      <h2 className="question">{q.text}</h2>
      <div className="options">
        <button
          className="option opt1"
          onClick={() => onPick(1)}
          disabled={done}
        >
          {n1}
        </button>
        <button
          className="option opt2"
          onClick={() => onPick(2)}
          disabled={done}
        >
          {n2}
        </button>
      </div>
      <button
        className="tie-link"
        onClick={() => onPick(0)}
        disabled={done}
      >
        Honestly equal — skip
      </button>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────
// Personal results (2 dots)
// ────────────────────────────────────────────────────────────────
function PersonalResults({
  quiz,
  mine,
  n1,
  n2,
  s1,
  s2,
  onRestart,
  onTakeIt,
}: {
  quiz: QuizConfig;
  mine: boolean;
  n1: string;
  n2: string;
  s1: Score;
  s2: Score;
  onRestart: () => void;
  onTakeIt: (() => void) | null;
}) {
  const assigned = assignQuadrants(quiz, s1, s2);
  const a1 = archetypeFor(quiz, assigned.p1.yPos, assigned.p1.xPos);
  const a2 = archetypeFor(quiz, assigned.p2.yPos, assigned.p2.xPos);
  const p1Pos = plotPercent(quiz, s1);
  const p2Pos = plotPercent(quiz, s2);

  // Build the #me= payload to share / merge.
  const mePayload: MePayload = useMemo(
    () => buildMePayload(quiz, n1, n2, s1, s2),
    [quiz, n1, n2, s1, s2],
  );

  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    const url =
      window.location.origin +
      window.location.pathname +
      "#me=" +
      b64urlEncode(mePayload);
    setShareUrl(url);
  }, [mePayload]);

  const dots: ChartDot[] = [
    { id: "d1", cls: "p1", label: n1, pos: p1Pos },
    { id: "d2", cls: "p2", label: n2, pos: p2Pos },
  ];

  return (
    <section className="screen">
      <div className="eyebrow">
        {mine ? "Your view recorded" : `${n1} took the quiz`}
      </div>
      <h2 className="results-title">
        {mine ? (
          <>
            Here&apos;s your <em>read</em>.
          </>
        ) : (
          <>
            <em>{n1}</em>&apos;s side of it.
          </>
        )}
      </h2>

      <QuadrantChart quiz={quiz} dots={dots} />

      <Verdict
        quiz={quiz}
        archetype={a1}
        name={n1}
        yPos={assigned.p1.yPos}
        xPos={assigned.p1.xPos}
        s={s1}
      />
      <Verdict
        quiz={quiz}
        archetype={a2}
        name={n2}
        yPos={assigned.p2.yPos}
        xPos={assigned.p2.xPos}
        s={s2}
      />

      {mine ? (
        <>
          {shareUrl && (
            <ShareBlock label={`Send your link to ${n2}`} url={shareUrl} />
          )}
          <CompareBlock
            quiz={quiz}
            label="Got their link? Paste it to compare."
            myPayload={mePayload}
          />
          <button className="btn secondary" onClick={onRestart}>
            Take it again
          </button>
        </>
      ) : (
        <>
          <div className="cta-take-it">
            <button className="btn" onClick={onTakeIt ?? (() => {})}>
              Take it from your side →
            </button>
            <p className="cta-hint">
              Answer the same twenty-four questions honestly. We&apos;ll merge
              into a 4-dot comparison automatically.
            </p>
          </div>
          <CompareBlock
            quiz={quiz}
            label="Already took it? Paste your link instead."
            myPayload={mePayload}
          />
        </>
      )}

      <p className="footer-note">{quiz.copy.footerNote}</p>
    </section>
  );
}

function Verdict({
  quiz,
  archetype,
  name,
  yPos,
  xPos,
  s,
}: {
  quiz: QuizConfig;
  archetype: { emoji: string; name: string; blurb: string; klass: string };
  name: string;
  yPos: boolean;
  xPos: boolean;
  s: Score;
}) {
  const yPosL = quiz.axes.y.posLabel[0];
  const yNegL = quiz.axes.y.negLabel[0];
  const xPosL = quiz.axes.x.posLabel[0];
  const xNegL = quiz.axes.x.negLabel[0];

  return (
    <div className={`verdict ${archetype.klass}`}>
      <div className="v-emoji">{archetype.emoji}</div>
      <div className="v-name">{name}</div>
      <div className="v-tags">{tagFor(quiz, yPos, xPos)}</div>
      <div className="v-archetype">{archetype.name}</div>
      <p className="v-blurb">{archetype.blurb}</p>
      <div className="v-scores">
        <span>
          {yPosL} {s[quiz.axes.y.pos] || 0} · {yNegL}{" "}
          {s[quiz.axes.y.neg] || 0}
        </span>
        <span>
          {xPosL} {s[quiz.axes.x.pos] || 0} · {xNegL}{" "}
          {s[quiz.axes.x.neg] || 0}
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Comparison results (4 dots)
// ────────────────────────────────────────────────────────────────
function ComparisonResults({
  quiz,
  payload,
  onRestart,
}: {
  quiz: QuizConfig;
  payload: UsPayload;
  onRestart: () => void;
}) {
  const { n1, n2 } = payload;
  const sAA = arrayToScore(quiz, payload.a1byA);
  const sBA = arrayToScore(quiz, payload.a2byA);
  const sAB = arrayToScore(quiz, payload.a1byB);
  const sBB = arrayToScore(quiz, payload.a2byB);

  const pAA = plotPercent(quiz, sAA);
  const pBA = plotPercent(quiz, sBA);
  const pAB = plotPercent(quiz, sAB);
  const pBB = plotPercent(quiz, sBB);

  const viewA = assignQuadrants(quiz, sAA, sBA);
  const viewB = assignQuadrants(quiz, sAB, sBB);
  const archA_byA = archetypeFor(quiz, viewA.p1.yPos, viewA.p1.xPos);
  const archB_byA = archetypeFor(quiz, viewA.p2.yPos, viewA.p2.xPos);
  const archA_byB = archetypeFor(quiz, viewB.p1.yPos, viewB.p1.xPos);
  const archB_byB = archetypeFor(quiz, viewB.p2.yPos, viewB.p2.xPos);

  const dots: ChartDot[] = [
    { id: "d-aa", cls: "p1", label: n1, pos: pAA },
    { id: "d-ba", cls: "p2", label: n2, pos: pBA },
    { id: "d-ab", cls: "p1 hollow", label: n1, pos: pAB },
    { id: "d-bb", cls: "p2 hollow", label: n2, pos: pBB },
  ];
  const connectors: ChartConnector[] = [
    { from: pAA, to: pAB },
    { from: pBA, to: pBB },
  ];

  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    const url =
      window.location.origin +
      window.location.pathname +
      "#us=" +
      b64urlEncode(payload);
    setShareUrl(url);
  }, [payload]);

  return (
    <section className="screen">
      <div className="eyebrow">Both views in</div>
      <h2 className="results-title">
        {n1} vs <em>{n2}</em>.
      </h2>

      <QuadrantChart quiz={quiz} dots={dots} connectors={connectors} />

      <div className="legend">
        <div className="legend-row">
          <span className="legend-swatches">
            <span className="legend-swatch p1" />
            <span className="legend-swatch p2" />
          </span>
          <span>
            Solid dots = <strong>{n1}&apos;s view</strong> (how {n1} sees both
            of you).
          </span>
        </div>
        <div className="legend-row">
          <span className="legend-swatches">
            <span className="legend-swatch p1 hollow" />
            <span className="legend-swatch p2 hollow" />
          </span>
          <span>
            Outlined rings = <strong>{n2}&apos;s view</strong> (how {n2} sees
            both of you).
          </span>
        </div>
      </div>

      <AgreementPanel
        quiz={quiz}
        n1={n1}
        n2={n2}
        viewA={viewA}
        viewB={viewB}
        archA_byA={archA_byA}
        archB_byA={archB_byA}
        archA_byB={archA_byB}
        archB_byB={archB_byB}
      />

      {shareUrl && <ShareBlock label="Share this comparison" url={shareUrl} />}
      <button className="btn secondary" onClick={onRestart}>
        Take it again
      </button>
      <p className="footer-note">{quiz.copy.footerNote}</p>
    </section>
  );
}
