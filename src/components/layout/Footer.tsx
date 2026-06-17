import Link from "next/link";
import { getTranslations } from "next-intl/server";

const FOOTER_HREFS = ["#", "#", "#", "#", "mailto:ruby@drruby.ai"];

export default async function Footer({ variant }: { variant: "home" | "sub" }) {
  const t = await getTranslations("footer");
  const links = t.raw("links") as string[];

  if (variant === "home") {
    return (
      <footer className="bg-dr-black text-[#666] py-10 px-5 md:px-10 text-center text-sm">
        <ul className="flex gap-7 justify-center list-none mb-4 flex-wrap">
          {links.map((label, i) => (
            <li key={label}>
              <Link
                href={FOOTER_HREFS[i]}
                className="text-[#888] no-underline hover:text-white transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div>{t("copyright")}</div>
      </footer>
    );
  }

  return (
    <footer className="bg-dr-black text-[#666] py-10 px-5 md:px-10 text-center text-sm">
      {t("copyright")}
    </footer>
  );
}
