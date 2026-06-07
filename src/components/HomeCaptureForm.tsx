"use client";

import { useState } from "react";

export default function HomeCaptureForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="max-w-[560px] mx-auto text-center">
        <div className="p-5 bg-[rgba(208,2,27,0.1)] border border-[rgba(208,2,27,0.3)] rounded-[10px] text-dr-red-mid text-[15px] leading-relaxed">
          &#10003; You&apos;re on the list. We&apos;ll be in touch before launch.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[560px] mx-auto text-center">
      <div className="text-xs font-semibold tracking-[1.5px] uppercase text-dr-red-mid mb-3.5">
        Early Access &middot; Limited Spots
      </div>
      <h2 className="text-[clamp(26px,3.5vw,40px)] font-bold tracking-tight leading-[1.15] text-white mb-3">
        Be first to know<br />when DrRuby <em className="italic text-dr-red-mid">launches.</em>
      </h2>
      <p className="text-base text-[#aaa] mb-9 leading-relaxed">
        Join the waitlist. Early members get 3 months Pro free and shape what we build.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className="w-full py-[14px] px-[18px] bg-white/7 border border-white/15 rounded-[10px] text-white text-[15px] outline-none focus:border-dr-red-mid transition-colors placeholder:text-[#666]"
            type="text"
            name="FNAME"
            placeholder="First name"
            required
          />
          <input
            className="w-full py-[14px] px-[18px] bg-white/7 border border-white/15 rounded-[10px] text-white text-[15px] outline-none focus:border-dr-red-mid transition-colors placeholder:text-[#666]"
            type="email"
            name="EMAIL"
            placeholder="Email address"
            required
          />
        </div>
        <input
          className="w-full py-[14px] px-[18px] bg-white/7 border border-white/15 rounded-[10px] text-white text-[15px] outline-none focus:border-dr-red-mid transition-colors placeholder:text-[#666]"
          type="tel"
          name="PHONE"
          placeholder="Phone (optional — for launch SMS)"
        />
        <button
          type="submit"
          className="w-full py-4 bg-dr-red text-white border-none rounded-[10px] text-base font-semibold cursor-pointer hover:opacity-85 transition-opacity mt-1"
        >
          Join the Waitlist &rarr;
        </button>
      </form>
      <p className="text-[13px] text-[#555] mt-2">No spam, ever. Unsubscribe anytime.</p>
    </div>
  );
}
