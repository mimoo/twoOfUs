/**
 * URL hash payload encoding/decoding + fragment parsing.
 *
 * Hashes are versioned JSON, base64url-encoded:
 *   - `+` / `/`  → `-` / `_`
 *   - trailing `=` padding stripped
 *
 * Recognized hash kinds (legacy `invite=` / `results=` are NOT supported).
 */

import type {
  AnyPayload,
  MePayload,
  ParsedRoute,
  QuizId,
  TrioPayload,
  UsPayload,
} from "./types";

const QUIZ_PAGES: Record<QuizId, string> = {
  relationship: "relationship",
  leader: "leader",
  grownup: "grownup",
};

export function pageForQuiz(q: QuizId): string {
  return QUIZ_PAGES[q];
}

export function b64urlEncode(obj: unknown): string {
  const json = JSON.stringify(obj);
  // utf8-safe btoa
  let b64: string;
  try {
    const utf8 = unescape(encodeURIComponent(json));
    b64 = btoa(utf8);
  } catch {
    b64 = btoa(json);
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode<T = unknown>(str: string): T | null {
  let s = String(str).replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  let utf8: string;
  try {
    utf8 = atob(s);
  } catch {
    return null;
  }
  let json: string;
  try {
    json = decodeURIComponent(escape(utf8));
  } catch {
    json = utf8;
  }
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Parse a hash fragment (without the leading `#`) into a route.
 * Returns null on failure or version/quiz mismatch.
 *
 * `expectedQuiz`: if provided, only accepts payloads whose `q` field matches.
 */
export function parseHashFragment(
  frag: string,
  expectedQuiz?: QuizId,
): ParsedRoute | null {
  if (!frag) return null;
  const eq = frag.indexOf("=");
  if (eq < 0) return null;
  const kind = frag.slice(0, eq).toLowerCase();
  const value = frag.slice(eq + 1);
  const data = b64urlDecode<AnyPayload>(value);
  if (!data) return null;

  if (kind === "me" && data.m === "me") {
    if (expectedQuiz && data.q !== expectedQuiz) return null;
    return { kind: "me", data: data as MePayload };
  }
  if (kind === "us" && data.m === "us") {
    if (expectedQuiz && data.q !== expectedQuiz) return null;
    return { kind: "us", data: data as UsPayload };
  }
  if (kind === "trio" && data.m === "trio") {
    return { kind: "trio", data: data as TrioPayload };
  }
  return null;
}

/**
 * Parse anything the user might paste (full URL, bare fragment, or
 * `me=…` without the `#`). Returns null if it doesn't look like ours.
 */
export function parseAnyInput(raw: string): ParsedRoute | null {
  if (!raw) return null;
  let frag = raw.trim();
  const idx = frag.indexOf("#");
  if (idx >= 0) frag = frag.slice(idx + 1);
  return parseHashFragment(frag);
}

/**
 * Read the current `window.location.hash` payload, if any.
 * Returns null on the server.
 */
export function readHashPayload(expectedQuiz?: QuizId): ParsedRoute | null {
  if (typeof window === "undefined") return null;
  const frag = (window.location.hash || "").slice(1);
  return parseHashFragment(frag, expectedQuiz);
}

/**
 * Outcome of parsing a `#trio=…` hash:
 *   - `none`    → no hash present (or no `#trio=` prefix)
 *   - `error`   → hash present but malformed / wrong version
 *   - `ok`      → decoded TrioPayload
 */
export type TrioParse =
  | { kind: "none" }
  | { kind: "error"; reason: string }
  | { kind: "ok"; data: TrioPayload };

/**
 * Parse a `#trio=…` fragment into a TrioPayload (or report why it failed).
 * `frag` is the hash WITHOUT the leading `#`.
 */
export function parseTrioHash(frag: string): TrioParse {
  if (!frag) return { kind: "none" };
  if (!frag.startsWith("trio=")) return { kind: "none" };
  const value = frag.slice("trio=".length);
  const data = b64urlDecode<TrioPayload>(value);
  if (!data) return { kind: "error", reason: "Couldn't decode the link." };
  if (data.m !== "trio")
    return { kind: "error", reason: "Not a trio link." };
  if (data.v !== 1)
    return { kind: "error", reason: "Unknown payload version." };
  return { kind: "ok", data };
}
