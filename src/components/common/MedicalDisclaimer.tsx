"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MedicalDisclaimer() {
  const t = useTranslations("portal");
  return (
    <div className="text-[10px] text-[#aaa] leading-[1.6] mt-4">
      {t("disclaimer.short")}{" "}
      <Link href="/portal" className="underline text-[#aaa] hover:text-dr-mid">
        {t("disclaimer.seeFull")}
      </Link>
    </div>
  );
}
