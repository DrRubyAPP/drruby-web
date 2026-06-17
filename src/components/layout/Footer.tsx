import Link from "next/link";

export default function Footer({ variant }: { variant: "home" | "sub" }) {
  if (variant === "home") {
    return (
      <footer className="bg-dr-black text-[#666] py-10 px-5 md:px-10 text-center text-sm">
        <ul className="flex gap-7 justify-center list-none mb-4 flex-wrap">
          <li>
            <Link
              href="#"
              className="text-[#888] no-underline hover:text-white transition-colors"
            >
              Science
            </Link>
          </li>
          <li>
            <Link
              href="#"
              className="text-[#888] no-underline hover:text-white transition-colors"
            >
              Privacy
            </Link>
          </li>
          <li>
            <Link
              href="#"
              className="text-[#888] no-underline hover:text-white transition-colors"
            >
              For Clinics
            </Link>
          </li>
          <li>
            <Link
              href="#"
              className="text-[#888] no-underline hover:text-white transition-colors"
            >
              Research Partners
            </Link>
          </li>
          <li>
            <Link
              href="mailto:ruby@drruby.ai"
              className="text-[#888] no-underline hover:text-white transition-colors"
            >
              Contact
            </Link>
          </li>
        </ul>
        <div>
          &copy; 2026 DrRuby.ai &middot; Wellness device. Not intended to
          diagnose or treat any medical condition.
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-dr-black text-[#666] py-10 px-5 md:px-10 text-center text-sm">
      &copy; 2026 DrRuby.ai &middot; Wellness device. Not intended to diagnose
      or treat any medical condition.
    </footer>
  );
}
