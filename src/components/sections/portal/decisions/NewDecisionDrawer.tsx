"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/components/api";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import {
  ACTIVE_CHIP,
  CLOSE_BTN,
  DRAWER,
  LABEL,
  OVERLAY,
  SUBMIT_BTN,
  TEXTAREA,
} from "./drawerStyles";
import type { CreateDecisionInput, DecisionStatus, DecisionType } from "./dto";
import {
  chipToQuestionTemplate,
  chipToType,
  DECISION_STATUSES,
  statusToLabel,
} from "./mappers";

interface NewDecisionDrawerProps {
  chip: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}

/**
 * 新建决策抽屉：由 DecisionsView 的 "Start a new decision" chips 触发。
 * - 预填 question 模板（`chipToQuestionTemplate`）+ type（`chipToType`）+ status=considering
 * - POST /api/decisions → onSuccess 调 onCreated(out.id)（关抽屉 + 触发详情打开 + refetch 列表）
 * - 错误态：抽屉内 inline ErrorState，输入保留可重试
 * - 关闭：X 按钮 / Esc / 点遮罩
 */
export function NewDecisionDrawer({
  chip,
  onClose,
  onCreated,
}: NewDecisionDrawerProps) {
  const [question, setQuestion] = useState(chipToQuestionTemplate(chip));
  const [status, setStatus] = useState<DecisionStatus>("considering");
  const type: DecisionType = chipToType(chip);

  const create = useMutation(
    (input: CreateDecisionInput) =>
      apiClient.post<{ id: string }>("/api/decisions", input),
    { onSuccess: (out) => onCreated(out.id) },
  );

  // Esc 关闭
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim().length === 0) return;
    create.mutate({ question: question.trim(), status, type });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={OVERLAY}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={DRAWER}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={CLOSE_BTN}
        >
          ×
        </button>
        <h3
          style={{
            margin: 0,
            marginBottom: 16,
            fontFamily: "var(--p-serif)",
            fontSize: 22,
            fontWeight: 400,
          }}
        >
          New decision
        </h3>

        <form onSubmit={handleSubmit}>
          <label style={LABEL}>Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            style={TEXTAREA}
            autoFocus
          />

          <label style={LABEL}>Type</label>
          <div
            style={{
              display: "inline-block",
              padding: "7px 13px",
              background: "var(--p-off)",
              border: "1px solid var(--p-border)",
              borderRadius: 20,
              fontSize: 13,
              color: "var(--p-mid)",
              marginBottom: 16,
            }}
          >
            {chip}
          </div>

          <label style={LABEL}>Status</label>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            {DECISION_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className="ask-chip"
                onClick={() => setStatus(s)}
                style={status === s ? ACTIVE_CHIP : undefined}
              >
                {statusToLabel(s)}
              </button>
            ))}
          </div>

          {create.error && (
            <ErrorState
              message={create.error.message}
              onRetry={() => create.reset()}
            />
          )}

          <button
            type="submit"
            disabled={create.loading || question.trim().length === 0}
            style={SUBMIT_BTN}
          >
            {create.loading ? "Saving…" : "Save decision"}
          </button>
        </form>
      </div>
    </div>
  );
}
