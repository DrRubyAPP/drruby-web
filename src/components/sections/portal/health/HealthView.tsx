"use client";

import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import type { HormoneDto, SignalDto, SkinScanDto } from "./dto";
import { mapHormones, mapSignals, mapSkin } from "./mappers";

/** My Health（health）视图：signals / hormone / skin 三区块，各自独立取数与态。 */
export function HealthView() {
  const signals = useApi<SignalDto[]>("/api/signals");
  const hormone = useApi<HormoneDto[]>("/api/hormone-layer");
  const skin = useApi<SkinScanDto | null>("/api/skin-scan/latest");

  const signalRows = mapSignals(signals.data ?? []);
  const hormoneRows = mapHormones(hormone.data ?? []);
  const skinView = mapSkin(skin.data ?? null);

  return (
    <>
      <h1>My Health</h1>
      <div className="lede">
        Bring your data in. DrRuby helps you see what&rsquo;s relevant &mdash;
        not another dashboard to maintain.
      </div>

      {/* ===== Signals（Recent labs / device signals）===== */}
      <div className="sec">
        <div className="sec-h">Your signals</div>
        {signals.loading ? (
          <Skeleton lines={3} />
        ) : signals.error ? (
          <ErrorState
            message={signals.error.message}
            onRetry={signals.refetch}
          />
        ) : signalRows.length === 0 ? (
          <EmptyState
            title="No signals yet"
            hint="Connect a device or upload a lab result to begin."
          />
        ) : (
          <div className="card">
            {signalRows.map((s) => (
              <div className="lab-row" key={s.id}>
                <div className="lab-name">{s.label}</div>
                <div className="lab-val">{s.display}</div>
                <span className="conf pos">{s.confidence}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Hormone layer ===== */}
      <div className="sec">
        <div className="sec-h">Cycle &amp; hormones</div>
        {hormone.loading ? (
          <Skeleton lines={2} />
        ) : hormone.error ? (
          <ErrorState
            message={hormone.error.message}
            onRetry={hormone.refetch}
          />
        ) : hormoneRows.length === 0 ? (
          <EmptyState
            title="No hormone readings"
            hint="Hormone-layer readings will appear here."
          />
        ) : (
          <div className="card">
            {hormoneRows.map((h) => (
              <div className="lab-row" key={h.id}>
                <div className="lab-name">{h.marker}</div>
                <div className="lab-val">{h.value}</div>
                <span className="conf obs">{h.phase}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Skin scan ===== */}
      <div className="sec">
        <div className="sec-h">Skin observations</div>
        {skin.loading ? (
          <Skeleton lines={2} />
        ) : skin.error ? (
          <ErrorState message={skin.error.message} onRetry={skin.refetch} />
        ) : skinView == null ? (
          <EmptyState
            title="No skin scan yet"
            hint="Your latest skin scan will appear here."
          />
        ) : (
          <div className="card">
            <h3>{skinView.headline}</h3>
            <div style={{ fontSize: 12.5, color: "#a89a95", marginBottom: 8 }}>
              {skinView.date}
            </div>
            {skinView.zones.map((z) => (
              <div className="sub-row" key={z.name}>
                <span>{z.name}</span>
                <span className="arr">{z.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
