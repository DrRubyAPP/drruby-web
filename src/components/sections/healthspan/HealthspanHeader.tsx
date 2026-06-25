import { getTranslations } from "next-intl/server";

export default async function HealthspanHeader() {
  const t = await getTranslations("healthspan.header");
  return (
    <section className="pb-4 border-b border-dr-border">
      <h1 className="font-serif text-[26px] md:text-[32px] font-medium text-dr-ink leading-[1.15]">
        {t.rich("title", {
          em: (c) => <em className="italic text-dr-red">{c}</em>,
        })}
      </h1>
      <p className="text-[13px] md:text-[15px] font-semibold tracking-[0.2em] uppercase text-[#111] mt-1.5 leading-[1.5]">
        {t("sub")}
      </p>
    </section>
  );
}
