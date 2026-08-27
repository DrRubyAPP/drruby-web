"use client";

import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import type {
  OthersDimensionKey,
  ScienceBlockKey,
} from "@/config/decision-corpus";
import { getDecisionCorpus } from "@/config/decision-corpus";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { useRouter } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import { ACTIVE_CHIP, SUBMIT_BTN, TEXTAREA } from "./drawerStyles";
import type { DecisionDetailDto, DecisionStatus, DecisionType } from "./dto";
import {
  ALL_DECISION_TYPES,
  DECISION_STATUSES,
  sortEntries,
  statusToLabel,
  typeToLabel,
} from "./mappers";

type Perspective = "yourself" | "others" | "science";

const PERSPECTIVES: { key: Perspective; label: string }[] = [
  { key: "yourself", label: "Yourself" },
  { key: "others", label: "Others" },
  { key: "science", label: "Science" },
];

const OTHERS_DIMENSIONS: { key: OthersDimensionKey; label: string }[] = [
  { key: "helpful", label: "Helpful" },
  { key: "difficult", label: "Difficult" },
  { key: "varied", label: "Varied" },
  { key: "may-matter", label: "May matter" },
];

const SCIENCE_BLOCKS: { key: ScienceBlockKey; label: string }[] = [
  { key: "benefits", label: "Benefits" },
  { key: "risks", label: "Risks" },
  { key: "uncertainty", label: "Uncertainty" },
];

/**
 * 决策详情页（Slice 1 核心）：
 * - 三视角自由切换，无强制顺序；Yourself 草稿存客户端 state，切换不丢（A2）
 * - Yourself 草稿随 "Keep this" 一并落库（F4）；Not now 仅不置 saved，无任何提醒 UI（A4）
 * - Others / Science 读预置语料（type 驱动）；type 可改（B9）
 * - Observation 追加（迁移自 DecisionDetailDrawer，append-only）
 */
