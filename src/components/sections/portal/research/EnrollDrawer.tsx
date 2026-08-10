"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/components/api";
import {
  CLOSE_BTN,
  DRAWER,
  LABEL,
  OVERLAY,
  SUBMIT_BTN,
} from "@/components/sections/portal/decisions/drawerStyles";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type { EnrollResponse, StudyDto } from "./dto";

interface EnrollDrawerProps {
  study: StudyDto;
  onClose: () => void;
  onEnrolled: () => void;
}

/** 静态同意说明要点（硬编码，不依赖后端字段）。 */
const CONSENT_POINTS = [
  "My data from this study will be used for the research described above.",
  "I can withdraw at any time, without giving a reason.",
  "Participation is voluntary and does not affect my other DrRuby services.",
  "I have had the opportunity to ask questions about this study.",
];

/**
 * 入组同意抽屉：由 ResearchView 的 "Join study" 按钮触发。
 * - 单勾选框 "I consent" → Confirm 启用 → POST /api/studies/{id}/enroll
 * - body `{ consentGiven: true }`（对齐 z.literal(true)）
 * - onSuccess → onEnrolled()（父级 refetch + 关抽屉）
 * - 错误态：抽屉内 inline ErrorState，勾选状态保留可重试
 * - 关闭：X / Esc / 点遮罩
 */
export function EnrollDrawer({
  study,
  onClose,
  onEnrolled,
}: EnrollDrawerProps) {
  const [consented, setConsented] = useState(false);

  const enroll = useMutation(
    () =>
      apiClient.post<EnrollResponse>(`/api/studies/${study.id}/enroll`, {
        consentGiven: true,
      }),
    { onSuccess: () => onEnrolled() },
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
    if (!consented || enroll.loading) return;
    enroll.mutate(undefined as never);
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
            marginBottom: 8,
            fontFamily: "var(--p-serif)",
            fontSize: 22,
            fontWeight: 400,
          }}
        >
          Join study
        </h3>
        <div
          style={{
            fontSize: 15,
            color: "var(--p-ink)",
            marginBottom: 16,
          }}
        >
          {study.name}
        </div>

        <label style={LABEL}>Informed consent</label>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 13,
            color: "var(--p-mid)",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          {CONSENT_POINTS.map((p) => (
            <li key={p} style={{ marginBottom: 4 }}>
              {p}
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              fontSize: 14,
              color: "var(--p-ink)",
              marginBottom: 16,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>I consent to participate in this study</span>
          </label>

          {enroll.error && (
            <ErrorState
              message={enroll.error.message}
              onRetry={() => enroll.reset()}
            />
          )}

          <button
            type="submit"
            disabled={!consented || enroll.loading}
            style={{
              ...SUBMIT_BTN,
              opacity: !consented || enroll.loading ? 0.5 : 1,
            }}
          >
            {enroll.loading ? "Joining…" : "Confirm and join"}
          </button>
        </form>
      </div>
    </div>
  );
}
