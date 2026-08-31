"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MedicalDisclaimer() {
  const t = useTranslations("portal");
  return (
    <div className="text-[11px] text-dr-mid leading-[1.6] mt-4">
      {t("disclaimer.short")}{" "}
      <Link href="/portal" className="underline text-dr-mid hover:text-dr-ink">
        {t("disclaimer.seeFull")}
      </Link>
    </div>
  );
}
