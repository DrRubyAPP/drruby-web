"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/api";
import type { AiStateView as AiStateViewDto, Perspective } from "./mappers";

/**
 * task-43 §24–§26 AI 五态视图（T11）
 *
 * 按 view.state 渲染：
 * - LOADING：骨架屏（regen 进行中或首次 synthesis 生成中）
 * - READY：占位 div（让 CurrentSynthesisPanel 渲染 synthesis；本组件仅标记 ready）
 * - INSUFFICIENT_INFORMATION：三视角文案（§25 Yourself/Others/Science 各自空态）
 *   + Yourself 视角附 "Add health context" CTA
 * - FAILED：错误态 + Retry 按钮（§26 ≠ Insufficient，绝不伪装成"无证据"）
 * - STALE_UPDATE_AVAILABLE：黄色提示 "有更新可用" + Update now 按钮（调 POST /regenerate）
 *
 * 受控组件：父组件拉 GET /ai-state 后通过 props 分发；写入走 POST /regenerate。
 */
interface Props {
  view: AiStateViewDto;
  perspective: Perspective;
  onRetry?: () => void;
  onUpdateNow?: () => void;
  onAddHealthContext?: () => void;
}

const BTN_BASE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "6px 12px",
  cursor: "pointer",
};

const RETRY_BTN: React.CSSProperties = {
  ...BTN_BASE,
  border: "1px solid var(--p-red)",
  background: "transparent",
  color: "var(--p-red)",
};

const UPDATE_BTN: React.CSSProperties = {
  ...BTN_BASE,
  border: "1px solid #c8102e",
  background: "#fdf6ec",
  color: "#7c5a1a",
};

const CTA_BTN: React.CSSProperties = {
  ...BTN_BASE,
  border: "1px solid var(--p-red)",
  background: "var(--p-red)",
  color: "#fff",
};

export function AiStateView({
  view,
  perspective,
  onRetry,
  onUpdateNow,
  onAddHealthContext,
}: Props) {
  const t = useTranslations("aiState");

  switch (view.state) {
    case "LOADING":
      return <Skeleton lines={3} />;

    case "READY":
      // 占位：让 CurrentSynthesisPanel 渲染 synthesis；本组件不显示状态文案
      return <div className="ai-state-ready" aria-hidden="true" />;

    case "INSUFFICIENT_INFORMATION": {
      return (
        <div
          style={{
            padding: "12px 14px",
            background: "#f8f5f0",
            border: "1px solid #e8e0d8",
            borderRadius: 4,
          }}
        >
          <p style={{ fontSize: 14, color: "#7c746f", margin: 0 }}>
            {t(view.messageKey)}
          </p>
          {perspective === "yourself" && onAddHealthContext && (
            <button
              type="button"
              onClick={onAddHealthContext}
              style={{ ...CTA_BTN, marginTop: 10 }}
            >
              {t("addHealthContext")}
            </button>
          )}
        </div>
      );
    }

    case "FAILED": {
      return (
        <div
          style={{
            padding: "12px 14px",
            background: "#fff0f0",
            border: "1px solid #f0c674",
            borderRadius: 4,
          }}
        >
          <p style={{ fontSize: 14, color: "#7c5a1a", margin: 0 }}>
            {t(view.messageKey)}
          </p>
          {view.retryable && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{ ...RETRY_BTN, marginTop: 10 }}
            >
              {t("retry")}
            </button>
          )}
        </div>
      );
    }

    case "STALE_UPDATE_AVAILABLE": {
      return (
        <div
          style={{
            padding: "10px 14px",
            background: "#fdf6ec",
            border: "1px solid #f0c674",
            borderRadius: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "#7c5a1a" }}>
            <span>{t(view.messageKey)}</span>
            {view.pendingUntil && (
              <span style={{ marginLeft: 8, fontSize: 11, color: "#a89a95" }}>
                {new Date(view.pendingUntil).toLocaleString()}
              </span>
            )}
          </div>
          {onUpdateNow && (
            <button type="button" onClick={onUpdateNow} style={UPDATE_BTN}>
              {t("updateNow")}
            </button>
          )}
        </div>
      );
    }
  }
}
