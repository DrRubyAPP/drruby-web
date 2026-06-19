"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { IMAGE_QUALITY_CHECKS } from "@/config/skin-mock";

const SCAN_MODES = ["modeCheekL", "modeCheekR", "modeForehead", "modeUnderEye"] as const;

export default function ScanWindow() {
  const t = useTranslations("skin.scan");
  const [activeMode, setActiveMode] = useState(0);
  const allPassed = IMAGE_QUALITY_CHECKS.every((c) => c.passed);

  return (
    <div className="bg-dr-ink p-8 flex gap-7 items-start">
      {/* Scan window 320×320 */}
      <div className="flex-[0_0_320px] h-[320px] bg-[#0A0A0A] border border-white/8 relative flex items-center justify-center overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute w-[280px] h-[280px] rounded-full border border-[rgba(200,16,46,0.06)]" />
        {/* Scan frame 200×200 */}
        <div className="w-[200px] h-[200px] relative">
          {/* 4 corner markers */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-dr-red" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-dr-red" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-dr-red" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-dr-red" />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-[rgba(200,16,46,0.6)] rounded-full" />
          </div>
          {/* Scan line animation */}
          <div className="scan-line" />
        </div>
        {/* Bottom label */}
        <div className="absolute bottom-3 left-0 right-0 text-center text-[12px] font-semibold tracking-[0.2em] uppercase text-white/20">
          {t("positionLabel")}
        </div>
        {/* Image Quality Gate overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/82 px-3.5 py-2.5">
          <div className="text-[12px] font-semibold tracking-[0.16em] uppercase text-white/40 mb-2">
            {t("qualityCheck")}
          </div>
          <div className="flex flex-col gap-1.5">
            {IMAGE_QUALITY_CHECKS.map((check) => (
              <div key={check.id} className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    check.passed
                      ? "bg-[rgba(31,158,90,0.2)] border border-[rgba(31,158,90,0.5)]"
                      : "bg-[rgba(200,16,46,0.15)] border border-[rgba(200,16,46,0.5)]"
                  }`}
                >
                  <span
                    className={`text-[12px] ${
                      check.passed ? "text-[rgba(31,158,90,0.9)]" : "text-dr-red"
                    }`}
                  >
                    {check.passed ? "✓" : "✗"}
                  </span>
                </div>
                <span
                  className={`text-[12px] ${
                    check.passed ? "text-white/55" : "text-[rgba(200,16,46,0.9)]"
                  }`}
                >
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right info */}
      <div className="flex-1 flex flex-col gap-4 pt-1">
        <h2 className="font-serif text-[28px] font-light text-white leading-[1.2]">
          {t.rich("title", {
            em: (c) => <em className="italic text-[#F0C0C8]">{c}</em>,
          })}
        </h2>
        <p className="text-[14px] font-light text-white/38 leading-[1.9] max-w-[340px]">
          {t("desc")}
        </p>
        {/* Scan mode buttons */}
        <div className="flex gap-2 flex-wrap">
          {SCAN_MODES.map((mode, i) => (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveMode(i)}
              className={`text-[12px] font-semibold tracking-[0.14em] uppercase px-4 py-2 cursor-pointer border transition-all ${
                i === activeMode
                  ? "bg-dr-red text-white border-dr-red"
                  : "border-white/10 text-white/30 bg-transparent hover:border-[rgba(200,16,46,0.4)] hover:text-white/70"
              }`}
            >
              {t(mode)}
            </button>
          ))}
        </div>
        {/* SkinScope upgrade card */}
        <div className="bg-white/4 border border-white/7 p-3.5 flex gap-3 items-center max-w-[340px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/skinscope.jpg"
            alt="SkinScope"
            className="w-11 h-11 object-contain opacity-70 flex-shrink-0"
          />
          <div>
            <div className="text-[13px] font-medium text-white/55 mb-0.5">
              {t("scopeName")}
            </div>
            <div className="text-[12px] text-[rgba(200,16,46,0.6)] font-semibold tracking-[0.1em] cursor-pointer">
              {t("scopeCta")}
            </div>
          </div>
        </div>
        {/* Capture button */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={!allPassed}
            className={`text-[13px] font-semibold tracking-[0.16em] uppercase text-white px-6 py-3 border-none w-fit ${
              allPassed
                ? "bg-dr-red cursor-pointer"
                : "bg-dr-red opacity-35 cursor-not-allowed"
            }`}
          >
            {t("capture")}
          </button>
          {!allPassed && (
            <div className="text-[12px] text-[rgba(200,16,46,0.7)] pl-0.5">
              {t("captureHint")}
            </div>
          )}
        </div>
        {/* All-passed state annotation */}
        {allPassed && (
          <div className="mt-1 px-3.5 py-2.5 bg-[rgba(31,158,90,0.07)] border border-[rgba(31,158,90,0.2)]">
            <div className="text-[12px] font-bold text-[rgba(31,158,90,0.9)] tracking-[0.1em] mb-[3px]">
              {t("allPassed")}
            </div>
            <div className="text-[12px] text-[rgba(31,158,90,0.65)]">
              {t("allPassedDesc")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
