"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { apiClient } from "@/lib/api/client";

interface PrefDto {
  key: string;
  enabled: boolean;
}

const PREF_ORDER = [
  "weekly_digest",
  "decision_followups",
  "study_updates",
  "product_updates",
] as const;

const LABEL_KEYS: Record<string, string> = {
  weekly_digest: "notifications.weeklyDigest",
  decision_followups: "notifications.decisionFollowups",
  study_updates: "notifications.studyUpdates",
  product_updates: "notifications.productUpdates",
};

/**
 * privacy 视图 "Notification preferences" 展开区：4 个固定开关。
 * - GET /api/notification-preferences 加载（未写过的 key 服务端默认 enabled=true）
 * - 开关点击 → PUT 乐观更新，失败回滚 + 就地错误提示
 */
export function NotificationPrefs() {
  const t = useTranslations("portal.privacy");
  const [prefs, setPrefs] = useState<PrefDto[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    apiClient
      .get<PrefDto[]>("/api/notification-preferences")
      .then((rows) => {
        if (!cancelled) setPrefs(rows);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(pref: PrefDto) {
    if (!prefs) return;
    const next = !pref.enabled;
    const prev = prefs;
    // 乐观更新
    setPrefs(
      prefs.map((p) => (p.key === pref.key ? { ...p, enabled: next } : p)),
    );
    setSaveError(false);
    try {
      await apiClient.put("/api/notification-preferences", {
        key: pref.key,
        enabled: next,
      });
    } catch (e) {
      const err =
        e instanceof ApiError ? e : new ApiError("unknown", 0, "未知错误");
      if (err.status === 401) return;
      // 回滚
      setPrefs(prev);
      setSaveError(true);
    }
  }

  function retry() {
    setPrefs(null);
    setLoadError(false);
    apiClient
      .get<PrefDto[]>("/api/notification-preferences")
      .then((rows) => setPrefs(rows))
      .catch(() => setLoadError(true));
  }

  if (loadError) {
    return (
      <div
        style={{
          padding: "12px 0 4px",
          fontSize: 13,
          color: "#8C2635",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{t("notifications.error")}</span>
        <button
          type="button"
          onClick={retry}
          style={{
            background: "transparent",
            border: "none",
            color: "#8C2635",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
            textTransform: "uppercase",
            fontSize: 11,
            letterSpacing: ".08em",
          }}
        >
          {t("notifications.retry")}
        </button>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div style={{ padding: "12px 0 4px", fontSize: 13, color: "#a89a95" }}>
        …
      </div>
    );
  }

  const ordered = PREF_ORDER.map(
    (key) => prefs.find((p) => p.key === key) ?? { key, enabled: true },
  );

  return (
    <div style={{ padding: "6px 0 2px" }}>
      {ordered.map((p) => (
        <label
          key={p.key}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 0",
            fontSize: 14,
            color: "#524d49",
            cursor: "pointer",
            borderBottom: "1px solid #f0ece9",
          }}
        >
          <span>{t(LABEL_KEYS[p.key] ?? p.key)}</span>
          <input
            type="checkbox"
            aria-label={t(LABEL_KEYS[p.key] ?? p.key)}
            checked={p.enabled}
            onChange={() => toggle(p)}
            style={{ width: 16, height: 16, accentColor: "#8C2635" }}
          />
        </label>
      ))}
      {saveError && (
        <div style={{ fontSize: 12.5, color: "#8C2635", paddingTop: 8 }}>
          {t("notifications.error")}
        </div>
      )}
    </div>
  );
}
