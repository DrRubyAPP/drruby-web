"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import AnswerPage from "@/components/sections/portal/AnswerPage";
import {
  SKIN_CONSIDER_ANSWER,
  SKIN_CONSIDER_DATA_SOURCES,
  SKIN_CONSIDER_SYMPTOMS,
} from "@/config/user-portal-mock";
import {
  buildEntryText,
  skinChipsSummary,
  skinConsiderToQuestion,
} from "./mappers";
import { SaveAsDecisionButton } from "./SaveAsDecisionButton";

type Screen = "select" | "loading" | "answer";

export default function SkinConsiderFlow() {
  const t = useTranslations("portal.considerSkin");
  const [screen, setScreen] = useState<Screen>("select");
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    if (id === "all") {
      setSelected(["all"]);
      return;
    }
    setSelected((prev) => {
      const next = prev.filter((s) => s !== "all");
      return next.includes(id) ? next.filter((s) => s !== id) : [...next, id];
    });
  }

  function handleAnalyze() {
    if (selected.length === 0) return;
    setScreen("loading");
    // §4.1 — Loading minimum 2.5s even if data returns faster
    setTimeout(() => setScreen("answer"), 2800);
  }

  if (screen === "select") {
    return (
      <div className="max-w-[680px]">
        <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-3">
          {t("eyebrow")}
        </div>
        <h1 className="font-serif text-[36px] md:text-[44px] font-light text-dr-ink leading-[1.15] mb-3">
          {t.rich("title", {
            em: (chunks) => <em className="italic text-dr-red">{chunks}</em>,
          })}
        </h1>
        <p className="text-[12px] text-dr-mid mb-7 leading-[1.7]">{t("sub")}</p>

        <div className="flex flex-wrap gap-2.5 mb-8">
          {SKIN_CONSIDER_SYMPTOMS.map((s) => {
            const active = selected.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
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

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={selected.length === 0}
          className={`text-[12px] font-semibold tracking-[0.16em] uppercase px-6 py-3 border-none cursor-pointer ${
            selected.length === 0
              ? "bg-dr-red text-white opacity-35 cursor-not-allowed"
              : "bg-dr-red text-white hover:opacity-90 transition-opacity"
          }`}
        >
          {t("cta")}
        </button>
      </div>
    );
  }

  if (screen === "loading") {
    return (
      <div className="max-w-[560px]">
        <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-3">
          {t("loadingEyebrow")}
        </div>
        <h1 className="font-serif text-[32px] md:text-[38px] font-light text-dr-ink leading-[1.2] mb-2">
          {t("loadingTitle")}
        </h1>
        <p className="text-[12px] text-dr-mid mb-8 leading-[1.7]">
          {t("loadingSub")}
        </p>

        <div className="flex flex-col gap-3">
          {SKIN_CONSIDER_DATA_SOURCES.map((src, i) => (
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

        <div className="text-[11px] text-dr-mid mt-8">{t("loadingFootnote")}</div>

        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  const selectedLabels: string[] = (() => {
    const labels = selected
      .filter((id) => id !== "all")
      .map((id) => SKIN_CONSIDER_SYMPTOMS.find((s) => s.id === id)?.label ?? "")
      .filter(Boolean);
    // "all" 特殊处理：把 "All of the above" 作为 label 加入末尾
    if (selected.includes("all")) labels.push("All of the above");
    return labels;
  })();

  return (
    <>
      <AnswerPage data={SKIN_CONSIDER_ANSWER} />
      <SaveAsDecisionButton
        question={skinConsiderToQuestion(selectedLabels)}
        entryText={buildEntryText("skin-analysis", skinChipsSummary(selectedLabels))}
        goal="skin"
      />
    </>
  );
}
