"use client";

import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import type { StudyDto } from "./dto";
import { EnrollDrawer } from "./EnrollDrawer";
import {
  canWithdraw,
  groupStudies,
  hasArm,
  isJoinable,
  statusToLabel,
} from "./mappers";
import { WithdrawConfirmDialog } from "./WithdrawConfirmDialog";

/**
 * Research 视图：替换 portal/page.tsx 的 #v-research 内 "Studies you can join" sec。
 * - GET /api/studies → 按 status 分两组：Open studies (invited) / Your studies (enrolled+completed)
 * - invited 卡 "Join study" → 打开 EnrollDrawer
 * - enrolled 卡 "Withdraw" → 打开 WithdrawConfirmDialog
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

  const groups = groupStudies(data ?? []);
  const bothEmpty = groups.open.length === 0 && groups.yours.length === 0;

  if (bothEmpty) {
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
      ? data?.find((s) => s.id === enrollTargetId)
      : undefined;
  const withdrawTarget =
    withdrawTargetId !== null
      ? data?.find((s) => s.id === withdrawTargetId)
      : undefined;

  return (
    <>
      {groups.open.length > 0 && (
        <div className="sec">
          <div className="sec-h">Open studies</div>
          {groups.open.map((s) => (
            <StudyCard
              key={s.id}
              study={s}
              onJoin={() => setEnrollTargetId(s.id)}
              onWithdraw={() => setWithdrawTargetId(s.id)}
            />
          ))}
        </div>
      )}

      {groups.yours.length > 0 && (
        <div className="sec">
          <div className="sec-h">Your studies</div>
          {groups.yours.map((s) => (
            <StudyCard
              key={s.id}
              study={s}
              onJoin={() => setEnrollTargetId(s.id)}
              onWithdraw={() => setWithdrawTargetId(s.id)}
            />
          ))}
        </div>
      )}

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

/** 单张研究卡：name + arm（如有）+ status badge + 按状态的操作按钮。 */
function StudyCard({
  study,
  onJoin,
  onWithdraw,
}: {
  study: StudyDto;
  onJoin: () => void;
  onWithdraw: () => void;
}) {
  return (
    <div className="card">
      <div className="dec">
        <div>
          <h4>{study.name}</h4>
          {hasArm(study) && <div className="st">Arm: {study.arm}</div>}
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
                <button
                  type="button"
                  className="dec-badge"
                  onClick={onWithdraw}
                >
                  Withdraw
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
