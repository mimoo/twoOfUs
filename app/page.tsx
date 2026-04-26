import type { Metadata } from "next";
import Link from "next/link";
import QuizCard from "@/components/QuizCard";
import PasteRouter from "@/components/PasteRouter";

export const metadata: Metadata = {
  title: "How are you two, really?",
  description:
    "A trilogy of honest relationship diagnostics. Ten minutes each. Affectionate teasing, not therapy.",
  openGraph: {
    type: "website",
    title: "How are you two, really?",
    description:
      "A trilogy of honest relationship diagnostics. Ten minutes each. Affectionate teasing, not therapy.",
    images: ["og-cover.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "How are you two, really?",
    description:
      "A trilogy of honest relationship diagnostics. Ten minutes each. Affectionate teasing, not therapy.",
    images: ["og-cover.png"],
  },
};

export default function Page() {
  return (
    <main className="landing-bg landing-stage">
      <header className="hero">
        <div className="eyebrow">Three quizzes · Two people</div>
        <h1 className="title">
          How are you two, <em>really</em>?
        </h1>
        <p className="lede">
          A trilogy of honest relationship diagnostics. Ten minutes each.
          Affectionate teasing, not therapy.
        </p>
      </header>

      <div className="deck">
        <QuizCard
          href="/relationship/"
          variant="q1"
          part="Part I"
          titleHtml="Who does <em>what</em>?"
          axes="Mother · Baby × Serf · Tyrant"
          quadLabels={{
            tl: "Caretaker",
            tr: "Matriarch",
            bl: "Puppy",
            br: "Royal Baby",
          }}
        />
        <QuizCard
          href="/leader/"
          variant="q2"
          part="Part II"
          titleHtml="Who <em>leads</em>, who plays?"
          axes="Dom · Sub × Boring · Fun"
          quadLabels={{
            tl: "Manager",
            tr: "Ringleader",
            bl: "Anchor",
            br: "Hype Person",
          }}
        />
        <QuizCard
          href="/grownup/"
          variant="q3"
          part="Part III"
          titleHtml="Who's the <em>grown-up</em>?"
          axes="Mature · Immature × Unaware · Aware"
          quadLabels={{
            tl: "The Mellow",
            tr: "The Sage",
            bl: "The Storm",
            br: "The Diarist",
          }}
        />
      </div>

      <PasteRouter />

      <div className="footer-block">
        <Link className="combo-link" href="/combo/">
          See all three at once →
        </Link>
        <p className="footer">Best taken together, in order. Bring snacks.</p>
      </div>
    </main>
  );
}
