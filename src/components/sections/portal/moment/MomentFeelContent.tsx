"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  buildEntryText,
  moment3ChipsSummary,
  moment3ToQuestion,
} from "./mappers";
import { SaveAsDecisionButton } from "./SaveAsDecisionButton";

export default function MomentFeelContent() {
  const t = useTranslations("portal");
  return (
    <div className="max-w-[680px]">
      <div className="text-[10px] font-semibold tracking-[0.28em] uppercase text-dr-red mb-3">
        {t("moment3.eyebrow")}
      </div>
      <h1 className="font-serif text-[36px] md:text-[44px] font-light text-dr-ink leading-[1.15] mb-4">
        {t.rich("moment3.title", {
          em: (chunks) => <em className="italic">{chunks}</em>,
        })}
      </h1>
      <p className="text-[13px] text-dr-mid leading-[1.7] mb-7">
        {t("moment3.sub")}
      </p>

      <div className="bg-dr-white border border-dr-border p-5 mb-5">
        <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
          <span className="block w-2.5 h-px bg-dr-red" />
          {t("moment3.whatYouGet")}
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
          {t("moment3.shippingIn")}
        </div>
        <div className="text-[12px] text-dr-ink leading-[1.7]">
          {t("moment3.shippingDesc")}
        </div>
      </div>

      <SaveAsDecisionButton
        question={moment3ToQuestion()}
        entryText={buildEntryText(3, moment3ChipsSummary())}
        momentN={3}
      />

      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/portal"
          className="text-[11px] font-semibold tracking-[0.16em] uppercase text-dr-ink no-underline border border-dr-border px-5 py-3 hover:border-dr-mid transition-colors"
        >
          {t("common.backToHome")}
        </Link>
        <Link
          href="/portal/moment/skin"
          className="text-[11px] font-semibold tracking-[0.16em] uppercase text-dr-red no-underline"
        >
          {t("moment3.tryMoment1")}
        </Link>
      </div>
    </div>
  );
}
