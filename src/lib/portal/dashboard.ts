/**
 * Portal 仪表盘纯函数：问候语时辰、initials、tier 映射。
 * 不依赖 React/DOM，便于单测与复用（PortalSidebar 与 dashboard 页面共享 initials 逻辑）。
 */

export type TimeOfDay = "morning" | "afternoon" | "evening";

/** 5-11 morning / 12-17 afternoon / 18-4 evening */
export function getTimeOfDay(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}

/** 返回 portal 命名空间下的问候语 i18n key（不含 portal. 前缀） */
export function getGreetingKey(date: Date): string {
  return `dashboard.greeting.${getTimeOfDay(date)}`;
}

/** 取显示名前两词首字母大写；空字符串返回空 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** 取显示名第一个词作为问候语称呼 */
export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** 已知 tier 返回 dashboard.profile.plan.{tier}；未知回退到 unknown */
export function getTierKey(tier: string): string {
  const known = ["free", "plus", "pro"] as const;
  return known.includes(tier as never)
    ? `dashboard.profile.plan.${tier}`
    : "dashboard.profile.plan.unknown";
}
