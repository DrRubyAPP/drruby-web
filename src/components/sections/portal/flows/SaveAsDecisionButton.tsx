"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState } from "@/components/api";
import type { CreateDecisionInput } from "@/components/sections/portal/decisions/dto";
import { apiClient } from "@/lib/api/client";

type Step =
  | "idle"
  | "creating"
  | "appending"
  | "done"
  | "error-partial"
  | "error-full";

interface SaveAsDecisionButtonProps {
  question: string;
  entryText: string;
  /** 该决策服务的目标（对齐 concern_goals 词汇，必填） */
  goal: string;
}

/**
 * 共享按钮：3 个 Spine flow 末尾「Save as decision」CTA。
 *
 * 状态机：
 * - idle → creating (POST /api/decisions)
 *   - 成功 → appending (POST /api/decisions/[id]/entries)
 *     - 成功 → done (router.push /portal#v-decisions)
 *     - 失败 → error-partial（决策已创建，首条记录失败 → 提供「跳到决策」链接）
 *   - 失败 → error-full（inline error + 重试）
 *
 * 401 由 portal/layout 的 UnauthorizedRedirect 全局接管，本组件不单独处理。
 */
export function SaveAsDecisionButton({
  question,
  entryText,
  goal,
}: SaveAsDecisionButtonProps) {
  const router = useRouter();
  const t = useTranslations("portal.saveCta");
  const [step, setStep] = useState<Step>("idle");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const busy = step === "creating" || step === "appending";

  async function handleClick() {
    setStep("creating");
    setErrorMsg(null);
    try {
      const created = await apiClient.post<{ id: string }>("/api/decisions", {
        question,
        goal,
        status: "considering",
        type: null,
      } satisfies CreateDecisionInput);
      setCreatedId(created.id);
      setStep("appending");
      try {
        await apiClient.post(`/api/decisions/${created.id}/entries`, {
          text: entryText,
        });
        setStep("done");
        router.push("/portal#v-decisions");
      } catch (e) {
        setStep("error-partial");
        setErrorMsg(e instanceof Error ? e.message : "Append entry failed");
      }
    } catch (e) {
      setStep("error-full");
      setErrorMsg(e instanceof Error ? e.message : "Create decision failed");
    }
  }

  function retry() {
    // error-full: 从头走流程；error-partial: 重新尝试 append（createdId 已知）
    if (step === "error-partial" && createdId) {
      setStep("appending");
      void appendOnly(createdId);
    } else {
      setStep("idle");
    }
  }

  async function appendOnly(id: string) {
    setErrorMsg(null);
    try {
      await apiClient.post(`/api/decisions/${id}/entries`, {
        text: entryText,
      });
      setStep("done");
      router.push("/portal#v-decisions");
    } catch (e) {
      setStep("error-partial");
      setErrorMsg(e instanceof Error ? e.message : "Append entry failed");
    }
  }

  if (step === "done") {
    return (
      <div style={{ fontSize: 13, color: "var(--p-mid)", marginTop: 16 }}>
        {t("saved")}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        style={{
          background: "var(--p-red)",
          color: "#fff",
          border: "none",
          padding: "12px 24px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.5 : 1,
        }}
      >
        {busy ? t("submitting") : t("label")}
      </button>

      {step === "error-partial" && (
        <div style={{ marginTop: 12 }}>
          <ErrorState
            message={`${t("errorPartial")} ${errorMsg ?? ""}`.trim()}
            onRetry={() => retry()}
          />
          <Link
            href="/portal#v-decisions"
            style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 12,
              color: "var(--p-red)",
              textDecoration: "underline",
            }}
          >
            {t("jumpToDecision")}
          </Link>
        </div>
      )}

      {step === "error-full" && (
        <div style={{ marginTop: 12 }}>
          <ErrorState
            message={`${t("errorFull")} ${errorMsg ?? ""}`.trim()}
            onRetry={() => retry()}
          />
        </div>
      )}
    </div>
  );
}
