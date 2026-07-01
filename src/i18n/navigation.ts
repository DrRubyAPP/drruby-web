import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * locale 感知的导航 API。用这些替代 `next/link` / `next/navigation`，
 * 链接与跳转会自动带上当前 locale 前缀（en 无前缀、zh → /zh）。
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
