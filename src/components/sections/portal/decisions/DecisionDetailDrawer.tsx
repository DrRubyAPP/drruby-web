"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import type { ApiError } from "@/lib/api";
import { apiClient } from "@/lib/api/client";
import {
  ACTIVE_CHIP,
  BRIEF_BLOCK,
  BRIEF_TITLE,
  CLOSE_BTN,
  DRAWER,
  LABEL,
  OVERLAY,
  SUBMIT_BTN,
  TEXTAREA,
} from "./drawerStyles";
import type { DecisionDetailDto, DecisionStatus } from "./dto";
import type { DecisionDetailView } from "./mappers";
import {
  DECISION_STATUSES,
  goalToLabel,
  mapDecisionDetail,
  statusToLabel,
} from "./mappers";

interface DecisionDetailDrawerProps {
  id: string;
  onClose: () => void;
  /** 列表 refetch（status 推进 / 追加 entry 后调用，保持列表与详情同步）。 */
  onChanged: () => void;
}

/**
 * 决策详情抽屉：列表卡片点击触发。
 * - useApi GET /api/decisions/[id] → mapDecisionDetail → 渲染
 * - brief null/缺失 → 整块隐藏
 * - entries 时间线（升序，append-only，不可编辑/删除）
 * - status 切换器：4 chips → POST /api/decisions/[id] { status }
 * - 追加表单：textarea → POST /api/decisions/[id]/entries { text }
 * - 错误态：抽屉内 inline ErrorState
 */
export function DecisionDetailDrawer({
  id,
  onClose,
  onChanged,
}: DecisionDetailDrawerProps) {
  const { data, error, loading, refetch } = useApi<DecisionDetailDto>(
    `/api/decisions/${id}`,
  );
  const [entryText, setEntryText] = useState("");

  // Esc 关闭
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // status 推进（PATCH 语义）
  const updateStatus = useMutation(
    (status: DecisionStatus) =>
      apiClient.post(`/api/decisions/${id}`, { status }),
    {
      onSuccess: () => {
        refetch();
        onChanged();
      },
    },
  );

  // 追加 entry（append-only）
  const appendEntry = useMutation(
    (text: string) => apiClient.post(`/api/decisions/${id}/entries`, { text }),
    {
      onSuccess: () => {
        setEntryText("");
        refetch();
        onChanged();
      },
    },
  );

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

        {loading ? (
          <Skeleton lines={6} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : !data ? (
          <EmptyState title="Decision unavailable" hint="" />
        ) : (
          <DetailContent
            detail={mapDecisionDetail(data)}
            onStatusChange={(s) => updateStatus.mutate(s)}
            onAppend={(text) => appendEntry.mutate(text)}
            entryText={entryText}
            setEntryText={setEntryText}
            statusLoading={updateStatus.loading}
            statusError={updateStatus.error}
            appendLoading={appendEntry.loading}
            appendError={appendEntry.error}
          />
        )}
      </div>
    </div>
  );
}

function DetailContent({
  detail,
  onStatusChange,
  onAppend,
  entryText,
  setEntryText,
  statusLoading,
  statusError,
  appendLoading,
  appendError,
}: {
  detail: DecisionDetailView;
  onStatusChange: (s: DecisionStatus) => void;
  onAppend: (text: string) => void;
  entryText: string;
  setEntryText: (s: string) => void;
  statusLoading: boolean;
  statusError: ApiError | null;
  appendLoading: boolean;
  appendError: ApiError | null;
}) {
  return (
    <>
      <h3
        style={{
          margin: 0,
          marginBottom: 8,
          fontFamily: "var(--p-serif)",
          fontSize: 22,
          fontWeight: 400,
        }}
      >
        {detail.question}
      </h3>
      <span
        className="dec-badge"
        style={{ display: "inline-block", marginBottom: 16 }}
      >
        {detail.statusLabel}
      </span>

      {/* 所属 Goal（Spine 起点；旧数据可空则隐藏） */}
      {detail.goal && (
        <div style={{ marginBottom: 16 }}>
          <div style={LABEL}>For your goal of</div>
          <div
            style={{
              fontSize: 14,
              fontFamily: "var(--p-serif)",
              color: "var(--p-ink)",
            }}
          >
            {goalToLabel(detail.goal)}
          </div>
        </div>
      )}

      {/* status 切换器 */}
      <div style={{ marginBottom: 16 }}>
        <div style={LABEL}>Status</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DECISION_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className="ask-chip"
              onClick={() => onStatusChange(s)}
              disabled={statusLoading}
              style={detail.status === s ? ACTIVE_CHIP : undefined}
            >
              {statusToLabel(s)}
            </button>
          ))}
        </div>
        {statusError && (
          <ErrorState
            message={statusError.message}
            onRetry={() => onStatusChange(detail.status)}
          />
        )}
      </div>

      {/* brief（如存在） */}
      {detail.brief && (
        <div style={{ marginBottom: 16 }}>
          <div style={LABEL}>Decision brief</div>
          {detail.brief.hasYourHistory && (
            <BriefBlock title="Your history" items={detail.brief.yourHistory} />
          )}
          {detail.brief.hasSimilarJourneys && (
            <div style={BRIEF_BLOCK}>
              <div style={BRIEF_TITLE}>Similar journeys</div>
              <div>{detail.brief.similarJourneysSummary}</div>
              {detail.brief.similarJourneysNote && (
                <div style={{ fontSize: 12, color: "#a89a95" }}>
                  {detail.brief.similarJourneysNote}
                </div>
              )}
            </div>
          )}
          {detail.brief.hasEvidence && (
            <div style={BRIEF_BLOCK}>
              <div style={BRIEF_TITLE}>Evidence</div>
              <div>Known: {detail.brief.evidenceKnown.join(", ")}</div>
              <div>Uncertain: {detail.brief.evidenceUncertain.join(", ")}</div>
            </div>
          )}
          {detail.brief.hasQuestions && (
            <BriefBlock
              title="Questions for clinician"
              items={detail.brief.questionsForClinician}
            />
          )}
        </div>
      )}

      {/* entries 时间线（append-only，不可编辑） */}
      {detail.entries.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={LABEL}>Timeline</div>
          <div className="tl">
            {detail.entries.map((e) => (
              <div className="tl-item" key={e.id}>
                <span className="tl-dot" />
                <div className="tl-d">
                  {new Date(e.occurredAt).toLocaleDateString()}
                </div>
                <div className="tl-t">{e.text}</div>
                <div style={{ fontSize: 11, color: "#a89a95" }}>
                  Status: {statusToLabel(e.statusSnapshot)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 追加表单 */}
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (entryText.trim()) onAppend(entryText.trim());
        }}
      >
        <div style={LABEL}>Add entry</div>
        <textarea
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          rows={3}
          style={TEXTAREA}
          placeholder="What happened? What did you decide?"
        />
        {appendError && (
          <ErrorState
            message={appendError.message}
            onRetry={() => onAppend(entryText)}
          />
        )}
        <button
          type="submit"
          disabled={appendLoading || entryText.trim().length === 0}
          style={SUBMIT_BTN}
        >
          {appendLoading ? "Saving…" : "Add entry"}
        </button>
      </form>
    </>
  );
}

function BriefBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={BRIEF_BLOCK}>
      <div style={BRIEF_TITLE}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
