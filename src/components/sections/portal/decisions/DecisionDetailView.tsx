"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { ConnectedRecordsPanel } from "@/components/sections/portal/health/ConnectedRecordsPanel";
import type {
  OthersDimensionKey,
  ScienceBlockKey,
} from "@/config/decision-corpus";
import { getDecisionCorpus } from "@/config/decision-corpus";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import { AiStateView } from "./AiStateView";
import { CurrentSynthesisPanel } from "./CurrentSynthesisPanel";
import { ACTIVE_CHIP, SUBMIT_BTN, TEXTAREA } from "./drawerStyles";
import type {
  AiStateDto,
  DecisionDetailDto,
  DecisionOutcome,
  HealthContextDto,
  RegenerateInput,
  RegenerateResponseDto,
  SnapshotsResponseDto,
  StopObservingResponse,
  UpdateDecisionInput,
} from "./dto";
import { HealthContextQuestionnaire } from "./HealthContextQuestionnaire";
import { HistorySnapshotList } from "./HistorySnapshotList";
import {
  ALL_DECISION_TYPES,
  archivedEntryLabel,
  KIND_OPTIONS,
  lifecycleToLabel,
  mapAiStateDto,
  outcomesForKind,
  outcomeToLabel,
  PERSPECTIVES,
  sortEntries,
  typeToLabel,
} from "./mappers";
import { ObservationForm } from "./ObservationForm";
import { PendingUpdateIndicator } from "./PendingUpdateIndicator";
import { StartObservingForm } from "./StartObservingForm";

type Perspective = "yourself" | "others" | "science";

