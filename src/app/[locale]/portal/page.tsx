"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import PortalShell from "@/components/layout/PortalShell";
import LogoutButton from "@/components/auth/LogoutButton";
import { ErrorState } from "@/components/api/ErrorState";
import { DeleteAccountDialog } from "@/components/sections/portal/settings/DeleteAccountDialog";
import { ExportDataButton } from "@/components/sections/portal/settings/ExportDataButton";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/lib/api/client";
import { useMutation } from "@/hooks/useMutation";
import {
  getFirstName,
  getGreetingKey,
  getInitials,
  getTierKey,
} from "@/lib/portal/dashboard";
import { ActiveDecisionsSummary } from "@/components/sections/portal/decisions/ActiveDecisionsSummary";
import { DecisionsView } from "@/components/sections/portal/decisions/DecisionsView";
import { HealthView } from "@/components/sections/portal/health/HealthView";
import { PrivacyView } from "@/components/sections/portal/privacy/PrivacyView";
import { ResearchView } from "@/components/sections/portal/research/ResearchView";
import { TodayView } from "@/components/sections/portal/today/TodayView";
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

interface AskResponse {
  choices: { message: { role: string; content: string } }[];
}

type View =
  | "today"
  | "health"
  | "decisions"
  | "library"
  | "research"
  | "privacy";

