"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type {
  DecisionEntryDto,
  LearningTemplateDto,
  SaveLearningInput,
} from "./dto";

/**
 * task-44 §29 Learning summary 表单（sub-plan-3 T10）
 *
 * - 仅 LEARNING 状态渲染（Stop Observing 后弹出）
 * - mount 时 GET /api/decisions/[id]/learn 拿模板预填（D1 纯模板拼装，不引入 LLM）
 * - 模板 text 可编辑；supporting observations 默认全选，可取消（D12）
 * - 提交 POST /api/decisions/[id]/learn → lifecycle → COMPLETED
 * - 不展示 Emerging/Moderate/Strong/置信度%（§29 禁用）— 由 buildLearningTemplate 保证
 * - 历史学习不被无痕改写（§14）：每次保存写新 entry，旧 entry 保留（由父组件时间线渲染）
 *
 * supporting observations 列表从 GET /learn 响应中取（template 只返回 ids，
 * 故同端点附带 observations 详情）。如果 GET 只返回 ids，前端拉一次 GET /observations
 * 来取详情。简化：本组件再 GET /observations 拿 text 用于复选框 label。
 */
interface Props {
  decisionId: string;
  onSaved?: () => void;
}

const SUBMIT_BTN: React.CSSProperties = {
  background: "var(--p-red)",
  color: "#fff",
  border: "none",
  padding: "12px 24px",
  fontSize: 12,
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

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#524d49",
  marginBottom: 4,
};

const HINT: React.CSSProperties = {
  fontSize: 12,
  color: "#a89a95",
  marginTop: 4,
};

const OBS_LIST_ITEM: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontSize: 13,
  color: "#524d49",
  marginBottom: 4,
};

export function LearningSummaryForm({ decisionId, onSaved }: Props) {
  const t = useTranslations("portal.decisionsDetail.observe");

  // GET /learn 拿模板预填
  const {
    data: templateData,
    error: templateError,
    loading: templateLoading,
    refetch: refetchTemplate,
  } = useApi<{ template: LearningTemplateDto }>(
    `/api/decisions/${decisionId}/learn`,
  );

  // GET /observations 拿 observation 详情（id + text + direction）用于复选框 label
  const {
    data: obsData,
    error: obsError,
    loading: obsLoading,
    refetch: refetchObs,
  } = useApi<{ observations: DecisionEntryDto[] }>(
    `/api/decisions/${decisionId}/observations`,
  );

  const [text, setText] = useState<string | null>(null); // null = 未编辑，展示 template.text
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null); // null = 未编辑，使用 template default
  const [validationError, setValidationError] = useState<string | null>(null);

  // 派生：用户未编辑时用 template 默认；编辑后用 state
  const templateText = templateData?.template.text ?? "";
  const templateIds = templateData?.template.supportingObservationIds ?? [];
  const textValue = text ?? templateText;
  const selectedSet = selectedIds ?? new Set(templateIds);

  const observations = obsData?.observations ?? [];

  const save = useMutation(
    (input: SaveLearningInput) =>
      apiClient.post<{ learning: DecisionEntryDto }>(
        `/api/decisions/${decisionId}/learn`,
        input,
      ),
    {
      onSuccess: () => {
        setText(null);
        setSelectedIds(null);
        setValidationError(null);
        onSaved?.();
      },
    },
  );

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const base = prev ?? new Set(templateIds);
      const next = new Set(base);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textValue.trim()) {
      setValidationError("learn.errorTextRequired");
      return;
    }
    setValidationError(null);
    save.mutate({
      text: textValue.trim(),
      supportingObservationIds: Array.from(selectedSet),
    });
  }

  if (templateLoading || obsLoading) return <Skeleton lines={4} />;
  if (templateError)
    return (
      <ErrorState message={templateError.message} onRetry={refetchTemplate} />
    );
  if (obsError)
    return <ErrorState message={obsError.message} onRetry={refetchObs} />;

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <span style={LABEL}>{t("learn.summaryLabel")}</span>
        <textarea
          value={textValue}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          style={TEXTAREA}
          placeholder={t("learn.summaryPlaceholder")}
        />
        <p style={HINT}>{t("learn.summaryHint")}</p>
      </div>
      <div style={{ marginBottom: 12 }}>
        <span style={LABEL}>{t("learn.supportingLabel")}</span>
        {observations.length === 0 ? (
          <p style={HINT}>{t("learn.supportingEmpty")}</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
            {observations.map((o) => (
              <li key={o.id} style={OBS_LIST_ITEM}>
                <input
                  type="checkbox"
                  checked={selectedSet.has(o.id)}
                  onChange={() => toggle(o.id)}
                  style={{ marginTop: 3 }}
                />
                <span>
                  {o.direction && (
                    <span
                      className="dec-badge"
                      style={{
                        marginRight: 6,
                        background: "#f0e6e8",
                        color: "var(--p-red)",
                        fontSize: 11,
                      }}
                    >
                      {t(`observation.direction.${o.direction}`)}
                    </span>
                  )}
                  {o.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {validationError && (
        <p style={{ fontSize: 13, color: "var(--p-red)", marginBottom: 12 }}>
          {t(validationError)}
        </p>
      )}
      {save.error && (
        <ErrorState message={save.error.message} onRetry={() => save.reset()} />
      )}
      <button type="submit" disabled={save.loading} style={SUBMIT_BTN}>
        {save.loading ? t("learn.submitting") : t("learn.saveAndComplete")}
      </button>
    </form>
  );
}
