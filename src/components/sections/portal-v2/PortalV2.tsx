"use client";

import { useRef, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import type {
  DecisionDto,
  WmnResponse,
} from "@/components/sections/portal/decisions/dto";
import type { HealthRecordDto } from "@/components/sections/portal/health/dto";
import {
  healthRecordHighlight,
  healthRecordMetricKey,
} from "@/components/sections/portal/health/mappers";
import { YourTimeline } from "@/components/sections/portal/today/YourTimeline";
import { useApi } from "@/hooks/useApi";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import { HealthRecordValueCue } from "./HealthRecordValueCue";
import { MetricHistoryDialog } from "./MetricHistoryDialog";

type Tab = "home" | "health" | "decisions";

type PendingAction =
  | {
      type: "suggest_tracking";
      decisionId: string;
      title: string;
      cadence: string;
    }
  | { type: "ask_custom_tracking"; decisionId: string }
  | null;

type IntakeResponse = {
  message: string;
  decisionId?: string;
  healthRecordId?: string;
  pendingAction: PendingAction;
};

type ChatMessage = { role: "assistant" | "user"; content: string };

const NAV: { id: Tab; title: string; sub: string; icon: React.ReactNode }[] = [
  {
    id: "home",
    title: "Home",
    sub: "Today, in context",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v10h12V10" />
      </svg>
    ),
  },
  {
    id: "health",
    title: "My Health",
    sub: "Your body, together",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20s-7.5-4.35-9.5-8.5C.8 8 2.3 4.5 6 4.5c2 0 3.6 1.2 6 3.8 2.4-2.6 4-3.8 6-3.8 3.7 0 5.2 3.5 3.5 7C19.5 15.65 12 20 12 20z" />
      </svg>
    ),
  },
  {
    id: "decisions",
    title: "My Decisions",
    sub: "What you are weighing",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
      </svg>
    ),
  },
];

export function PortalV2() {
  const [tab, setTab] = useState<Tab>("home");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div id="app-portal" className="portal-v2">
      <div className="ufw portal-v2__shell">
        <aside className="side">
          <Link href="/" className="logo">
            Dr<span>Ruby</span>
          </Link>
          <div className="logo-sub">YOUR HEALTHSPAN, IN CONTEXT</div>
          <nav className="nav" aria-label="Portal navigation">
            {NAV.map((item) => (
              <button
                className={`nav-item${tab === item.id ? " active" : ""}`}
                key={item.id}
                onClick={() => setTab(item.id)}
                type="button"
              >
                <span className="ni-ic" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="ni-tx">
                  <b>{item.title}</b>
                  <small>{item.sub}</small>
                </span>
              </button>
            ))}
          </nav>
          <div className="side-foot">
            <Link className="portal-v2__quiet-link" href="/portal">
              Use classic portal
            </Link>
          </div>
        </aside>

        <main className="ufm portal-v2__main">
          {tab === "home" && <HomeView refreshKey={refreshKey} />}
          {tab === "health" && <HealthView refreshKey={refreshKey} />}
          {tab === "decisions" && <DecisionsView refreshKey={refreshKey} />}
        </main>
      </div>
      <FloatingComposer onChanged={() => setRefreshKey((value) => value + 1)} />
    </div>
  );
}

