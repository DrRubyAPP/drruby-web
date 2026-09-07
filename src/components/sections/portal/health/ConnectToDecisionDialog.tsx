"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, useState } from "react";
import { toErrorMessage } from "@/components/sections/portal/coach-helpers";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "@/i18n/navigation";
import { ApiError, apiClient } from "@/lib/api";
import { SUBMIT_BTN } from "../decisions/drawerStyles";
import type { DecisionDto } from "../decisions/dto";
import { isActionable } from "../decisions/mappers";

const CENTER_OVERLAY: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 16,
};

const CENTER_MODAL: CSSProperties = {
  background: "#fff",
  padding: 24,
  maxWidth: 520,
  width: "100%",
  boxSizing: "border-box",
  position: "relative",
  maxHeight: "90vh",
  overflowY: "auto",
};

const OPTION_ROW: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "10px 0",
  borderBottom: "1px solid #eee",
  cursor: "pointer",
  fontSize: 14,
  color: "#524d49",
};

interface ConnectToDecisionDialogProps {
  recordId: string;
  /** task-49 F1：新建分支展示「相关记录」语境 */
  recordTitle: string;
  open: boolean;
  onClose: () => void;
  onConnected?: () => void;
  /** task-49 D-1：「暂不处理」落库成功后的回调（调用方刷新 connectDismissedAt） */
  onDismissed?: () => void;
}

type Choice = "existing" | "new" | "dismiss";

/**
 * C6 · Connect to a decision（Contract §2 核心护栏）+ task-49 F1 三选一。
 * Record 进 My Health ≠ 自动进 Decision；仅用户显式 Connect 才进该 Decision 的 Yourself。
 *
 * 三选一：
 * 1. existing — 连接已有 actionable Decision（关联表为引用来源）
 * 2. new — dialog 内嵌迷你表单：POST /api/decisions → 自动 connect → 跳详情（P-1）
 * 3. dismiss — 「暂不处理」落库 connectDismissedAt（D-1），
 *    不产生任何 Decision/连接；Cancel 才是无状态退出
 */
