"use client";

import { ErrorState } from "@/components/api/ErrorState";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { useApi } from "@/hooks/useApi";
import type { MeDto } from "../profile/dto";

/** name 首字母派生 initials（无名时回退占位）。 */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Settings 账户区客户端岛：读 GET /api/me 只读展示真实 name/email；
 * 「Edit profile」链接跳 /portal/profile（编辑入口统一在 Profile 页）。
 * loading 占位、error → ErrorState（可 refetch）。
 */
export function AccountSummary() {
  const { data, error, loading, refetch } = useApi<MeDto>("/api/me");

  if (loading && !data) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-full bg-dr-off" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-dr-off mb-1.5" />
          <div className="h-3 w-40 bg-dr-off" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return <ErrorState message={toErrorMessage(error)} onRetry={refetch} />;
  }

  if (!data) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="w-10 h-10 rounded-full bg-[rgba(200,16,46,0.1)] flex items-center justify-center text-[13px] text-dr-red font-medium">
        {initialsOf(data.name)}
      </div>
      <div className="flex-1 min-w-[180px]">
        <div className="text-[13px] text-dr-ink leading-tight">{data.name}</div>
        <div className="text-[11px] text-dr-mid mt-0.5">{data.email}</div>
      </div>
      <a
        href="/portal/profile"
        className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-ink no-underline border border-dr-border px-3 py-2 cursor-pointer hover:border-dr-mid transition-colors"
      >
        Edit profile
      </a>
    </div>
  );
}
