import Link from "next/link";

export default function Navbar({ variant }: { variant: "home" | "sub" }) {
  return (
    <nav className="sticky top-12 z-50 border-b border-dr-border bg-white/95 backdrop-blur-xl px-5 md:px-10 h-16 flex items-center justify-between">
      <Link
        href="/"
        className="text-xl font-bold tracking-tight text-dr-black no-underline"
      >
        Dr<span className="text-dr-red">Ruby</span>.ai
      </Link>

      {variant === "home" ? (
        <>
          <span className="hidden sm:inline text-[13px] text-dr-muted absolute left-1/2 -translate-x-1/2">
            Women&apos;s Healthspan Intelligence
          </span>
          <Link
            href="/#join-home"
            className="bg-dr-red text-white py-2 px-5 rounded-lg text-sm font-semibold no-underline hover:opacity-85 transition-opacity"
          >
            Get Early Access
          </Link>
        </>
      ) : (
        <Link
          href="/"
          className="text-sm font-medium text-dr-muted no-underline hover:text-dr-red transition-colors"
        >
          &larr; Back
        </Link>
      )}
    </nav>
  );
}
