"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ONBOARDING_CONCERNS } from "@/config/user-portal-mock";

type Screen = 1 | 2 | 3;

export default function OnboardingFlow() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(1);
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(id: string) {
    setSelected(id);
    // §2.1 — auto-advance, no "Continue" button needed
    setTimeout(() => setScreen(2), 220);
  }

  function handleConnectAppleHealth() {
    // Mock — in production this triggers HealthKit authorization
    setScreen(3);
  }

  function handleSkip() {
    setScreen(3);
  }

  function handleFinish() {
    router.push("/portal");
  }

  if (screen === 1) {
    return (
      <div className="min-h-screen bg-dr-off flex items-center justify-center px-6 py-12">
        <div className="max-w-[640px] w-full">
          <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-4">
            DrRuby Onboarding · Step 1 of 3
          </div>
          <h1 className="font-serif text-[40px] md:text-[48px] font-light text-dr-ink leading-[1.15] mb-3">
            What's the one thing that's been <em className="italic text-dr-red">bothering you</em> most lately?
          </h1>
          <p className="text-[13px] text-dr-mid mb-8 leading-[1.7]">
            Pick one. You can change this later — DrRuby adapts as you use it.
          </p>
          <div className="flex flex-col gap-2.5">
            {ONBOARDING_CONCERNS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c.id)}
                className={`text-left p-4 border transition-all text-[14px] ${
                  selected === c.id
                    ? "border-dr-red bg-[rgba(200,16,46,0.04)] text-dr-ink"
                    : "border-dr-border bg-dr-white text-dr-ink hover:border-dr-mid"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-dr-mid mt-6">
            No account needed yet — answer first, sign up later if it's useful.
          </div>
        </div>
      </div>
    );
  }

  if (screen === 2) {
    return (
      <div className="min-h-screen bg-dr-off flex items-center justify-center px-6 py-12">
        <div className="max-w-[560px] w-full">
          <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-4">
            DrRuby Onboarding · Step 2 of 3
          </div>
          <h1 className="font-serif text-[36px] md:text-[42px] font-light text-dr-ink leading-[1.15] mb-3">
            Connect your health data for <em className="italic text-dr-red">personalized insights.</em>
          </h1>
          <p className="text-[13px] text-dr-mid mb-8 leading-[1.7]">
            You can always do this later. Skipping won't lock any features —
            DrRuby will use population baselines until you connect.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleConnectAppleHealth}
              className="bg-dr-ink text-white px-5 py-4 text-[13px] font-semibold tracking-[0.14em] uppercase border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
            >
              <span className="text-[18px]">🍎</span>
              Connect Apple Health
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="text-[12px] text-dr-mid underline underline-offset-4 cursor-pointer hover:text-dr-ink transition-colors mt-2"
            >
              Skip for now
            </button>
          </div>
          <div className="mt-8 flex items-center gap-2 text-[11px] text-dr-mid">
            <span className="w-1.5 h-1.5 rounded-full bg-dr-success" />
            Your data stays on your device. Never shared, never sold.
          </div>
        </div>
      </div>
    );
  }

  // Screen 3 — Day 1 value delivery
  return (
    <div className="min-h-screen bg-dr-off flex items-center justify-center px-6 py-12">
      <div className="max-w-[680px] w-full">
        <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-4">
          DrRuby Onboarding · Step 3 of 3 · Your first answer
        </div>
        <h1 className="font-serif text-[36px] md:text-[44px] font-light text-dr-ink leading-[1.15] mb-2">
          This isn't just your skin.
        </h1>
        <div className="text-[11px] text-dr-mid mb-6">
          Based on patterns typical for women your age · No personal data
          connected yet
        </div>

        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            What we noticed
          </div>
          <p className="text-[13px] text-dr-ink leading-[1.7] mb-3">
            Breakouts in women 40+ are rarely just a skin issue. They often
            track sleep quality, hormonal shifts, and stress — all of which
            affect your skin barrier 7–10 days before you see anything.
          </p>
          <p className="text-[13px] text-dr-ink leading-[1.7]">
            The good news: this means you have multiple levers to pull, not just
            one. The first one is almost always sleep consistency.
          </p>
        </div>

        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            Try this week
          </div>
          <div className="font-serif text-[18px] font-light text-dr-ink leading-[1.4] mb-2">
            Same bedtime every night for 7 days — even weekends.
          </div>
          <div className="text-[12px] text-dr-mid">
            That's it. No new products, no supplements, no routine overhaul.
          </div>
        </div>

        <div className="bg-dr-white border border-dr-border p-5 mb-6">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            Save your money
          </div>
          <div className="text-[13px] text-dr-ink leading-[1.7]">
            Don't buy a new serum this week. Topical products can't fix a
            systemic pattern — and you'd be out $60–$120 for no reason.
          </div>
        </div>

        <div className="bg-dr-ink p-5 flex items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[rgba(200,16,46,0.6)] mb-1">
              Save your insights
            </div>
            <div className="font-serif text-[18px] font-light text-white leading-[1.3]">
              Create a free account to track your progress and get proactive
              insights.
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="bg-dr-red text-white px-5 py-3 text-[12px] font-semibold tracking-[0.16em] uppercase border-none cursor-pointer flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            Create free account →
          </button>
        </div>

        <div className="text-[11px] text-dr-mid leading-[1.6] mt-4">
          DrRuby provides health insights based on your personal data, not
          medical diagnoses. Always consult a qualified healthcare provider for
          medical concerns.
        </div>
      </div>
    </div>
  );
}
