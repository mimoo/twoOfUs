"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  arrayToScore,
  archetypeFor,
  assignQuadrants,
  plotPercent,
} from "@/lib/scoring";
import { b64urlEncode, parseTrioHash, type TrioParse } from "@/lib/hash";
import type {
  Archetype,
  QuizConfig,
  QuizId,
  ScoreArray,
  SubPayload,
  TrioPayload,
} from "@/lib/types";
import QuadrantChart, { type ChartDot } from "./QuadrantChart";
import ShareBlock from "./ShareBlock";
import relationship from "@/quizzes/relationship";
import leader from "@/quizzes/leader";
import grownup from "@/quizzes/grownup";

interface QuizMeta {
  config: QuizConfig;
  variant: "q1" | "q2" | "q3";
  part: string;
  href: string;
}

const QUIZZES: Record<QuizId, QuizMeta> = {
  relationship: {
    config: relationship,
    variant: "q1",
    part: "Part I",
    href: "/relationship/",
  },
  leader: {
    config: leader,
    variant: "q2",
    part: "Part II",
    href: "/leader/",
  },
  grownup: {
    config: grownup,
    variant: "q3",
    part: "Part III",
    href: "/grownup/",
  },
};

const ORDER: QuizId[] = ["relationship", "leader", "grownup"];

type Status =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; reason: string }
  | { kind: "ok"; data: TrioPayload };

export default function Combo() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    function readHash() {
      const frag = (window.location.hash || "").slice(1);
      const parsed: TrioParse = parseTrioHash(frag);
      if (parsed.kind === "none") {
        setStatus({ kind: "empty" });
        setShareUrl("");
        return;
      }
      if (parsed.kind === "error") {
        setStatus({ kind: "error", reason: parsed.reason });
        setShareUrl("");
        return;
      }
      setStatus({ kind: "ok", data: parsed.data });
      setShareUrl(
        window.location.origin +
          window.location.pathname +
          "#trio=" +
          b64urlEncode(parsed.data),
      );
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  return (
    <main className="combo-bg">
      <div className="combo-stage">
        <header className="combo-hero">
          <div className="eyebrow">All three at once</div>
          <h1>
            The <em>full</em> picture.
          </h1>
          <p className="lede">
            Where you both land across all three diagnostics — care,
            leadership, grown-up-ness. Share it, revisit it later, or quietly
            compare with friends.
          </p>
        </header>

        {status.kind === "ok" && shareUrl && (
          <div className="combo-share">
            <ShareBlock label="Share this combo link" url={shareUrl} />
          </div>
        )}

        {status.kind === "error" && (
          <div className="combo-error">
            <h2>Couldn&apos;t read that link.</h2>
            <p>{status.reason}</p>
            <Link href="/">Back to start</Link>
          </div>
        )}

        {status.kind === "empty" && (
          <div className="combo-error">
            <h2>No trio link yet.</h2>
            <p>
              Take all three quizzes and we&apos;ll wire one up. Or paste a
              friend&apos;s combo link into your browser.
            </p>
            <Link href="/">Back to start</Link>
          </div>
        )}

        {status.kind === "ok" && (
          <ComboGrid data={status.data} />
        )}

        <p className="combo-foot">
          Diagnosis is non-binding. Probably.{" "}
          <Link href="/">← Back to start</Link>
        </p>
      </div>
    </main>
  );
}

function ComboGrid({ data }: { data: TrioPayload }) {
  const n1 = data.n1 || "Person 1";
  const n2 = data.n2 || "Person 2";
  return (
    <div className="combo-grid">
      {ORDER.map((quizId) => {
        const meta = QUIZZES[quizId];
        const sub = data[quizId];
        if (!sub) {
          return <PlaceholderBlock key={quizId} meta={meta} />;
        }
        return (
          <QuizBlock
            key={quizId}
            meta={meta}
            sub={sub}
            n1={n1}
            n2={n2}
          />
        );
      })}
    </div>
  );
}

function PlaceholderBlock({ meta }: { meta: QuizMeta }) {
  const { config, variant, part, href } = meta;
  return (
    <div className={`combo-block placeholder ${variant}`}>
      <div className="part">{part}</div>
      <h2 dangerouslySetInnerHTML={{ __html: config.title }} />
      <p className="placeholder-msg">
        Not yet taken. Take it together or pass a link back and forth.
      </p>
      <Link className="take-link" href={href}>
        Take it →
      </Link>
    </div>
  );
}

