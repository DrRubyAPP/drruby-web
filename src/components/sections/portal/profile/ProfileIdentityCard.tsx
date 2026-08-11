"use client";

import { useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type { MeDto, UpdateMeInput } from "./dto";

/** name 首字母派生 initials（无名时回退占位）。 */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Profile 身份卡客户端岛：读 GET /api/me 展示真实 name/email；
 * name 内联可编辑（Save → POST /api/me），email 只读、无编辑入口。
 * loading 占位、error → ErrorState（可 refetch）。
 */
export function ProfileIdentityCard() {
  const { data, error, loading, refetch } = useApi<MeDto>("/api/me");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [display, setDisplay] = useState<MeDto | null>(null);
  const me = display ?? data;

  const save = useMutation<UpdateMeInput, MeDto>(
    (input) => apiClient.post<MeDto>("/api/me", input),
    {
      onSuccess: (out) => {
        setDisplay(out);
        setEditing(false);
      },
    },
  );

  if (loading && !me) {
    return (
      <div className="bg-dr-white border border-dr-border p-5 mb-3 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-dr-off" />
        <div className="flex-1">
          <div className="h-5 w-40 bg-dr-off mb-2" />
          <div className="h-3 w-32 bg-dr-off" />
        </div>
      </div>
    );
  }

  if (error && !me) {
    return (
      <div className="mb-3">
        <ErrorState message={toErrorMessage(error)} onRetry={refetch} />
      </div>
    );
  }

  if (!me) return null;

  function startEdit() {
    setName(me!.name);
    save.reset();
    setEditing(true);
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || save.loading) return;
    save.mutate({ name: trimmed });
  }

  return (
    <div className="bg-dr-white border border-dr-border p-5 mb-3 flex items-center gap-4 flex-wrap">
      <div className="w-14 h-14 rounded-full bg-[rgba(200,16,46,0.1)] flex items-center justify-center text-[18px] text-dr-red font-medium">
        {initialsOf(me.name)}
      </div>

      {editing ? (
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={save.loading}
            aria-label="Full name"
            className="font-serif text-[22px] font-light text-dr-ink leading-tight w-full border-b border-dr-border bg-transparent focus:outline-none focus:border-dr-red"
          />
          <div className="text-[11px] text-dr-mid mt-0.5">{me.email}</div>
          {save.error && (
            <div className="mt-2">
              <ErrorState message={toErrorMessage(save.error)} />
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={save.loading}
              className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white bg-dr-red px-3 py-2 cursor-pointer disabled:opacity-60"
            >
              {save.loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={save.loading}
              className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-ink border border-dr-border px-3 py-2 cursor-pointer hover:border-dr-mid transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-[200px]">
            <div className="font-serif text-[22px] font-light text-dr-ink leading-tight">
              {me.name}
            </div>
            <div className="text-[11px] text-dr-mid mt-0.5">{me.email}</div>
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-ink border border-dr-border px-3 py-2 cursor-pointer hover:border-dr-mid transition-colors"
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}
