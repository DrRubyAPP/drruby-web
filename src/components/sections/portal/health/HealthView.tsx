"use client";

import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import { useApi } from "@/hooks/useApi";
import type { SignalDto } from "./dto";
import { mapSignals } from "./mappers";

/** My Health（health）视图：对齐设计稿 v-health 结构。
 *  静态区块（Your data / Your body right now / Current focus / Meaningful
 *  follow-ups / Browse all）照设计稿渲染；Recent labs（signals）、Cycle &
 *  hormones、Skin observations 接真实 API。 */
const DATA_IMPORTS = [
  {
    label: "Upload a lab result",
    sub: "PDF or photo of a blood panel",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 3h6M10 3v6l-4.5 8.5A2 2 0 007.3 21h9.4a2 2 0 001.8-3.5L14 9V3" />
      </svg>
    ),
  },
  {
    label: "Connect Apple Health",
    sub: "Sleep, activity, heart data",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20s-7-4.2-9.3-8.3C1 8.3 2.4 5 5.8 5c1.9 0 3.1 1.1 6.2 3.7C15.1 6.1 16.3 5 18.2 5c3.4 0 4.8 3.3 3.1 6.7C19 15.8 12 20 12 20z" />
      </svg>
    ),
  },
  {
    label: "Add a medical report",
    sub: "Physical exam, imaging, notes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    label: "Import a wearable summary",
    sub: "Ring, watch, CGM",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="7" y="7" width="10" height="10" rx="2.5" />
        <path d="M9 7V4h6v3M9 17v3h6v-3" />
      </svg>
    ),
  },
];

const BODY_NOW = [
  {
    h: "1 meaningful change",
    p: "Your average bedtime moved about 46 minutes later over the past 10 days.",
    next: "View why this matters →",
    src: "based on Apple Watch sleep data",
    conf: "obs",
    confLabel: "Observed",
  },
  {
    h: "2 stable indicators",
    p: "Your resting heart rate and activity frequency have stayed steady.",
    next: "View details →",
    src: "based on Apple Watch data",
    conf: "obs",
    confLabel: "Stable",
  },
  {
    h: "4 items need more context",
    p: "Your recent LDL result can’t yet be compared — there’s no comparable prior panel on file.",
    next: "Add context →",
    src: "based on your June 12 lab upload",
    conf: "no",
    confLabel: "Not enough information",
  },
];

const FOLLOW_UPS = [
  "Add a comparable photo after August 12",
  "Review sleep trend after 14 nights",
  "Note how you feel 4 weeks after starting treatment",
];

const BROWSE_CATEGORIES = [
  "Lab Results",
  "Wearables",
  "Sleep",
  "Movement",
  "Cycle & Hormones",
  "Mood & Energy",
  "Weight",
  "Skin observations",
  "Symptoms",
  "Appointments",
  "Medical reports",
];

export function HealthView() {
  const signals = useApi<SignalDto[]>("/api/signals");

  const signalRows = mapSignals(signals.data ?? []);

  return (
    <>
      <h1>My Health</h1>
      <div className="lede">
        Bring your data in. DrRuby helps you see what&rsquo;s relevant &mdash;
        not another dashboard to maintain.
      </div>

      {/* ===== Your data（静态导入宫格，设计稿）===== */}
      <div className="sec">
        <div className="sec-h">Your data</div>
        <div className="data-grid">
          {DATA_IMPORTS.map((d) => (
            <button key={d.label} type="button" className="data-btn">
              <span className="data-ic">{d.icon}</span>
              <b>{d.label}</b>
              <span>{d.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Your body right now（静态 matter 卡，设计稿）===== */}
      <div className="sec">
        <div className="sec-h">Your body right now</div>
        {BODY_NOW.map((c) => (
          <div className="card matter" key={c.h}>
            <h3>{c.h}</h3>
            <p>{c.p}</p>
            <div className="matter-next">{c.next}</div>
            <div className="why">
              <span className="why-src">{c.src}</span>
              <span className={`conf ${c.conf}`}>{c.confLabel}</span>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12.5, color: "#a89a95", marginTop: 4 }}>
          Organized by relevance, not by health domain. DrRuby surfaces what
          changed, what&rsquo;s stable, and what it can&rsquo;t yet assess
          &mdash; not a fixed set of trackers to maintain.
        </div>
      </div>

      {/* ===== Recent labs（signals API）===== */}
      <div className="sec">
        <div className="sec-h">Recent labs</div>
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
      {/* ===== Current focus（静态，设计稿）===== */}
      <div className="sec">
        <div className="sec-h">
          Current focus &middot; only what&rsquo;s relevant to you
        </div>
        <div className="card">
          <div style={{ fontFamily: "var(--p-serif)", fontSize: 19 }}>
            Strength &amp; muscle health
          </div>
          <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
            Based on your stated goal. DrRuby prioritizes related information
            when it is available, and only surfaces it when it becomes relevant
            &mdash; nothing is collected unless you connect or add it.
          </div>
        </div>
      </div>

      {/* ===== Meaningful follow-ups（静态，设计稿）===== */}
      <div className="sec">
        <div className="sec-h">Meaningful follow-ups</div>
        <div className="card">
          {FOLLOW_UPS.map((f) => (
            <div className="foll" key={f}>
              <span className="dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ===== Browse all（折叠列表，设计稿）===== */}
      <div className="sec">
        <details className="uf-browse">
          <summary>Browse all health information &rarr;</summary>
          <div className="card" style={{ marginTop: 10 }}>
            {BROWSE_CATEGORIES.map((c) => (
              <div className="sub-row" key={c}>
                <span>{c}</span>
                <span className="arr">&rsaquo;</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </>
  );
}
