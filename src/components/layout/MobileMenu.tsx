"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface NavLink {
  href: string;
  key: "howItWorks" | "skin" | "healthspan" | "portal";
}

const LINKS: NavLink[] = [
  { href: "/", key: "howItWorks" },
  { href: "/skin", key: "skin" },
  { href: "/healthspan", key: "healthspan" },
  { href: "/portal", key: "portal" },
];

export default function MobileMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col gap-[5px] w-7 h-7 items-center justify-center"
        aria-label={t("menu")}
      >
        <span className="block w-5 h-px bg-dr-ink" />
        <span className="block w-5 h-px bg-dr-ink" />
        <span className="block w-5 h-px bg-dr-ink" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
        >
          <div
            className="absolute inset-0 bg-dr-ink/40"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setOpen(false);
            }}
          />
          <div className="absolute right-0 top-0 h-full w-[280px] max-w-[80vw] bg-dr-white shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-dr-border">
              <span className="font-serif text-[18px] text-dr-ink">
                Dr<span className="text-dr-red">Ruby</span>.ai
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-dr-ink"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col py-4">
              {LINKS.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-6 py-3.5 text-[15px] font-normal tracking-[0.08em] text-dr-ink no-underline hover:bg-dr-off transition-colors"
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>
            <div className="mt-auto p-6 border-t border-dr-border flex flex-col gap-3">
              <Link
                href="/waitlist"
                onClick={() => setOpen(false)}
                className="text-center text-[13px] font-semibold tracking-[0.16em] uppercase bg-dr-red text-white px-5 py-3 no-underline hover:opacity-90 transition-opacity"
              >
                {t("getStarted")}
              </Link>
              <Link
                href="/waitlist"
                onClick={() => setOpen(false)}
                className="text-center text-[13px] font-medium tracking-[0.1em] text-dr-ink border border-dr-border px-5 py-3 no-underline hover:border-dr-ink transition-colors"
              >
                {t("login")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
