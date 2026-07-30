"use client";

import { useState, type FormEvent } from "react";

type SubmitStatus = "idle" | "loading" | "ok" | "err";

export default function FooterSubscribe() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("EMAIL") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/mailchimp/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, formId: "home" }),
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

  if (status === "ok") {
    return <div className="ft-done">Thanks &mdash; you&rsquo;re on the list.</div>;
  }

  return (
    <>
      <form className="ft-form" onSubmit={onSubmit}>
        <input
          type="email"
          name="EMAIL"
          required
          placeholder="Email address"
          aria-label="Email address"
          disabled={status === "loading"}
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Submitting…" : "Submit"}
        </button>
      </form>
      {status === "err" && <div className="ft-err">{msg}</div>}
    </>
  );
}
