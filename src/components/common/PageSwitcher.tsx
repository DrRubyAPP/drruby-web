"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_PAGES } from "@/config/site";

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  skin: "Skin",
  healthspan: "Healthspan",
};

export default function PageSwitcher() {
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-dr-black h-12 flex items-center gap-1 px-5 md:px-10">
      <span className="text-[11px] text-[#555] tracking-[1px] uppercase mr-3">
        Page:
      </span>
      {NAV_PAGES.map((page) => {
        const isActive = pathname === page.href;
        return (
          <Link
            key={page.href}
            href={page.href}
            className={`py-1.5 px-[18px] rounded-md text-[13px] font-semibold no-underline transition-all ${
              isActive
                ? "bg-dr-red text-white"
                : "bg-transparent text-[#666] hover:text-white hover:bg-white/8"
            }`}
          >
            {PAGE_LABELS[page.key]}
          </Link>
        );
      })}
    </div>
  );
}
