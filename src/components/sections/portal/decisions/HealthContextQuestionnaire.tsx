"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ErrorState, Skeleton } from "@/components/api";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type { HealthContextDto } from "./dto";
import {
  HEALTH_CONTEXT_CATEGORIES,
  HEALTH_CONTEXT_CATEGORY_LABEL_KEYS,
} from "./mappers";

/**
 * task-43 §19/§20/§21 Health Context 问卷（T10）
 *
 * §19：5 类预填（symptoms/medications_treatments/related_health_changes/
 *   current_health_state/goals_concerns），用户主要"确认有什么变化"
 * §20：unconfirmed 永不自动转 confirmed；顶部条提示"健康语境尚未确认"
 * §21：Confirm no changes = DECIDE 前 gate（status=confirmed + 刷 confirmedAt）；
 *   不阻塞 regeneration（问卷 unconfirmed 不影响 Record 参与 regen）
 *
 * 受控组件：父组件拉 GET /health-context 后通过 props 分发；
 * 写入走 PUT /health-context（Save changes）+ POST /health-context（Confirm no changes）。
 */
interface Props {
  decisionId: string;
  data: HealthContextDto | null;
  loading: boolean;
  error: { message: string } | null;
  onRetry?: () => void;
  refetch: () => void;
}

interface DraftRow {
  category: (typeof HEALTH_CONTEXT_CATEGORIES)[number];
  labelKey: string;
  value: string;
}

const SUBMIT_BTN: React.CSSProperties = {
  background: "var(--p-red)",
  color: "#fff",
  border: "none",
  padding: "10px 18px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const TEXTAREA: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--p-border)",
  padding: 10,
  fontFamily: "var(--p-serif)",
  fontSize: 15,
  marginBottom: 12,
  resize: "vertical",
  boxSizing: "border-box",
};

const CONFIRM_BTN: React.CSSProperties = {
  ...SUBMIT_BTN,
  background: "transparent",
  color: "var(--p-red)",
  border: "1px solid var(--p-red)",
};

export function HealthContextQuestionnaire({
  decisionId,
  data,
  loading,
  error,
  onRetry,
  refetch,
}: Props) {
  const t = useTranslations("decisions.healthContext");
  const [draft, setDraft] = useState<Record<string, string>>({});

  // 预填：data 变化时同步 draft（保留用户已编辑的字段不被覆盖）
  useEffect(() => {
    if (!data) return;
    setDraft((prev) => {
      const next: Record<string, string> = {};
      for (const cat of HEALTH_CONTEXT_CATEGORIES) {
        const serverVal = data.healthContext?.[cat] ?? "";
        next[cat] = prev[cat] ?? serverVal;
      }
      return next;
    });
  }, [data]);

  // Save changes：PUT /health-context 写入 5 类，status 保持 unconfirmed（§20）
  const save = useMutation(
    (input: { healthContext: Record<string, string>; status: "unconfirmed" }) =>
      apiClient.put<HealthContextDto>(
        `/api/decisions/${decisionId}/health-context`,
        input,
      ),
    { onSuccess: () => refetch() },
  );

  // Confirm no changes：POST /health-context，status=confirmed（§21 gate）
  const confirm = useMutation(
    (_input: void) =>
      apiClient.post<HealthContextDto>(
        `/api/decisions/${decisionId}/health-context`,
      ),
    { onSuccess: () => refetch() },
  );

  if (loading) return <Skeleton lines={5} />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (!data) return null;

  const rows: DraftRow[] = HEALTH_CONTEXT_CATEGORIES.map((category) => ({
    category,
    labelKey: HEALTH_CONTEXT_CATEGORY_LABEL_KEYS[category],
    value: draft[category] ?? "",
  }));

  const isUnconfirmed = data.status !== "confirmed";
  // 只提交非空字段（避免覆盖服务端已存值为空字符串）
  const nonEmptyDraft: Record<string, string> = {};
  for (const cat of HEALTH_CONTEXT_CATEGORIES) {
    const v = draft[cat];
    if (v != null && v !== "") nonEmptyDraft[cat] = v;
  }

  return (
    <div className="card">
      <div className="sec-h">{t("title")}</div>

      {isUnconfirmed && (
        <div
          style={{
            background: "#fdf6ec",
            border: "1px solid #f0c674",
            padding: "8px 12px",
            marginBottom: 14,
            borderRadius: 4,
            fontSize: 13,
            color: "#7c5a1a",
          }}
        >
          {t("unconfirmedBanner")}
        </div>
      )}

      {rows.map((row) => (
        <div key={row.category}>
          <label
            htmlFor={`hc-${row.category}`}
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#524d49",
              marginBottom: 4,
            }}
          >
            {t(row.labelKey)}
          </label>
          <textarea
            id={`hc-${row.category}`}
            value={row.value}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, [row.category]: e.target.value }))
            }
            rows={2}
            style={TEXTAREA}
            placeholder={t(`placeholder.${row.category}`)}
          />
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          type="button"
          onClick={() =>
            save.mutate({
              healthContext: nonEmptyDraft,
              status: "unconfirmed",
            })
          }
          disabled={save.loading}
          style={SUBMIT_BTN}
        >
          {save.loading ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          onClick={() => confirm.mutate(undefined as unknown as void)}
          disabled={confirm.loading}
          style={CONFIRM_BTN}
        >
          {confirm.loading ? t("confirming") : t("confirmNoChanges")}
        </button>
      </div>

      {save.error && (
        <ErrorState message={save.error.message} onRetry={() => save.reset()} />
      )}
      {confirm.error && (
        <ErrorState
          message={confirm.error.message}
          onRetry={() => confirm.reset()}
        />
      )}

      {data.healthContextConfirmedAt && (
        <div style={{ fontSize: 11, color: "#a89a95", marginTop: 10 }}>
          {t("confirmedAt", {
            date: new Date(data.healthContextConfirmedAt).toLocaleDateString(),
          })}
        </div>
      )}
    </div>
  );
}