function HomeView({ refreshKey }: { refreshKey: number }) {
  const { data, error, loading, refetch } = useApi<WmnResponse>(
    `/api/decisions/wmn?portalV2=${refreshKey}`,
  );
  return (
    <section className="portal-v2__content">
      <p className="portal-v2__eyebrow">YOUR HEALTH, IN CONTEXT</p>
      <h1>Home</h1>
      <div className="lede">A quiet place to notice what is changing.</div>
      <div className="sec">
        <div className="sec-h">What matters now</div>
        {loading ? (
          <Skeleton lines={3} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : data?.cards.length ? (
          <div className="card">
            {data.cards.map((decision, index) => {
              const observationDue = index < data.checkInDueCount;
              return (
                <Link
                  className={`dec portal-v2__wmn-item${index === 0 ? " mn-primary" : ""}`}
                  href={
                    observationDue
                      ? `/portal/decisions/${decision.id}`
                      : `/portal-v2/decisions/${decision.id}`
                  }
                  key={decision.id}
                >
                  <div>
                    <h4>{decision.question}</h4>
                    <div className="st">
                      {observationDue ? "Observation due" : "Updated"}{" "}
                      {new Date(
                        observationDue && decision.nextCheckInAt
                          ? decision.nextCheckInAt
                          : decision.lastUserActivityAt,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="arr" aria-hidden="true">
                    &rsaquo;
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="cm2-note">
            Nothing needs your attention yet. Use the box below whenever you
            want to capture something.
          </div>
        )}
      </div>
      <YourTimeline refreshKey={refreshKey} />
    </section>
  );
}

function HealthView({ refreshKey }: { refreshKey: number }) {
  const [selectedMetric, setSelectedMetric] = useState<HealthRecordDto | null>(null);
  const { data, error, loading, refetch } = useApi<HealthRecordDto[]>(
    `/api/health/records?portalV2=${refreshKey}`,
  );
  const records = data ?? [];
  const groups = [
    { title: "Vitals", kinds: ["vitals"] },
    { title: "Medication", kinds: ["medication"] },
    { title: "Conditions", kinds: ["symptom"] },
    { title: "Treatments", kinds: ["treatment"] },
  ];
  return (
    <section className="portal-v2__content">
      <p className="portal-v2__eyebrow">YOUR HEALTH, TOGETHER</p>
      <h1>My Health</h1>
      <div className="lede">
        Your records are organized here. Add words, a photo, or a PDF from the
        same box wherever you are in the portal.
      </div>
      <div className="sec">
        <div className="sec-h">Your body right now</div>
        {loading ? (
          <Skeleton lines={5} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : (
          <div className="portal-v2__health-grid">
            {groups.map((group) => {
              const matches = records.filter((record) =>
                group.kinds.includes(record.kind),
              );
              const latestByMetric = latestRecordsByMetric(matches);
              return (
                <div className="card portal-v2__body-group" key={group.title}>
                  <h3>{group.title}</h3>
                  {latestByMetric.length ? (
                    latestByMetric.map((record) => {
                      const highlight = healthRecordHighlight(record);
                      return (
                        <button
                          className="sub-row portal-v2__metric-row"
                          key={record.id}
                          onClick={() => setSelectedMetric(record)}
                          type="button"
                        >
                          <span>{record.displayName ?? record.title}</span>
                          <span className="portal-v2__record-meta">
                            {highlight && (
                              <HealthRecordValueCue highlight={highlight} />
                            )}
                            <span className="arr">
                              {new Date(record.recordedAt).toLocaleDateString()}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p>No records yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selectedMetric && (
        <MetricHistoryDialog
          onClose={() => setSelectedMetric(null)}
          records={records.filter(
            (record) => healthRecordMetricKey(record) === healthRecordMetricKey(selectedMetric),
          )}
          title={selectedMetric.displayName ?? selectedMetric.title}
        />
      )}
    </section>
  );
}

/**
 * "Your body right now" shows one current record per supported metric. Raw
 * `other` records deliberately use their title as identity because no catalog
 * concept exists yet. Sort locally instead of depending on API ordering.
 */
function latestRecordsByMetric(records: HealthRecordDto[]): HealthRecordDto[] {
  const seen = new Set<string>();
  return [...records]
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    )
    .filter((record) => {
      const key = healthRecordMetricKey(record);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function DecisionsView({ refreshKey }: { refreshKey: number }) {
  const { data, error, loading, refetch } = useApi<DecisionDto[]>(
    `/api/decisions?portalV2=${refreshKey}`,
  );
  const active = (data ?? []).filter(
    (decision) => !["CLOSED", "COMPLETED"].includes(decision.lifecycle),
  );
  const completed = (data ?? []).filter((decision) =>
    ["CLOSED", "COMPLETED"].includes(decision.lifecycle),
  );
  return (
    <section className="portal-v2__content">
      <p className="portal-v2__eyebrow">WHAT YOU ARE WEIGHING</p>
      <h1>My Decisions</h1>
      <div className="lede">
        Mention anything you are considering or have started in the box below.
        DrRuby will create the space and bring in relevant health context.
      </div>
      <div className="sec">
        <div className="sec-h">In progress</div>
        {loading ? (
          <Skeleton lines={3} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : active.length ? (
          active.map((decision) => (
            <DecisionCard decision={decision} key={decision.id} />
          ))
        ) : (
          <div className="cm2-note">Nothing in progress yet.</div>
        )}
      </div>
      {completed.length > 0 && (
        <div className="sec">
          <div className="sec-h">Past decisions</div>
          {completed.map((decision) => (
            <DecisionCard decision={decision} key={decision.id} />
          ))}
        </div>
      )}
    </section>
  );
}

function DecisionCard({ decision }: { decision: DecisionDto }) {
  return (
    <Link
      className="card portal-v2__decision"
      href={`/portal-v2/decisions/${decision.id}`}
    >
      <div>
        <h3>{decision.topic || decision.question}</h3>
        <p>{decision.question}</p>
      </div>
      <span aria-hidden="true">›</span>
    </Link>
  );
}

function FloatingComposer({ onChanged }: { onChanged: () => void }) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function submit() {
    if ((!text.trim() && !attachment) || sending) return;
    const message = text.trim() || `Attached ${attachment?.name}`;
    setText("");
    setError(null);
    setSending(true);
    setMessages((items) => [...items, { role: "user", content: message }]);
    try {
      const result = await apiClient.post<IntakeResponse>(
        "/api/portal-v2/intake",
        {
          text: message,
          attachments: attachment
            ? [
                {
                  fileName: attachment.name,
                  mime: attachment.type || "application/octet-stream",
                },
              ]
            : [],
          pendingAction: pendingAction ?? undefined,
        },
      );
      setAttachment(null);
      setPendingAction(result.pendingAction);
      setMessages((items) => [
        ...items,
        { role: "assistant", content: result.message },
      ]);
      onChanged();
    } catch {
      setError("That did not save. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="portal-v2__composer-wrap">
      {messages.length > 0 && (
        <div className="portal-v2__chat" aria-live="polite">
          {messages.slice(-4).map((message, index) => (
            <p
              className={`portal-v2__message portal-v2__message--${message.role}`}
              key={`${message.role}-${index}`}
            >
              {message.content}
            </p>
          ))}
        </div>
      )}
      <div className="portal-v2__composer">
        {attachment && (
          <div className="portal-v2__attachment">
            {attachment.name}
            <button onClick={() => setAttachment(null)} type="button">
              ×
            </button>
          </div>
        )}
        <textarea
          aria-label="Tell DrRuby what is changing"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Tell DrRuby what is changing, what you started, or what you are considering…"
          value={text}
        />
        <div className="portal-v2__composer-actions">
          <input
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            ref={fileInput}
            type="file"
          />
          <button onClick={() => fileInput.current?.click()} type="button">
            Add photo or PDF
          </button>
          <button
            disabled={sending || (!text.trim() && !attachment)}
            onClick={submit}
            type="button"
          >
            {sending ? "Saving…" : "Send"}
          </button>
        </div>
        {error && <p className="portal-v2__composer-error">{error}</p>}
      </div>
    </div>
  );
}
