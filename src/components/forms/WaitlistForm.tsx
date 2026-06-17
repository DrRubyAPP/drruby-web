"use client";

import { type FormEvent, type ReactNode, useState } from "react";

interface ConcernOption {
  label: string;
  value: string;
}

interface WaitlistFormProps {
  title: ReactNode;
  subtitle: string;
  ageOptions?: string[];
  concerns: ConcernOption[];
  showSpend?: boolean;
  showWinning?: boolean;
  formId: string;
}

type SubmitStatus = "idle" | "loading" | "ok" | "err";

export default function WaitlistForm({
  title,
  subtitle,
  ageOptions,
  concerns,
  showSpend,
  showWinning,
  formId,
}: WaitlistFormProps) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [msg, setMsg] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  const spendOptions = [
    "Under $50",
    "$50–$150",
    "$150–$300",
    "$300–$500",
    "$500+",
  ];

  function toggleConcern(value: string) {
    setSelectedConcerns((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    const form = e.currentTarget;
    const data = {
      email: (form.elements.namedItem("EMAIL") as HTMLInputElement).value,
      firstName: (form.elements.namedItem("FNAME") as HTMLInputElement).value,
      phone:
        (form.elements.namedItem("PHONE") as HTMLInputElement)?.value || "",
      formId,
      // Extra fields for Mailchimp merge fields
      age: ageOptions
        ? (form.elements.namedItem("AGE") as HTMLSelectElement)?.value || ""
        : "",
      concerns: selectedConcerns.join(", "),
      spend: showSpend
        ? (form.elements.namedItem("SPEND") as HTMLSelectElement)?.value || ""
        : "",
      winning: showWinning
        ? (form.elements.namedItem("WINNING") as HTMLInputElement)?.value || ""
        : "",
    };

    try {
      const res = await fetch("/api/mailchimp/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && !result.error) {
        setStatus("ok");
        setMsg(result.message || "You're on the list!");
      } else {
        setStatus("err");
        setMsg(result.error || "Something went wrong.");
      }
    } catch {
      setStatus("err");
      setMsg("Network error. Please try again.");
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
      <div>
        <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red mb-3">
          Join the Waitlist
        </div>
        <h2 className="text-[clamp(28px,4vw,42px)] font-bold tracking-tight leading-tight text-dr-black mb-3">
          {title}
        </h2>
        <p className="text-[17px] text-[#666] max-w-[540px] leading-relaxed">
          {subtitle}
        </p>
      </div>

      {status === "ok" ? (
        <div className="bg-dr-off border border-dr-border rounded-[20px] p-9 shadow-[0_4px_40px_rgba(0,0,0,0.06)] text-center">
          <div className="text-2xl mb-3">&#10003;</div>
          <p className="text-lg font-semibold text-dr-black mb-2">{msg}</p>
          <p className="text-sm text-dr-muted">
            We&apos;ll be in touch before launch.
          </p>
        </div>
      ) : (
        <form
          className="bg-dr-off border border-dr-border rounded-[20px] p-9 shadow-[0_4px_40px_rgba(0,0,0,0.06)]"
          onSubmit={onSubmit}
        >
          <h3 className="text-xl font-bold tracking-tight mb-1.5">
            Get Early Access
          </h3>
          <p className="text-sm text-dr-muted mb-6">
            {subtitle.split(".")[0]}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="wf-fname"
                className="text-xs font-semibold tracking-[0.5px] uppercase text-[#555]"
              >
                First Name
              </label>
              <input
                id="wf-fname"
                className="p-3 border border-dr-border rounded-lg text-[15px] bg-white outline-none focus:border-dr-red transition-colors"
                type="text"
                name="FNAME"
                placeholder="Your name"
                required
                disabled={status === "loading"}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="wf-email"
                className="text-xs font-semibold tracking-[0.5px] uppercase text-[#555]"
              >
                Email
              </label>
              <input
                id="wf-email"
                className="p-3 border border-dr-border rounded-lg text-[15px] bg-white outline-none focus:border-dr-red transition-colors"
                type="email"
                name="EMAIL"
                placeholder="your@email.com"
                required
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-3.5">
            <label
              htmlFor="wf-phone"
              className="text-xs font-semibold tracking-[0.5px] uppercase text-[#555]"
            >
              Phone{" "}
              <span className="font-normal text-[#aaa]">
                (optional — for launch SMS)
              </span>
            </label>
            <input
              id="wf-phone"
              className="p-3 border border-dr-border rounded-lg text-[15px] bg-white outline-none focus:border-dr-red transition-colors"
              type="tel"
              name="PHONE"
              placeholder="+1 (___) ___-____"
              disabled={status === "loading"}
            />
          </div>

          {ageOptions && (
            <div className="flex flex-col gap-1.5 mb-3.5">
              <label
                htmlFor="wf-age"
                className="text-xs font-semibold tracking-[0.5px] uppercase text-[#555]"
              >
                Age range
              </label>
              <select
                id="wf-age"
                name="AGE"
                className="p-3 border border-dr-border rounded-lg text-[15px] bg-white outline-none focus:border-dr-red transition-colors text-dr-black appearance-none"
                defaultValue=""
              >
                <option value="" disabled>
                  Select your age
                </option>
                {ageOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5 mb-3.5">
            <span className="text-xs font-semibold tracking-[0.5px] uppercase text-[#555]">
              {showWinning
                ? "What are you experiencing? (pick all that apply)"
                : "Main skin concern (pick all that apply)"}
            </span>
            <div className="flex flex-col gap-2.5">
              {concerns.map((c) => {
                const checked = selectedConcerns.includes(c.value);
                return (
                  <label
                    key={c.value}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleConcern(c.value)}
                    />
                    <span
                      aria-hidden="true"
                      className={`w-[18px] h-[18px] border-[1.5px] rounded flex-shrink-0 flex items-center justify-center transition-colors ${
                        checked ? "bg-dr-red border-dr-red" : "border-dr-border"
                      }`}
                    >
                      {checked && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="text-[15px] text-dr-black">{c.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {showSpend && (
            <div className="flex flex-col gap-1.5 mb-3.5">
              <label
                htmlFor="wf-spend"
                className="text-xs font-semibold tracking-[0.5px] uppercase text-[#555]"
              >
                Monthly skincare spend
              </label>
              <select
                id="wf-spend"
                name="SPEND"
                className="p-3 border border-dr-border rounded-lg text-[15px] bg-white outline-none focus:border-dr-red transition-colors text-dr-black appearance-none"
                defaultValue=""
              >
                <option value="" disabled>
                  Select range
                </option>
                {spendOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {showWinning && (
            <div className="flex flex-col gap-1.5 mb-3.5">
              <label
                htmlFor="wf-winning"
                className="text-xs font-semibold tracking-[0.5px] uppercase text-[#555]"
              >
                What does &quot;winning&quot; look like for you?
              </label>
              <input
                id="wf-winning"
                className="p-3 border border-dr-border rounded-lg text-[15px] bg-white outline-none focus:border-dr-red transition-colors"
                type="text"
                name="WINNING"
                placeholder="e.g. Hike with my kids, sleep through the night..."
                disabled={status === "loading"}
              />
            </div>
          )}

          {status === "err" && (
            <p className="text-dr-red text-sm mb-3">{msg}</p>
          )}

          <p className="text-xs text-[#aaa] leading-relaxed mb-4">
            No spam, ever. You can unsubscribe at any time.
          </p>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-dr-red text-white border-none py-[15px] rounded-[10px] text-base font-bold cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Subscribing..." : "Join the Waitlist →"}
          </button>
        </form>
      )}
    </div>
  );
}
