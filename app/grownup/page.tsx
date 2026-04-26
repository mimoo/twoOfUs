import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Quiz from "@/components/Quiz";
import grownup from "@/quizzes/grownup";

export const metadata: Metadata = {
  title: "Who's the grown-up? — Two of Us, Part III",
  description:
    "Mature, immature, aware, unaware. The hard one. Be honest — these cut a little closer.",
  openGraph: {
    type: "website",
    title: "Who's the grown-up — Two of Us, Part III",
    description:
      "Mature, immature, aware, unaware. The hard one. Be honest — these cut a little closer.",
    images: ["og-grownup.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Who's the grown-up — Two of Us, Part III",
    description:
      "Mature, immature, aware, unaware. The hard one. Be honest — these cut a little closer.",
    images: ["og-grownup.png"],
  },
};

export default function GrownupPage() {
  // Inline the per-quiz palette as CSS variables on the page wrapper —
  // this lets shared design-system rules (var(--accent), etc.) cascade
  // without per-quiz CSS files.
  const styleVars = grownup.palette as unknown as CSSProperties;

  return (
    <main className="quiz-bg" style={styleVars}>
      <Quiz quiz={grownup} />
    </main>
  );
}
