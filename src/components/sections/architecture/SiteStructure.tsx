import { getTranslations } from "next-intl/server";

interface PortalItem {
  name: string;
  desc: string;
  highlight?: boolean;
}

export default async function SiteStructure() {
  const t = await getTranslations("architecture");
  const publicPages = t.raw("publicPages") as string[];
  const userPortalItems = t.raw("userPortalItems") as PortalItem[];
  const clinicPortalItems = t.raw("clinicPortalItems") as PortalItem[];
  return (
    <section className="bg-dr-white border-b border-dr-border py-12 px-8 md:px-14">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-4">
        {t("siteStructureLabel")}
      </div>
      <div className="flex flex-col gap-5">
        {/* Public */}
        <div className="border border-dr-border py-5 px-6">
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-3">
            {t("publicLabel")}
          </div>
          <div className="flex gap-3 flex-wrap">
            {publicPages.map((p) => (
              <div
                key={p}
                className="bg-dr-off py-2 px-4 text-[11px] text-dr-ink"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
        {/* User Portal */}
        <div className="border border-[rgba(200,16,46,0.2)] py-5 px-6 bg-[rgba(200,16,46,0.02)]">
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3">
            {t("userPortalLabel")}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {userPortalItems.map((item) => (
              <div
                key={item.name}
                className={`bg-dr-white p-3 text-[11px] border ${
                  item.highlight
                    ? "border-[rgba(200,16,46,0.3)]"
                    : "border-dr-border"
                }`}
              >
                <div
                  className={`font-semibold mb-1.5 ${
                    item.highlight ? "text-dr-red" : "text-dr-ink"
                  }`}
                >
                  {item.name}
                </div>
                <div className="text-[10px] text-dr-mid leading-[1.5]">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Clinic Portal */}
        <div className="border border-[#888] py-5 px-6 bg-[rgba(0,0,0,0.01)]">
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#888] mb-3">
            {t("clinicPortalLabel")}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {clinicPortalItems.map((item) => (
              <div
                key={item.name}
                className="bg-dr-white border border-dr-border p-3 text-[11px]"
              >
                <div className="font-semibold text-dr-ink mb-1.5">
                  {item.name}
                </div>
                <div className="text-[10px] text-dr-mid leading-[1.5]">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
