import type { QuizConfig } from "@/lib/types";

const leader: QuizConfig = {
  id: "leader",
  title: "Who <em>leads</em>, who plays?",
  intro:
    "Twenty-four questions on two new axes — who takes the lead (dom / sub) and who's the energy in the room (fun / boring). No judgment. Mostly.",

  axes: {
    y: { pos: "dom", neg: "sub", posLabel: "Dom", negLabel: "Sub" },
    x: { pos: "fun", neg: "boring", posLabel: "Fun", negLabel: "Boring" },
  },

  questions: [
    { text: "Who makes the first move?", axis: "dom" },
    { text: "Who suggests 'let's just go right now' to a random plan?", axis: "fun" },
    { text: "Who asks 'what do you want to do tonight?'", axis: "sub" },
    { text: "Who says 'we should head home soon'?", axis: "boring" },

    { text: "Who plans the date?", axis: "dom" },
    { text: "Who orders dessert?", axis: "fun" },
    { text: "Who waits for the other to text first?", axis: "sub" },
    { text: "Who's checking the time at the party?", axis: "boring" },

    { text: "Who initiates the difficult conversation?", axis: "dom" },
    { text: "Who starts dancing first?", axis: "fun" },
    { text: "Who lets the other order for them?", axis: "sub" },
    { text: "Who orders the safe option on the menu?", axis: "boring" },

    { text: "Who picks up the menu first and starts deciding?", axis: "dom" },
    { text: "Who talks to strangers at the bar?", axis: "fun" },
    { text: "Who follows the other's lead in unfamiliar settings?", axis: "sub" },
    { text: "Who says 'maybe tomorrow' to the spontaneous thing?", axis: "boring" },

    { text: "Who sets the pace of the relationship?", axis: "dom" },
    { text: "Who's first in the pool, ocean, or onto the dance floor?", axis: "fun" },
    { text: "Who agrees to the plan without weighing in?", axis: "sub" },
    { text: "Who's in bed by 11?", axis: "boring" },

    { text: "Who decides 'okay, we're doing this' when the group is stalling?", axis: "dom" },
    { text: "Who pushes for 'one more drink, one more song'?", axis: "fun" },
    { text: "Who waits to be told it's time to leave?", axis: "sub" },
    { text: "Who declines the invitation when they're tired?", axis: "boring" },
  ],

  archetypes: {
    "dom+fun": {
      emoji: "🎪",
      name: "The Ringleader",
      blurb:
        "Drags everyone out, picks the venue, last to leave. The chaos has a captain — and it's them.",
      klass: "ringleader",
    },
    "dom+boring": {
      emoji: "📋",
      name: "The Manager",
      blurb:
        "Has opinions about bedtime. Runs a tight ship. The plan is the fun, and the plan ends at 10:30.",
      klass: "manager",
    },
    "sub+fun": {
      emoji: "🎉",
      name: "The Hype Person",
      blurb:
        "Wouldn't suggest it themselves, but a hard yes to every chaotic idea. Best wingman energy.",
      klass: "hype",
    },
    "sub+boring": {
      emoji: "🛋️",
      name: "The Anchor",
      blurb:
        "Reliable, low-key, perfectly content on the couch. The voice of reason that quietly vetoes the late-night plan.",
      klass: "anchor",
    },
  },

  quadLabels: {
    tl: "Manager",
    tr: "Ringleader",
    bl: "Anchor",
    br: "Hype Person",
  },

  copy: {
    eyebrow: "Part two — the sequel",
    resultsHead: "Here's the <em>truth</em>.",
    footerNote: "Diagnosis is non-binding. Probably.",
  },

  /**
   * Per-quiz palette — applied as inline CSS variables on the quiz page wrapper.
   * Keep variable names in sync with shared CSS (see app/globals.css).
   */
  palette: {
    "--bg": "#F4EFE6",
    "--ink": "#14131F",
    "--accent": "#FF3D2E",
    "--accent-soft": "#FFD6CF",
    "--p2-color": "#FF3D2E",

    "--opt1-bg": "#FFD6CF", // hot-soft
    "--opt2-bg": "#C8F25A", // lime

    "--quad-tl": "#9FD8FF", // Manager — sky (dom + boring)
    "--quad-tr": "#FFD6CF", // Ringleader — hot-soft (dom + fun)
    "--quad-bl": "#F4EFE6", // Anchor — cream (sub + boring)
    "--quad-br": "#FFC93C", // Hype Person — sun (sub + fun)

    "--bg-glow-1": "rgba(255,61,46,0.10)",
    "--bg-glow-2": "rgba(159,216,255,0.28)",

    "--ink-soft": "rgba(20,19,31,0.72)",
    "--ink-muted": "rgba(20,19,31,0.55)",
    "--ink-faint": "rgba(20,19,31,0.45)",
    "--ink-fade": "rgba(20,19,31,0.28)",
    "--ink-tint": "rgba(20,19,31,0.08)",
  },
};

export default leader;
