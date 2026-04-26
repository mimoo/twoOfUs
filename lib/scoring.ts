/**
 * Scoring math, archetype lookup, quadrant assignment, plot positioning.
 * Direct port of the math in engine.js — keep behavior bit-identical.
 */

import type {
  Archetype,
  MePayload,
  QuizConfig,
  Score,
  ScoreArray,
  UsPayload,
} from "./types";
import { PAYLOAD_VERSION } from "./types";

/** Canonical axis order: [yPos, yNeg, xPos, xNeg]. */
export function axisOrder(quiz: QuizConfig): [string, string, string, string] {
  return [quiz.axes.y.pos, quiz.axes.y.neg, quiz.axes.x.pos, quiz.axes.x.neg];
}

export function blankScores(quiz: QuizConfig): { 1: Score; 2: Score } {
  const tags = axisOrder(quiz);
  const s1: Score = {};
  const s2: Score = {};
  for (const k of tags) {
    s1[k] = 0;
    s2[k] = 0;
  }
  return { 1: s1, 2: s2 };
}

export function scoreToArray(quiz: QuizConfig, s: Score): ScoreArray {
  const tags = axisOrder(quiz);
  return [s[tags[0]] || 0, s[tags[1]] || 0, s[tags[2]] || 0, s[tags[3]] || 0];
}

export function arrayToScore(quiz: QuizConfig, arr: ScoreArray | undefined): Score {
  const tags = axisOrder(quiz);
  const s: Score = {};
  tags.forEach((k, i) => {
    s[k] = (arr && arr[i]) || 0;
  });
  return s;
}

export function netY(quiz: QuizConfig, s: Score): number {
  return (s[quiz.axes.y.pos] || 0) - (s[quiz.axes.y.neg] || 0);
}
export function netX(quiz: QuizConfig, s: Score): number {
  return (s[quiz.axes.x.pos] || 0) - (s[quiz.axes.x.neg] || 0);
}

function archetypeKey(quiz: QuizConfig, yPos: boolean, xPos: boolean): string {
  return (
    (yPos ? quiz.axes.y.pos : quiz.axes.y.neg) +
    "+" +
    (xPos ? quiz.axes.x.pos : quiz.axes.x.neg)
  );
}

export function archetypeFor(
  quiz: QuizConfig,
  yPos: boolean,
  xPos: boolean,
): Archetype {
  return (
    quiz.archetypes[archetypeKey(quiz, yPos, xPos)] || {
      emoji: "✨",
      name: "Unclassifiable",
      blurb: "Unique. Charts off the map.",
      klass: "unknown",
    }
  );
}

export function tagFor(quiz: QuizConfig, yPos: boolean, xPos: boolean): string {
  return (
    (yPos ? quiz.axes.y.posLabel : quiz.axes.y.negLabel) +
    " · " +
    (xPos ? quiz.axes.x.posLabel : quiz.axes.x.negLabel)
  );
}

export interface QuadrantAssignment {
  p1: { yPos: boolean; xPos: boolean };
  p2: { yPos: boolean; xPos: boolean };
}

/**
 * Whoever has the higher net Y gets yPos=true; same for X.
 * Ties broken by raw count, then by P1.
 */
export function assignQuadrants(
  quiz: QuizConfig,
  s1: Score,
  s2: Score,
): QuadrantAssignment {
  const yN1 = netY(quiz, s1);
  const yN2 = netY(quiz, s2);
  let p1Y: boolean;
  if (yN1 > yN2) p1Y = true;
  else if (yN1 < yN2) p1Y = false;
  else p1Y = (s1[quiz.axes.y.pos] || 0) >= (s2[quiz.axes.y.pos] || 0);

  const xN1 = netX(quiz, s1);
  const xN2 = netX(quiz, s2);
  let p1X: boolean;
  if (xN1 > xN2) p1X = true;
  else if (xN1 < xN2) p1X = false;
  else p1X = (s1[quiz.axes.x.pos] || 0) >= (s2[quiz.axes.x.pos] || 0);

  return {
    p1: { yPos: p1Y, xPos: p1X },
    p2: { yPos: !p1Y, xPos: !p1X },
  };
}

export interface PlotPos {
  /** % from left edge of chart. */
  x: number;
  /** % from top edge of chart. */
  y: number;
}

/**
 * Net score → percentage from chart edge. Mirrors engine.js.
 * 12% margin around the edges; net normalized to [-1, 1] over a span of 6.
 */
export function plotPercent(quiz: QuizConfig, s: Score): PlotPos {
  const margin = 12;
  const yNet = Math.max(-1, Math.min(1, netY(quiz, s) / 6));
  const xNet = Math.max(-1, Math.min(1, netX(quiz, s) / 6));
  return {
    x: 50 + xNet * (50 - margin),
    y: 50 - yNet * (50 - margin),
  };
}

/**
 * Build a #me= payload from in-progress state.
 */
export function buildMePayload(
  quiz: QuizConfig,
  n1: string,
  n2: string,
  s1: Score,
  s2: Score,
): MePayload {
  return {
    v: PAYLOAD_VERSION,
    m: "me",
    q: quiz.id,
    n1,
    n2,
    a1: scoreToArray(quiz, s1),
    a2: scoreToArray(quiz, s2),
  };
}

/**
 * Merge two #me= payloads into one #us= payload.
 * meA: the first answerer's data ({n1, n2, a1, a2}).
 * meB: the second answerer's data — note their n1/n2 are mirrored from meA.
 *   B's view of A = meB.a2 (their "view of partner")
 *   B's view of B = meB.a1 (their "view of self")
 */
export function combineMeAndMe(
  quiz: QuizConfig,
  meA: MePayload,
  meB: MePayload,
): UsPayload {
  return {
    v: PAYLOAD_VERSION,
    m: "us",
    q: quiz.id,
    n1: meA.n1,
    n2: meA.n2,
    a1byA: meA.a1,
    a2byA: meA.a2,
    a1byB: meB.a2,
    a2byB: meB.a1,
  };
}
