"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  buildEntryText,
  feelChipsSummary,
  feelObserveToQuestion,
} from "./mappers";
import { SaveAsDecisionButton } from "./SaveAsDecisionButton";

export default function FeelObserveContent() {
  const t = useTranslations("portal");
  return (
    <div className="max-w-[680px]">
      <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-3">
        {t("observeFeel.eyebrow")}
      </div>
      <h1 className="font-serif text-[36px] md:text-[44px] font-light text-dr-ink leading-[1.15] mb-4">
        {t.rich("observeFeel.title", {
          em: (chunks) => <em className="italic">{chunks}</em>,
        })}
      </h1>
      <p className="text-[13px] text-dr-mid leading-[1.7] mb-7">
        {t("observeFeel.sub")}
      </p>

      <div className="bg-dr-white border border-dr-border p-5 mb-5">
        <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
          <span className="block w-2.5 h-px bg-dr-red" />
          {t("observeFeel.whatYouGet")}
        </div>
        <ul className="text-[13px] text-dr-ink leading-[1.8] space-y-1.5">
          <li>
            · A read on whether what you're feeling is a pattern or a passing
            week
          </li>
          <li>
            · Cross-reference with sleep, HRV, cycle, and supplement timing
          </li>
          <li>
            · One concrete next step — not a list of 10 metrics to worry about
          </li>
          <li>
            · The same "save your money" lens: what <em>not</em> to buy or try
          </li>
        </ul>
      </div>

      <div className="bg-dr-off border border-dr-border p-5 mb-7">
        <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-2 flex items-center gap-2">
          <span className="block w-2.5 h-px bg-dr-mid" />
          {t("observeFeel.shippingIn")}
        </div>
        <div className="text-[12px] text-dr-ink leading-[1.7]">
          {t("observeFeel.shippingDesc")}
        </div>
      </div>

      <SaveAsDecisionButton
        question={feelObserveToQuestion()}
        entryText={buildEntryText("feel-check-in", feelChipsSummary())}
        goal="mood"
      />

      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/portal"
          className="text-[11px] font-semibold tracking-[0.16em] uppercase text-dr-ink no-underline border border-dr-border px-5 py-3 hover:border-dr-mid transition-colors"
        >
          {t("common.backToHome")}
        </Link>
        <Link
          href="/portal/consider/skin"
          className="text-[11px] font-semibold tracking-[0.16em] uppercase text-dr-red no-underline"
        >
          {t("observeFeel.trySkinCheck")}
        </Link>
      </div>
    </div>
  );
}