const NAV: { id: View; titleKey: string; icon: React.ReactNode }[] = [
  {
    id: "today",
    titleKey: "dashboard.tabs.today",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v10h12V10" />
      </svg>
    ),
  },
  {
    id: "health",
    titleKey: "dashboard.tabs.health",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20s-7.5-4.35-9.5-8.5C.8 8 2.3 4.5 6 4.5c2 0 3.6 1.2 6 3.8 2.4-2.6 4-3.8 6-3.8 3.7 0 5.2 3.5 3.5 7C19.5 15.65 12 20 12 20z" />
      </svg>
    ),
  },
  {
    id: "decisions",
    titleKey: "dashboard.tabs.decisions",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
      </svg>
    ),
  },
  {
    id: "library",
    titleKey: "dashboard.tabs.library",
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
    titleKey: "dashboard.tabs.research",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6" />
        <path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
      </svg>
    ),
  },
  {
    id: "privacy",
    titleKey: "dashboard.tabs.privacy",
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

  // Ask DrRuby：受控输入 + useMutation POST /api/ask，结果就地展示
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const askMut = useMutation<string, AskResponse>(
    (q: string) =>
      apiClient.post<AskResponse>("/api/ask", {
        messages: [{ role: "user", content: q }],
      }),
    { onSuccess: (out) => setAnswer(out?.choices?.[0]?.message?.content ?? "") },
  );

  function submitAsk() {
    const q = question.trim();
    if (!q || askMut.loading) return;
    setAnswer(null);
    askMut.mutate(q);
  }

  // Timeline：最近 5 条（按 date 倒序）
  const { data: timeline, error: tlErr, loading: tlLoading } = useApi<TimelineEventDTO[]>(
    "/api/timeline",
  );
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
    <PortalShell pageTitle={t("dashboard.title")} pageSub={t("dashboard.subtitle")}>
      <div id="app-portal">
        <div className="portal-tabs">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`portal-tab${view === item.id ? " active" : ""}`}
              onClick={() => go(item.id)}
            >
              <span className="pt-ic">{item.icon}</span>
              <span className="pt-tx">
                <b>{t(item.titleKey)}</b>
              </span>
            </button>
          ))}
        </div>

        <div className="ufm">
          {/* ===== TODAY / HOME ===== */}
          <div className={on("today")} id="v-today">
            <div className="hello">
              {me && greetingKey ? t(greetingKey, { name: meFirst }) : ""}
            </div>
            <h1>Home</h1>
            <div className="lede">Here&rsquo;s what deserves your attention today.</div>
            <TodayView onSeeAllSignals={() => go("health")} />
            <ActiveDecisionsSummary onClick={() => go("decisions")} />
            <div className="sec">
              <div className="sec-h">Your progress</div>
              <div className="card">
                <div style={{ fontSize: 15, color: "#524d49", lineHeight: 1.65 }}>
                  <b style={{ color: "#8C2635" }}>You&rsquo;re understanding yourself better.</b> You&rsquo;ve
                  reflected on four important decisions this year &mdash; and two of your anonymous
                  journeys are quietly helping other women.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Ask DrRuby</div>
              <div className="ask">
                <div style={{ fontSize: 15, color: "var(--p-ink)" }}>
                  Ask about your results, history or decisions.
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
                    disabled={askMut.loading || !question.trim()}
                  >
                    {askMut.loading ? t("dashboard.ask.loading") : t("dashboard.ask.button")}
                  </button>
                </div>
                {askMut.error && <ErrorState message={t("dashboard.ask.error")} />}
                {answer && <div className="ask-answer">{answer}</div>}
                <div className="ask-ex">
                  {[
                    "Has my sleep changed?",
                    "Is this skin change consistent?",
                    "What should I ask at my next appointment?",
                  ].map((chip) => (
                    <button
                      type="button"
                      key={chip}
                      className="ask-chip"
                      onClick={() => setQuestion(chip)}
                    >
                      &ldquo;{chip}&rdquo;
                    </button>
                  ))}
                </div>
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
                  {tlErr && <ErrorState message={t("dashboard.timeline.error")} />}
                  {!tlLoading && !tlErr && recentTimeline.length === 0 && (
                    <div className="tl-empty">{t("dashboard.timeline.empty")}</div>
                  )}
                  {recentTimeline.map((e) => (
                    <div className="tl-item" key={e.id}>
                      <span className="tl-dot" />
                      <div className="tl-d">{new Date(e.date).toLocaleDateString()}</div>
                      <div className="tl-t">{e.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ===== MY BODY ===== */}
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
              A learning library, not a feed. Real women&rsquo;s decisions &mdash; structured,
              consented, and relevant to you. Not strangers&rsquo; posts.
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
                  Every experience is shared with explicit, revocable consent and anonymized before
                  it appears here. The more rigorous the source, the more clearly it&rsquo;s labeled
                  &mdash; never anonymous strangers&rsquo; posts.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Relevant to your decision</div>
              <div className="card">
                <div className="ask-ex">
                  <span className="coming-soon">{t("dashboard.comingSoon")}</span>
                </div>
                <div className="cm2-note">
                  Matched by your <b>decision, goal, concerns, and timing</b> &mdash; not by age,
                  ethnicity, or location. Similarity does not imply the same outcome.
                </div>
                <div className="cm2-counts">
                  <div className="cm2-stat">
                    <span className="coming-soon">{t("dashboard.comingSoon")}</span>
                    <span>journeys</span>
                  </div>
                  <div className="cm2-stat">
                    <span className="coming-soon">{t("dashboard.comingSoon")}</span>
                    <span>insights</span>
                  </div>
                  <div className="cm2-stat">
                    <span className="coming-soon">{t("dashboard.comingSoon")}</span>
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
                  Many describe results appearing gradually over 2&ndash;3 months; a few noticed
                  little change. Experiences vary widely.
                </p>
                <div style={{ fontSize: 12, color: "#a89a95", marginTop: 8 }}>
                  Summarized from many consented experiences &mdash; what people report, not a
                  statistic and not medical advice.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Photos within a journey &middot; with context</div>
              <div className="cm2-ba">
                <div className="cm2-bacard" onClick={() => cmToast("Opening full Thermage journey")}>
                  <div className="cm2-ph">
                    <div style={{ background: "linear-gradient(140deg,#d9cac4,#b9afa9)" }}>
                      <span>Before</span>
                    </div>
                    <div style={{ background: "linear-gradient(140deg,#d9c7c9,#cda8ad)" }}>
                      <span>Month 6</span>
                    </div>
                  </div>
                  <div className="cm2-bab">
                    <b>Thermage &middot; Age 42</b>
                    <span>Would do again</span>
                    <span className="cm2-src">Verified member &middot; anonymized</span>
                    <div className="cm2-view">View the full journey &rarr;</div>
                  </div>
                </div>
                <div className="cm2-bacard" onClick={() => cmToast("Opening full melasma journey")}>
                  <div className="cm2-ph">
                    <div style={{ background: "linear-gradient(140deg,#d9cac4,#c2b6ae)" }}>
                      <span>Before</span>
                    </div>
                    <div style={{ background: "linear-gradient(140deg,#e0cfcf,#cdb1b3)" }}>
                      <span>Month 12</span>
                    </div>
                  </div>
                  <div className="cm2-bab">
                    <b>Melasma &middot; Age 39</b>
                    <span>Mixed result</span>
                    <span className="cm2-src">Founder interview &middot; consented</span>
                    <div className="cm2-view">View the full journey &rarr;</div>
                  </div>
                </div>
                <div className="cm2-bacard" onClick={() => cmToast("Opening hair-loss journey")}>
                  <div className="cm2-ph">
                    <div style={{ background: "linear-gradient(140deg,#c9c3bb,#a69b92)" }}>
                      <span>Week 1</span>
                    </div>
                    <div style={{ background: "linear-gradient(140deg,#bcb2aa,#94867c)" }}>
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
              <div className="sec-h">Living journeys &middot; still updating</div>
              <div className="card">
                <div className="cm2-q">
                  <div className="cm2-qt">Thermage</div>
                  <div className="cm2-qmeta">Month 9 &middot; last updated yesterday</div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">Started HRT</div>
                  <div className="cm2-qmeta">Week 4</div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">Hair loss</div>
                  <div className="cm2-qmeta">Month 12</div>
                </div>
              </div>
              <div className="cm2-note">
                A journey isn&rsquo;t shared once and forgotten. Journeys keep updating &mdash;
                that&rsquo;s what makes them worth following.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Contribute &amp; ask</div>
              <div className="card">
                <div className="cm2-q">
                  <div className="cm2-qt">Have a decision on your mind?</div>
                  <div className="cm2-qmeta">
                    DrRuby answers with a Decision Brief first &mdash; your history, the evidence, and
                    similar journeys. Browsing others&rsquo; experiences comes after that, not before.
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button
                    className="cm2-ghost"
                    onClick={() => router.push("/portal/moment/feel")}
                  >
                    Contribute a journey anonymously
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "#a89a95", marginTop: 10 }}>
                  Your personal information is never shared. Contributing is optional and can be
                  withdrawn anytime.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Things I wish I knew &middot; regret stories</div>
              <div className="card">
                <div className="cm2-q">
                  <div className="cm2-qt">
                    &ldquo;I regret doing it before asking what happens if it doesn&rsquo;t
                    work.&rdquo;
                  </div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">
                    &ldquo;I regret waiting so long &mdash; not for vanity, I just kept putting it
                    off.&rdquo;
                  </div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">
                    &ldquo;I regret choosing the clinic that pushed a package.&rdquo;
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
                  <div className="cm2-qt">Ask what happens if it doesn&rsquo;t work.</div>
                </div>
              </div>
              <div className="cm2-note">
                Organized by DrRuby from real journeys &mdash; lessons, not advice.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">This week</div>
              <div className="card">
                <div className="found">
                  <div>
                    <div className="n"><span className="coming-soon">{t("dashboard.comingSoon")}</span></div>
                    <div className="l">new journeys</div>
                  </div>
                  <div>
                    <div className="n"><span className="coming-soon">{t("dashboard.comingSoon")}</span></div>
                    <div className="l">long-term updates</div>
                  </div>
                  <div>
                    <div className="n"><span className="coming-soon">{t("dashboard.comingSoon")}</span></div>
                    <div className="l">most followed</div>
                  </div>
                  <div>
                    <div className="n"><span className="coming-soon">{t("dashboard.comingSoon")}</span></div>
                    <div className="l">top lesson</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Following &middot; journeys, not people</div>
              <div className="card">
                <div className="sub-row">
                  <span className="coming-soon">{t("dashboard.comingSoon")}</span>
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
            </div>
          </div>

          {/* ===== RESEARCH ===== */}
          <div className={on("research")} id="v-research">
            <h1>Research</h1>
            <div className="lede">
              Where women&rsquo;s health and healthspan science may be heading &mdash; early signals
              from the research world, explained honestly. For learning, not medical advice.
            </div>
            <div className="sec">
              <div className="priv-note">
                <b>Emerging, not established.</b> These are directions researchers are exploring
                &mdash; often promising, rarely settled. Today&rsquo;s signal isn&rsquo;t
                tomorrow&rsquo;s guideline, and nothing here is a recommendation.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">On the horizon &mdash; from the journals</div>
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
                  unknown: "what, if anything, is safe and effective for people.",
                },
              ].map((c) => (
                <div className="card matter" key={c.h}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "baseline" }}>
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
                    <b>Why it may matter:</b> {c.why} <b>Still unknown:</b> {c.unknown}
                  </p>
                </div>
              ))}
              <div style={{ fontSize: 12, color: "#a89a95", marginTop: 6 }}>
                Curated directions, not a paper feed &mdash; we summarize where the field is looking,
                and what it still doesn&rsquo;t know.
              </div>
            </div>
            <ResearchView />
            <div className="sec">
              <div className="sec-h">What are we learning?</div>
              <div className="card matter">
                <h3>Does a sleep headband help &mdash; or just add anxiety?</h3>
                <p>
                  An early question we&rsquo;re exploring with members who track sleep. Nothing
                  concluded yet.
                </p>
              </div>
              <div className="card matter">
                <h3>How skin actually changes across a year</h3>
                <p>Built from many individual timelines kept intact &mdash; not averages.</p>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">New products, independently evaluated</div>
              <div className="card">
                <div className="sub-row">
                  <span>Devices &amp; products we&rsquo;re independently evaluating</span>
                  <span className="arr">2 active</span>
                </div>
                <div style={{ fontSize: 13, color: "#7c746f", marginTop: 8, lineHeight: 1.5 }}>
                  Independent, real-world evaluation &mdash; never an endorsement, never influenced by
                  sponsorship.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="card">
                <div className="sub-row" onClick={() => go("privacy")} style={{ cursor: "pointer" }}>
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
                <ErrorState message={t("dashboard.profile.error")} onRetry={refetchMe} />
              ) : (
                <>
                  <div className="pf-av">{me ? (getInitials(meName) || "—") : "—"}</div>
                  <div>
                    <div className="pf-name">{me ? (meName || "—") : "—"}</div>
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
              <span className="pf-pill"><span className="coming-soon">{t("dashboard.comingSoon")}</span></span>
            </div>
            <div className="lede">
              <b>Your data. Your choice.</b> You control what DrRuby can access, where it&rsquo;s
              processed, and what &mdash; if anything &mdash; is shared.
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
                <Link href="/pricing" className="sub-row" style={{ cursor: "pointer", color: "inherit" }}>
                  <span>View plans</span>
                  <span className="arr">&rsaquo;</span>
                </Link>
                {/* TODO: 付费计划上线后接 /portal/billing */}
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Account</div>
              <div className="card">
                <Link href="/portal/profile" className="sub-row" style={{ cursor: "pointer", color: "inherit" }}>
                  <span>Your profile</span>
                  <span className="arr">&rsaquo;</span>
                </Link>
                <Link href="/portal/settings" className="sub-row" style={{ cursor: "pointer", color: "inherit" }}>
                  <span>Account security</span>
                  <span className="arr">&rsaquo;</span>
                </Link>
                <LogoutButton className="w-full text-left text-[14.5px] text-dr-red py-3.5 border-t border-dr-border hover:opacity-70 transition-opacity disabled:opacity-60" />
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Your data</div>
              <div className="card">
                {/* TODO: /portal/settings#activity 锚点 */}
                <ExportDataButton />
                <DeleteAccountDialog />
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Devices &amp; Permissions</div>
              <div className="card">
                <div className="sub-row">
                  <span>Connected data sources</span>
                  <span className="arr"><span className="coming-soon">{t("dashboard.comingSoon")}</span></span>
                </div>
                <div className="sub-row">
                  <span>Permissions</span>
                  <span className="arr"><span className="coming-soon">{t("dashboard.comingSoon")}</span></span>
                </div>
                <div className="sub-row">
                  <span>Where data is processed</span>
                  <span className="arr"><span className="coming-soon">{t("dashboard.comingSoon")}</span></span>
                </div>
              </div>
            </div>
            {/* TODO: /portal/settings 通知与外观偏好 */}
            <div className="sec">
              <div className="sec-h">Help</div>
              <div className="card">
                <a href="mailto:support@drruby.ai" className="sub-row" style={{ cursor: "pointer", color: "inherit" }}>
                  <span>Help &amp; support</span>
                  <span className="arr">&rsaquo;</span>
                </a>
                <a href="mailto:feedback@drruby.ai" className="sub-row" style={{ cursor: "pointer", color: "inherit" }}>
                  <span>Report a problem</span>
                  <span className="arr">&rsaquo;</span>
                </a>
              </div>
            </div>
            {/* TODO: 静态页 /legal/tos 等 */}
          </div>
        </div>

      {/* ── Toast ── */}
      <div className="cm2-toast" style={{ display: toast ? "block" : "none" }}>
        {toast}
      </div>
      </div>
    </PortalShell>
  );
}
