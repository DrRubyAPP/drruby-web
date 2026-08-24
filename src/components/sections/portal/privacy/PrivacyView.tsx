"use client";

import { ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type { ConsentSettingDto, UpdateConsentResponse } from "./dto";
import { isLocked } from "./mappers";

/**
 * Privacy 视图的 "Privacy & Consent" sec：
 * GET /api/consent 三档开关；locked 项 "Always on"，非 locked 项 POST 切换。
 */
export function PrivacyView() {
  return <ConsentSection />;
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
        Three independent choices. Using DrRuby never implies sharing your
        experiences or research participation.
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
