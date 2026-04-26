import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Quiz from "@/components/Quiz";
import relationship from "@/quizzes/relationship";

export const metadata: Metadata = {
  title: "Who does what in the relationship?",
  description:
    "Mother, baby, tyrant, serf. Twenty-four honest questions about who really runs your relationship.",
  openGraph: {
    type: "website",
    title: "Who does what — Two of Us, Part I",
    description:
      "Mother, baby, tyrant, serf. Twenty-four honest questions about who really runs your relationship.",
    images: ["og-relationship.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Who does what — Two of Us, Part I",
    description:
      "Mother, baby, tyrant, serf. Twenty-four honest questions about who really runs your relationship.",
    images: ["og-relationship.png"],
  },
};

export default function RelationshipPage() {
  // Inline the per-quiz palette as CSS variables on the page wrapper —
  // this lets shared design-system rules (var(--accent), etc.) cascade
  // without per-quiz CSS files.
  const styleVars = relationship.palette as unknown as CSSProperties;

  return (
    <main className="quiz-bg" style={styleVars}>
      <Quiz quiz={relationship} />
    </main>
  );
}
