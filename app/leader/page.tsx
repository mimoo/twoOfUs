import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Quiz from "@/components/Quiz";
import leader from "@/quizzes/leader";

export const metadata: Metadata = {
  title: "Who leads, who plays? — Two of Us, Part II",
  description:
    "Dom, sub, fun, boring. Who runs the night and who's checking the time at the party.",
  openGraph: {
    type: "website",
    title: "Who leads, who plays — Two of Us, Part II",
    description:
      "Dom, sub, fun, boring. Who runs the night and who's checking the time at the party.",
    images: ["og-leader.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Who leads, who plays — Two of Us, Part II",
    description:
      "Dom, sub, fun, boring. Who runs the night and who's checking the time at the party.",
    images: ["og-leader.png"],
  },
};

export default function LeaderPage() {
  // Inline the per-quiz palette as CSS variables on the page wrapper —
  // this lets shared design-system rules (var(--accent), etc.) cascade
  // without per-quiz CSS files.
  const styleVars = leader.palette as unknown as CSSProperties;

  return (
    <main className="quiz-bg" style={styleVars}>
      <Quiz quiz={leader} />
    </main>
  );
}
