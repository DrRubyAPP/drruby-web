"use client";

import { useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type {
  ConsentSettingDto,
  ContributionDto,
  UpdateConsentResponse,
  UpdateContributionResponse,
} from "./dto";
import { canShare, canWithdrawContribution, isLocked } from "./mappers";
import { WithdrawContributionDialog } from "./WithdrawContributionDialog";

/**
 * Privacy 视图：替换 portal/page.tsx 的 #v-privacy 内 "Privacy & Consent" sec。
 * 渲染两个 sec：
 * 1. Privacy & Consent — GET /api/consent 三档开关；locked 项 "Always on"，非 locked 项 POST 切换
 * 2. Data Contributions — GET /api/contributions 列表；shared 项 "Withdraw"（二次确认），未 shared 项 "Share"（直接 mutate）
 * onSuccess → refetch()
 */
export function PrivacyView() {
  return (
    <>
      <ConsentSection />
      <ContributionsSection />
    </>
  );
}

/** Privacy & Consent sec：三档开关 */
function ConsentSection() {
  const { data, error, loading, refetch } =
    useApi<ConsentSettingDto[]>("/api/consent");

  if (loading) {
    return (
      <div className="sec">
        <div className="sec-h">Privacy &amp; Consent</div>
        <Skeleton lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sec">
        <div className="sec-h">Privacy &amp; Consent</div>
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="sec">
      <div className="sec-h">Privacy &amp; Consent</div>
      <div className="card">
        <div className="pf-state">
          <span className="pf-dot" />
          By default, your data stays private. Nothing is shared unless you
          explicitly choose to.
        </div>
        {(data ?? []).map((s) => (
          <ConsentRow key={s.id} setting={s} onToggled={refetch} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#a89a95", marginTop: 10 }}>
        Three independent choices. Using DrRuby never implies community
        contribution or research participation.
      </div>
    </div>
  );
}

/** 单档 consent 行：locked → "Always on" 文本；非 locked → 开关 POST 切换 */
function ConsentRow({
  setting,
  onToggled,
}: {
  setting: ConsentSettingDto;
  onToggled: () => void;
}) {
  const toggle = useMutation(
    () =>
      apiClient.post<UpdateConsentResponse>(`/api/consent/${setting.id}`, {
        value: !setting.value,
      }),
    { onSuccess: () => onToggled() },
  );

  if (isLocked(setting)) {
    return (
      <div className="consent-row">
        <div>
          <b>{setting.title}</b>
          <span>{setting.description}</span>
        </div>
        <span className="consent-state">Always on</span>
      </div>
    );
  }

  return (
    <div className="consent-row">
      <div>
        <b>{setting.title}</b>
        <span>{setting.description}</span>
      </div>
      {toggle.error ? (
        <ErrorState
          message={toggle.error.message}
          onRetry={() => toggle.reset()}
        />
      ) : (
        <label className="switch">
          <input
            type="checkbox"
            checked={setting.value}
            disabled={toggle.loading}
            onChange={() => {
              if (toggle.loading) return;
              toggle.mutate(undefined as never);
            }}
          />
          <span className="slider" />
        </label>
      )}
    </div>
  );
}

/** Data Contributions sec：列表 + 分享/撤回 */
function ContributionsSection() {
  const { data, error, loading, refetch } =
    useApi<ContributionDto[]>("/api/contributions");
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="sec">
        <div className="sec-h">Data Contributions</div>
        <Skeleton lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sec">
        <div className="sec-h">Data Contributions</div>
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  const items = data ?? [];
  const withdrawTarget =
    withdrawTargetId !== null
      ? items.find((c) => c.id === withdrawTargetId)
      : undefined;

  return (
    <>
      <div className="sec">
        <div className="sec-h">Data Contributions</div>
        {items.length === 0 ? (
          <EmptyState
            title="No data contributions"
            hint="Data contributions you can opt into will appear here."
          />
        ) : (
          <div className="card">
            {items.map((c) => (
              <ContributionRow
                key={c.id}
                contribution={c}
                onToggled={refetch}
                onWithdraw={() => setWithdrawTargetId(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {withdrawTarget && (
        <WithdrawContributionDialog
          contribution={withdrawTarget}
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

/** 单条 contribution 行：shared → "Withdraw"（二次确认）；未 shared → "Share"（直接 mutate） */
function ContributionRow({
  contribution,
  onToggled,
  onWithdraw,
}: {
  contribution: ContributionDto;
  onToggled: () => void;
  onWithdraw: () => void;
}) {
  const share = useMutation(
    () =>
      apiClient.post<UpdateContributionResponse>(
        `/api/contributions/${contribution.id}`,
        { shared: true },
      ),
    { onSuccess: () => onToggled() },
  );

  return (
    <div className="consent-row">
      <div>
        <b>{contribution.title}</b>
        <span>{contribution.description}</span>
      </div>
      {share.error ? (
        <ErrorState
          message={share.error.message}
          onRetry={() => share.reset()}
        />
      ) : canShare(contribution) ? (
        <button
          type="button"
          className="dec-badge"
          disabled={share.loading}
          onClick={() => {
            if (share.loading) return;
            share.mutate(undefined as never);
          }}
        >
          {share.loading ? "Sharing…" : "Share"}
        </button>
      ) : canWithdrawContribution(contribution) ? (
        <button
          type="button"
          className="dec-badge"
          disabled={share.loading}
          onClick={onWithdraw}
        >
          Withdraw
        </button>
      ) : null}
    </div>
  );
}
