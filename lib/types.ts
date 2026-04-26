/**
 * Shared types for the Two of Us quiz trilogy.
 *
 * Each quiz uses a 4-element score array `[yPos, yNeg, xPos, xNeg]`,
 * counting how many times the answerer chose the person for each axis tag.
 */

export type QuizId = "relationship" | "leader" | "grownup";

export type ScoreArray = [number, number, number, number];

/** A score keyed by axis tag (e.g. "mother", "baby", "tyrant", "serf"). */
export type Score = Record<string, number>;

export interface AxisDef {
  /** Axis tag for the positive (top/right) side. */
  pos: string;
  /** Axis tag for the negative (bottom/left) side. */
  neg: string;
  /** Display label for the positive side (used in chart axes + tags). */
  posLabel: string;
  /** Display label for the negative side. */
  negLabel: string;
}

export interface Archetype {
  emoji: string;
  name: string;
  blurb: string;
  /** CSS class hook used for verdict-card tinting. */
  klass: string;
}

export interface QuizCopy {
  eyebrow: string;
  resultsHead: string;
  footerNote: string;
}

export interface QuestionDef {
  text: string;
  /** Which axis tag this question scores when picked. */
  axis: string;
}

export interface QuizConfig {
  id: QuizId;
  /** Title HTML — may contain <em> for the accent word. */
  title: string;
  /** Plain-text intro paragraph for the landing screen of the quiz. */
  intro: string;

  axes: { y: AxisDef; x: AxisDef };

  questions: QuestionDef[];

  /** Keyed `<yKey>+<xKey>`: 4 archetypes. */
  archetypes: Record<string, Archetype>;

  /** Quadrant labels (top-left, top-right, bottom-left, bottom-right). */
  quadLabels: { tl: string; tr: string; bl: string; br: string };

  copy: QuizCopy;

  /**
   * Per-quiz palette, applied as inline CSS variables on the page wrapper.
   * Keys map 1:1 to the variables used by the design system
   * (see lib/scoring.ts and components/QuadrantChart.tsx).
   */
  palette: Record<string, string>;
}

// ─── URL hash payloads ──────────────────────────────────────────────

export const PAYLOAD_VERSION = 1 as const;

export interface MePayload {
  v: 1;
  m: "me";
  q: QuizId;
  /** Answerer's name. */
  n1: string;
  /** Partner's name. */
  n2: string;
  /** Answerer's view of self. */
  a1: ScoreArray;
  /** Answerer's view of partner. */
  a2: ScoreArray;
}

export interface UsPayload {
  v: 1;
  m: "us";
  q: QuizId;
  n1: string;
  n2: string;
  a1byA: ScoreArray;
  a2byA: ScoreArray;
  a1byB: ScoreArray;
  a2byB: ScoreArray;
}

export type SubPayload =
  | { a1: ScoreArray; a2: ScoreArray }
  | {
      a1byA: ScoreArray;
      a2byA: ScoreArray;
      a1byB: ScoreArray;
      a2byB: ScoreArray;
    };

export interface TrioPayload {
  v: 1;
  m: "trio";
  n1: string;
  n2: string;
  relationship?: SubPayload;
  leader?: SubPayload;
  grownup?: SubPayload;
}

export type AnyPayload = MePayload | UsPayload | TrioPayload;

export type ParsedRoute =
  | { kind: "me"; data: MePayload }
  | { kind: "us"; data: UsPayload }
  | { kind: "trio"; data: TrioPayload };