export function ConnectToDecisionDialog({
  recordId,
  recordTitle,
  open,
  onClose,
  onConnected,
  onDismissed,
}: ConnectToDecisionDialogProps) {
  const t = useTranslations("myHealth");
  const router = useRouter();
  const [choice, setChoice] = useState<Choice>("existing");
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const { data: decisions, loading } = useApi<DecisionDto[]>("/api/decisions");

  if (!open) return null;

  // 仅 actionable decision 可连接（History 行不进 Connect 列表）
  const actionableDecisions = (decisions ?? []).filter((d) =>
    isActionable(d.lifecycle),
  );

  function close() {
    setChoice("existing");
    setDecisionId(null);
    setQuestion("");
    setSubmitting(false);
    setErrMsg(null);
    onClose();
  }

  async function handleExisting() {
    if (!decisionId || submitting) return;
    setSubmitting(true);
    setErrMsg(null);
    try {
      await apiClient.post(`/api/decisions/${decisionId}/health-records`, {
        healthRecordId: recordId,
      });
      onConnected?.();
      close();
    } catch (e) {
      const err =
        e instanceof ApiError ? e : new ApiError("unknown", 0, "未知错误");
      if (err.status !== 401) setErrMsg(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  /** P-1：新建 Decision → 自动 connect → 跳详情（结局与 Ask 流程一致） */
  async function handleNew() {
    if (!question.trim() || submitting) return;
    setSubmitting(true);
    setErrMsg(null);
    try {
      const created = await apiClient.post<{ id: string }>("/api/decisions", {
        question: question.trim(),
        type: "not_sure",
      });
      await apiClient.post(`/api/decisions/${created.id}/health-records`, {
        healthRecordId: recordId,
      });
      onConnected?.();
      router.push(`/portal/decisions/${created.id}`);
      close();
    } catch (e) {
      const err =
        e instanceof ApiError ? e : new ApiError("unknown", 0, "未知错误");
      if (err.status !== 401) setErrMsg(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  /** D-1：「暂不处理」落库（幂等）；不产生任何 Decision/连接 */
  async function handleDismiss() {
    if (submitting) return;
    setSubmitting(true);
    setErrMsg(null);
    try {
      await apiClient.patch(`/api/health/records/${recordId}`, {
        action: "dismissConnect",
      });
      onDismissed?.();
      close();
    } catch (e) {
      const err =
        e instanceof ApiError ? e : new ApiError("unknown", 0, "未知错误");
      if (err.status !== 401) setErrMsg(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function confirm() {
    if (choice === "existing") return handleExisting();
    if (choice === "new") return handleNew();
    return handleDismiss();
  }

  const canConfirm =
    choice === "dismiss" ||
    (choice === "existing" && !!decisionId) ||
    (choice === "new" && question.trim().length > 0);

  const confirmLabel = submitting
    ? choice === "new"
      ? t("connect.creating")
      : choice === "dismiss"
        ? t("connect.dismissing")
        : t("connect.connecting")
    : t("connect.confirm");

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={CENTER_OVERLAY}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) close();
      }}
    >
      <div style={CENTER_MODAL}>
        <h3
          style={{
            margin: 0,
            marginBottom: 8,
            fontFamily: "var(--p-serif)",
            fontSize: 20,
            fontWeight: 400,
          }}
        >
          {t("connect.title")}
        </h3>
        <p style={{ fontSize: 13, color: "#6b6561", lineHeight: 1.6 }}>
          {t("connect.intro")}
        </p>

        {/* ── 选项 1：连接已有 Decision ── */}
        <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
          <legend style={{ display: "none" }}>connect choice</legend>
          <label style={OPTION_ROW}>
            <input
              type="radio"
              name="connect-choice"
              checked={choice === "existing"}
              onChange={() => setChoice("existing")}
              style={{ marginTop: 3 }}
            />
            <span style={{ fontWeight: 600 }}>{t("connect.existing")}</span>
          </label>

          {choice === "existing" && (
            <div style={{ margin: "4px 0 8px 20px" }}>
              {loading ? (
                <p style={{ fontSize: 13, color: "#a89a95", padding: "8px 0" }}>
                  {t("loading")}
                </p>
              ) : actionableDecisions.length === 0 ? (
                <p style={{ fontSize: 13, color: "#a89a95", padding: "8px 0" }}>
                  {t("connect.empty")}
                </p>
              ) : (
                actionableDecisions.map((d) => (
                  <label
                    key={d.id}
                    style={{ ...OPTION_ROW, fontSize: 13.5, paddingLeft: 4 }}
                  >
                    <input
                      type="radio"
                      name="connect-decision"
                      checked={decisionId === d.id}
                      onChange={() => setDecisionId(d.id)}
                      style={{ marginTop: 3 }}
                    />
                    <span>{d.question}</span>
                  </label>
                ))
              )}
            </div>
          )}

          {/* ── 选项 2：新建 Decision（P-1 迷你表单）── */}
          <label style={OPTION_ROW}>
            <input
              type="radio"
              name="connect-choice"
              checked={choice === "new"}
              onChange={() => setChoice("new")}
              style={{ marginTop: 3 }}
            />
            <span style={{ fontWeight: 600 }}>{t("connect.newDecision")}</span>
          </label>

          {choice === "new" && (
            <div style={{ margin: "4px 0 8px 20px" }}>
              <p style={{ fontSize: 12, color: "#a89a95", margin: "6px 0" }}>
                {t("connect.newDecisionHint")}{" "}
                {t("connect.relatedRecord", { title: recordTitle })}
              </p>
              <label
                htmlFor="connect-new-question"
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#524d49",
                  marginBottom: 6,
                }}
              >
                {t("connect.questionLabel")}
              </label>
              <textarea
                id="connect-new-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("connect.questionPlaceholder")}
                rows={3}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontSize: 14,
                  padding: "8px 10px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  resize: "vertical",
                }}
              />
            </div>
          )}

          {/* ── 选项 3：暂不处理（D-1）── */}
          <label style={OPTION_ROW}>
            <input
              type="radio"
              name="connect-choice"
              checked={choice === "dismiss"}
              onChange={() => setChoice("dismiss")}
              style={{ marginTop: 3 }}
            />
            <span style={{ fontWeight: 600 }}>{t("connect.notNow")}</span>
          </label>
          {choice === "dismiss" && (
            <p
              style={{
                fontSize: 12,
                color: "#a89a95",
                margin: "6px 0 8px 20px",
              }}
            >
              {t("connect.notNowHint")}
            </p>
          )}
        </fieldset>

        {errMsg && (
          <div style={{ color: "#8C2635", fontSize: 13, margin: "10px 0" }}>
            {errMsg}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="text-[12px] font-bold tracking-[0.16em] uppercase text-dr-mid border border-dr-border px-5 py-2.5 cursor-pointer disabled:opacity-50"
          >
            {t("connect.cancel")}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={submitting || !canConfirm}
            style={SUBMIT_BTN}
            className="disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
