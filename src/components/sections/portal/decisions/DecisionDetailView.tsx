"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import type {
  OthersDimensionKey,
  ScienceBlockKey,
} from "@/config/decision-corpus";
import { getDecisionCorpus } from "@/config/decision-corpus";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import { ACTIVE_CHIP, SUBMIT_BTN, TEXTAREA } from "./drawerStyles";
import type {
  DecisionDetailDto,
  DecisionOutcome,
  UpdateDecisionInput,
} from "./dto";
import {
  ALL_DECISION_TYPES,
  archivedEntryLabel,
  KIND_OPTIONS,
  lifecycleToLabel,
  outcomesForKind,
  outcomeToLabel,
  sortEntries,
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

/** §6 freshness gate 检查端点 V1 占位响应 */
interface CheckFreshnessResponse {
  freshnessCheckedAt: string;
  materialChange: boolean;
}

/** useMutation 无参调用的占位 input（hook 签名要求传值） */
const NO_INPUT = undefined as unknown as void;

/**
 * 决策详情页（Slice 1 核心 + task-41 Decide 环节）：
 * - 三视角自由切换，无强制顺序；Yourself 草稿存客户端 state，切换不丢（A2）
 * - ☆ Save 书签化（§11 纯书签）：右上角低强调 toggle，仅"更易找到"；不创建 Active、
 *   不影响 lifecycle/WMN 排序（saved 不在 MEANINGFUL_UPDATE_KEYS）；Yourself 草稿随 Save 一并落库
 * - Others / Science 读预置语料（topicSlug 驱动检索）；粗粒度 type 已迁入 Science tab 底部（D2）
 * - task-41 Decide section（三视角之后、Observations 之前）：
 *   - F2 Type 确认用人话澄清（用户不见 "Type A/B" 字面）
 *   - F3 outcome 选择驱动 lifecycle（含 decided_on_next_step 必填 next_step）
 *   - F4 Closed→Reopen 原子归档 + freshness gate（D4 UI 提示 + D6 时序）
 *   - B6 reclassify 自动清空非法 outcome
 *   - D5 DECIDED 后 "Start observing" 禁用按钮占位（task-44 接真实逻辑）
 * - Observation 追加（迁移自 DecisionDetailDrawer，append-only）
 */
export function DecisionDetailView({ id }: { id: string }) {
  const tr = useTranslations("portal.decisionsDetail");
  const { data, error, loading, refetch } = useApi<DecisionDetailDto>(
    `/api/decisions/${id}`,
  );
  const [tab, setTab] = useState<Perspective>("yourself");
  const [yourselfDraft, setYourselfDraft] = useState<string | null>(null); // null = 未编辑，展示已存值
  const [entryText, setEntryText] = useState("");

  // task-41 Decide section 状态
  const [decideOutcome, setDecideOutcome] = useState<DecisionOutcome | null>(
    null, // 服务端 outcome 在 data.outcome；本地仅跟踪用户未提交的选择
  );
  const [nextStepDraft, setNextStepDraft] = useState("");
  const [reclassifyConfirm, setReclassifyConfirm] = useState(false);

  // D4 freshness gate 派生：最近 archived_outcome entry 存在且 freshnessCheckedAt 不新于该 entry → 需检查
  const needsFreshnessCheck = useMemo(() => {
    if (!data) return false;
    const archived = data.entries.find((e) => e.kind === "archived_outcome");
    if (!archived) return false;
    if (!data.freshnessCheckedAt) return true;
    return new Date(data.freshnessCheckedAt) <= new Date(archived.occurredAt);
  }, [data]);

  // ☆ Save 书签化（§11 纯书签）：saved 不刷新 lastUserActivityAt → 不进 WMN 排序；
  // Yourself 草稿随 Save 一并落库（保持 A5 行为不回退）
  const toggleSave = useMutation(
    (input: { saved: boolean; yourselfContext?: string }) =>
      apiClient.post(`/api/decisions/${id}`, input),
    { onSuccess: () => refetch() },
  );

  // 改 type（粗粒度，只影响 Science 措辞框架，不切换检索语料）+ task-41 outcome/decisionKind/nextStep
  const update = useMutation(
    (input: UpdateDecisionInput) =>
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

  // F4 Reopen：CLOSED → ACTIVE 原子归档（走专用端点）
  const reopen = useMutation(
    (_input: void) => apiClient.post<unknown>(`/api/decisions/${id}/reopen`),
    { onSuccess: () => refetch() },
  );

  // D4 Check now：freshness gate 占位（V1 写 freshnessCheckedAt=now，task-43 接真实刷新）
  const [checkFreshnessData, setCheckFreshnessData] =
    useState<CheckFreshnessResponse | null>(null);
  const checkFreshness = useMutation(
    (_input: void) =>
      apiClient.post<CheckFreshnessResponse>(
        `/api/decisions/${id}/check-freshness`,
      ),
    {
      onSuccess: (out) => {
        setCheckFreshnessData(out ?? null);
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
  // 语料检索按 topicSlug（B9）：命中→专题语料，null/未命中→通用占位；type 不参与检索
  const corpus = getDecisionCorpus(data.topicSlug);
  const entries = sortEntries(data.entries);
  // Decide section 本地选择的 outcome（与 data.outcome 同步：用户改选后立即更新 state）
  const currentOutcomeSelection = decideOutcome ?? data.outcome;
  const nextStepValue = nextStepDraft || data.nextStep || "";

  return (
    <div>
      {/* 标题行：question + 右上角 ☆ Save（§11 纯书签，低强调；与 come_back_later 等 Outcome 语义分离） */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--p-serif)",
            fontWeight: 400,
            margin: "0 0 8px",
          }}
        >
          {data.question}
        </h1>
        <button
          type="button"
          className="save-star"
          aria-pressed={data.saved}
          aria-label={
            data.saved ? tr("save.ariaSavedLabel") : tr("save.ariaSaveLabel")
          }
          disabled={toggleSave.loading}
          onClick={() =>
            toggleSave.mutate({
              saved: !data.saved,
              yourselfContext: yourselfValue.trim() || undefined,
            })
          }
        >
          {data.saved ? tr("save.saved") : tr("save.save")}
        </button>
      </div>
      {toggleSave.error && (
        <ErrorState
          message={toggleSave.error.message}
          onRetry={() => toggleSave.reset()}
        />
      )}
      <span className="dec-badge">{lifecycleToLabel(data.lifecycle)}</span>
      {data.topic && (
        <span style={{ fontSize: 13, color: "#a89a95", marginLeft: 8 }}>
          {data.topic}
        </span>
      )}

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
              lines of context are enough. This is saved when you tap ☆ Save
              above.
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

            {/* F1/D2：粗粒度 type chips 迁入 Science tab（只影响 Science 措辞框架） */}
            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: "1px solid #eee",
              }}
            >
              <div className="sec-h" style={{ fontSize: 13 }}>
                {tr("scienceFraming")}
              </div>
              <div className="ask-ex" style={{ marginTop: 8 }}>
                {ALL_DECISION_TYPES.map((t_) => (
                  <button
                    key={t_}
                    type="button"
                    className="ask-chip"
                    disabled={update.loading}
                    onClick={() => update.mutate({ type: t_ })}
                    style={data.type === t_ ? ACTIVE_CHIP : undefined}
                  >
                    {typeToLabel(t_)}
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
          </div>
        )}
      </div>

      {/* F1/D1：Decide section（三视角之后、Observations 之前） */}
      <div className="sec">
        <div className="sec-h">{tr("decide.title")}</div>

        {data.lifecycle === "CLOSED" ? (
          // CLOSED 状态：Reopen 入口
          <div className="card">
            <p style={{ fontSize: 13.5, color: "#7c746f" }}>
              {tr("decide.closedHint")}
            </p>
            <button
              type="button"
              onClick={() => reopen.mutate(NO_INPUT)}
              disabled={reopen.loading}
              style={SUBMIT_BTN}
            >
              {reopen.loading ? tr("decide.reopening") : tr("decide.reopen")}
            </button>
            {reopen.error && (
              <ErrorState
                message={reopen.error.message}
                onRetry={() => reopen.reset()}
              />
            )}
          </div>
        ) : data.decisionKind === "action" ||
          data.decisionKind === "exploration" ? (
          <>
            {/* D4 freshness gate：存在 archived entry 且 freshnessCheckedAt 不新于该 entry */}
            {needsFreshnessCheck && (
              <div
                className="card"
                style={{ background: "#fdf6ec", borderColor: "#f0c674" }}
              >
                <b style={{ fontSize: 13.5 }}>{tr("decide.freshnessPrompt")}</b>
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => checkFreshness.mutate(NO_INPUT)}
                    disabled={checkFreshness.loading}
                    style={SUBMIT_BTN}
                  >
                    {checkFreshness.loading
                      ? tr("decide.checking")
                      : tr("decide.checkNow")}
                  </button>
                  {checkFreshnessData && !checkFreshnessData.materialChange && (
                    <span
                      style={{ fontSize: 12, color: "#7c746f", marginLeft: 10 }}
                    >
                      {tr("decide.upToDate")}
                    </span>
                  )}
                </div>
                {checkFreshness.error && (
                  <ErrorState
                    message={checkFreshness.error.message}
                    onRetry={() => checkFreshness.reset()}
                  />
                )}
              </div>
            )}

            {/* F3 outcome 选择 */}
            <div className="ask-ex" style={{ marginBottom: 12 }}>
              {outcomesForKind(data.decisionKind).map((o) => (
                <button
                  key={o}
                  type="button"
                  className="ask-chip"
                  disabled={
                    update.loading ||
                    needsFreshnessCheck ||
                    checkFreshness.loading
                  }
                  onClick={() => setDecideOutcome(o)}
                  style={
                    currentOutcomeSelection === o ? ACTIVE_CHIP : undefined
                  }
                >
                  {outcomeToLabel(o)}
                </button>
              ))}
            </div>

            {/* F3 decided_on_next_step 必填 next_step */}
            {currentOutcomeSelection === "decided_on_next_step" && (
              <div style={{ marginBottom: 12 }}>
                <label
                  htmlFor="next-step"
                  style={{ fontSize: 13, display: "block", marginBottom: 6 }}
                >
                  {tr("decide.nextStepLabel")}
                </label>
                <textarea
                  id="next-step"
                  value={nextStepValue}
                  onChange={(e) => setNextStepDraft(e.target.value)}
                  rows={2}
                  placeholder={tr("decide.nextStepPlaceholder")}
                  style={TEXTAREA}
                />
              </div>
            )}

            <button
              type="button"
              disabled={
                update.loading ||
                !currentOutcomeSelection ||
                (currentOutcomeSelection === "decided_on_next_step" &&
                  nextStepValue.trim().length === 0)
              }
              onClick={() => {
                if (!currentOutcomeSelection) return;
                update.mutate({
                  outcome: currentOutcomeSelection,
                  nextStep:
                    currentOutcomeSelection === "decided_on_next_step"
                      ? nextStepValue.trim()
                      : null,
                });
              }}
              style={SUBMIT_BTN}
            >
              {update.loading ? tr("decide.submitting") : tr("decide.submit")}
            </button>
            {update.error && (
              <ErrorState
                message={update.error.message}
                onRetry={() => update.reset()}
              />
            )}

            {/* B6 reclassify 入口 */}
            <div style={{ marginTop: 12 }}>
              {reclassifyConfirm ? (
                <>
                  <span style={{ fontSize: 12, color: "#7c746f" }}>
                    {tr("decide.reclassifyConfirm")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      update.mutate({ decisionKind: undefined });
                      setReclassifyConfirm(false);
                      setDecideOutcome(null);
                      setNextStepDraft("");
                    }}
                    style={{ fontSize: 12, marginLeft: 8 }}
                  >
                    {tr("decide.reclassifyConfirmYes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReclassifyConfirm(false)}
                    style={{ fontSize: 12, marginLeft: 8 }}
                  >
                    {tr("decide.reclassifyConfirmNo")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setReclassifyConfirm(true)}
                  style={{ fontSize: 12, color: "#7c746f" }}
                >
                  {tr("decide.reclassify")}
                </button>
              )}
            </div>

            {/* D5/B4 DECIDED 后显示 Start observing 占位 */}
            {data.lifecycle === "DECIDED" && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid #eee",
                }}
              >
                <button
                  type="button"
                  disabled
                  style={{ ...SUBMIT_BTN, opacity: 0.5 }}
                >
                  {tr("decide.startObserving")}
                </button>
                <p style={{ fontSize: 12, color: "#a89a95", marginTop: 6 }}>
                  {tr("decide.startObservingDisabled")}
                </p>
              </div>
            )}
          </>
        ) : (
          /* unconfirmed：F2 人话澄清问题 */
          <div className="card">
            <p style={{ fontSize: 14, fontWeight: 600 }}>
              {tr("decide.clarifyQuestion")}
            </p>
            <div className="ask-ex" style={{ marginTop: 10 }}>
              {KIND_OPTIONS.map((opt) => (
                <button
                  key={opt.kind}
                  type="button"
                  className="ask-chip"
                  disabled={update.loading}
                  onClick={() => update.mutate({ decisionKind: opt.kind })}
                >
                  {opt.label}
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
        )}
      </div>

      {/* Observation：append-only 时间线 + 追加表单（迁移自 DecisionDetailDrawer） */}
      <div className="sec">
        <div className="sec-h">Observations</div>
        {entries.length > 0 && (
          <div className="card">
            <div className="tl">
              {entries.map((e) => {
                const isArchived = e.kind === "archived_outcome";
                const archived = isArchived
                  ? archivedEntryLabel(e.synthesis)
                  : null;
                return (
                  <div className="tl-item" key={e.id}>
                    <span
                      className="tl-dot"
                      style={isArchived ? { background: "#999" } : undefined}
                    />
                    <div className="tl-d">
                      {new Date(e.occurredAt).toLocaleDateString()}
                    </div>
                    <div className="tl-t">
                      {archived ? (
                        <>
                          <span
                            className="dec-badge"
                            style={{ marginRight: 6, background: "#e8e0d8" }}
                          >
                            {tr("decide.archivedBadge")}
                          </span>
                          {archived.body}
                        </>
                      ) : (
                        e.text
                      )}
                    </div>
                  </div>
                );
              })}
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
    </div>
  );
}
