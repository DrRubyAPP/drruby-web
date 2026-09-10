"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import type {
  CreateDecisionInput,
  WmnResponse,
} from "@/components/sections/portal/decisions/dto";
import {
  chipToTopic,
  DECISION_CHIPS,
  deriveHomeState,
} from "@/components/sections/portal/decisions/mappers";
import { WhatMattersNow } from "@/components/sections/portal/today/WhatMattersNow";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { useRouter } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import {
  getFirstName,
  getGreetingKey,
} from "@/lib/portal/dashboard";

interface MeResponse {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  role: string;
  subscriptionTier: string;
}

interface TimelineEventDTO {
  id: string;
  date: string;
  kind: string;
  title: string;
  detail?: string;
  source?: string;
}

export default function PortalHomePage() {
  const t = useTranslations("portal");
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  const {
    data: me,
  } = useApi<MeResponse>("/api/me");
  const meName = me?.name?.trim() || "";
  const meFirst = getFirstName(meName) || "—";
  const greetingKey = me ? getGreetingKey(new Date()) : null;

  const { data: wmn } = useApi<WmnResponse>("/api/decisions/wmn");
  const homeState = wmn ? deriveHomeState(wmn) : null;

  const [question, setQuestion] = useState("");
  const [askChip, setAskChip] = useState<string | null>(null);
  const askInputRef = useRef<HTMLInputElement>(null);
  const createAsk = useMutation(
    (input: CreateDecisionInput) =>
      apiClient.post<{ id: string }>("/api/decisions", input),
    {
      onSuccess: (out) => {
        setQuestion("");
        setAskChip(null);
        router.push(`/portal/decisions/${out.id}`);
      },
    },
  );

  function submitAsk() {
    const q = question.trim();
    if (!q || createAsk.loading) return;
    const topic = askChip ? chipToTopic(askChip) : undefined;
    createAsk.mutate(
      topic
        ? {
            question: q,
            topic: topic.topic,
            topicSlug: topic.topicSlug,
            type: topic.type,
          }
        : { question: q, type: "not_sure" },
    );
  }

  const {
    data: timeline,
    error: tlErr,
    loading: tlLoading,
  } = useApi<TimelineEventDTO[]>("/api/timeline");
  const recentTimeline = (timeline ?? [])
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const focusAsk = () => {
    const askSection = document.getElementById("portal-ask-health");
    askSection?.scrollIntoView?.({ block: "start" });
    askInputRef.current?.focus();
  };

  const cmToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const recentHealth = wmn?.recentHealth ?? [];

  return (
    <>
      <div className="hello">
        {me && greetingKey ? t(greetingKey, { name: meFirst }) : ""}
      </div>
      <h1>Home</h1>
      <div className="lede">
        Here&rsquo;s what deserves your attention today.
      </div>
      {homeState === "new" && (
        <div className="sec">
          <div className="card matter">
            <h3>{t("dashboard.home.newTitle")}</h3>
            <p>{t("dashboard.home.newSub")}</p>
            <button
              type="button"
              className="matter-next"
              onClick={() => router.push("/portal/health")}
            >
              {t("dashboard.home.newAddHealth")}
            </button>
          </div>
        </div>
      )}

      {homeState === "actionable" && <WhatMattersNow data={wmn} />}

      {homeState === "empty" && (
        <div className="sec">
          <div className="card">
            <b>{t("dashboard.home.emptyTitle")}</b>
            <p>{t("dashboard.home.emptySub")}</p>
            <div className="empty-cta-row">
              <button
                type="button"
                className="ask-btn"
                onClick={focusAsk}
              >
                {t("dashboard.home.emptyAskSomethingNew")}
              </button>
              <button
                type="button"
                className="matter-next"
                onClick={() => router.push("/portal/health")}
              >
                {t("dashboard.home.emptyAddHealth")}
              </button>
            </div>
          </div>
        </div>
      )}
      {homeState === "empty" && recentHealth.length > 0 && (
        <div className="sec">
          <div className="sec-h">
            {t("dashboard.home.recentHealthTitle")}
          </div>
          <div className="card">
            {recentHealth.map((r) => (
              <button
                key={r.id}
                type="button"
                className="sub-row sub-row--button"
                onClick={() => router.push("/portal/health")}
              >
                <span>
                  <span className="recent-health-title">{r.title}</span>
                  <span className="st">
                    {r.kind} ·{" "}
                    {new Date(r.recordedAt).toLocaleDateString()}
                  </span>
                </span>
                <span className="arr" aria-hidden="true">
                  &rsaquo;
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="sec" id="portal-ask-health">
        <div className="sec-h">Ask about your health</div>
        <div className="ask">
          <div style={{ fontSize: 15, color: "var(--p-ink)" }}>
            What are you weighing? Ask a question &mdash; you don&rsquo;t
            need a complete history to start.
          </div>
          <div className="ask-ex" style={{ marginBottom: 10 }}>
            {DECISION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="ask-chip"
                onClick={() => setAskChip(askChip === chip ? null : chip)}
                style={
                  askChip === chip
                    ? { borderColor: "var(--p-ink)" }
                    : undefined
                }
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="ask-in">
            <input
              ref={askInputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitAsk();
              }}
              placeholder={t("dashboard.ask.placeholder")}
            />
            <button
              className="ask-btn"
              onClick={submitAsk}
              disabled={createAsk.loading || !question.trim()}
            >
              {createAsk.loading ? t("dashboard.ask.loading") : "Ask"}
            </button>
          </div>
          {createAsk.error && (
            <ErrorState message={t("dashboard.ask.error")} />
          )}
          <div style={{ fontSize: 12, color: "#a89a95", marginTop: 12 }}>
            {t("dashboard.ask.disclaimer")}
          </div>
        </div>
      </div>
      <div className="sec">
        <div className="sec-h">Your timeline</div>
        <div className="card">
          <div className="tl">
            {tlLoading && <div className="tl-empty">…</div>}
            {tlErr && (
              <ErrorState message={t("dashboard.timeline.error")} />
            )}
            {!tlLoading && !tlErr && recentTimeline.length === 0 && (
              <div className="tl-empty">
                {t("dashboard.timeline.empty")}
              </div>
            )}
            {recentTimeline.map((e) => (
              <div className="tl-item" key={e.id}>
                <span className="tl-dot" />
                <div className="tl-d">
                  {new Date(e.date).toLocaleDateString()}
                </div>
                <div className="tl-t">{e.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
