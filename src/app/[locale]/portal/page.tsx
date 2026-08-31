"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import LogoutButton from "@/components/auth/LogoutButton";
import { ContributeDialog } from "@/components/sections/portal/ContributeDialog";
import { DecisionsView } from "@/components/sections/portal/decisions/DecisionsView";
import type {
  CreateDecisionInput,
  WmnResponse,
} from "@/components/sections/portal/decisions/dto";
import {
  chipToTopic,
  DECISION_CHIPS,
  deriveHomeState,
} from "@/components/sections/portal/decisions/mappers";
import { HealthView } from "@/components/sections/portal/health/HealthView";
import { LibraryJourneys } from "@/components/sections/portal/LibraryJourneys";
import { NotificationPrefs } from "@/components/sections/portal/NotificationPrefs";
import { PrivacyView } from "@/components/sections/portal/privacy/PrivacyView";
import { ResearchView } from "@/components/sections/portal/research/ResearchView";
import { DeleteAccountDialog } from "@/components/sections/portal/settings/DeleteAccountDialog";
import { ExportDataButton } from "@/components/sections/portal/settings/ExportDataButton";
import { WhatMattersNow } from "@/components/sections/portal/today/WhatMattersNow";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { Link, useRouter } from "@/i18n/navigation";
import { apiClient } from "@/lib/api/client";
import {
  getFirstName,
  getGreetingKey,
  getInitials,
  getTierKey,
} from "@/lib/portal/dashboard";
import "./portal.css";

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

type View =
  | "today"
  | "health"
  | "decisions"
  | "library"
  | "research"
  | "privacy";

type NavItem = {
  id: View;
  titleKey: string;
  subKey: string;
  icon: React.ReactNode;
};

/** 主导航：Home / My Health / My Decisions（§1 三顶级） */
const MAIN_NAV: NavItem[] = [
  {
    id: "today",
    titleKey: "dashboard.tabs.today.label",
    subKey: "dashboard.tabs.today.sub",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v10h12V10" />
      </svg>
    ),
  },
  {
    id: "health",
    titleKey: "dashboard.tabs.health.label",
    subKey: "dashboard.tabs.health.sub",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20s-7.5-4.35-9.5-8.5C.8 8 2.3 4.5 6 4.5c2 0 3.6 1.2 6 3.8 2.4-2.6 4-3.8 6-3.8 3.7 0 5.2 3.5 3.5 7C19.5 15.65 12 20 12 20z" />
      </svg>
    ),
  },
  {
    id: "decisions",
    titleKey: "dashboard.tabs.decisions.label",
    subKey: "dashboard.tabs.decisions.sub",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
      </svg>
    ),
  },
];

/** 次级 more 分组（D1）：Library / Research / Privacy — 视觉降级、仍可达 */
const MORE_NAV: NavItem[] = [
  {
    id: "library",
    titleKey: "dashboard.tabs.library.label",
    subKey: "dashboard.tabs.library.sub",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: "research",
    titleKey: "dashboard.tabs.research.label",
    subKey: "dashboard.tabs.research.sub",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6" />
        <path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
      </svg>
    ),
  },
  {
    id: "privacy",
    titleKey: "dashboard.tabs.privacy.label",
    subKey: "dashboard.tabs.privacy.sub",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
];

