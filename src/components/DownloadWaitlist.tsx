"use client";

import { useEffect, useState, type FormEvent } from "react";

/**
 * When the app ships, set this to the store URL (or a smart App Store /
 * Google Play redirect). While it's empty, the store buttons open the
 * "join the waitlist" modal instead of navigating.
 */
const APP_STORE_URL = "";

const OPEN_EVENT = "drruby:open-download";

/** Store buttons (and the nav Download button) call this. */
function triggerDownload() {
  if (APP_STORE_URL) {
    window.open(APP_STORE_URL, "_blank", "noopener");
    return;
  }
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/* ── Store button icons ─────────────────────────────────────── */
export function AppleIcon() {
  return (
    <svg viewBox="0 0 384 512" aria-hidden="true">
      <path
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
        fill="#111"
      />
    </svg>
  );
}

export function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true">
      <path
        d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"
        fill="#111"
      />
    </svg>
  );
}

/** The App Store + Google Play button pair used throughout the page. */
export function StoreRow() {
  return (
    <span className="store-row">
      <button
        type="button"
        className="store-btn"
        onClick={triggerDownload}
        aria-label="Download on the App Store"
      >
        <AppleIcon />
        <span>App Store</span>
      </button>
      <button
        type="button"
        className="store-btn"
        onClick={triggerDownload}
        aria-label="Get it on Google Play"
      >
        <GooglePlayIcon />
        <span>Google Play</span>
      </button>
    </span>
  );
}

/** The single "Download" button in the top nav. */
export function NavDownloadButton() {
  return (
    <button
      type="button"
      className="store-btn"
      onClick={triggerDownload}
      aria-label="Download DrRuby"
    >
      <AppleIcon />
      <span>Download</span>
    </button>
  );
}

type SubmitStatus = "idle" | "loading" | "ok" | "err";

/**
 * The download waitlist modal. Mount once on the page. It opens whenever
 * any store button is clicked (via the OPEN_EVENT), captures an email into
 * Mailchimp (tag: app-download-waitlist), and confirms in place.
 */
export function DownloadModal() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    // Reset back to the form after the fade so a re-open starts fresh.
    window.setTimeout(() => {
      setStatus("idle");
      setMsg("");
    }, 200);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    const email = (e.currentTarget.elements.namedItem("EMAIL") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/mailchimp/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, formId: "download" }),
      });
      const result = await res.json();
      if (res.ok && !result.error) {
        setStatus("ok");
      } else {
        setStatus("err");
        setMsg(result.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("err");
      setMsg("Network error. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(30,15,18,.45)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Download DrRuby"
    >
      <div
        style={{
          background: "#fff",
          maxWidth: 420,
          width: "calc(100% - 40px)",
          borderRadius: 22,
          padding: "34px 30px 28px",
          textAlign: "center",
          boxShadow: "0 40px 90px rgba(40,20,20,.30)",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 18,
            fontSize: 24,
            color: "#c1b5af",
            cursor: "pointer",
            lineHeight: 1,
            background: "none",
            border: 0,
          }}
        >
          &times;
        </button>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "#1a1614", marginBottom: 8 }}>
          Download DrRuby
        </div>
        <div style={{ fontSize: 15, color: "#6b635e", lineHeight: 1.55, marginBottom: 20 }}>
          Launching soon. Join the waitlist and we&rsquo;ll send you the download link the moment
          it&rsquo;s available.
        </div>

        {status === "ok" ? (
          <div style={{ fontSize: 15, color: "#2e7d5b", fontWeight: 600, padding: "6px 0 4px" }}>
            Thanks &mdash; we&rsquo;ll email you the download link at launch.
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <input
              type="email"
              name="EMAIL"
              required
              placeholder="Your email"
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #e6ddd7",
                borderRadius: 12,
                fontSize: 15,
                fontFamily: "inherit",
                marginBottom: 10,
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%",
                justifyContent: "center",
                display: "inline-flex",
                alignItems: "center",
                background: "#cf1736",
                color: "#fff",
                border: 0,
                borderRadius: 999,
                padding: "14px 22px",
                fontSize: 14,
                fontWeight: 750,
                cursor: status === "loading" ? "default" : "pointer",
                opacity: status === "loading" ? 0.7 : 1,
              }}
            >
              {status === "loading" ? "Joining…" : "Join the waitlist"}
            </button>
            {status === "err" && (
              <div style={{ fontSize: 13, color: "#cf1736", marginTop: 10 }}>{msg}</div>
            )}
          </form>
        )}
        <div style={{ fontSize: 12, color: "#a89a95", marginTop: 14 }}>No spam. Just the launch.</div>
      </div>
    </div>
  );
}
