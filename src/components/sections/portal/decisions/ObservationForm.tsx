"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState } from "@/components/api";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type {
  CreateObservationEntryInput,
  DecisionEntryDto,
  ObservationDirection,
  UpdateObservationEntryInput,
} from "./dto";

/**
 * task-44 §28 Observation 表单（sub-plan-3 T9）
 *
 * - 新建模式（default）：POST /api/decisions/[id]/observations
 * - 修正模式（existingEntry 传入）：PATCH /api/decisions/[id]/observations/[entryId]
 *   - append-only 原则下保留 occurredAt/createdAt 不变（服务端处理）
 * - direction 四态（better/same/worse/not_sure）+ 非必填（§28 允许无方向描述）
 *   - 已选 direction 再点一次 → 取消（null）
 * - text 必填
 * - synthesis {photos, recordRefs} 字段 V1 UI 不暴露上传入口（API 已支持；后续接入 task-42 上传基建）
 */
interface Props {
  decisionId: string;
  /** 传入则进入修正模式（PATCH） */
  existingEntry?: Pick<DecisionEntryDto, "id" | "text" | "direction">;
  onSaved?: () => void;
}

const DIRECTIONS: readonly ObservationDirection[] = [
  "better",
  "same",
  "worse",
  "not_sure",
];

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

const CHIP_BASE: React.CSSProperties = {
  border: "1px solid var(--p-border)",
  background: "#fff",
  color: "#524d49",
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  marginRight: 6,
};

const CHIP_ACTIVE: React.CSSProperties = {
  border: "1px solid var(--p-red)",
  background: "rgba(200,16,46,0.06)",
  color: "var(--p-red)",
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  marginRight: 6,
};

export function ObservationForm({ decisionId, existingEntry, onSaved }: Props) {
  const t = useTranslations("portal.decisionsDetail.observe");
  const isEdit = Boolean(existingEntry);
  const [text, setText] = useState(existingEntry?.text ?? "");
  const [direction, setDirection] = useState<ObservationDirection | null>(
    existingEntry?.direction ?? null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // 新建：POST /observations
  const create = useMutation(
    (input: CreateObservationEntryInput) =>
      apiClient.post<DecisionEntryDto>(
        `/api/decisions/${decisionId}/observations`,
        input,
      ),
    {
      onSuccess: () => {
        setText("");
        setDirection(null);
        setValidationError(null);
        onSaved?.();
      },
    },
  );

  // 修正：PATCH /observations/[entryId]
  const update = useMutation(
    (input: UpdateObservationEntryInput & { entryId: string }) =>
      apiClient.patch<DecisionEntryDto>(
        `/api/decisions/${decisionId}/observations/${input.entryId}`,
        {
          text: input.text,
          direction: input.direction,
          synthesis: input.synthesis,
        },
      ),
    {
      onSuccess: () => {
        setValidationError(null);
        onSaved?.();
      },
    },
  );

  const submitting = create.loading || update.loading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setValidationError("observation.errorTextRequired");
      return;
    }
    setValidationError(null);
    if (isEdit && existingEntry) {
      update.mutate({
        entryId: existingEntry.id,
        text: text.trim(),
        direction,
      });
    } else {
      create.mutate({
        text: text.trim(),
        direction: direction ?? undefined,
      });
    }
  }

  function toggleDirection(d: ObservationDirection) {
    setDirection((prev) => (prev === d ? null : d));
  }

  const error = create.error || update.error;

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 12 }}>
        <span style={LABEL}>{t("observation.directionLabel")}</span>
        <p style={HINT}>{t("observation.directionHint")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 8 }}>
          {DIRECTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDirection(d)}
              style={direction === d ? CHIP_ACTIVE : CHIP_BASE}
              aria-pressed={direction === d}
            >
              {t(`observation.direction.${d}`)}
            </button>
          ))}
        </div>
        {/* direction 非必填（§28 允许无方向描述），不渲染"取消"按钮 —
            用户可点击已选 direction 取消 */}
      </div>
      <div>
        <label htmlFor="obs-text" style={LABEL}>
          {t("observation.textLabel")}
        </label>
        <textarea
          id="obs-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={TEXTAREA}
          placeholder={t("observation.textPlaceholder")}
        />
      </div>
      {validationError && (
        <p style={{ fontSize: 13, color: "var(--p-red)", marginBottom: 12 }}>
          {t(validationError)}
        </p>
      )}
      {error && (
        <ErrorState
          message={error.message}
          onRetry={() => {
            create.reset();
            update.reset();
          }}
        />
      )}
      <button type="submit" disabled={submitting} style={SUBMIT_BTN}>
        {submitting
          ? t("observation.submitting")
          : isEdit
            ? t("observation.save")
            : t("observation.submit")}
      </button>
    </form>
  );
}
