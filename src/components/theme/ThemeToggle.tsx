"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch: the resolved theme is only known on the client.
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <span className="w-9 h-9" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-dr-fg hover:bg-dr-off transition-colors"
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}
