"use client";

import { useRef, useState } from "react";

interface Props {
  label: string;
  url: string;
}

/**
 * Readonly URL input + Copy button.
 * Never invokes navigator.share() — we just want a copy-paste-friendly link.
 */
export default function ShareBlock({ label, url }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [copied, setCopied] = useState(false);

  function selectAll() {
    const el = inputRef.current;
    if (!el) return;
    try {
      el.select();
      el.setSelectionRange(0, url.length);
    } catch {
      /* noop */
    }
  }

  async function copy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        fallbackCopy(url);
      }
    } catch {
      fallbackCopy(url);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="share-block">
      <div className="share-label">{label}</div>
      <div className="share-row">
        <input
          ref={inputRef}
          type="text"
          className="share-url"
          readOnly
          value={url}
          onFocus={selectAll}
          onClick={selectAll}
        />
        <button
          type="button"
          className={`share-copy${copied ? " copied" : ""}`}
          onClick={copy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function fallbackCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    /* ignore */
  }
  document.body.removeChild(ta);
}