const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  yourself: "Yourself",
  others: "Others",
  science: "Science",
};

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
  // task-43 综合结果层：mount 时同步拉 snapshots + ai-state + health-context
  // 后端 GET /decisions/[id] 已含 lazy fire 副作用（maybeFirePendingRegen），
  // 此处三个端点跟随主 GET 之后刷新，避免顺序竞态。
  const {
    data: snapshotsData,
    error: snapshotsError,
    loading: snapshotsLoading,
    refetch: refetchSnapshots,
  } = useApi<SnapshotsResponseDto>(`/api/decisions/${id}/snapshots`);
  const {
    data: aiStateData,
    error: aiStateError,
    loading: aiStateLoading,
    refetch: refetchAiState,
  } = useApi<AiStateDto>(`/api/decisions/${id}/ai-state`);
  const {
    data: healthContextData,
    error: healthContextError,
    loading: healthContextLoading,
    refetch: refetchHealthContext,
  } = useApi<HealthContextDto>(`/api/decisions/${id}/health-context`);
  const [tab, setTab] = useState<Perspective>("yourself");
  const [yourselfDraft, setYourselfDraft] = useState<string | null>(null); // null = 未编辑，展示已存值

  // task-44 §28 Observation 修正入口：editingEntryId 非空时展开内嵌 ObservationForm（edit mode）
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

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

  // task-43 §18/§22 手动触发 regeneration（STALE Update now / FAILED Retry）
  // 成功后刷全部 4 个端点（Decision + snapshots + ai-state + health-context）
  function refetchAll() {
    refetch();
    refetchSnapshots();
    refetchAiState();
    refetchHealthContext();
  }
  const regenerate = useMutation(
    (input: RegenerateInput) =>
      apiClient.post<RegenerateResponseDto>(
        `/api/decisions/${id}/regenerate`,
        input,
      ),
    { onSuccess: () => refetchAll() },
  );

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

  // Observation 追加（append-only）— task-44 §28 改走专属 /observations 端点（在 ObservationForm 内部）
  // 旧 /entries 端点的 inline 表单已退役；ObservationForm 自包含 POST + PATCH mutation

  // F4 Reopen：CLOSED → ACTIVE 原子归档（走专用端点）
  const reopen = useMutation(
    (_input: void) => apiClient.post<unknown>(`/api/decisions/${id}/reopen`),
    { onSuccess: () => refetch() },
  );

  // task-44 §27 Stop Observing：OBSERVING → LEARNING（有 obs）或 COMPLETED（无 obs）
  const stopObserving = useMutation(
    (_input: void) =>
      apiClient.post<StopObservingResponse>(
        `/api/decisions/${id}/observe/stop`,
      ),
    { onSuccess: () => refetch() },
  );

  // task-44 D5 Mark as completed：DECIDED → COMPLETED 直接路径
  const markCompleted = useMutation(
    (_input: void) => apiClient.post<unknown>(`/api/decisions/${id}/complete`),
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
        refetchAll();
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

  // task-43 五态：mapAiStateDto 把 server DTO 转三视角 AiStateView
  const aiViews = aiStateData ? mapAiStateDto(aiStateData) : null;
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

      {/* task-43 D6 STALE 可视化：pendingRegenAt 非空（窗口未过）时顶部条提示 */}
      <div style={{ marginTop: 12 }}>
        <PendingUpdateIndicator
          pendingUntil={data.pendingRegenAt ?? null}
          onUpdateNow={() => regenerate.mutate({ trigger: "new_record" })}
        />
      </div>

      {/* 三视角 tab（切换不卸载 Yourself 草稿 state，A2） */}
      <div className="sec">
        <div className="ask-ex" style={{ marginBottom: 14 }}>
          {PERSPECTIVES.map((p) => (
            <button
              key={p}
              type="button"
              className="ask-chip"
              onClick={() => setTab(p)}
              style={tab === p ? ACTIVE_CHIP : undefined}
            >
              {PERSPECTIVE_LABELS[p]}
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
            {/* task-43 §19/§20/§21 Health Context 问卷（结构化 5 类，与 yourselfContext 扁平字段 B2 fallback 共存） */}
            <HealthContextQuestionnaire
              decisionId={id}
              data={healthContextData}
              loading={healthContextLoading}
              error={
                healthContextError
                  ? { message: healthContextError.message }
                  : null
              }
              onRetry={refetchHealthContext}
              refetch={refetchHealthContext}
            />
            {/* task-42 B2：Connected Records 作为 Yourself 区块的新增子区块（不替换 yourselfContext 扁平字符串 fallback） */}
            <ConnectedRecordsPanel decisionId={id} />
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

      {/* task-43 §15/§24–§26 综合结果层：Current synthesis + History + AI 五态
          （三视角 tab 之后、Decide section 之前）
          - LOADING 期间渲染骨架屏；READY 时让 CurrentSynthesisPanel 渲染 synthesis
          - INSUFFICIENT_INFORMATION 三视角文案；FAILED Retry；STALE Update now */}
      <div className="sec">
        <div className="sec-h">{tr("synthesis.title")}</div>
        {aiViews ? (
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {PERSPECTIVES.map((p) => (
              <AiStateView
                key={p}
                view={
                  p === "yourself"
                    ? aiViews.yourself
                    : p === "others"
                      ? aiViews.others
                      : aiViews.science
                }
                perspective={p}
                onRetry={() => regenerate.mutate({ trigger: "new_record" })}
                onUpdateNow={() => regenerate.mutate({ trigger: "new_record" })}
                onAddHealthContext={() => setTab("yourself")}
              />
            ))}
          </div>
        ) : aiStateLoading ? (
          <Skeleton lines={3} />
        ) : aiStateError ? (
          <ErrorState message={aiStateError.message} onRetry={refetchAiState} />
        ) : null}
        <CurrentSynthesisPanel
          current={snapshotsData?.current ?? null}
          loading={snapshotsLoading}
          error={snapshotsError ? { message: snapshotsError.message } : null}
          onRetry={refetchSnapshots}
        />
        <div style={{ marginTop: 14 }}>
          <div className="sec-h" style={{ fontSize: 13 }}>
            {tr("synthesis.historyTitle")}
          </div>
          <HistorySnapshotList
            history={snapshotsData?.history ?? []}
            loading={snapshotsLoading}
            error={snapshotsError ? { message: snapshotsError.message } : null}
            onRetry={refetchSnapshots}
          />
        </div>
        {regenerate.error && (
          <ErrorState
            message={regenerate.error.message}
            onRetry={() => regenerate.reset()}
          />
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

            {/* task-44 §27 D5/B4 DECIDED → Start Observing（启用）+ Mark as completed */}
            {data.lifecycle === "DECIDED" && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid #eee",
                }}
              >
                <details>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "var(--p-red)",
                    }}
                  >
                    {tr("decide.startObserving")}
                  </summary>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#7c746f",
                      marginTop: 8,
                      marginBottom: 8,
                    }}
                  >
                    {tr("observe.start.description")}
                  </p>
                  <StartObservingForm
                    decisionId={data.id}
                    onStarted={() => refetch()}
                  />
                </details>
                {/* D5 Mark as completed：不需观察的 DECIDED 直接完成 */}
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(tr("observe.markCompleted.confirm")))
                      return;
                    markCompleted.mutate(NO_INPUT);
                  }}
                  disabled={markCompleted.loading}
                  style={{
                    fontSize: 12,
                    color: "#7c746f",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    marginTop: 12,
                    padding: 0,
                  }}
                >
                  {markCompleted.loading
                    ? tr("observe.markCompleted.submitting")
                    : tr("observe.markCompleted.cta")}
                </button>
                {markCompleted.error && (
                  <ErrorState
                    message={markCompleted.error.message}
                    onRetry={() => markCompleted.reset()}
                  />
                )}
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

      {/* Observation：append-only 时间线（task-44 §28 direction badge + Edit 入口）+ 追加表单（OBSERVING only） */}
      <div className="sec">
        <div className="sec-h">Observations</div>
        {entries.length > 0 && (
          <div className="card">
            <div className="tl">
              {entries.map((e) => {
                const isArchived = e.kind === "archived_outcome";
                const isLearning = e.kind === "learning";
                const isObservation = e.kind === "observation";
                const archived = isArchived
                  ? archivedEntryLabel(e.synthesis)
                  : null;
                const learningText = isLearning
                  ? (e.synthesis?.text ?? e.text)
                  : null;
                const editing = editingEntryId === e.id;
                return (
                  <div className="tl-item" key={e.id}>
                    <span
                      className="tl-dot"
                      style={
                        isArchived
                          ? { background: "#999" }
                          : isLearning
                            ? { background: "var(--p-red)" }
                            : isObservation
                              ? { background: "var(--p-red)" }
                              : undefined
                      }
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
                      ) : isLearning ? (
                        <>
                          <span
                            className="dec-badge"
                            style={{
                              marginRight: 6,
                              background: "rgba(200,16,46,0.1)",
                              color: "var(--p-red)",
                            }}
                          >
                            {tr("observe.learnHistory.badge")}
                          </span>
                          {learningText}
                        </>
                      ) : (
                        <>
                          {isObservation && e.direction && (
                            <span
                              className="dec-badge"
                              style={{
                                marginRight: 6,
                                background: "#f0e6e8",
                                color: "var(--p-red)",
                              }}
                            >
                              {tr(
                                `observe.observation.direction.${e.direction}`,
                              )}
                            </span>
                          )}
                          {editing ? (
                            <ObservationForm
                              decisionId={data.id}
                              existingEntry={{
                                id: e.id,
                                text: e.text,
                                direction: e.direction ?? null,
                              }}
                              onSaved={() => {
                                setEditingEntryId(null);
                                refetch();
                              }}
                            />
                          ) : (
                            e.text
                          )}
                        </>
                      )}
                      {/* Observation 修正入口（仅 OBSERVING + observation kind + 非编辑中） */}
                      {isObservation &&
                        data.lifecycle === "OBSERVING" &&
                        !editing && (
                          <button
                            type="button"
                            onClick={() => setEditingEntryId(e.id)}
                            style={{
                              fontSize: 11,
                              color: "var(--p-red)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              marginLeft: 8,
                              padding: 0,
                              textDecoration: "underline",
                            }}
                          >
                            {tr("observe.observation.edit")}
                          </button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* task-44 §28 Add observation 表单（仅 OBSERVING 状态显示） */}
        {data.lifecycle === "OBSERVING" && (
          <details style={{ marginTop: 12 }}>
            <summary
              style={{
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--p-red)",
              }}
            >
              {tr("observe.observation.addCta")}
            </summary>
            <div style={{ marginTop: 12 }}>
              <ObservationForm decisionId={data.id} onSaved={() => refetch()} />
            </div>
          </details>
        )}
        {data.lifecycle !== "OBSERVING" && entries.length === 0 && (
          <p style={{ fontSize: 13, color: "#a89a95" }}>
            {tr("observe.observation.emptyNonObserving")}
          </p>
        )}
      </div>
    </div>
  );
}
