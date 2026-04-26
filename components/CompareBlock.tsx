"use client";

import { useState } from "react";
import { b64urlEncode, parseAnyInput } from "@/lib/hash";
import { combineMeAndMe } from "@/lib/scoring";
import type { MePayload, QuizConfig } from "@/lib/types";

interface Props {
  quiz: QuizConfig;
  label: string;
  /** If present, pasting a `#me=` link merges with this and navigates to `#us=`. */
  myPayload: MePayload | null;
}

/**
 * Paste-input + "Compare" button. Supports pasting either
 * a `#me=` link (which gets merged with myPayload into a `#us=`)
 * or a `#us=` link (which we just navigate to).
 */
export default function CompareBlock({ quiz, label, myPayload }: Props) {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [isError, setIsError] = useState(false);

  function setError(text: string) {
    setMsg(text);
    setIsError(true);
  }
  function clearMsg() {
    setMsg("");
    setIsError(false);
  }

  function go() {
    const raw = value;
    if (!raw || !raw.trim()) {
      setError("Paste a link first.");
      return;
    }
    const route = parseAnyInput(raw);
    if (!route) {
      setError("That doesn't look like a quiz link from this site.");
      return;
    }

    if (route.kind === "trio") {
      setError("That's a trio link — open the combo page to see it.");
      return;
    }

    if (route.kind === "us") {
      // Already a comparison link → navigate to it.
      // Verify quiz id matches if it's tied to a specific quiz.
      if (route.data.q !== quiz.id) {
        setError("That link is from a different quiz.");
        return;
      }
      window.location.hash = "#us=" + b64urlEncode(route.data);
      return;
    }

    // route.kind === 'me'
    if (route.data.q !== quiz.id) {
      setError("That link is from a different quiz.");
      return;
    }

    if (!myPayload) {
      window.location.hash = "#me=" + b64urlEncode(route.data);
      return;
    }
    const us = combineMeAndMe(quiz, myPayload, route.data);
    window.location.hash = "#us=" + b64urlEncode(us);
  }

  return (
    <div className="compare-block">
      <div className="compare-label">{label}</div>
      <div className="share-row">
        <input
          type="url"
          className="share-url"
          placeholder="paste their link here"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (isError) clearMsg();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              go();
            }
          }}
        />
        <button
          type="button"
          className="share-copy compare-go"
          onClick={go}
        >
          Compare
        </button>
      </div>
      <div className={`compare-msg${isError ? " error" : ""}`}>{msg}</div>
    </div>
  );
}
