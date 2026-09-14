"use client";

import { useRef, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/api";
import type { DecisionDto } from "@/components/sections/portal/decisions/dto";
import type { HealthRecordDto } from "@/components/sections/portal/health/dto";
import { useApi } from "@/hooks/useApi";
import { Link, useRouter } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";

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

const NAV: { id: Tab; title: string; sub: string }[] = [
  { id: "home", title: "Home", sub: "Today, in context" },
  { id: "health", title: "My Health", sub: "Your body, together" },
  { id: "decisions", title: "My Decisions", sub: "What you are weighing" },
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
                <span className="ni-ic" aria-hidden="true">○</span>
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
  const { data, error, loading, refetch } = useApi<DecisionDto[]>(
    `/api/decisions?portalV2=${refreshKey}`,
  );
  const active = (data ?? []).filter(
    (decision) => !["CLOSED", "COMPLETED"].includes(decision.lifecycle),
  );
  return (
    <section className="portal-v2__content">
      <p className="portal-v2__eyebrow">YOUR HEALTH, IN CONTEXT</p>
      <h1>Home</h1>
      <div className="lede">A quiet place to notice what is changing.</div>
      <div className="sec">
        <div className="sec-h">What matters now</div>
        <div className="card matter">
          <h3>Start with what is real for you today.</h3>
          <p>
            Add a thought, a treatment update, a symptom, or a document below.
            DrRuby will organize it without making you choose a folder.
          </p>
        </div>
      </div>
      <div className="sec">
        <div className="sec-h">Currently in motion</div>
        {loading ? (
          <Skeleton lines={3} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : active.length ? (
          active.slice(0, 3).map((decision) => (
            <DecisionCard decision={decision} key={decision.id} />
          ))
        ) : (
          <div className="cm2-note">
            Nothing needs your attention yet. Use the box below whenever you
            want to capture something.
          </div>
        )}
      </div>
    </section>
  );
}

function HealthView({ refreshKey }: { refreshKey: number }) {
  const router = useRouter();
  const { data, error, loading, refetch } = useApi<HealthRecordDto[]>(
    `/api/health/records?portalV2=${refreshKey}`,
  );
  const records = data ?? [];
  const groups = [
    { title: "Vitals", kinds: ["vitals"] },
    { title: "Medication", kinds: ["medication"] },
    { title: "Conditions", kinds: ["symptom", "checkup"] },
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
          groups.map((group) => {
            const matches = records.filter((record) =>
              group.kinds.includes(record.kind),
            );
            return (
              <div className="card portal-v2__body-group" key={group.title}>
                <h3>{group.title}</h3>
                {matches.length ? (
                  matches.slice(0, 3).map((record) => (
                    <div className="sub-row" key={record.id}>
                      <span>{record.title}</span>
                      <span className="arr">
                        {new Date(record.recordedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>No records yet.</p>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="sec">
        <button
          className="portal-v2__trend-link"
          onClick={() => router.push("/portal-v2/health/trends")}
          type="button"
        >
          View trends <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
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
          active.map((decision) => <DecisionCard decision={decision} key={decision.id} />)
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
    <Link className="card portal-v2__decision" href={`/portal-v2/decisions/${decision.id}`}>
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
      const result = await apiClient.post<IntakeResponse>("/api/portal-v2/intake", {
        text: message,
        attachments: attachment
          ? [{ fileName: attachment.name, mime: attachment.type || "application/octet-stream" }]
          : [],
        pendingAction: pendingAction ?? undefined,
      });
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
            <p className={`portal-v2__message portal-v2__message--${message.role}`} key={`${message.role}-${index}`}>
              {message.content}
            </p>
          ))}
        </div>
      )}
      <div className="portal-v2__composer">
        {attachment && (
          <div className="portal-v2__attachment">
            {attachment.name}
            <button onClick={() => setAttachment(null)} type="button">×</button>
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
          <button disabled={sending || (!text.trim() && !attachment)} onClick={submit} type="button">
            {sending ? "Saving…" : "Send"}
          </button>
        </div>
        {error && <p className="portal-v2__composer-error">{error}</p>}
      </div>
    </div>
  );
}
