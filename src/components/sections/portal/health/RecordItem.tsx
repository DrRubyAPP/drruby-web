"use client";

import { useTranslations } from "next-intl";
import type { ParsedValueItem } from "./dto";

/**
 * 单条抽取结果项（Contract §13）。
 * - 展示 name / value / unit / flag
 * - needsConfirm=true 时显式标 "Please confirm"——不确定性不得隐藏
 * - 单项 confidence 缺省时回退到 Record.confidence（由上层渲染）
 */
export function RecordItem({
  item,
  needsConfirm,
}: {
  item: ParsedValueItem;
  needsConfirm: boolean;
}) {
  const t = useTranslations("myHealth");
  const valueDisplay =
    item.value == null || item.value === ""
      ? "—"
      : `${item.value}${item.unit ? ` ${item.unit}` : ""}`;
  return (
    <div
      className="rec-item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <span style={{ flex: 1, fontSize: 14, color: "#524d49" }}>
        {item.name}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {valueDisplay}
      </span>
      {item.flag && (
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            color: "#8C2635",
          }}
        >
          {item.flag}
        </span>
      )}
      {needsConfirm && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".08em",
            color: "#a87422",
            border: "1px solid #f0c674",
            padding: "2px 6px",
          }}
        >
          {t("pleaseConfirm")}
        </span>
      )}
    </div>
  );
}
