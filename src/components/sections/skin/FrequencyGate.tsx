import { getTranslations } from "next-intl/server";

export default async function FrequencyGate() {
  const t = await getTranslations("skin.freqGate");
  return (
    <div className="bg-[#0D0D0D] border-b border-white/6 py-2.5 px-7 flex items-center justify-between gap-4">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[rgba(200,16,46,0.5)] flex-shrink-0" />
          <div>
            <span className="text-[10px] font-semibold text-white/60 tracking-[0.1em]">
              {t("lastScan")} · {t("nextScanPrefix")}{" "}
            </span>
            <span className="text-[10px] font-bold text-dr-red">
              {t("nextScanDate")}
            </span>
            <span className="text-[10px] text-white/30">
              {" "}
              {t("nextScanDays")}
            </span>
          </div>
        </div>
        <div className="text-[10px] text-white/20">|</div>
        <div className="text-[10px] text-white/30">{t("cycleNote")}</div>
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="text-[10px] text-white/35 tracking-[0.08em]">
          {t("trackingMode")}
        </div>
        <div className="w-8 h-[18px] bg-white/10 rounded-[9px] relative cursor-pointer border border-white/12">
          <div className="w-3 h-3 rounded-full bg-white/25 absolute top-[2px] left-[2px] transition-all" />
        </div>
        <div className="text-[10px] text-white/20">{t("trackingOff")}</div>
      </div>
    </div>
  );
}
