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

// Warm light backgrounds — text reads as dark ink (per tech-index reference)
const SLIDE_BGS = [
  "radial-gradient(ellipse 80% 80% at 70% 50%, #F0E8E5 0%, #F5F0EE 55%, #EDE8E5 100%)",
  "radial-gradient(ellipse 70% 90% at 30% 60%, #EEECEA 0%, #F5F3F0 50%, #EDE9E6 100%)",
  "radial-gradient(ellipse 90% 70% at 60% 40%, #F2EDEB 0%, #F5F2EF 50%, #EEECEA 100%)",
  "radial-gradient(ellipse 60% 100% at 80% 50%, #EDE8E6 0%, #F3EEEC 50%, #EEECEA 100%)",
];

// Hero photography (webp) overlaid on the warm gradient
const SLIDE_IMAGES: Array<{ src: string; opacity: number }> = [
  { src: "/hero-slide3332.webp", opacity: 0.65 },
  { src: "/hero-slide11.webp", opacity: 0.65 },
  { src: "/hero-slide111.webp", opacity: 0.45 },
  { src: "/hero-slide44.webp", opacity: 0.65 },
];

// Left-side gradient overlay keeps the headline legible over the photo
const SLIDE_OVERLAYS = [
  "linear-gradient(to right, rgba(245,240,238,0.55) 0%, rgba(245,240,238,0.2) 50%, transparent 70%)",
  "linear-gradient(to right, rgba(238,233,230,0.55) 0%, rgba(238,233,230,0.2) 50%, transparent 70%)",
  "linear-gradient(to right, rgba(238,233,230,0.55) 0%, rgba(238,233,230,0.2) 50%, transparent 70%)",
  "linear-gradient(to right, rgba(245,240,238,0.55) 0%, rgba(245,240,238,0.2) 50%, transparent 70%)",
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
    <div className="relative h-[540px] md:h-[640px] overflow-hidden bg-[#EDE8E5]">
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-800 ease-[cubic-bezier(0.77,0,0.175,1)]"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="min-w-full h-full relative flex items-end">
            {/* Warm gradient background */}
            <div
              className="absolute inset-0"
              style={{ background: SLIDE_BGS[i] }}
            />
            {/* Hero photo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SLIDE_IMAGES[i].src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ opacity: SLIDE_IMAGES[i].opacity }}
            />
            {/* Left readability overlay */}
            <div
              className="absolute inset-0 z-2"
              style={{ background: SLIDE_OVERLAYS[i] }}
            />
            {/* Content */}
            <div className="relative z-3 px-6 md:px-18 pb-12 md:pb-20 max-w-[680px]">
              <div className="text-[12px] md:text-[13px] font-bold tracking-[0.32em] md:tracking-[0.38em] uppercase text-dr-red mb-4 md:mb-5">
                {slide.eyebrow}
              </div>
              <h2 className="font-serif text-[34px] md:text-[72px] font-semibold text-dr-ink leading-[1.05] mb-4 md:mb-[22px]">
                {t.rich(`slides.${i}.title`, {
                  em: (chunks) => (
                    <em className="italic text-dr-red">{chunks}</em>
                  ),
                })}
              </h2>
              <p className="text-[15px] md:text-[18px] font-normal text-dr-ink/80 leading-[1.7] md:leading-[1.8] max-w-[480px] mb-7 md:mb-9">
                {slide.subtitle}
              </p>
              <div className="flex gap-3.5 items-center flex-wrap">
                <button
                  type="button"
                  className="text-[13px] md:text-[14px] font-bold tracking-[0.18em] md:tracking-[0.2em] uppercase bg-dr-red text-white px-7 md:px-8 py-3.5 md:py-4 border-none cursor-pointer hover:bg-[#A50D25] hover:-translate-y-0.5 transition-all"
                >
                  {slide.ctaPrimary}
                </button>
                {slide.ctaGhost && (
                  <button
                    type="button"
                    className="text-[13px] md:text-[14px] font-semibold tracking-[0.12em] text-dr-ink border-2 border-dr-ink px-6 md:px-6 py-3 md:py-3.5 bg-transparent cursor-pointer hover:bg-dr-ink hover:text-white transition-all"
                  >
                    {slide.ctaGhost}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-18 md:bottom-8 md:translate-x-0 flex gap-2.5 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`h-0.5 transition-all duration-300 cursor-pointer ${
              i === current ? "w-10 bg-dr-red" : "w-6 bg-black/15"
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
          className="w-9 h-9 border border-black/15 flex items-center justify-center text-black/35 hover:border-dr-red hover:text-dr-red transition-all cursor-pointer"
          aria-label="Previous slide"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          className="w-9 h-9 border border-black/15 flex items-center justify-center text-black/35 hover:border-dr-red hover:text-dr-red transition-all cursor-pointer"
          aria-label="Next slide"
        >
          ↓
        </button>
      </div>

      {/* Counter */}
      <div className="absolute top-8 right-6 md:right-18 text-[12px] md:text-[14px] font-semibold tracking-[0.2em] text-black/20 z-10">
        <span className="text-black/50">
          {String(current + 1).padStart(2, "0")}
        </span>{" "}
        / {t("counterTotal")}
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
