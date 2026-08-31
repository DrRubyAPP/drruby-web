"use client";

import { useTranslations } from "next-intl";

/**
 * task-43 D6 STALE 可视化（T11）
 *
 * `pendingRegenAt` 非空（窗口未过）时的小条提示。
 * 与 AiStateView.STALE_UPDATE_AVAILABLE 互补：
 * - AiStateView 用于"主区"显示状态徽章（yourself/others/science 各自）
 * - PendingUpdateIndicator 用于"顶部"显示 pending 时间窗口 + Update now
 *
 * 受控组件：父组件拉 GET /decisions/[id] 后取 `pendingRegenAt` 传入；
 * 写入走 POST /regenerate（onUpdateNow 回调）。
 */
interface Props {
  /** Decision.pendingRegenAt；null/undefined → 不渲染 */
  pendingUntil: string | null | undefined;
  onUpdateNow?: () => void;
}

const UPDATE_BTN: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "4px 10px",
  cursor: "pointer",
  border: "1px solid #c8102e",
  background: "#fdf6ec",
  color: "#7c5a1a",
};

export function PendingUpdateIndicator({ pendingUntil, onUpdateNow }: Props) {
  const t = useTranslations("aiState");
  if (!pendingUntil) return null;

  return (
    <div
      style={{
        padding: "8px 12px",
        background: "#fdf6ec",
        border: "1px solid #f0c674",
        borderRadius: 4,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        fontSize: 12,
        color: "#7c5a1a",
      }}
    >
      <span>{t("pendingHint")}</span>
      <span style={{ color: "#a89a95" }}>
        {new Date(pendingUntil).toLocaleString()}
      </span>
      {onUpdateNow && (
        <button type="button" onClick={onUpdateNow} style={UPDATE_BTN}>
          {t("updateNow")}
        </button>
      )}
    </div>
  );
}
