"use client";

import { useEffect, useState } from "react";
import { type Theme, THEME_COOKIE } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  // Initial state comes from the SSR-injected <html data-theme>, keeping the
  // button in sync with the server-rendered theme without a flash.
  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    );
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    // 1 year, site-wide; SameSite=Lax is sufficient (not cross-site).
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    setTheme(next);
  };

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
      className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-dr-fg hover:bg-dr-off transition-colors"
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}
