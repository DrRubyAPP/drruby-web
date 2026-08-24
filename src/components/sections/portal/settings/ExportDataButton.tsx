"use client";

import { useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { ApiError } from "@/lib/api";
import { apiClient } from "@/lib/api/client";
import { exportFileName } from "./export-helpers";

/**
 * Settings 数据导出岛：点击 → GET /api/me/export（bearer 自动附）→ 全量 JSON
 * → Blob + 临时 object URL → 触发浏览器下载（文件名 drruby-export-YYYY-MM-DD.json）。
 * loading 期间禁用 + 文案切换；失败走前端统一文案（不泄漏后端 message）；401 交上层。
 */
export function ExportDataButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleExport() {
    if (loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const data = await apiClient.get<unknown>("/api/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportFileName(new Date());
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const err =
        e instanceof ApiError ? e : new ApiError("unknown", 0, "未知错误");
      // 401 由 fetchJson/上层 401 机制处理，不就近展示
      if (err.status !== 401) setMsg(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="sub-row" style={{ cursor: loading ? "wait" : "pointer" }}>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading}
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            fontFamily: "inherit",
            fontSize: "inherit",
            color: "inherit",
            textAlign: "left",
            flex: 1,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          <div className="sr2">
            <b>{loading ? "Exporting…" : "Download my data"}</b>
            <span>A copy of your full history.</span>
          </div>
        </button>
        <span className="arr">&rsaquo;</span>
      </div>
      {msg && <ErrorState message={msg} />}
    </>
  );
}