export default function PortalPage() {
  const t = useTranslations("portal");
  const router = useRouter();
  const [view, setView] = useState<View>("today");
  const [toast, setToast] = useState<string | null>(null);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [notifExpanded, setNotifExpanded] = useState(false);

  // 当前用户 profile（含 memberSince/subscriptionTier，session 不提供）
  const {
    data: me,
    error: meErr,
    loading: meLoading,
    refetch: refetchMe,
  } = useApi<MeResponse>("/api/me");
  const meName = me?.name?.trim() || "";
  const meFirst = getFirstName(meName) || "—";
  const greetingKey = me ? getGreetingKey(new Date()) : null;

  // What Matters Now 信封：Home 三态 + WMN 卡片单次取数（§7–§10）
  const { data: wmn } = useApi<WmnResponse>("/api/decisions/wmn");
  const homeState = wmn ? deriveHomeState(wmn) : null;

  // Ask about your health：提交 → 创建 Decision（A1：仅创建一个）→ 跳转详情（F2）
  // chip 语义 = 选 topic：预填 { topic, topicSlug, type } 三元组；自由 Ask 不选 chip
  const [question, setQuestion] = useState("");
  const [askChip, setAskChip] = useState<string | null>(null);
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
        : { question: q, type: "not_sure" }, // 自由 Ask：topic/topicSlug 省略 → null
    );
  }

  // Timeline：最近 5 条（按 date 倒序）
  const {
    data: timeline,
    error: tlErr,
    loading: tlLoading,
  } = useApi<TimelineEventDTO[]>("/api/timeline");
  const recentTimeline = (timeline ?? [])
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const go = (v: View) => {
    setView(v);
    const m = document.querySelector<HTMLElement>("#app-portal .ufm");
    if (m) m.scrollTop = 0;
  };

  const cmToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const on = (v: View) => `ufv${view === v ? " on" : ""}`;

  return (
    <div id="app-portal">
      <div className="ufw">
        <aside className="side">
          <Link href="/" className="logo">
            Dr<span>Ruby</span>
          </Link>
          <div className="logo-sub">{t("brandSub")}</div>
          <nav className="nav">
            {MAIN_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                id={`n-${item.id}`}
                className={`nav-item${view === item.id ? " active" : ""}`}
                onClick={() => go(item.id)}
              >
                <span className="ni-ic">{item.icon}</span>
                <span className="ni-tx">
                  <b>{t(item.titleKey)}</b>
                  <small>{t(item.subKey)}</small>
                </span>
              </button>
            ))}

            {/* more 分组：视觉降级（次级标题 + 弱化样式），置于主三项之下（D1） */}
            <div className="nav-more-label">{t("dashboard.tabs.more")}</div>
            {MORE_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                id={`n-${item.id}`}
                className={`nav-item nav-item--more${
                  view === item.id ? " active" : ""
                }`}
                onClick={() => go(item.id)}
              >
                <span className="ni-ic">{item.icon}</span>
                <span className="ni-tx">
                  <b>{t(item.titleKey)}</b>
                  <small>{t(item.subKey)}</small>
                </span>
              </button>
            ))}
          </nav>
          <div className="side-foot">
            <LogoutButton className="mb-2 ml-3 bg-transparent border-0 p-0 text-left text-[13px] font-normal text-[#6b6561] cursor-pointer hover:text-[#b74f53] hover:opacity-100 transition-colors disabled:opacity-60" />
            <div className="profile">
              <div className="avatar">
                {me ? getInitials(meName) || "—" : "—"}
              </div>
              <div>
                <div className="pname">{me ? meName || "—" : "—"}</div>
                <div className="pmail">{me?.email ?? "—"}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="ufm">
          {/* ===== TODAY / HOME ===== */}
          <div className={on("today")} id="v-today">
            <div className="hello">
              {me && greetingKey ? t(greetingKey, { name: meFirst }) : ""}
            </div>
            <h1>Home</h1>
            <div className="lede">
              Here&rsquo;s what deserves your attention today.
            </div>
            {/* 三态区（§10）：new / actionable / empty；加载中（null）先不渲染避免闪烁 */}
            {homeState === "new" && (
              <div className="sec">
                <div className="card matter">
                  <h3>{t("dashboard.home.newTitle")}</h3>
                  <p>{t("dashboard.home.newSub")}</p>
                  <div className="matter-next">
                    {t("dashboard.home.newAddHealth")}
                  </div>
                </div>
              </div>
            )}

            {homeState === "actionable" && <WhatMattersNow data={wmn} />}

            {homeState === "empty" && (
              <div className="sec">
                <div className="card">
                  <b>{t("dashboard.home.emptyTitle")}</b>
                  <p>{t("dashboard.home.emptySub")}</p>
                </div>
              </div>
            )}
            <div className="sec">
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
          </div>

          {/* ===== MY HEALTH ===== */}
          <div className={on("health")} id="v-health">
            <HealthView />
          </div>

          {/* ===== MY DECISIONS ===== */}
          <div className={on("decisions")} id="v-decisions">
            <DecisionsView />
          </div>

          {/* ===== LIBRARY (anonymous structured experiences) ===== */}
          <div className={on("library")} id="v-library">
            <h1>Library</h1>
            <div className="lede">
              A learning library, not a feed. Real women&rsquo;s decisions
              &mdash; structured, consented, and relevant to you. Not
              strangers&rsquo; posts.
            </div>
            <div className="uf-gate">
              <b>Experience Library, not a forum.</b> Every experience here is a
              real decision &mdash; shared with explicit, revocable consent and
              anonymized, then structured (goal &rarr; decision &rarr; outcome
              &rarr; reflection). It&rsquo;s{" "}
              <b>experience, not advice or evidence</b>. Using DrRuby is not the
              same as contributing. A public discussion module stays gated
              before launch (Non-goals, legal + ToS, Research Governance).
            </div>
            <div className="sec">
              <div className="sec-h">Where these experiences come from</div>
              <div className="card">
                <div className="src-grid">
                  <span className="src-pill">
                    <i>
                      <svg viewBox="0 0 24 24">
                        <path d="M12 3l2.5 5.5 6 .5-4.5 4 1.4 5.9L12 17l-5.4 2.9L8 13l-4.5-4 6-.5z" />
                      </svg>
                    </i>
                    Curated founder interviews
                  </span>
                  <span className="src-pill">
                    <i>
                      <svg viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </i>
                    Verified members
                  </span>
                  <span className="src-pill">
                    <i>
                      <svg viewBox="0 0 24 24">
                        <path d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-6h6v6" />
                      </svg>
                    </i>
                    Partner clinics
                  </span>
                  <span className="src-pill">
                    <i>
                      <svg viewBox="0 0 24 24">
                        <path d="M9 3h6M10 3v6l-4.5 8.5A2 2 0 007.3 21h9.4a2 2 0 001.8-3.5L14 9V3" />
                      </svg>
                    </i>
                    Research participants
                  </span>
                </div>
                <div className="cm2-note">
                  Every experience is shared with explicit, revocable consent
                  and anonymized before it appears here. The more rigorous the
                  source, the more clearly it&rsquo;s labeled &mdash; never
                  anonymous strangers&rsquo; posts.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Relevant to your decision</div>
              <div className="card">
                <div className="ask-ex">
                  <span className="coming-soon">
                    {t("dashboard.comingSoon")}
                  </span>
                </div>
                <div className="cm2-note">
                  Matched by your <b>decision, goal, concerns, and timing</b>{" "}
                  &mdash; not by age, ethnicity, or location. Similarity does
                  not imply the same outcome.
                </div>
                <div className="cm2-counts">
                  <div className="cm2-stat">
                    <span className="coming-soon">
                      {t("dashboard.comingSoon")}
                    </span>
                    <span>journeys</span>
                  </div>
                  <div className="cm2-stat">
                    <span className="coming-soon">
                      {t("dashboard.comingSoon")}
                    </span>
                    <span>insights</span>
                  </div>
                  <div className="cm2-stat">
                    <span className="coming-soon">
                      {t("dashboard.comingSoon")}
                    </span>
                    <span>with photos</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">What people commonly find</div>
              <div className="card matter">
                <h3>Across Thermage journeys like yours</h3>
                <p>
                  Many describe results appearing gradually over 2&ndash;3
                  months; a few noticed little change. Experiences vary widely.
                </p>
                <div style={{ fontSize: 12, color: "#a89a95", marginTop: 8 }}>
                  Summarized from many consented experiences &mdash; what people
                  report, not a statistic and not medical advice.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">
                Photos within a journey &middot; with context
              </div>
              <div className="cm2-ba">
                <div
                  className="cm2-bacard"
                  onClick={() => cmToast("Opening full Thermage journey")}
                >
                  <span className="arr cm2-ba-arr" aria-hidden="true">
                    &rsaquo;
                  </span>
                  <div className="cm2-ph">
                    <div
                      style={{
                        background: "linear-gradient(140deg,#d9cac4,#b9afa9)",
                      }}
                    >
                      <span>Before</span>
                    </div>
                    <div
                      style={{
                        background: "linear-gradient(140deg,#d9c7c9,#cda8ad)",
                      }}
                    >
                      <span>Month 6</span>
                    </div>
                  </div>
                  <div className="cm2-bab">
                    <b>Thermage &middot; Age 42</b>
                    <span>Would do again</span>
                    <span className="cm2-src">
                      Verified member &middot; anonymized
                    </span>
                    <div className="cm2-view">View the full journey &rarr;</div>
                  </div>
                </div>
                <div
                  className="cm2-bacard"
                  onClick={() => cmToast("Opening full melasma journey")}
                >
                  <span className="arr cm2-ba-arr" aria-hidden="true">
                    &rsaquo;
                  </span>
                  <div className="cm2-ph">
                    <div
                      style={{
                        background: "linear-gradient(140deg,#d9cac4,#c2b6ae)",
                      }}
                    >
                      <span>Before</span>
                    </div>
                    <div
                      style={{
                        background: "linear-gradient(140deg,#e0cfcf,#cdb1b3)",
                      }}
                    >
                      <span>Month 12</span>
                    </div>
                  </div>
                  <div className="cm2-bab">
                    <b>Melasma &middot; Age 39</b>
                    <span>Mixed result</span>
                    <span className="cm2-src">
                      Founder interview &middot; consented
                    </span>
                    <div className="cm2-view">View the full journey &rarr;</div>
                  </div>
                </div>
                <div
                  className="cm2-bacard"
                  onClick={() => cmToast("Opening hair-loss journey")}
                >
                  <span className="arr cm2-ba-arr" aria-hidden="true">
                    &rsaquo;
                  </span>
                  <div className="cm2-ph">
                    <div
                      style={{
                        background: "linear-gradient(140deg,#c9c3bb,#a69b92)",
                      }}
                    >
                      <span>Week 1</span>
                    </div>
                    <div
                      style={{
                        background: "linear-gradient(140deg,#bcb2aa,#94867c)",
                      }}
                    >
                      <span>Month 9</span>
                    </div>
                  </div>
                  <div className="cm2-bab">
                    <b>Hair loss &middot; Age 41</b>
                    <span>Ongoing</span>
                    <span className="cm2-src study">From a research study</span>
                    <div className="cm2-view">View the full journey &rarr;</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">
                Living journeys &middot; still updating
              </div>
              <LibraryJourneys />
              <div className="cm2-note">
                A journey isn&rsquo;t shared once and forgotten. Journeys keep
                updating &mdash; that&rsquo;s what makes them worth following.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Contribute &amp; ask</div>
              <div className="card">
                <div className="cm2-q">
                  <div className="cm2-qt">Have a decision on your mind?</div>
                  <div className="cm2-qmeta">
                    DrRuby answers with a Decision Brief first &mdash; your
                    history, the evidence, and similar journeys. Browsing
                    others&rsquo; experiences comes after that, not before.
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button
                    className="cm2-ghost"
                    onClick={() => setContributeOpen(true)}
                  >
                    Contribute a journey anonymously
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "#a89a95", marginTop: 10 }}>
                  Your personal information is never shared. Contributing is
                  optional and can be withdrawn anytime.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">
                Ask others &middot; optional forum module (gated)
              </div>
              <div className="card">
                <div className="cm2-q">
                  <div className="cm2-qt">Should I start HRT?</div>
                  <div className="cm2-qmeta">
                    48 replies &middot; 12 similar journeys &middot; 2 expert
                    comments
                  </div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">Anyone regret Thermage?</div>
                  <div className="cm2-qmeta">
                    61 replies &middot; 18 similar journeys
                  </div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">How did you choose your clinic?</div>
                  <div className="cm2-qmeta">
                    33 replies &middot; 9 similar journeys
                  </div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">How long until you saw results?</div>
                  <div className="cm2-qmeta">
                    54 replies &middot; 21 similar journeys
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">
                Things I wish I knew &middot; regret stories
              </div>
              <div className="card">
                <div className="cm2-q">
                  <div className="cm2-qt">
                    &ldquo;I regret doing it before asking what happens if it
                    doesn&rsquo;t work.&rdquo;
                  </div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">
                    &ldquo;I regret waiting so long &mdash; not for vanity, I
                    just kept putting it off.&rdquo;
                  </div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">
                    &ldquo;I regret choosing the clinic that pushed a
                    package.&rdquo;
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Most helpful lessons</div>
              <div className="card">
                <div className="cm2-q">
                  <div className="cm2-qt">Take photos before deciding.</div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">Don&rsquo;t judge by Week 1.</div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">
                    Ask what happens if it doesn&rsquo;t work.
                  </div>
                </div>
              </div>
              <div className="cm2-note">
                Organized by DrRuby from real journeys &mdash; lessons, not
                advice.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">This week</div>
              <div className="card">
                <div className="found">
                  <div>
                    <div className="n">
                      <span className="coming-soon">
                        {t("dashboard.comingSoon")}
                      </span>
                    </div>
                    <div className="l">new journeys</div>
                  </div>
                  <div>
                    <div className="n">
                      <span className="coming-soon">
                        {t("dashboard.comingSoon")}
                      </span>
                    </div>
                    <div className="l">long-term updates</div>
                  </div>
                  <div>
                    <div className="n">
                      <span className="coming-soon">
                        {t("dashboard.comingSoon")}
                      </span>
                    </div>
                    <div className="l">most followed</div>
                  </div>
                  <div>
                    <div className="n">
                      <span className="coming-soon">
                        {t("dashboard.comingSoon")}
                      </span>
                    </div>
                    <div className="l">top lesson</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">
                Following &middot; journeys, not people
              </div>
              <div className="card">
                <div className="sub-row">
                  <span className="coming-soon">
                    {t("dashboard.comingSoon")}
                  </span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Browse by decision</div>
              <div className="rel">
                <div className="rel-card">
                  <div className="k">Medical Aesthetics</div>
                  <h4>Thermage &middot; 248 journeys</h4>
                  <p>Ultherapy &middot; Botox &middot; Pico &middot; Filler</p>
                </div>
                <div className="rel-card">
                  <div className="k">Health</div>
                  <h4>HRT &middot; 190 journeys</h4>
                  <p>Hair loss &middot; Sleep &middot; Weight &middot; Mood</p>
                </div>
              </div>
              <div className="cm2-note">
                Batch 1: users don&rsquo;t come to browse a forum &mdash; they
                come to decide &ldquo;should I do this?&rdquo;. So the community
                is organized by decision, not by feed.
              </div>
            </div>
            <div className="sec">
              <div className="cm2-pos">
                Reddit helps you chat. RealSelf helps you see photos.{" "}
                <b>
                  DrRuby helps you learn how real decisions actually happen.
                </b>{" "}
                Every reply here is a journey, not a comment: &ldquo;I had a
                similar experience&rdquo; &middot; &ldquo;a different
                experience&rdquo; &middot; &ldquo;I changed my mind later&rdquo;
                &middot; &ldquo;here&rsquo;s my outcome&rdquo;.
              </div>
            </div>
            <ContributeDialog
              open={contributeOpen}
              onClose={() => setContributeOpen(false)}
            />
          </div>

          {/* ===== RESEARCH ===== */}
          <div className={on("research")} id="v-research">
            <h1>Research</h1>
            <div className="lede">
              Where women&rsquo;s health and healthspan science may be heading
              &mdash; early signals from the research world, explained honestly.
              For learning, not medical advice.
            </div>
            <div className="sec">
              <div className="priv-note">
                <b>Emerging, not established.</b> These are directions
                researchers are exploring &mdash; often promising, rarely
                settled. Today&rsquo;s signal isn&rsquo;t tomorrow&rsquo;s
                guideline, and nothing here is a recommendation.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">
                On the horizon &mdash; from the journals
              </div>
              {[
                {
                  h: "The gut microbiome and hormonal transitions",
                  tag: "Early research",
                  why: "emerging work links the gut to how hormones shift around perimenopause.",
                  unknown:
                    "whether changing the microbiome helps — not shown in people for this use yet.",
                },
                {
                  h: "GLP-1 medicines beyond weight",
                  tag: "Active research",
                  why: "researchers are studying effects on metabolism, inflammation and more.",
                  unknown:
                    "long-term effects and who truly benefits — decisions belong with your doctor.",
                },
                {
                  h: "The biology of cellular aging and skin",
                  tag: "Very early",
                  why: "a fast-moving field that may reshape how we think about skin over time.",
                  unknown:
                    "what, if anything, is safe and effective for people.",
                },
              ].map((c) => (
                <div className="card matter" key={c.h}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      alignItems: "baseline",
                    }}
                  >
                    <h3>{c.h}</h3>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: ".04em",
                        color: "#8C2635",
                        background: "#fbeef0",
                        padding: "4px 9px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.tag}
                    </span>
                  </div>
                  <p>
                    <b>Why it may matter:</b> {c.why} <b>Still unknown:</b>{" "}
                    {c.unknown}
                  </p>
                </div>
              ))}
              <div style={{ fontSize: 12, color: "#a89a95", marginTop: 6 }}>
                Curated directions, not a paper feed &mdash; we summarize where
                the field is looking, and what it still doesn&rsquo;t know.
              </div>
            </div>
            <ResearchView />
            <div className="sec">
              <div className="sec-h">What are we learning?</div>
              <div className="card matter">
                <h3>Does a sleep headband help &mdash; or just add anxiety?</h3>
                <p>
                  An early question we&rsquo;re exploring with members who track
                  sleep. Nothing concluded yet.
                </p>
              </div>
              <div className="card matter">
                <h3>How skin actually changes across a year</h3>
                <p>
                  Built from many individual timelines kept intact &mdash; not
                  averages.
                </p>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">New products, independently evaluated</div>
              <div className="card">
                <div className="sub-row">
                  <span>
                    Devices &amp; products we&rsquo;re independently evaluating
                  </span>
                  <span className="arr">2 active</span>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#7c746f",
                    marginTop: 8,
                    lineHeight: 1.5,
                  }}
                >
                  Independent, real-world evaluation &mdash; never an
                  endorsement, never influenced by sponsorship.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="card">
                <div
                  className="sub-row"
                  onClick={() => go("privacy")}
                  style={{ cursor: "pointer" }}
                >
                  <span>Your research participation</span>
                  <span className="arr">Manage in Consent Center &rsaquo;</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== PROFILE & PRIVACY ===== */}
          <div className={on("privacy")} id="v-privacy">
            <h1>Profile &amp; Privacy</h1>
            <div className="pf-head">
              {meErr ? (
                <ErrorState
                  message={t("dashboard.profile.error")}
                  onRetry={refetchMe}
                />
              ) : (
                <>
                  <div className="pf-av">
                    {me ? getInitials(meName) || "—" : "—"}
                  </div>
                  <div>
                    <div className="pf-name">{me ? meName || "—" : "—"}</div>
                    <div className="pf-meta">
                      {me
                        ? t("dashboard.profile.memberSince", {
                            email: me.email,
                            year: new Date(me.memberSince).getFullYear(),
                          })
                        : "—"}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="pf-status">
              <span className="pf-pill on">Private by default</span>
              <span className="pf-pill">No community sharing</span>
              <span className="pf-pill">No active studies</span>
            </div>
            <div className="lede">
              <b>Your data. Your choice.</b> You control what DrRuby can access,
              where it&rsquo;s processed, and what &mdash; if anything &mdash;
              is shared.
            </div>
            <PrivacyView />
            <div className="sec">
              <div className="sec-h">Membership</div>
              <div className="card">
                <div className="sub-row">
                  <div className="sr2">
                    <b>Your plan</b>
                    <span>{me ? t(getTierKey(me.subscriptionTier)) : "—"}</span>
                  </div>
                  <span className="arr">&rsaquo;</span>
                </div>
                <Link
                  href="/pricing"
                  className="sub-row"
                  style={{ cursor: "pointer", color: "inherit" }}
                >
                  <span>View plans</span>
                  <span className="arr">&rsaquo;</span>
                </Link>
                <div className="sub-row">
                  <span>Manage billing</span>
                  <span className="arr">&rsaquo;</span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Account</div>
              <div className="card">
                <div className="sub-row">
                  <span>Your profile</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Account security</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row" style={{ color: "#8C2635" }}>
                  <LogoutButton className="bg-transparent border-0 p-0 text-left text-[14.5px] font-normal cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-60" />
                  <span className="arr">&rsaquo;</span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Your data</div>
              <div className="card">
                <div className="sub-row">
                  <div className="sr2">
                    <b>Activity log</b>
                    <span>Everything DrRuby has recorded.</span>
                  </div>
                  <span className="arr">&rsaquo;</span>
                </div>
                <ExportDataButton />
                <DeleteAccountDialog />
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Devices &amp; Permissions</div>
              <div className="card">
                <div className="sub-row">
                  <span>Connected data sources</span>
                  <span className="arr">
                    <span className="coming-soon">
                      {t("dashboard.comingSoon")}
                    </span>
                  </span>
                </div>
                <div className="sub-row">
                  <span>Permissions</span>
                  <span className="arr">
                    <span className="coming-soon">
                      {t("dashboard.comingSoon")}
                    </span>
                  </span>
                </div>
                <div className="sub-row">
                  <span>Where data is processed</span>
                  <span className="arr">
                    <span className="coming-soon">
                      {t("dashboard.comingSoon")}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Notifications &amp; Appearance</div>
              <div className="card">
                <div
                  className="sub-row"
                  style={{ cursor: "pointer" }}
                  onClick={() => setNotifExpanded((v) => !notifExpanded)}
                >
                  <span>Notification preferences</span>
                  <span className="arr">{notifExpanded ? "▾" : "›"}</span>
                </div>
                {notifExpanded && <NotificationPrefs />}
                <div className="sub-row">
                  <span>Appearance &amp; language</span>
                  <span className="arr">&rsaquo;</span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Help</div>
              <div className="card">
                <a
                  href="mailto:support@drruby.ai"
                  className="sub-row"
                  style={{ cursor: "pointer", color: "inherit" }}
                >
                  <span>Help &amp; support</span>
                  <span className="arr">&rsaquo;</span>
                </a>
                <a
                  href="mailto:feedback@drruby.ai"
                  className="sub-row"
                  style={{ cursor: "pointer", color: "inherit" }}
                >
                  <span>Report a problem</span>
                  <span className="arr">&rsaquo;</span>
                </a>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Legal</div>
              <div className="card">
                <div className="sub-row">
                  <span>Terms of Service</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Privacy Policy</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Consumer Health Data Privacy Policy</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Research Consent Terms</span>
                  <span className="arr">&rsaquo;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      <div className="cm2-toast" style={{ display: toast ? "block" : "none" }}>
        {toast}
      </div>
    </div>
  );
}
