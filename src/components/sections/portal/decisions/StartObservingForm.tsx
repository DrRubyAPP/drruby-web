"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState } from "@/components/api";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type { CheckInFrequency, DecisionDto, StartObservingInput } from "./dto";

/**
 * task-44 §27 Start Observing 表单（sub-plan-3 T8）
 *
 * - DECIDED → OBSERVING 原子提交（POST /observe/start）
 * - 字段：baselineText（必填）+ baselineRecordId（可选）+ freq（5 选 1，缺省 weekly）
 * - 表单顶部建议语不包装成医学治疗建议（§27）
 * - 提交后由父组件 refetch；本组件不直接 router.refresh（与项目模式一致）
 */
interface Props {
  decisionId: string;
  onStarted?: () => void;
}

const FREQ_OPTIONS: readonly CheckInFrequency[] = [
  "daily",
  "3days",
  "weekly",
  "2weeks",
  "monthly",
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

const INPUT: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--p-border)",
  padding: 10,
  fontSize: 15,
  marginBottom: 12,
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

export function StartObservingForm({ decisionId, onStarted }: Props) {
  const t = useTranslations("portal.decisionsDetail.observe");
  const [baselineText, setBaselineText] = useState("");
  const [baselineRecordId, setBaselineRecordId] = useState("");
  const [freq, setFreq] = useState<CheckInFrequency>("weekly");
  const [validationError, setValidationError] = useState<string | null>(null);

  const start = useMutation(
    (input: StartObservingInput) =>
      apiClient.post<DecisionDto>(
        `/api/decisions/${decisionId}/observe/start`,
        input,
      ),
    {
      onSuccess: () => {
        setBaselineText("");
        setBaselineRecordId("");
        setFreq("weekly");
        setValidationError(null);
        onStarted?.();
      },
    },
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!baselineText.trim()) {
      setValidationError("start.errorBaselineRequired");
      return;
    }
    setValidationError(null);
    start.mutate({
      baselineText: baselineText.trim(),
      baselineRecordId: baselineRecordId.trim() || undefined,
      freq,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="observe-baseline" style={LABEL}>
          {t("start.baselineLabel")}
        </label>
        <textarea
          id="observe-baseline"
          value={baselineText}
          onChange={(e) => setBaselineText(e.target.value)}
          rows={3}
          style={TEXTAREA}
          placeholder={t("start.baselinePlaceholder")}
        />
      </div>
      <div>
        <label htmlFor="observe-baseline-record" style={LABEL}>
          {t("start.baselineRecordLabel")}
        </label>
        <input
          id="observe-baseline-record"
          type="text"
          value={baselineRecordId}
          onChange={(e) => setBaselineRecordId(e.target.value)}
          style={INPUT}
          placeholder={t("start.baselineRecordPlaceholder")}
        />
      </div>
      <div>
        <label htmlFor="observe-freq" style={LABEL}>
          {t("start.freqLabel")}
        </label>
        <select
          id="observe-freq"
          value={freq}
          onChange={(e) => setFreq(e.target.value as CheckInFrequency)}
          style={INPUT}
        >
          {FREQ_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {t(`start.freq.${f}`)}
            </option>
          ))}
        </select>
        <p style={HINT}>{t("start.suggestionHint")}</p>
      </div>
      {validationError && (
        <p style={{ fontSize: 13, color: "var(--p-red)", marginBottom: 12 }}>
          {t(validationError)}
        </p>
      )}
      {start.error && (
        <ErrorState
          message={start.error.message}
          onRetry={() => start.reset()}
        />
      )}
      <button type="submit" disabled={start.loading} style={SUBMIT_BTN}>
        {start.loading ? t("start.submitting") : t("start.submit")}
      </button>
    </form>
  );
}
