"use client";

import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import type { StudyDto } from "./dto";
import { EnrollDrawer } from "./EnrollDrawer";
import { canWithdraw, hasArm, isJoinable, statusToLabel } from "./mappers";
import { WithdrawConfirmDialog } from "./WithdrawConfirmDialog";

/**
 * Research 视图：替换 portal/page.tsx 的 #v-research 内 "Studies you can join" sec。
 * - GET /api/studies → 单卡 dec 行列表（设计稿结构）
 * - 可加入 → "Join study" 打开 EnrollDrawer；enrolled → 状态徽章 + "Withdraw" 打开确认框
 * - completed 卡仅显示 badge，无按钮
 * - onSuccess → refetch() 刷新整个列表
 */
export function ResearchView() {
  const { data, error, loading, refetch } = useApi<StudyDto[]>("/api/studies");
  const [enrollTargetId, setEnrollTargetId] = useState<string | null>(null);
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="sec">
        <div className="sec-h">Studies you can join</div>
        <Skeleton lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sec">
        <div className="sec-h">Studies you can join</div>
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  const studies = data ?? [];

  if (studies.length === 0) {
    return (
      <div className="sec">
        <div className="sec-h">Studies you can join</div>
        <EmptyState
          title="No studies available"
          hint="Studies recruiting new participants will appear here."
        />
      </div>
    );
  }

  const enrollTarget =
    enrollTargetId !== null
      ? studies.find((s) => s.id === enrollTargetId)
      : undefined;
  const withdrawTarget =
    withdrawTargetId !== null
      ? studies.find((s) => s.id === withdrawTargetId)
      : undefined;

  return (
    <>
      <div className="sec">
        <div className="sec-h">Studies you can join</div>
        <div className="card">
          {studies.map((s) => (
            <StudyRow
              key={s.id}
              study={s}
              onJoin={() => setEnrollTargetId(s.id)}
              onWithdraw={() => setWithdrawTargetId(s.id)}
            />
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#a89a95", marginTop: 10 }}>
          Joining a study opens a separate, specific consent &mdash; reviewed in
          your Consent Center.
        </div>
      </div>

      {enrollTarget && (
        <EnrollDrawer
          study={enrollTarget}
          onClose={() => setEnrollTargetId(null)}
          onEnrolled={() => {
            setEnrollTargetId(null);
            refetch();
          }}
        />
      )}

      {withdrawTarget && (
        <WithdrawConfirmDialog
          study={withdrawTarget}
          onClose={() => setWithdrawTargetId(null)}
          onWithdrawn={() => {
            setWithdrawTargetId(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

/** 单条研究行：name + arm（如有）+ status 徽章 + 按状态的操作按钮。 */
function StudyRow({
  study,
  onJoin,
  onWithdraw,
}: {
  study: StudyDto;
  onJoin: () => void;
  onWithdraw: () => void;
}) {
  return (
    <div className="dec">
      <div>
        <h4>{study.name}</h4>
        <div className="st">
          {hasArm(study) ? study.arm : statusToLabel(study.status)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isJoinable(study) ? (
          <button type="button" className="dec-badge" onClick={onJoin}>
            Join study
          </button>
        ) : (
          <>
            <span className="dec-badge">{statusToLabel(study.status)}</span>
            {canWithdraw(study) && (
              <button type="button" className="dec-badge" onClick={onWithdraw}>
                Withdraw
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
