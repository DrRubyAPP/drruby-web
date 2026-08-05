"use client";

import Link from "next/link";
import { useState } from "react";
import { HealthView } from "@/components/sections/portal/health/HealthView";
import "./portal.css";

type View =
  | "today"
  | "health"
  | "decisions"
  | "community"
  | "history"
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
    <div id="app-portal">
      <div className="uf-top">
        <Link className="uf-back" href="/">
          <span
            style={{ fontSize: 19, fontWeight: 800, color: "#8C2635", marginRight: 2 }}
          >
            &larr;
          </span>
          <span
            style={{ fontSize: 20, fontWeight: 850, letterSpacing: "-1px", color: "#171717" }}
          >
            Dr<span style={{ color: "#cf1736" }}>Ruby</span>.ai
          </span>
        </Link>
        <div className="uf-note">
          Concept &middot; understand-first redesign (n=8-driven) &middot; prototype
        </div>
      </div>

      <div className="ufw">
        {/* ── Sidebar ── */}
        <aside className="side">
          <div className="logo">
            Dr<span>Ruby</span>
          </div>
          <div className="logo-sub">Know your body</div>
          <div className="nav">
            {NAV.map((item) => (
              <div
                key={item.id}
                className={`nav-item${view === item.id ? " active" : ""}`}
                onClick={() => go(item.id)}
              >
                <span className="ni-ic">{item.icon}</span>
                <span className="ni-tx">
                  <b>{item.title}</b>
                  <small>{item.sub}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="side-foot">
            <div className="profile">
              <div className="avatar">RJ</div>
              <div>
                <div className="pname">Ruby Johnson</div>
                <div className="pmail">rubysun@gmail.com</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="ufm">
          {/* ===== TODAY / HOME ===== */}
          <div className={on("today")} id="v-today">
            <div className="hello">Good morning, Ruby &#9728;&#65039;</div>
            <h1>Home</h1>
            <div className="lede">Here&rsquo;s what deserves your attention today.</div>
            <div className="sec">
              <div className="sec-h">What deserves your attention today?</div>
              <div className="card matter mn-primary">
                <div className="mn-tag">&#9733; Continue your decision</div>
                <h3>Keep the retinol, or pause it?</h3>
                <p>
                  You noted dryness 12 days ago. See your own history and similar journeys before
                  you decide.
                </p>
                <div className="matter-next">Continue this decision &rarr;</div>
                <div className="why">
                  <span className="why-src">
                    Why you&rsquo;re seeing this &middot; you paused this decision 12 days ago
                  </span>
                  <span className="conf obs">In progress</span>
                </div>
              </div>
              <div className="card matter">
                <h3>A pattern worth noticing</h3>
                <p>
                  Your sleep has slipped the week before your period in each of the last three
                  cycles.
                </p>
                <div style={{ fontSize: 12, color: "#a89a95", marginTop: 8 }}>
                  Observed across your own history &mdash; a pattern, not a diagnosis.
                </div>
              </div>
              <div className="card matter">
                <h3>Learn from your past self</h3>
                <p>
                  &ldquo;I almost stopped retinol in week 2 &mdash; glad I didn&rsquo;t.&rdquo;
                  &mdash; you, 3 months ago. You&rsquo;re weighing a similar call now.
                </p>
                <div className="matter-next">Revisit that decision &rarr;</div>
              </div>
              <div className="mn-see" onClick={() => go("health")}>
                See all your body signals &rarr;
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Your active decisions</div>
              <div className="card">
                <div className="dec">
                  <div>
                    <h4>Should I start HRT?</h4>
                    <div className="st">Last updated 8 days ago &middot; 2 new relevant journeys</div>
                  </div>
                  <span className="dec-badge">Researching</span>
                </div>
                <div className="dec">
                  <div>
                    <h4>Is Thermage worth it for me?</h4>
                    <div className="st">Waiting for second consultation</div>
                  </div>
                  <span className="dec-badge">Considering</span>
                </div>
                <div className="dec">
                  <div>
                    <h4>Which strength-training plan should I follow?</h4>
                    <div className="st">Week 3</div>
                  </div>
                  <span className="dec-badge">Trying</span>
                </div>
              </div>
            </div>
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
            <h1>My Decisions</h1>
            <div className="lede">
              Treatments, products and clinics live inside a decision &mdash; not as separate
              folders to maintain.
            </div>
            <div className="sec">
              <div className="sec-h">Start a new decision</div>
              <div className="card">
                <div style={{ fontSize: 14, color: "var(--p-ink)", marginBottom: 10 }}>
                  What are you considering?
                </div>
                <div className="ask-ex">
                  {[
                    "Thermage",
                    "Ultherapy",
                    "Botox",
                    "Laser",
                    "Filler",
                    "HRT",
                    "A skincare product",
                    "A doctor or clinic",
                    "Not sure yet",
                  ].map((c) => (
                    <span className="ask-chip" key={c}>
                      {c}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#a89a95", marginTop: 12 }}>
                  DrRuby helps you understand the decision before you make it &mdash; it doesn&rsquo;t
                  ask you to start a diary.
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Active decisions</div>
              <div
                className="dcard"
                onClick={() => cmToast("Opening decision · Should I start HRT?")}
              >
                <div className="dcard-ic">
                  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z" />
                  </svg>
                </div>
                <div className="dcard-main">
                  <div className="dcard-top">
                    <h4>Should I start HRT?</h4>
                    <span className="dec-badge">Researching</span>
                  </div>
                  <div className="st">Updated 8 days ago</div>
                  <div className="dcard-src">
                    <span className="ds you">
                      <i />You
                    </span>
                    <span className="ds sim">
                      <i />Similar journeys
                    </span>
                    <span className="ds ev">
                      <i />Evidence
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="dcard"
                onClick={() => cmToast("Opening decision · Is Thermage worth it?")}
              >
                <div className="dcard-ic">
                  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z" />
                  </svg>
                </div>
                <div className="dcard-main">
                  <div className="dcard-top">
                    <h4>Is Thermage worth it for me?</h4>
                    <span className="dec-badge">Considering</span>
                  </div>
                  <div className="st">Waiting for second consultation</div>
                  <div className="dcard-src">
                    <span className="ds you">
                      <i />You
                    </span>
                    <span className="ds sim">
                      <i />Similar journeys
                    </span>
                    <span className="ds ev">
                      <i />Evidence
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Inside a decision</div>
              <div className="card">
                <div style={{ fontFamily: "var(--p-serif)", fontSize: 20, marginBottom: 10 }}>
                  Should I do Thermage?
                </div>
                <div className="sub-row">
                  <span>Clinic consultations</span>
                  <span className="arr">2</span>
                </div>
                <div className="sub-row">
                  <span>Products considered</span>
                  <span className="arr">3</span>
                </div>
                <div className="sub-row">
                  <span>Cost &amp; what&rsquo;s included</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Concerns</span>
                  <span className="arr">pain, cost, volume</span>
                </div>
                <div className="sub-row">
                  <span>Related real journeys</span>
                  <span className="arr">5</span>
                </div>
                <div className="sub-row">
                  <span>Final decision &amp; follow-up</span>
                  <span className="arr">&mdash;</span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Saved &amp; completed</div>
              <div className="card">
                <div className="sub-row">
                  <span>Considering Retinol &middot; faded</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Botox &middot; did not proceed</span>
                  <span className="arr">&rsaquo;</span>
                </div>
              </div>
            </div>
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

          {/* ===== MY HISTORY (no nav entry, matches design) ===== */}
          <div className={on("history")} id="v-history">
            <h1>My History</h1>
            <div className="lede">
              Your history isn&rsquo;t a record of your past &mdash; it&rsquo;s evidence of how
              you&rsquo;ve learned. Your past becomes easier to understand over time.
            </div>
            <div className="cm2-pos" style={{ marginTop: 16 }}>
              Everything remembers something. <b>Only DrRuby remembers how you learned.</b>
            </div>
            <div className="sec">
              <div className="sec-h">Your history so far</div>
              <div className="card">
                <div className="found">
                  <div>
                    <div className="n">12</div>
                    <div className="l">decisions</div>
                  </div>
                  <div>
                    <div className="n">7</div>
                    <div className="l">treatments</div>
                  </div>
                  <div>
                    <div className="n">86</div>
                    <div className="l">photos</div>
                  </div>
                  <div>
                    <div className="n">14</div>
                    <div className="l">follow-ups</div>
                  </div>
                  <div>
                    <div className="n">9</div>
                    <div className="l">reflections</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Your story over time</div>
              <div className="card">
                <div className="tl">
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">
                      May 2026 &middot; <span className="hist-tag">Decision</span>
                    </div>
                    <div className="tl-t">Started tretinoin</div>
                  </div>
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">June 2026</div>
                    <div className="tl-t">Dryness increased</div>
                  </div>
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">
                      July 2026 &middot; <span className="hist-tag">Consultation</span>
                    </div>
                    <div className="tl-t">Stopped twice &middot; saw a dermatologist</div>
                  </div>
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">August 2026</div>
                    <div className="tl-t">Skin adapted</div>
                  </div>
                </div>
                <div className="hist-hind">
                  <div className="hist-hind-k">Looking back</div>
                  If you had known dryness usually peaks early, you probably wouldn&rsquo;t have
                  stopped twice.{" "}
                  <span style={{ color: "#a89a95" }}>
                    Time creates hindsight &mdash; that&rsquo;s what history is for.
                  </span>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Things becoming clearer &middot; what DrRuby understands now</div>
              <div className="card matter">
                <h3>You usually stop new products around Week 2</h3>
                <p>Discontinued in the second week across several product periods.</p>
                <div className="why">
                  <span className="why-src">from 4 product periods</span>
                  <span className="conf obs">Observed</span>
                </div>
              </div>
              <div className="card matter">
                <h3>Strength training may improve your sleep consistency</h3>
                <p>On weeks with 3+ sessions, sleep looked steadier.</p>
                <div className="why">
                  <span className="why-src">wearable + activity</span>
                  <span className="conf pos">Possible</span>
                </div>
              </div>
              <div className="card matter">
                <h3>We still don&rsquo;t know whether your skin tracks your cycle</h3>
                <p>Not enough comparable data to say either way.</p>
                <div className="why">
                  <span className="why-src">insufficient comparable data</span>
                  <span className="conf no">Unknown</span>
                </div>
              </div>
              <div className="cm2-note">
                Unknown is also value. Saying &ldquo;we can&rsquo;t assess this yet&rdquo; is part of
                what makes the rest trustworthy.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Letters from your past self</div>
              <div className="card matter">
                <h3>A year ago, you were unsure about Thermage</h3>
                <p style={{ fontStyle: "italic", color: "var(--p-ink)" }}>
                  &ldquo;I really don&rsquo;t know what to do.&rdquo;
                </p>
                <p>
                  You decided not to proceed. Three months later you wrote:{" "}
                  <span style={{ fontStyle: "italic" }}>
                    &ldquo;I&rsquo;m actually glad I waited.&rdquo;
                  </span>
                </p>
                <div className="matter-next">Read what your past self wrote &rarr;</div>
              </div>
              <div className="cm2-note">
                Learning isn&rsquo;t just remembering &mdash; it&rsquo;s seeing how your own thinking
                changed over time. This is why nothing you wrote is ever overwritten.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">What I decided</div>
              <div className="card">
                <div className="dec">
                  <div>
                    <h4>Thermage</h4>
                    <div className="st">Did not proceed &middot; cost + uncertain outcome</div>
                  </div>
                  <span className="dec-badge">Did not proceed</span>
                </div>
                <div className="dec">
                  <div>
                    <h4>Retinol</h4>
                    <div className="st">Worked after 3 months</div>
                  </div>
                  <span className="dec-badge">Completed</span>
                </div>
              </div>
              <div className="card" style={{ marginTop: 10 }}>
                <div style={{ fontFamily: "var(--p-serif)", fontSize: 18, marginBottom: 3 }}>
                  Inside a decision &middot; kept in full
                </div>
                <div className="cm2-note" style={{ margin: "0 0 12px" }}>
                  Every entry preserved in order &mdash; never overwritten. This is Decision Linking.
                </div>
                <div className="tl">
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">May</div>
                    <div className="tl-t">&ldquo;I think I&rsquo;ll do Thermage.&rdquo;</div>
                  </div>
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">June</div>
                    <div className="tl-t">&ldquo;I&rsquo;m worried about recovery.&rdquo;</div>
                  </div>
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">July</div>
                    <div className="tl-t">Decided not to proceed.</div>
                  </div>
                  <div className="tl-item">
                    <span className="tl-dot" />
                    <div className="tl-d">October</div>
                    <div className="tl-t">
                      &ldquo;Looking back, I still think that was the right decision.&rdquo;
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">What I learned &middot; in your own words</div>
              <div className="card">
                <div className="cm2-q">
                  <div className="cm2-qt">&ldquo;I react slowly to new skincare.&rdquo;</div>
                  <div className="cm2-qmeta">Supported by 3 skincare journeys</div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">
                    &ldquo;Stress affects my sleep more than caffeine.&rdquo;
                  </div>
                  <div className="cm2-qmeta">Observed across 4 months</div>
                </div>
                <div className="cm2-q">
                  <div className="cm2-qt">&ldquo;I wait too long before seeing a doctor.&rdquo;</div>
                  <div className="cm2-qmeta">First written May 2026 &middot; updated October 2026</div>
                </div>
              </div>
              <div className="cm2-note">
                Kept in your own words &mdash; DrRuby organizes and connects them to evidence, never
                rewrites them.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Journeys</div>
              <div className="card">
                <div style={{ fontFamily: "var(--p-serif)", fontSize: 16, marginBottom: 8 }}>Skin</div>
                <div className="hist-ph">
                  <div className="hist-tile" style={{ background: "linear-gradient(140deg,#d9cac4,#b9afa9)" }}>
                    <span>Baseline</span>
                  </div>
                  <div className="hist-tile" style={{ background: "linear-gradient(140deg,#dcccc6,#c0b3ab)" }}>
                    <span>Week 4</span>
                  </div>
                  <div className="hist-tile" style={{ background: "linear-gradient(140deg,#dfcdcd,#c9b1b3)" }}>
                    <span>Week 12</span>
                  </div>
                  <div className="hist-tile" style={{ background: "linear-gradient(140deg,#e2cfcf,#cdb1b5)" }}>
                    <span>Month 6</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="sub-row">
                  <span>Sleep</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>Strength</span>
                  <span className="arr">&rsaquo;</span>
                </div>
                <div className="sub-row">
                  <span>HRT</span>
                  <span className="arr">&rsaquo;</span>
                </div>
              </div>
              <div className="cm2-note">
                Skin isn&rsquo;t a special case &mdash; it&rsquo;s one journey among several. Photos
                are bound to the products, treatments and symptoms from the same period.
              </div>
            </div>
            <div className="sec">
              <div className="sec-h">Life context</div>
              <div className="card">
                <div className="ask-ex">
                  {[
                    "Started HRT",
                    "Stopped birth control",
                    "Gallbladder surgery",
                    "COVID",
                    "Started strength training",
                    "Started a new job",
                    "Moved",
                  ].map((c) => (
                    <span className="ask-chip" key={c}>
                      {c}
                    </span>
                  ))}
                </div>
                <div className="cm2-note">
                  Some of these aren&rsquo;t events &mdash; they&rsquo;re context that shapes
                  everything after. So they live in your history, not a medical folder.
                </div>
              </div>
            </div>
            <div className="sec">
              <details className="uf-browse">
                <summary>View everything &rarr;</summary>
                <div className="card" style={{ marginTop: 10 }}>
                  {["Photos", "Notes", "Treatments", "Products", "Labs & reports", "Appointments"].map(
                    (r) => (
                      <div className="sub-row" key={r}>
                        <span>{r}</span>
                        <span className="arr">&rsaquo;</span>
                      </div>
                    ),
                  )}
                </div>
              </details>
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
            <div className="sec">
              <div className="sec-h">Studies you can join</div>
              <div className="card">
                <div className="dec">
                  <div>
                    <h4>Perimenopause Sleep Study</h4>
                    <div className="st">Recruiting &middot; ~5 min/week &middot; IRB-approved</div>
                  </div>
                  <button className="dec-badge" onClick={() => go("privacy")}>
                    Review &amp; join
                  </button>
                </div>
                <div className="dec">
                  <div>
                    <h4>Skin Aging Observation</h4>
                    <div className="st">Recruiting &middot; monthly photo &middot; IRB-approved</div>
                  </div>
                  <button className="dec-badge" onClick={() => go("privacy")}>
                    Review &amp; join
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#a89a95", marginTop: 10 }}>
                Joining a study opens a separate, specific consent &mdash; reviewed in your Consent
                Center.
              </div>
            </div>
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
            <div className="sec">
              <div className="sec-h">Privacy &amp; Consent</div>
              <div className="card">
                <div className="pf-state">
                  <span className="pf-dot" />
                  By default, your data stays private. Nothing is shared unless you explicitly choose
                  to.
                </div>
                <div className="consent-row">
                  <div>
                    <b>Use DrRuby for yourself</b>
                    <span>
                      Your history remains private. Simply using DrRuby never enrolls you in
                      community sharing or research.
                    </span>
                  </div>
                  <span className="consent-state">Always on</span>
                </div>
                <div className="consent-row">
                  <div>
                    <b>Contribute de-identified, aggregated insights</b>
                    <span>
                      Helps improve DrRuby for everyone. Identifying information is removed before
                      contribution.
                    </span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider" />
                  </label>
                </div>
                <div className="consent-row">
                  <div>
                    <b>Take part in identified research studies</b>
                    <span>Opt in per study, each with its own specific consent. Withdraw any time.</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider" />
                  </label>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#a89a95", marginTop: 10 }}>
                Three independent choices. Using DrRuby never implies community contribution or
                research participation.
              </div>
            </div>
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
        </main>
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
  );
}