export function DecisionDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data, error, loading, refetch } = useApi<DecisionDetailDto>(
    `/api/decisions/${id}`,
  );
  const [tab, setTab] = useState<Perspective>("yourself");
  const [yourselfDraft, setYourselfDraft] = useState<string | null>(null); // null = 未编辑，展示已存值
  const [entryText, setEntryText] = useState("");

  // Keep this：saved + yourselfContext 一次提交（F4）
  const keep = useMutation(
    (input: { saved: boolean; yourselfContext?: string }) =>
      apiClient.post(`/api/decisions/${id}`, input),
    { onSuccess: () => refetch() },
  );

  // 改 type → 切换语料（B9）；改 status（迁移自 drawer）
  const update = useMutation(
    (input: { type?: DecisionType; status?: DecisionStatus }) =>
      apiClient.post(`/api/decisions/${id}`, input),
    { onSuccess: () => refetch() },
  );

  // Observation 追加（append-only）
  const appendEntry = useMutation(
    (text: string) => apiClient.post(`/api/decisions/${id}/entries`, { text }),
    {
      onSuccess: () => {
        setEntryText("");
        refetch();
      },
    },
  );

  if (loading) return <Skeleton lines={6} />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data)
    return (
      <EmptyState title="Decision not found" hint="It may have been removed." />
    );

  // A5：yourselfDraft 仅在用户编辑后覆盖；未编辑时展示服务端已存值
  const yourselfValue = yourselfDraft ?? data.yourselfContext ?? "";
  const corpus = getDecisionCorpus(data.type);
  const entries = sortEntries(data.entries);

  return (
    <div>
      <h1
        style={{
          fontFamily: "var(--p-serif)",
          fontWeight: 400,
          margin: "0 0 8px",
        }}
      >
        {data.question}
      </h1>
      <span className="dec-badge">{statusToLabel(data.status)}</span>

      {/* type 切换 chips（B9：改 type 换取对应语料） */}
      <div className="sec">
        <div className="sec-h">Type</div>
        <div className="ask-ex">
          {ALL_DECISION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className="ask-chip"
              disabled={update.loading}
              onClick={() => update.mutate({ type: t })}
              style={data.type === t ? ACTIVE_CHIP : undefined}
            >
              {typeToLabel(t)}
            </button>
          ))}
        </div>
        {update.error && (
          <ErrorState
            message={update.error.message}
            onRetry={() => update.reset()}
          />
        )}
      </div>

      {/* 三视角 tab（切换不卸载 Yourself 草稿 state，A2） */}
      <div className="sec">
        <div className="ask-ex" style={{ marginBottom: 14 }}>
          {PERSPECTIVES.map((p) => (
            <button
              key={p.key}
              type="button"
              className="ask-chip"
              onClick={() => setTab(p.key)}
              style={tab === p.key ? ACTIVE_CHIP : undefined}
            >
              {p.label}
            </button>
          ))}
        </div>

        {tab === "yourself" && (
          <div className="card">
            <div className="sec-h">Yourself</div>
            <p style={{ fontSize: 13.5, color: "#7c746f", marginTop: 8 }}>
              You don&apos;t need a complete medical history to start — a few
              lines of context are enough. This is saved only if you keep this
              decision.
            </p>
            <textarea
              value={yourselfValue}
              onChange={(e) => setYourselfDraft(e.target.value)}
              rows={5}
              placeholder="Anything relevant — age, symptoms, what you've already tried…"
              style={TEXTAREA}
            />
          </div>
        )}

        {tab === "others" && (
          <div className="card">
            <div className="sec-h">Others</div>
            {OTHERS_DIMENSIONS.map((dim) => (
              <div key={dim.key} style={{ margin: "14px 0" }}>
                <b style={{ fontSize: 14 }}>{dim.label}</b>
                <ul
                  style={{
                    margin: "6px 0 0 18px",
                    fontSize: 14,
                    lineHeight: 1.7,
                    padding: 0,
                  }}
                >
                  {corpus.others[dim.key].map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div style={{ fontSize: 12, color: "#a89a95" }}>
              What people report — not a statistic, not advice.
            </div>
          </div>
        )}

        {tab === "science" && (
          <div className="card">
            <div className="sec-h">Science</div>
            {SCIENCE_BLOCKS.map((blk) => (
              <div key={blk.key} style={{ margin: "14px 0" }}>
                <b style={{ fontSize: 14 }}>{blk.label}</b>
                <ul
                  style={{
                    margin: "6px 0 0 18px",
                    fontSize: 14,
                    lineHeight: 1.7,
                    padding: 0,
                  }}
                >
                  {corpus.science[blk.key].map((item, i) => (
                    <li key={i}>
                      {item.text}{" "}
                      <span style={{ fontSize: 11, color: "#a89a95" }}>
                        — {item.source}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div style={{ fontSize: 12, color: "#a89a95" }}>
              For learning, not medical advice.
            </div>
          </div>
        )}
      </div>

      {/* Save 区（A4：两选项视觉权重相等；Not now 无任何阻拦） */}
      {!data.saved ? (
        <div className="sec">
          <div className="sec-h">Keep this?</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="ask-btn"
              disabled={keep.loading}
              onClick={() =>
                keep.mutate({
                  saved: true,
                  yourselfContext: yourselfValue.trim() || undefined,
                })
              }
            >
              {keep.loading ? "Saving…" : "Keep this"}
            </button>
            <button
              type="button"
              className="ask-btn"
              onClick={() => router.push("/portal")}
            >
              Not now
            </button>
          </div>
          {keep.error && (
            <ErrorState
              message={keep.error.message}
              onRetry={() => keep.reset()}
            />
          )}
        </div>
      ) : (
        <div className="sec">
          <span className="dec-badge">Kept</span>
          <span style={{ fontSize: 12, color: "#a89a95", marginLeft: 8 }}>
            Saved — you can come back to this anytime.
          </span>
        </div>
      )}

      {/* Observation：append-only 时间线 + 追加表单（迁移自 DecisionDetailDrawer） */}
      <div className="sec">
        <div className="sec-h">Observations</div>
        {entries.length > 0 && (
          <div className="card">
            <div className="tl">
              {entries.map((e) => (
                <div className="tl-item" key={e.id}>
                  <span className="tl-dot" />
                  <div className="tl-d">
                    {new Date(e.occurredAt).toLocaleDateString()}
                  </div>
                  <div className="tl-t">{e.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            if (entryText.trim()) appendEntry.mutate(entryText.trim());
          }}
        >
          <textarea
            value={entryText}
            onChange={(e) => setEntryText(e.target.value)}
            rows={3}
            placeholder="What happened? What did you notice?"
            style={TEXTAREA}
          />
          {appendEntry.error && (
            <ErrorState
              message={appendEntry.error.message}
              onRetry={() => appendEntry.reset()}
            />
          )}
          <button
            type="submit"
            disabled={appendEntry.loading || entryText.trim().length === 0}
            style={SUBMIT_BTN}
          >
            {appendEntry.loading ? "Saving…" : "Add observation"}
          </button>
        </form>
      </div>

      {/* status 推进（迁移自 DecisionDetailDrawer） */}
      <div className="sec">
        <div className="sec-h">Status</div>
        <div className="ask-ex">
          {DECISION_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className="ask-chip"
              disabled={update.loading}
              onClick={() => update.mutate({ status: s })}
              style={data.status === s ? ACTIVE_CHIP : undefined}
            >
              {statusToLabel(s)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
