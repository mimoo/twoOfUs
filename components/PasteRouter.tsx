"use client";

import { useState } from "react";
import { b64urlEncode, parseAnyInput } from "@/lib/hash";
import type { ParsedRoute } from "@/lib/types";

const QUIZ_PAGES: Record<string, string> = {
  relationship: "relationship",
  leader: "leader",
  grownup: "grownup",
};

/**
 * Landing-page helper: paste any `#me=`, `#us=`, or `#trio=` link
 * and we route to the right quiz / combo page.
 */
export default function PasteRouter() {
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  function setError(text: string) {
    setMsg(text);
    setIsError(true);
  }
  function setNote(text: string) {
    setMsg(text);
    setIsError(false);
  }

  function go() {
    const route = parseAnyInput(value);
    if (!route) {
      if (!value.trim()) {
        setError("Paste a quiz link first.");
      } else {
        setError("That doesn't look like a quiz link.");
      }
      return;
    }
    setNote("Loading…");
    const target = buildTarget(route);
    if (!target) {
      setError("Unknown quiz id in that link.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="paste-row">
      <label htmlFor="pasteInput">Already have results? Paste your link.</label>
      <div className="paste-input-wrap">
        <input
          id="pasteInput"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="paste #me=… or #us=… or #trio=…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (isError) {
              setMsg("");
              setIsError(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              go();
            }
          }}
        />
        <button type="button" onClick={go}>
          Go →
        </button>
      </div>
      <div className={`paste-msg${isError ? " error" : ""}`}>{msg}</div>
    </div>
  );
}

function buildTarget(route: ParsedRoute): string | null {
  // Use relative URLs so basePath is honored automatically by the browser.
  // The current page is the landing page; sibling routes are at "./<quiz>/".
  const search = typeof window !== "undefined" ? window.location.search : "";
  if (route.kind === "trio") {
    // Combo page is shipped by Wave 2.
    return `./combo/${search}#trio=${b64urlEncode(route.data)}`;
  }
  const quizId = route.data.q;
  const page = QUIZ_PAGES[quizId];
  if (!page) return null;
  return `./${page}/${search}#${route.kind}=${b64urlEncode(route.data)}`;
}
