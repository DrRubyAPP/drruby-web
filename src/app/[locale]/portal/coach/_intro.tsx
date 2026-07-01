"use client";

import { useTranslations } from "next-intl";

export default function CoachIntro() {
  const t = useTranslations("portal");
  return (
    <div className="mb-4">
      <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
        {t.rich("coach.title", {
          em: (chunks) => <em className="italic">{chunks}</em>,
        })}
      </h1>
      <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[560px]">
        {t("coach.sub")}
      </p>
    </div>
  );
}
