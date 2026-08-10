"use client";

import { useState } from "react";
import AnswerPage from "@/components/sections/portal/AnswerPage";
import {
  MOMENT2_ANSWER,
  MOMENT2_DATA_SOURCES,
  MOMENT2_DURATIONS,
  MOMENT2_SUPPLEMENTS,
  MOMENT2_TOO_EARLY_ANSWER,
  SUPPLEMENT_TARGETS,
  VERDICT_CONFIG,
  type VerdictType,
} from "@/config/user-portal-mock";
import {
  buildEntryText,
  moment2ChipsSummary,
  moment2ToQuestion,
} from "./mappers";
import { SaveAsDecisionButton } from "./SaveAsDecisionButton";

type Screen = "select" | "loading" | "answer";

// §5.2 Verdict derivation:
//   < 4 weeks of use → TOO_EARLY (data insufficient)
//   ≥ 4 weeks → mock CONTINUE signal (Magnesium demo path)
// §5.3: new supplement (no active log) auto-enters TOO_EARLY — represented
// here by the < 4 week durations.
function deriveVerdict(duration: string): VerdictType {
  if (duration === "lt-2w" || duration === "2-4w") return "TOO_EARLY";
  return "CONTINUE";
}

export default function Moment2Flow() {
  const [screen, setScreen] = useState<Screen>("select");
  const [supplement, setSupplement] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  const verdict: VerdictType = duration ? deriveVerdict(duration) : "CONTINUE";
  const answer =
    verdict === "TOO_EARLY" ? MOMENT2_TOO_EARLY_ANSWER : MOMENT2_ANSWER;
  const targets = supplement ? SUPPLEMENT_TARGETS[supplement] : null;
  const supplementLabel = MOMENT2_SUPPLEMENTS.find(
    (s) => s.id === supplement,
  )?.label;

  function handleAnalyze() {
    if (!supplement || !duration) return;
    setScreen("loading");
    // §4.1 — Loading minimum 2.5s even if data returns faster
    setTimeout(() => setScreen("answer"), 2800);
  }

  if (screen === "select") {
    return (
      <div className="max-w-[680px]">
        <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-3">
          Moment 2 · Is this worth it?
        </div>
        <h1 className="font-serif text-[36px] md:text-[44px] font-light text-dr-ink leading-[1.15] mb-7">
          Let's check if it's{" "}
          <em className="italic text-dr-red">actually working.</em>
        </h1>

        {/* Question 1 */}
        <div className="mb-7">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-dr-ink mb-3">
            1 · What are you evaluating?
          </div>
          <div className="flex flex-wrap gap-2.5">
            {MOMENT2_SUPPLEMENTS.map((s) => {
              const active = supplement === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSupplement(s.id)}
                  className={`text-[12px] font-medium px-4 py-2.5 border rounded-[20px] cursor-pointer transition-all ${
                    active
                      ? "border-dr-red bg-[rgba(200,16,46,0.06)] text-dr-ink"
                      : "border-dr-border bg-dr-white text-dr-ink hover:border-dr-mid"
                  }`}
                >
                  {active && "✓ "}
                  {s.label}
                </button>
              );
            })}
          </div>
          {targets && (
            <div className="mt-3 text-[11px] text-dr-mid leading-[1.6]">
              <span className="font-semibold tracking-[0.12em] uppercase text-dr-ink mr-2">
                Targets:
              </span>
              {targets.primary.join(", ")}
              {targets.secondary.length > 0 &&
                ` · secondary: ${targets.secondary.join(", ")}`}
              <span className="ml-2">
                · expected onset {targets.onsetWeeks} weeks
              </span>
            </div>
          )}
        </div>

        {/* Question 2 */}
        <div className="mb-8">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-dr-ink mb-3">
            2 · How long have you been taking it?
          </div>
          <div className="flex flex-wrap gap-2.5">
            {MOMENT2_DURATIONS.map((d) => {
              const active = duration === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDuration(d.id)}
                  className={`text-[12px] font-medium px-4 py-2.5 border cursor-pointer transition-all ${
                    active
                      ? "border-dr-red bg-[rgba(200,16,46,0.06)] text-dr-ink"
                      : "border-dr-border bg-dr-white text-dr-ink hover:border-dr-mid"
                  }`}
                >
                  {active && "✓ "}
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!supplement || !duration}
          className={`text-[12px] font-semibold tracking-[0.16em] uppercase px-6 py-3 border-none cursor-pointer ${
            !supplement || !duration
              ? "bg-dr-red text-white opacity-35 cursor-not-allowed"
              : "bg-dr-red text-white hover:opacity-90 transition-opacity"
          }`}
        >
          Analyze my data →
        </button>
      </div>
    );
  }

  if (screen === "loading") {
    return (
      <div className="max-w-[560px]">
        <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-3">
          Analyzing
        </div>
        <h1 className="font-serif text-[32px] md:text-[38px] font-light text-dr-ink leading-[1.2] mb-2">
          Checking your biomarkers…
        </h1>
        <p className="text-[12px] text-dr-mid mb-8 leading-[1.7]">
          Comparing before and after you started
        </p>

        <div className="flex flex-col gap-3">
          {MOMENT2_DATA_SOURCES.map((src, i) => (
            <div
              key={src}
              className="flex items-center gap-3 opacity-0"
              style={{
                animation: `fadeInUp 0.5s ease-out ${i * 0.4}s forwards`,
              }}
            >
              <div className="w-4 h-4 rounded-full border-2 border-dr-red border-t-transparent animate-spin" />
              <span className="text-[13px] text-dr-ink">{src}</span>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  const vConfig = VERDICT_CONFIG[verdict];
  const durationLabel = MOMENT2_DURATIONS.find((d) => d.id === duration)?.label;
  return (
    <div className="max-w-[760px]">
      {/* Verdict banner (§5.2) */}
      <div
        className={`border-l-2 ${vConfig.borderColor} ${vConfig.bgColor} p-5 mb-5`}
      >
        <div
          className={`text-[9px] font-semibold tracking-[0.2em] uppercase ${vConfig.textColor} mb-1.5`}
        >
          Verdict · {vConfig.type}
          {supplementLabel && (
            <span className="ml-2 normal-case tracking-normal text-dr-mid">
              · {supplementLabel}
            </span>
          )}
        </div>
        <div className="font-serif text-[28px] font-light text-dr-ink leading-[1.2]">
          {vConfig.headline}
        </div>
      </div>

      <AnswerPage data={answer} />

      {supplementLabel && durationLabel && (
        <SaveAsDecisionButton
          question={moment2ToQuestion(supplementLabel, durationLabel)}
          entryText={buildEntryText(
            2,
            moment2ChipsSummary(supplementLabel, durationLabel),
          )}
          momentN={2}
        />
      )}
    </div>
  );
}
