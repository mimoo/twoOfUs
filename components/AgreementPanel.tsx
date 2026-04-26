"use client";

import type { Archetype, QuizConfig } from "@/lib/types";
import type { QuadrantAssignment } from "@/lib/scoring";

interface Props {
  quiz: QuizConfig;
  n1: string;
  n2: string;
  viewA: QuadrantAssignment;
  viewB: QuadrantAssignment;
  archA_byA: Archetype;
  archB_byA: Archetype;
  archA_byB: Archetype;
  archB_byB: Archetype;
}

/**
 * Auto-generates the 4 bullets shown in the "What you both see — and don't"
 * card under the 4-dot chart. Mirrors buildAgreementBullets() in engine.js,
 * preserving copy verbatim.
 *
 * Each bullet uses <strong> for emphasis. We render via dangerouslySetInnerHTML
 * to keep the formatting tight; inputs are user names + label strings, so we
 * escape them ourselves.
 */
export default function AgreementPanel({
  quiz,
  n1,
  n2,
  viewA,
  viewB,
  archA_byA,
  archB_byA,
  archA_byB,
  archB_byB,
}: Props) {
  const bullets: string[] = [];
  const yPosLabel = quiz.axes.y.posLabel;
  const yNegLabel = quiz.axes.y.negLabel;
  const xPosLabel = quiz.axes.x.posLabel;
  const xNegLabel = quiz.axes.x.negLabel;

  const N1 = esc(n1);
  const N2 = esc(n2);

  const agreesP1Y = viewA.p1.yPos === viewB.p1.yPos;
  const agreesP2Y = viewA.p2.yPos === viewB.p2.yPos;
  const agreesP1X = viewA.p1.xPos === viewB.p1.xPos;
  const agreesP2X = viewA.p2.xPos === viewB.p2.xPos;

  if (agreesP1Y && agreesP2Y) {
    bullets.push(
      `You both see <strong>${N1}</strong> as the more <strong>${esc(
        viewA.p1.yPos ? yPosLabel : yNegLabel,
      )}</strong> one. No disagreement there.`,
    );
  } else {
    bullets.push(
      `Disagreement on the <strong>${esc(yPosLabel)}/${esc(
        yNegLabel,
      )}</strong> axis: ${N1} thinks ${esc(viewA.p1.yPos ? n1 : n2)} is the ${esc(
        yPosLabel,
      )} one, ${N2} thinks it's ${esc(viewB.p1.yPos ? n1 : n2)}. Interesting.`,
    );
  }

  if (agreesP1X && agreesP2X) {
    bullets.push(
      `You both put <strong>${N1}</strong> on the <strong>${esc(
        viewA.p1.xPos ? xPosLabel : xNegLabel,
      )}</strong> side. Aligned.`,
    );
  } else {
    bullets.push(
      `Disagreement on the <strong>${esc(xPosLabel)}/${esc(
        xNegLabel,
      )}</strong> axis — you each see this one differently.`,
    );
  }

  if (archA_byA.name !== archA_byB.name) {
    bullets.push(
      `<strong>${N1}</strong> sees themself as <strong>${esc(
        archA_byA.name,
      )}</strong>, but <strong>${N2}</strong> sees them as <strong>${esc(
        archA_byB.name,
      )}</strong>. Worth a chat.`,
    );
  } else {
    bullets.push(
      `You both agree <strong>${N1}</strong> is <strong>${esc(
        archA_byA.name,
      )}</strong>. Settled.`,
    );
  }

  if (archB_byA.name !== archB_byB.name) {
    bullets.push(
      `<strong>${N2}</strong> sees themself as <strong>${esc(
        archB_byB.name,
      )}</strong>, but <strong>${N1}</strong> sees them as <strong>${esc(
        archB_byA.name,
      )}</strong>. Hmm.`,
    );
  } else {
    bullets.push(
      `You both agree <strong>${N2}</strong> is <strong>${esc(
        archB_byA.name,
      )}</strong>. Locked in.`,
    );
  }

  return (
    <div className="agreement">
      <h3>What you both see — and don&apos;t</h3>
      <ul>
        {bullets.map((b, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
        ))}
      </ul>
    </div>
  );
}

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}
