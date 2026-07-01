import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";

// Scan upload with capture-consistency guidance (spec §4.4). MVP path uses
// phone/camera — no professional dermatoscope BLE integration yet (Phase 2).
// First-scan auto-creates a DrRuby account for the patient (spec §4.3).
export default async function SkinArchiveUploadPage() {
  const t = await getTranslations("clinic");

  const guidance = [
    {
      title: t("skinArchive.guidanceLight"),
      desc: t("skinArchive.guidanceLightDesc"),
      icon: "☀",
    },
    {
      title: t("skinArchive.guidanceDistance"),
      desc: t("skinArchive.guidanceDistanceDesc"),
      icon: "⊙",
    },
    {
      title: t("skinArchive.guidanceZone"),
      desc: t("skinArchive.guidanceZoneDesc"),
      icon: "▣",
    },
    {
      title: t("skinArchive.guidanceFrequency"),
      desc: t("skinArchive.guidanceFrequencyDesc"),
      icon: "↻",
    },
  ];

  return (
    <ClinicShell
      pageTitle={t("skinArchive.uploadPageTitle")}
      pageSub={t("skinArchive.uploadPageSub")}
    >
      <div className="max-w-[760px]">
        <Link
          href="/clinic/skin-archive"
          className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-mid no-underline hover:text-dr-ink transition-colors inline-block mb-4"
        >
          {t("common.backToArchive")}
        </Link>

        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("skinArchive.uploadTitle", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[560px]">
            {t("skinArchive.uploadSub")}
          </p>
        </div>

        {/* Capture consistency guidance — 4 dimensions (spec §4.4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {guidance.map((g) => (
            <div key={g.title} className="bg-dr-white border border-dr-border p-4">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-dr-red text-[16px] w-5 flex-shrink-0">
                  {g.icon}
                </span>
                <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-red">
                  {g.title}
                </div>
              </div>
              <div className="text-[11px] text-dr-ink leading-[1.6] pl-7">
                {g.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Patient + zone selectors */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid mb-1.5">
                Patient
              </label>
              <select className="w-full text-[11px] text-dr-ink border border-dr-border bg-dr-white px-3 py-2 cursor-pointer">
                <option>Select patient…</option>
                <option>Sarah Mitchell</option>
                <option>Mia Johnson</option>
                <option>Emily Carter</option>
                <option>New patient (auto-create account)</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid mb-1.5">
                Body Zone
              </label>
              <select className="w-full text-[11px] text-dr-ink border border-dr-border bg-dr-white px-3 py-2 cursor-pointer">
                <option>Left cheek</option>
                <option>Right cheek</option>
                <option>Forehead</option>
                <option>Chin</option>
                <option>Jawline</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upload zone */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("skinArchive.uploadSubmit")}
          </div>
          <label
            className="block border-2 border-dashed border-dr-border bg-dr-off p-10 text-center cursor-pointer hover:border-dr-mid transition-colors"
            htmlFor="scan-upload"
          >
            <div className="text-dr-mid text-[24px] mb-2">↑</div>
            <div className="text-[11px] text-dr-ink mb-1">
              {t("skinArchive.uploadZone")}
            </div>
            <input
              id="scan-upload"
              type="file"
              accept="image/jpeg,image/raw"
              className="hidden"
            />
          </label>
        </div>

        {/* Auto-account-creation notice (spec §4.3) */}
        <div className="bg-[rgba(31,158,90,0.04)] border border-[rgba(31,158,90,0.15)] p-4 text-[10px] text-dr-mid leading-[1.6]">
          <span className="text-dr-success">✓ </span>
          <strong className="text-dr-ink">First scan for this patient?</strong>{" "}
          DrRuby will automatically create their account using the patient's
          phone or email. The patient receives an activation link to access
          their scan history. Subsequent scans attach to the same account
          automatically.
        </div>
      </div>
    </ClinicShell>
  );
}
