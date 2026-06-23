"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const AUTO_PLAY_MS = 4800;
const TOTAL_SLIDES = 4;

interface Slide {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaGhost?: string;
}

const SLIDE_BGS = [
  "radial-gradient(ellipse 80% 80% at 70% 50%, #5E0E1C 0%, #3D0810 55%, #2A050B 100%)",
  "radial-gradient(ellipse 70% 90% at 30% 60%, #3D0A20 0%, #2A0815 50%, #2A050B 100%)",
  "radial-gradient(ellipse 90% 70% at 60% 40%, #4E0A0E 0%, #3D0810 50%, #2A050B 100%)",
  "radial-gradient(ellipse 60% 100% at 80% 50%, #1A3A22 0%, #2A050B 50%, #2A050B 100%)",
];

const SLIDE_OVERLAYS = [
  "linear-gradient(to right, rgba(42,5,11,0.88) 0%, rgba(42,5,11,0.5) 45%, transparent 70%)",
  "linear-gradient(to right, rgba(42,5,16,0.92) 0%, rgba(42,5,16,0.5) 45%, transparent 70%)",
  "linear-gradient(to right, rgba(30,12,8,0.92) 0%, rgba(30,12,8,0.5) 45%, transparent 70%)",
  "linear-gradient(to right, rgba(42,5,11,0.88) 0%, rgba(42,5,11,0.5) 45%, transparent 70%)",
];

// Decorative art per slide: [circle1, circle2, optional extra]
const SLIDE_ART: Array<{
  circles: Array<{ size: number; right: number; top: number; border: string }>;
  extra?: "skinscope" | "n1" | "lock" | "brenner";
}> = [
  {
    circles: [
      { size: 500, right: -80, top: -60, border: "rgba(200,16,46,0.12)" },
      { size: 320, right: 40, top: 80, border: "rgba(200,16,46,0.06)" },
    ],
    extra: "skinscope",
  },
  {
    circles: [
      { size: 600, right: -150, top: -100, border: "rgba(91,63,160,0.15)" },
      { size: 350, right: 60, top: 80, border: "rgba(91,63,160,0.08)" },
    ],
    extra: "n1",
  },
  {
    circles: [
      { size: 400, right: 20, top: 40, border: "rgba(31,158,90,0.12)" },
      { size: 240, right: 100, top: 120, border: "rgba(31,158,90,0.07)" },
    ],
    extra: "lock",
  },
  {
    circles: [
      { size: 480, right: -60, top: 20, border: "rgba(200,16,46,0.1)" },
    ],
    extra: "brenner",
  },
];

