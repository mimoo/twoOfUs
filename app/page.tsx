import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QuizCard from "@/components/QuizCard";
import PasteRouter from "@/components/PasteRouter";
import heroImg from "@/public/hero.png";

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
      <header className="hero hero-image">
        <h1 className="sr-only">
          How are you two, really? A trilogy of honest relationship diagnostics.
        </h1>
        <Image
          src={heroImg}
          alt="Three quizzes, two people. How are you two, really? A trilogy of honest relationship diagnostics. Ten minutes each. Affectionate teasing, not therapy."
          priority
          sizes="(max-width: 540px) 100vw, 540px"
          placeholder="blur"
          className="hero-img"
        />
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
