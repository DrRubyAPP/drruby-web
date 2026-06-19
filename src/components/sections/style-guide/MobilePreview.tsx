import { getTranslations } from "next-intl/server";

interface MobileNote {
  num: string;
  strong: string;
  text: string;
}

export default async function MobilePreview() {
  const t = await getTranslations("styleGuide");
  const notes = t.raw("mobileNotes") as MobileNote[];
  return (
    <section className="bg-dr-off py-12 px-8 md:px-14">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-4">
        {t("mobileLabel")}
      </div>
      <div className="flex flex-col md:flex-row gap-10 items-start">
        {/* Mobile frame */}
        <div className="w-[200px] border-[6px] border-dr-ink rounded-[18px] overflow-hidden flex-shrink-0">
          {/* Notch */}
          <div className="bg-dr-ink h-[18px] flex items-center justify-center">
            <div className="w-[50px] h-1 bg-[#333] rounded" />
          </div>
          {/* Screen content */}
          <div className="bg-dr-white">
            {/* Nav */}
            <div className="bg-dr-ink px-3 py-2 flex items-center justify-between">
              <div className="font-serif text-[12px] text-white">
                Dr<span className="text-dr-red">Ruby</span>
              </div>
              <div className="text-[18px] text-white/50">☰</div>
            </div>
            {/* Hero */}
            <div className="bg-dr-ink px-3 py-5">
              <div className="font-serif text-[14px] font-light text-white leading-[1.2]">
                {t("mobilePreview.heroTitle")}
              </div>
            </div>
            {/* Choice row */}
            <div className="grid grid-cols-2 gap-px bg-dr-border">
              <div className="bg-dr-off py-3 flex flex-col items-center gap-1">
                <div className="text-[14px]">✨</div>
                <div className="text-[10px] text-dr-ink">
                  {t("mobilePreview.choiceSkin")}
                </div>
              </div>
              <div className="bg-dr-off py-3 flex flex-col items-center gap-1">
                <div className="text-[14px]">🧬</div>
                <div className="text-[10px] text-dr-ink">
                  {t("mobilePreview.choiceHealth")}
                </div>
              </div>
            </div>
            {/* Placeholder */}
            <div className="h-20 bg-dr-off flex items-center justify-center p-3">
              <div className="w-full h-2 bg-dr-border rounded" />
            </div>
            {/* Bottom nav */}
            <div className="grid grid-cols-5 bg-dr-white border-t border-dr-border">
              {[
                { icon: "🏠", label: "Home", active: true },
                { icon: "📊", label: "Dashboard", active: false },
                { icon: "💬", label: "Coach", active: false },
                { icon: "🏥", label: "Clinics", active: false },
                { icon: "👤", label: "Profile", active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="py-2 flex flex-col items-center gap-0.5"
                >
                  <div className="text-[12px]">{item.icon}</div>
                  <div
                    className={`text-[9px] ${
                      item.active ? "text-dr-red" : "text-dr-mid"
                    }`}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Notes */}
        <div className="flex flex-col gap-3 flex-1">
          {notes.map((n) => (
            <div key={n.num} className="flex gap-3 items-start">
              <div className="w-6 h-6 border border-dr-border rounded-full flex items-center justify-center text-[11px] font-semibold text-dr-ink flex-shrink-0">
                {n.num}
              </div>
              <div className="text-[12px] text-dr-mid leading-[1.7] flex-1">
                <strong className="text-dr-ink font-semibold">{n.strong}</strong>
                {n.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
