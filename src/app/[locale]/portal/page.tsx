"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import PortalShell from "@/components/layout/PortalShell";
import { ActiveDecisionsSummary } from "@/components/sections/portal/decisions/ActiveDecisionsSummary";
import { DecisionsView } from "@/components/sections/portal/decisions/DecisionsView";
import { HealthView } from "@/components/sections/portal/health/HealthView";
import { PrivacyView } from "@/components/sections/portal/privacy/PrivacyView";
import { ResearchView } from "@/components/sections/portal/research/ResearchView";
import { TodayView } from "@/components/sections/portal/today/TodayView";
import "./portal.css";

type View =
  | "today"
  | "health"
  | "decisions"
  | "community"
  | "research"
  | "privacy";

const NAV: { id: View; title: string; sub: string; icon: React.ReactNode }[] = [
  {
    id: "today",
    title: "Home",
    sub: "Today’s feed",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v10h12V10" />
      </svg>
    ),
  },
  {
    id: "health",
    title: "My Body",
    sub: "Your data & changes",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20s-7.5-4.35-9.5-8.5C.8 8 2.3 4.5 6 4.5c2 0 3.6 1.2 6 3.8 2.4-2.6 4-3.8 6-3.8 3.7 0 5.2 3.5 3.5 7C19.5 15.65 12 20 12 20z" />
      </svg>
    ),
  },
  {
    id: "decisions",
    title: "My Decisions",
    sub: "What you’re weighing",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
      </svg>
    ),
  },
  {
    id: "community",
    title: "Library",
    sub: "Learn from real journeys",
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
    title: "Research",
    sub: "Studies you can join · opt-in",
    icon: (
      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6" />
        <path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
      </svg>
    ),
  },
  {
    id: "privacy",
    title: "Profile",
    sub: "Account & privacy",
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
  const [view, setView] = useState<View>("today");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const go = (v: View) => {
    setView(v);
    const m = document.querySelector<HTMLElement>("#app-portal .ufm");
    if (m) m.scrollTop = 0;
  };

  const cmToast = (msg: string) => {
    setModalOpen(false);
    setToast(`${msg} selected`);
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
                <b>{item.title}</b>
              </span>
            </button>
          ))}
        </div>

        <div className="ufm">
          {/* ===== TODAY / HOME ===== */}
          <div className={on("today")} id="v-today">
            <div className="hello">Good morning, Ruby &#9728;&#65039;</div>
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
                  <input type="text" placeholder="What does my blood test mean for me?" />
                  <button className="ask-btn">Ask</button>
                </div>
                <div className="ask-ex">
                  <span className="ask-chip">&ldquo;Has my sleep changed?&rdquo;</span>
                  <span className="ask-chip">&ldquo;Is this skin change consistent?&rdquo;</span>
                  <span className="ask-chip">
                    &ldquo;What should I ask at my next appointment?&rdquo;
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#a89a95", marginTop: 12 }}>
                  DrRuby explains results, shows what changed, and helps you form questions &mdash;
                  it does not give medical advice or tell you what to do.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Your timeline</div>
              <div className="card">
                <div className="tl">
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">June 18</div>
                    <div className="tl-t">Lab result uploaded</div>
                  </div>
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">June 12</div>
                    <div className="tl-t">Sleep trend changed</div>
                  </div>
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">May 25</div>
                    <div className="tl-t">Baseline photo</div>
                  </div>
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

          {/* ===== LIBRARY (community) ===== */}
          <div className={on("community")} id="v-community">
            <h1>Library</h1>
            <div className="lede">
              A learning library, not a feed. Real women&rsquo;s decisions &mdash; structured,
              consented, and relevant to you. Not strangers&rsquo; posts.
            </div>
            <div className="uf-gate">
              <b>Experience Library, not a forum.</b> Every experience here is a real decision
              &mdash; shared with explicit, revocable consent and anonymized, then structured (goal
              &rarr; decision &rarr; outcome &rarr; reflection). It&rsquo;s{" "}
              <b>experience, not advice or evidence</b>. Using DrRuby is not the same as
              contributing. A public discussion module stays gated before launch (Non-goals, legal +
              ToS, Research Governance).
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
                  {["Considering Thermage", "Firmness & laxity", "Dry skin", "First treatment", "Deciding now"].map(
                    (c) => (
                      <span className="ask-chip" key={c}>
                        {c}
                      </span>
                    ),
                  )}
                </div>
                <div className="cm2-note">
                  Matched by your <b>decision, goal, concerns, and timing</b> &mdash; not by age,
                  ethnicity, or location. Similarity does not imply the same outcome.
                </div>
                <div className="cm2-counts">
                  <div className="cm2-stat">
                    <b>248</b>
                    <span>journeys</span>
                  </div>
                  <div className="cm2-stat">
                    <b>63</b>
                    <span>discussions</span>
                  </div>
                  <div className="cm2-stat">
                    <b>42</b>
                    <span>with photos</span>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: "#b3a9a4", marginTop: 12, fontStyle: "italic" }}>
                  Illustrative numbers (pre-launch). DrRuby distinguishes illustrative examples from
                  early and mature collections &mdash; it never implies evidence it hasn&rsquo;t
                  earned.
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
                Others don&rsquo;t post once and disappear. Journeys keep updating &mdash; that&rsquo;s
                what makes them worth following.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Contribute &amp; ask</div>
              <div className="card">
                <div className="cm2-q">
                  <div className="cm2-qt">Have a decision on your mind?</div>
                  <div className="cm2-qmeta">
                    DrRuby answers with a Decision Brief first &mdash; your history, the evidence, and
                    similar journeys. Asking the community is the last step, not the first.
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button
                    className="cm2-ghost"
                    onClick={() => cmToast("Contribute anonymously — your info is never shared")}
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
              <div className="sec-h">Ask others &middot; optional forum module (gated)</div>
              <div className="card">
                <div className="cm2-q" onClick={() => setModalOpen(true)}>
                  <div className="cm2-qt">Should I start HRT?</div>
                  <div className="cm2-qmeta">48 replies &middot; 12 similar journeys &middot; 2 expert comments</div>
                </div>
                <div className="cm2-q" onClick={() => setModalOpen(true)}>
                  <div className="cm2-qt">Anyone regret Thermage?</div>
                  <div className="cm2-qmeta">61 replies &middot; 18 similar journeys</div>
                </div>
                <div className="cm2-q" onClick={() => setModalOpen(true)}>
                  <div className="cm2-qt">How did you choose your clinic?</div>
                  <div className="cm2-qmeta">33 replies &middot; 9 similar journeys</div>
                </div>
                <div className="cm2-q" onClick={() => setModalOpen(true)}>
                  <div className="cm2-qt">How long until you saw results?</div>
                  <div className="cm2-qmeta">54 replies &middot; 21 similar journeys</div>
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
                    <div className="n">42</div>
                    <div className="l">new journeys</div>
                  </div>
                  <div>
                    <div className="n">18</div>
                    <div className="l">long-term updates</div>
                  </div>
                  <div>
                    <div className="n" style={{ fontSize: 18, paddingTop: 6 }}>
                      Thermage
                    </div>
                    <div className="l">most discussed</div>
                  </div>
                  <div>
                    <div className="n" style={{ fontSize: 18, paddingTop: 6 }}>
                      Wait 3 months
                    </div>
                    <div className="l">top lesson</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Following &middot; journeys, not people</div>
              <div className="card">
                <div className="sub-row">
                  <span>Amy&rsquo;s HRT journey &middot; Month 8</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Thermage collection</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Melasma group</span>
                  <span className="arr">&rsaquo;</span>
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
                Batch 1: users don&rsquo;t come to browse a forum &mdash; they come to decide
                &ldquo;should I do this?&rdquo;. So the community is organized by decision, not by
                feed.
              </div>
            </div>
            <div className="sec">
              <div className="cm2-pos">
                Reddit helps you chat. RealSelf helps you see photos.{" "}
                <b>DrRuby helps you learn how real decisions actually happen.</b> Every reply here is
                a journey, not a comment: &ldquo;I had a similar experience&rdquo; &middot; &ldquo;a
                different experience&rdquo; &middot; &ldquo;I changed my mind later&rdquo; &middot;
                &ldquo;here&rsquo;s my outcome&rdquo;.
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
              <div className="pf-av">RJ</div>
              <div>
                <div className="pf-name">Ruby Johnson</div>
                <div className="pf-meta">rubysun@gmail.com &middot; Member since 2026</div>
              </div>
            </div>
            <div className="pf-status">
              <span className="pf-pill on">Private by default</span>
              <span className="pf-pill">No community sharing</span>
              <span className="pf-pill">No active studies</span>
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
                    <span>Free &mdash; Remember yourself.</span>
                  </div>
                  <span className="arr">Free</span>
                </div>
                <Link href="/pricing" className="sub-row" style={{ cursor: "pointer", color: "inherit" }}>
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
                <Link href="/" className="sub-row" style={{ color: "#8C2635" }}>
                  <span>Log out</span>
                  <span className="arr">&rsaquo;</span>
                </Link>
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
                <div className="sub-row">
                  <div className="sr2">
                    <b>Download my data</b>
                    <span>A copy of your full history.</span>
                  </div>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <div className="sr2">
                    <b>Delete my history or account</b>
                    <span>Remove your data, any time.</span>
                  </div>
                  <span className="arr">&rsaquo;</span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Devices &amp; Permissions</div>
              <div className="card">
                <div className="sub-row">
                  <span>Connected data sources</span>
                  <span className="arr">Apple Health, 1 lab</span>
                </div>
                <div className="sub-row">
                  <span>Permissions</span>
                  <span className="arr">Camera, Photos, Health, Location</span>
                </div>
                <div className="sub-row">
                  <span>Where data is processed</span>
                  <span className="arr">On-device preferred</span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Notifications &amp; Appearance</div>
              <div className="card">
                <div className="sub-row">
                  <span>Notification preferences</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Appearance &amp; language</span>
                  <span className="arr">&rsaquo;</span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Help</div>
              <div className="card">
                <div className="sub-row">
                  <span>Help &amp; support</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Report a problem</span>
                  <span className="arr">&rsaquo;</span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Legal</div>
              <div className="card">
                {[
                  "Terms of Service",
                  "Privacy Policy",
                  "Consumer Health Data Privacy Policy",
                  "Research Consent Terms",
                ].map((r) => (
                  <div className="sub-row" key={r}>
                    <span>{r}</span>
                    <span className="arr">&rsaquo;</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* ── Ask modal ── */}
      <div
        className={`cm2-modal${modalOpen ? " open" : ""}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains("cm2-modal")) setModalOpen(false);
        }}
      >
        <div className="cm2-mbox">
          <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--p-red)", fontWeight: 700 }}>
            Ask a question
          </div>
          <div style={{ fontFamily: "var(--p-serif)", fontSize: 22, margin: "4px 0 4px" }}>
            What are you trying to do?
          </div>
          <div style={{ fontSize: 13, color: "#999", marginBottom: 14 }}>
            Choosing a starting point makes your question &mdash; and the answers &mdash; more useful.
          </div>
          <div className="cm2-choices">
            <button className="cm2-choice" onClick={() => cmToast("Make a decision")}>
              <b>Make a decision</b>
              <span>Should I do this?</span>
            </button>
            <button className="cm2-choice" onClick={() => cmToast("Understand something")}>
              <b>Understand something</b>
              <span>What does this mean?</span>
            </button>
            <button className="cm2-choice" onClick={() => cmToast("Ask for others' experience")}>
              <b>Ask for others&rsquo; experience</b>
              <span>Has anyone been through this?</span>
            </button>
            <button className="cm2-choice" onClick={() => cmToast("Share my experience")}>
              <b>Share my experience</b>
              <span>What happened to me</span>
            </button>
            <button className="cm2-choice" onClick={() => cmToast("Show my results")}>
              <b>Show my results</b>
              <span>With interval &amp; context</span>
            </button>
          </div>
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
