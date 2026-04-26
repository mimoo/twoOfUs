import Link from "next/link";

interface Props {
  href: string;
  /** "q1" | "q2" | "q3" — drives palette + part label color. */
  variant: "q1" | "q2" | "q3";
  part: string;
  /** Title HTML — may contain <em> for accent. */
  titleHtml: string;
  axes: string;
  quadLabels: { tl: string; tr: string; bl: string; br: string };
}

/**
 * Single landing-page card. Self-contained (no quiz config needed),
 * styled per-variant via CSS classes on the parent.
 */
export default function QuizCard({
  href,
  variant,
  part,
  titleHtml,
  axes,
  quadLabels,
}: Props) {
  return (
    <Link href={href} className={`card ${variant}`}>
      <div className="card-meta">
        <span className="part">{part}</span>
        <span className="dot" />
      </div>
      <h2
        className="card-title"
        dangerouslySetInnerHTML={{ __html: titleHtml }}
      />
      <div className="card-axes">{axes}</div>
      <div className="mini-chart">
        <div className="mc-cell tl">{quadLabels.tl}</div>
        <div className="mc-cell tr">{quadLabels.tr}</div>
        <div className="mc-cell bl">{quadLabels.bl}</div>
        <div className="mc-cell br">{quadLabels.br}</div>
      </div>
      <span className="card-cta">Begin →</span>
    </Link>
  );
}
