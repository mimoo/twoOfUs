"use client";

import { useEffect, useRef } from "react";
import type { QuizConfig } from "@/lib/types";
import type { PlotPos } from "@/lib/scoring";

export interface ChartDot {
  id: string;
  /** "p1" | "p2" | "p1 hollow" | "p2 hollow" */
  cls: string;
  label: string;
  pos: PlotPos;
}

export interface ChartConnector {
  from: PlotPos;
  to: PlotPos;
}

interface Props {
  quiz: QuizConfig;
  dots: ChartDot[];
  connectors?: ChartConnector[];
}

/**
 * 2x2 quadrant chart with up to 4 dots and optional dashed connectors.
 * Mirrors the geometry from engine.js → drawConnectors().
 */
export default function QuadrantChart({ quiz, dots, connectors = [] }: Props) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function draw() {
      const chart = chartRef.current;
      if (!chart) return;
      // Remove old connectors.
      chart.querySelectorAll(".connector").forEach((el) => el.remove());
      const rect = chart.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (!w || !h) return;
      for (const p of connectors) {
        const x1 = (p.from.x / 100) * w;
        const y1 = (p.from.y / 100) * h;
        const x2 = (p.to.x / 100) * w;
        const y2 = (p.to.y / 100) * h;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const conn = document.createElement("div");
        conn.className = "connector";
        conn.style.left = x1 + "px";
        conn.style.top = y1 + "px";
        conn.style.width = len + "px";
        conn.style.transform = "rotate(" + angle + "deg)";
        chart.appendChild(conn);
      }
    }

    // Defer to next frame so layout is settled.
    const raf = requestAnimationFrame(draw);
    window.addEventListener("resize", draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", draw);
    };
  }, [connectors]);

  const ql = quiz.quadLabels;

  return (
    <div className="chart-wrap">
      <div className="chart-axis-top">{quiz.axes.y.posLabel}</div>
      <div className="chart-row">
        <div className="chart-axis-side left">{quiz.axes.x.negLabel}</div>
        <div className="chart-grid" ref={chartRef}>
          <div className="quadrant tl">
            <span className="qname">{ql.tl}</span>
          </div>
          <div className="quadrant tr">
            <span className="qname">{ql.tr}</span>
          </div>
          <div className="quadrant bl">
            <span className="qname">{ql.bl}</span>
          </div>
          <div className="quadrant br">
            <span className="qname">{ql.br}</span>
          </div>
          <div className="grid-line h" />
          <div className="grid-line v" />
          {dots.map((d) => (
            <div key={d.id}>
              <div
                className={`dot ${d.cls}`}
                style={{ left: `${d.pos.x}%`, top: `${d.pos.y}%` }}
              />
              <div
                className={`dot-label ${d.cls}`}
                style={{ left: `${d.pos.x}%`, top: `${d.pos.y}%` }}
              >
                {d.label}
              </div>
            </div>
          ))}
        </div>
        <div className="chart-axis-side right">{quiz.axes.x.posLabel}</div>
      </div>
      <div className="chart-axis-bottom">{quiz.axes.y.negLabel}</div>
    </div>
  );
}