function QuizBlock({
  meta,
  sub,
  n1,
  n2,
}: {
  meta: QuizMeta;
  sub: SubPayload;
  n1: string;
  n2: string;
}) {
  const { config, variant, part } = meta;
  const styleVars = useMemo(
    () => config.palette as unknown as CSSProperties,
    [config.palette],
  );

  // Wrap each block in its palette so chart gridlines/quadrant tints + accents
  // pick up per-quiz vars locally.
  const isCompared = "a1byA" in sub;

  let dots: ChartDot[];
  let verdictNode: React.ReactNode;
  let legendNode: React.ReactNode = null;

  if (isCompared) {
    const sAA = arrayToScore(config, sub.a1byA as ScoreArray);
    const sBA = arrayToScore(config, sub.a2byA as ScoreArray);
    const sAB = arrayToScore(config, sub.a1byB as ScoreArray);
    const sBB = arrayToScore(config, sub.a2byB as ScoreArray);
    const pAA = plotPercent(config, sAA);
    const pBA = plotPercent(config, sBA);
    const pAB = plotPercent(config, sAB);
    const pBB = plotPercent(config, sBB);
    dots = [
      { id: `${config.id}-d-aa`, cls: "p1", label: n1, pos: pAA },
      { id: `${config.id}-d-ba`, cls: "p2", label: n2, pos: pBA },
      { id: `${config.id}-d-ab`, cls: "p1 hollow", label: n1, pos: pAB },
      { id: `${config.id}-d-bb`, cls: "p2 hollow", label: n2, pos: pBB },
    ];

    const viewA = assignQuadrants(config, sAA, sBA);
    const viewB = assignQuadrants(config, sAB, sBB);
    const a1A = archetypeFor(config, viewA.p1.yPos, viewA.p1.xPos);
    const a1B = archetypeFor(config, viewB.p1.yPos, viewB.p1.xPos);
    const a2A = archetypeFor(config, viewA.p2.yPos, viewA.p2.xPos);
    const a2B = archetypeFor(config, viewB.p2.yPos, viewB.p2.xPos);

    verdictNode = (
      <p className="combo-verdict">
        {n1} — <ArchetypeLabel a={a1A} b={a1B} />
        <br />
        {n2} — <ArchetypeLabel a={a2A} b={a2B} />
      </p>
    );

    legendNode = (
      <div className="legend">
        <div className="legend-row">
          <span className="legend-swatch p1" />
          {n1} by {n1}
        </div>
        <div className="legend-row">
          <span className="legend-swatch p2" />
          {n2} by {n1}
        </div>
        <div className="legend-row">
          <span className="legend-swatch p1 hollow" />
          {n1} by {n2}
        </div>
        <div className="legend-row">
          <span className="legend-swatch p2 hollow" />
          {n2} by {n2}
        </div>
      </div>
    );
  } else {
    const s1 = arrayToScore(config, sub.a1 as ScoreArray);
    const s2 = arrayToScore(config, sub.a2 as ScoreArray);
    const p1 = plotPercent(config, s1);
    const p2 = plotPercent(config, s2);
    dots = [
      { id: `${config.id}-d1`, cls: "p1", label: n1, pos: p1 },
      { id: `${config.id}-d2`, cls: "p2", label: n2, pos: p2 },
    ];
    const assigned = assignQuadrants(config, s1, s2);
    const a1 = archetypeFor(config, assigned.p1.yPos, assigned.p1.xPos);
    const a2 = archetypeFor(config, assigned.p2.yPos, assigned.p2.xPos);
    verdictNode = (
      <p className="combo-verdict">
        {n1} — {a1.emoji} <strong>{a1.name}</strong>
        <br />
        {n2} — {a2.emoji} <strong>{a2.name}</strong>
      </p>
    );
  }

  const ax = config.axes;

  return (
    <div className={`combo-block ${variant}`} style={styleVars}>
      <div className="part">{part}</div>
      <h2 dangerouslySetInnerHTML={{ __html: config.title }} />
      <div className="combo-axes">
        {ax.y.posLabel} · {ax.y.negLabel} × {ax.x.negLabel} · {ax.x.posLabel}
      </div>

      <QuadrantChart quiz={config} dots={dots} />

      {legendNode}

      {verdictNode}
    </div>
  );
}

function ArchetypeLabel({ a, b }: { a: Archetype; b: Archetype }) {
  if (a.name === b.name) {
    return (
      <>
        {a.emoji} <strong>{a.name}</strong>
      </>
    );
  }
  return (
    <>
      <strong>{a.name}</strong> / <strong>{b.name}</strong> (split)
    </>
  );
}
