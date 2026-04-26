import type { QuizConfig } from "@/lib/types";

const relationship: QuizConfig = {
  id: "relationship",
  title: "Who does <em>what</em>?",
  intro:
    "Twenty-four honest questions across two axes — care direction (mother / baby) and whose preferences win (tyrant / serf). At the end you'll see exactly where you both land.",

  axes: {
    y: { pos: "mother", neg: "baby", posLabel: "Mother", negLabel: "Baby" },
    x: { pos: "tyrant", neg: "serf", posLabel: "Tyrant", negLabel: "Serf" },
  },

  questions: [
    { text: "Who packs snacks 'just in case'?", axis: "mother" },
    { text: "Who picks the restaurant?", axis: "tyrant" },
    { text: "Who falls asleep on the other in the car or on the couch?", axis: "baby" },
    { text: "Who says 'whatever you want' — and means it?", axis: "serf" },

    { text: "Who texts 'did you eat today?' or 'let me know when you land'?", axis: "mother" },
    { text: "Who controls the thermostat or AC remote?", axis: "tyrant" },
    { text: "Who hands packages to the other to open?", axis: "baby" },
    { text: "Who apologizes first after a fight?", axis: "serf" },

    { text: "Who remembers the other's mom's birthday?", axis: "mother" },
    { text: "Who picks the show on TV?", axis: "tyrant" },
    { text: "Who throws a hangry tantrum?", axis: "baby" },
    { text: "Who carries the bags?", axis: "serf" },

    { text: "Who notices when the other is quiet and asks what's wrong?", axis: "mother" },
    { text: "Who orders for the table at a restaurant?", axis: "tyrant" },
    { text: "Who lets the other deal with the waiter or customer service?", axis: "baby" },
    { text: "Who reshuffles their schedule to fit the other's?", axis: "serf" },

    { text: "Who saves the last bite or the unbroken cookie for the other?", axis: "mother" },
    { text: "Who decides when to leave a party?", axis: "tyrant" },
    { text: "Who says 'where's my…' while it's right in front of them?", axis: "baby" },
    { text: "Who sits through shows they don't enjoy?", axis: "serf" },

    { text: "Who books appointments the other keeps putting off?", axis: "mother" },
    { text: "Whose aesthetic does the home quietly run on?", axis: "tyrant" },
    { text: "Who eats off the other's plate?", axis: "baby" },
    { text: "Who gives up the window seat, the aux cord, the last word?", axis: "serf" },
  ],

  archetypes: {
    "mother+tyrant": {
      emoji: "👑🍼",
      name: "The Matriarch",
      blurb:
        "Runs the show, packs the snacks, picks the movie. Loving but unmistakably in charge — God bless.",
      klass: "matriarch",
    },
    "mother+serf": {
      emoji: "🌷",
      name: "The Caretaker",
      blurb:
        "Will do anything for you and ask for nothing back. A walking saint with a tote bag full of band-aids.",
      klass: "caretaker",
    },
    "baby+tyrant": {
      emoji: "👶👑",
      name: "The Royal Baby",
      blurb:
        "Demands snacks. Picks the restaurant. Will not be cold. Somehow gets away with all of it because they're so cute about it.",
      klass: "royalbaby",
    },
    "baby+serf": {
      emoji: "🐶",
      name: "The Puppy",
      blurb:
        "Easy, breezy, agreeable. Whatever you want, sweetie. Asleep on the couch by 9pm.",
      klass: "puppy",
    },
  },

  quadLabels: {
    tl: "Caretaker",
    tr: "Matriarch",
    bl: "Puppy",
    br: "Royal Baby",
  },

  copy: {
    eyebrow: "A relationship diagnostic",
    resultsHead: "Here's the <em>truth</em>.",
    footerNote: "Diagnosis is non-binding. Probably.",
  },

  /**
   * Per-quiz palette — applied as inline CSS variables on the quiz page wrapper.
   * Keep variable names in sync with shared CSS (see app/globals.css).
   */
  palette: {
    "--bg": "#FFF1E0",
    "--ink": "#1F1226",
    "--accent": "#FF4D7E",
    "--accent-soft": "#FFDDE6",
    "--p2-color": "#FF4D7E",

    "--opt1-bg": "#FFDDE6", // pink-soft
    "--opt2-bg": "#B8E8C8", // mint

    "--quad-tl": "#B8E8C8", // Caretaker — mint
    "--quad-tr": "#FFDDE6", // Matriarch — pink-soft
    "--quad-bl": "#E8DFFF", // Puppy — lilac
    "--quad-br": "#FFD66B", // Royal Baby — yellow

    "--bg-glow-1": "rgba(255,77,126,0.10)",
    "--bg-glow-2": "rgba(184,232,200,0.22)",

    "--ink-soft": "rgba(31,18,38,0.72)",
    "--ink-muted": "rgba(31,18,38,0.55)",
    "--ink-faint": "rgba(31,18,38,0.45)",
    "--ink-fade": "rgba(31,18,38,0.28)",
    "--ink-tint": "rgba(31,18,38,0.08)",
  },
};

export default relationship;
