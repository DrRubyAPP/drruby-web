import type { CSSProperties } from "react";

/**
 * 抽屉共用 inline 样式常量。NewDecisionDrawer / DecisionDetailDrawer 共享。
 * 颜色与变量对齐 portal.css（--p-red / --p-border / --p-off / --p-mid / --p-serif）。
 */

/** 全屏遮罩：右对齐抽屉。 */
export const OVERLAY: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 1000,
};

/** 右侧抽屉容器。 */
export const DRAWER: CSSProperties = {
  width: "min(520px, 100vw)",
  height: "100vh",
  background: "#fff",
  padding: 24,
  overflowY: "auto",
  boxSizing: "border-box",
  position: "relative",
};

/** 右上角关闭按钮。 */
export const CLOSE_BTN: CSSProperties = {
  position: "absolute",
  top: 16,
  right: 16,
  background: "none",
  border: "none",
  fontSize: 28,
  cursor: "pointer",
  color: "#524d49",
};

/** 区块小标题（大写字母 + 字间距）。 */
export const LABEL: CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--p-red-d)",
  marginBottom: 6,
};

/** 文本域。 */
export const TEXTAREA: CSSProperties = {
  width: "100%",
  border: "1px solid var(--p-border)",
  padding: 10,
  fontFamily: "var(--p-serif)",
  fontSize: 16,
  marginBottom: 12,
  resize: "vertical",
  boxSizing: "border-box",
};

/** 选中态 chip。 */
export const ACTIVE_CHIP: CSSProperties = {
  borderColor: "var(--p-red)",
  color: "var(--p-red)",
  background: "rgba(200,16,46,0.06)",
};

/** 主操作按钮。 */
export const SUBMIT_BTN: CSSProperties = {
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

/** brief 子块容器。 */
export const BRIEF_BLOCK: CSSProperties = {
  marginBottom: 12,
  padding: "10px 12px",
  background: "var(--p-off)",
  border: "1px solid var(--p-border)",
};

/** brief 子块标题。 */
export const BRIEF_TITLE: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--p-mid)",
  marginBottom: 6,
};