export default function HeroCarousel() {
  const t = useTranslations("home.hero");
  const [current, setCurrent] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = t.raw("slides") as Slide[];

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % TOTAL_SLIDES);
      setProgressKey((k) => k + 1);
    }, AUTO_PLAY_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function goTo(n: number) {
    setCurrent(((n % TOTAL_SLIDES) + TOTAL_SLIDES) % TOTAL_SLIDES);
    setProgressKey((k) => k + 1);
    // restart timer
    if (timerRef.current) clearInterval(timerRef.current);
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!prefersReduced) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % TOTAL_SLIDES);
        setProgressKey((k) => k + 1);
      }, AUTO_PLAY_MS);
    }
  }

  return (
    <div className="relative h-[520px] md:h-[580px] overflow-hidden bg-dr-wine">
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-800 ease-[cubic-bezier(0.77,0,0.175,1)]"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => {
          const art = SLIDE_ART[i];
          return (
            <div key={i} className="min-w-full h-full relative flex items-end">
              {/* Background */}
              <div
                className="absolute inset-0"
                style={{ background: SLIDE_BGS[i] }}
              />
              {/* Decorative art — hidden on mobile to keep content readable */}
              <div className="hidden md:block absolute right-0 top-0 w-[60%] h-full overflow-hidden pointer-events-none">
                {art.circles.map((c, ci) => (
                  <div
                    key={ci}
                    className="absolute rounded-full"
                    style={{
                      width: c.size,
                      height: c.size,
                      right: c.right,
                      top: c.top,
                      border: `1px solid ${c.border}`,
                    }}
                  />
                ))}
                {art.extra === "skinscope" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/skinscope.jpg"
                    alt="SkinScope"
                    className="absolute right-10 top-1/2 -translate-y-1/2 h-[75%] w-auto object-contain opacity-55 mix-blend-lighten"
                    style={{ filter: "contrast(1.1)" }}
                  />
                )}
                {art.extra === "n1" && (
                  <div
                    className="absolute font-serif italic font-light select-none"
                    style={{
                      right: 80,
                      top: 120,
                      fontSize: 220,
                      lineHeight: 1,
                      color: "rgba(255,255,255,0.025)",
                    }}
                  >
                    N=1
                  </div>
                )}
                {art.extra === "lock" && (
                  <>
                    <div
                      className="absolute select-none"
                      style={{
                        right: 100,
                        top: 150,
                        fontSize: 100,
                        opacity: 0.04,
                        color: "white",
                        lineHeight: 1,
                      }}
                    >
                      🔒
                    </div>
                    <div
                      className="absolute rounded-full flex items-center justify-center"
                      style={{
                        right: 160,
                        top: 220,
                        width: 80,
                        height: 80,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        className="rounded-full"
                        style={{
                          width: 30,
                          height: 30,
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}
                      />
                    </div>
                  </>
                )}
                {art.extra === "brenner" && (
                  <div
                    className="absolute"
                    style={{
                      right: 72,
                      bottom: 80,
                      maxWidth: 300,
                      padding: 24,
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[rgba(200,16,46,0.5)] mb-2">
                      Scientific Advisor
                    </div>
                    <div className="font-serif italic text-[15px] text-white/50 leading-[1.7] mb-2.5">
                      "DrRuby connects metabolic aging science to the consumer
                      for the first time."
                    </div>
                    <div className="text-[12px] text-white/30 font-medium">
                      Charles Brenner
                    </div>
                    <div className="text-[12px] text-white/18">
                      Biochemist · NAD Biology
                    </div>
                  </div>
                )}
              </div>
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 z-2"
                style={{ background: SLIDE_OVERLAYS[i] }}
              />
              {/* Content */}
              <div className="relative z-3 px-6 md:px-18 pb-10 md:pb-18 max-w-[640px]">
                <div className="text-[11px] md:text-[12px] font-semibold tracking-[0.32em] uppercase text-[rgba(200,16,46,0.65)] mb-[14px] md:mb-[18px]">
                  {slide.eyebrow}
                </div>
                <h2 className="font-serif text-[30px] md:text-[56px] font-light text-white leading-[1.08] mb-4 md:mb-5">
                  {t.rich(`slides.${i}.title`, {
                    em: (chunks) => (
                      <em className="italic text-[#F0C0C8]">{chunks}</em>
                    ),
                  })}
                </h2>
                <p className="text-[13px] md:text-[14px] font-light text-white/45 leading-[1.8] md:leading-[1.9] max-w-[420px] mb-6 md:mb-8">
                  {slide.subtitle}
                </p>
                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    className="text-[12px] md:text-[13px] font-semibold tracking-[0.18em] uppercase bg-dr-red text-white px-6 md:px-7 py-3 border-none cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {slide.ctaPrimary}
                  </button>
                  {slide.ctaGhost && (
                    <button
                      type="button"
                      className="text-[12px] md:text-[13px] font-normal tracking-[0.1em] text-white/45 border border-white/12 px-5 md:px-6 py-3 bg-transparent cursor-pointer hover:text-white hover:border-white/30 transition-all"
                    >
                      {slide.ctaGhost}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-18 md:bottom-8 md:translate-x-0 flex gap-2.5 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`h-0.5 transition-all duration-300 cursor-pointer ${
              i === current ? "w-10 bg-dr-red" : "w-6 bg-white/18"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrows */}
      <div className="hidden md:flex absolute right-18 top-1/2 -translate-y-1/2 flex-col gap-2 z-10">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/40 hover:border-dr-red hover:text-white transition-all cursor-pointer"
          aria-label="Previous slide"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/40 hover:border-dr-red hover:text-white transition-all cursor-pointer"
          aria-label="Next slide"
        >
          ↓
        </button>
      </div>

      {/* Counter */}
      <div className="absolute top-8 right-6 md:right-18 text-[12px] font-semibold tracking-[0.2em] text-white/20 z-10">
        <span className="text-white/60">
          {String(current + 1).padStart(2, "0")}
        </span>{" "}
        / 04
      </div>

      {/* Progress bar */}
      <div
        key={progressKey}
        className="absolute bottom-0 left-0 h-0.5 bg-dr-red z-10"
        style={{
          width: `${((current + 1) / TOTAL_SLIDES) * 100}%`,
          transition: "width 4s linear",
        }}
      />
    </div>
  );
}
