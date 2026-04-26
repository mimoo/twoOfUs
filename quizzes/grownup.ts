import type { QuizConfig } from "@/lib/types";

const grownup: QuizConfig = {
  id: "grownup",
  title: "Who's the <em>grown-up</em>?",
  intro:
    "Twenty-four questions on the trickier axes — emotional maturity and self-awareness. Be honest. These ones cut a little closer.",

  axes: {
    y: { pos: "mature", neg: "immature", posLabel: "Mature", negLabel: "Immature" },
    x: { pos: "aware", neg: "unaware", posLabel: "Aware", negLabel: "Unaware" },
  },

  questions: [
    { text: "Who apologizes for the actual thing they did, not 'if you felt hurt'?", axis: "mature" },
    { text: "Who notices their own pattern? ('I get like this when I'm tired')", axis: "aware" },
    { text: "Who sulks when they don't get their way?", axis: "immature" },
    { text: "Who's surprised by feedback they really should've seen coming?", axis: "unaware" },

    { text: "Who can hear hard feedback without immediately defending themselves?", axis: "mature" },
    { text: "Who can name what they did wrong before being told?", axis: "aware" },
    { text: "Who keeps a mental list of past grievances?", axis: "immature" },
    { text: "Who insists they're fine when they obviously aren't?", axis: "unaware" },

    { text: "Who recovers from upset in hours rather than days?", axis: "mature" },
    { text: "Who admits their own hypocrisies out loud?", axis: "aware" },
    { text: "Who goes silent instead of saying what's actually wrong?", axis: "immature" },
    { text: "Who's the last to notice they're in a bad mood?", axis: "unaware" },

    { text: "Who can be wrong about something without it ruining their day?", axis: "mature" },
    { text: "Who knows what they're not good at?", axis: "aware" },
    { text: "Who turns small disagreements into bigger ones?", axis: "immature" },
    { text: "Who can't quite see how they come across to others?", axis: "unaware" },

    { text: "Who stays calm when the other one is escalating?", axis: "mature" },
    { text: "Who warns the other when they're in a bad mood?", axis: "aware" },
    { text: "Who needs the other person to fix their bad mood?", axis: "immature" },
    { text: "Who tells the same story without seeing their own role in it?", axis: "unaware" },

    { text: "Who lets minor mistakes stay minor?", axis: "mature" },
    { text: "Who can describe their actual feelings, not just 'fine' or 'annoyed'?", axis: "aware" },
    { text: "Who has to 'win' the argument?", axis: "immature" },
    { text: "Who has a self-image that doesn't quite match how others see them?", axis: "unaware" },
  ],

  archetypes: {
    "mature+aware": {
      emoji: "🦉",
      name: "The Sage",
      blurb:
        "Owns their stuff, regulates beautifully, repairs honestly. Knows themselves and acts accordingly. Therapy enrichment for everyone they love.",
      klass: "sage",
    },
    "mature+unaware": {
      emoji: "🌿",
      name: "The Mellow",
      blurb:
        "Even-keeled and easy to be around — but introspection isn't really their hobby. The vibes are immaculate, the inner monologue is mercifully short.",
      klass: "mellow",
    },
    "immature+aware": {
      emoji: "📓",
      name: "The Diarist",
      blurb:
        "Sees the pattern in real time, sometimes mid-spiral. Can narrate exactly what they're doing and why. Will absolutely do it again on Tuesday.",
      klass: "diarist",
    },
    "immature+unaware": {
      emoji: "⛈️",
      name: "The Storm",
      blurb:
        "Big feelings arrive without warning, and so do they. The reflection comes later, if at all. Honest, intense, and reliably human.",
      klass: "storm",
    },
  },

  quadLabels: {
    tl: "Mellow",
    tr: "Sage",
    bl: "Storm",
    br: "Diarist",
  },

  copy: {
    eyebrow: "Part three — the hard one",
    resultsHead: "Here's the <em>truth</em>.",
    footerNote: "Affectionate teasing. Not therapy.",
  },

  /**
   * Per-quiz palette — applied as inline CSS variables on the quiz page wrapper.
   * Keep variable names in sync with shared CSS (see app/globals.css).
   */
  palette: {
    "--bg": "#F5F1E8",
    "--ink": "#1A2238",
    "--accent": "#D67651", // clay / terracotta
    "--accent-soft": "#F4D4C2", // peach
    "--p2-color": "#D67651",

    "--opt1-bg": "#F4D4C2", // clay-soft
    "--opt2-bg": "#B8D8D3", // sage

    "--quad-tl": "#B8D8D3", // Mature + Unaware = Mellow — sage
    "--quad-tr": "#F4D4C2", // Mature + Aware = Sage — clay-soft
    "--quad-bl": "#C9C2DD", // Immature + Unaware = Storm — lavender
    "--quad-br": "#F0D88A", // Immature + Aware = Diarist — butter

    "--bg-glow-1": "rgba(214,118,81,0.10)",
    "--bg-glow-2": "rgba(184,216,211,0.30)",

    "--ink-soft": "rgba(26,34,56,0.72)",
    "--ink-muted": "rgba(26,34,56,0.55)",
    "--ink-faint": "rgba(26,34,56,0.45)",
    "--ink-fade": "rgba(26,34,56,0.28)",
    "--ink-tint": "rgba(26,34,56,0.08)",
  },
};

export default grownup;
