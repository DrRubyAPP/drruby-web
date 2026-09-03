import FooterSubscribe from "@/components/FooterSubscribe";
import "./home-v5.css";
import {
  DownloadCTA,
  DownloadModal,
  StoreRow,
} from "@/components/DownloadWaitlist";
import HomeNav from "@/components/layout/HomeNav";

export default function Home() {
  return (
    <div className="dr-v5">
      <HomeNav authAware />

      <main>
        {/* HERO */}
        <section className="wrap hero">
          <div className="hero-copy">
            <div className="eyebrow">Women&rsquo;s Healthspan Intelligence</div>
            <h1>
              Understand your health before a decision.{" "}
              <em>Learn from what happens after.</em>
            </h1>
            <div className="lede">
              Bring your history, other women&rsquo;s experience, and the
              science together.
              <br />
              So every decision starts with the full picture.
            </div>
            <div className="hero-formula">
              Yourself + Others + Science <b>&rarr;</b> Better Health Decisions
            </div>
            <div>
              <StoreRow />
              <span className="note">Launching soon. Free to start.</span>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src="/hero-woman.webp"
              alt="Woman reflecting on her skin journey"
            />
          </div>
        </section>

        {/* ONE PLACE — bento */}
        <section id="oneplace" className="section">
          <div className="wrap" style={{ textAlign: "center" }}>
            <div className="kicker">All in one place</div>
            <h2>Everything about your health, together.</h2>
            <p
              className="sub"
              style={{
                fontFamily: "Georgia, serif",
                color: "#8C2635",
                maxWidth: 600,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Your notes, photos, cycle, labs, and decisions &mdash; in one
              place, so every decision starts with the full picture.
            </p>
            <div className="op-bento">
              <div className="opw span2">
                <div className="opk">Sleep</div>
                <div className="opv">7h 54m &middot; Good</div>
                <svg
                  viewBox="0 0 320 60"
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: 50, marginTop: 6 }}
                >
                  <polyline
                    points="4,42 56,32 108,36 160,22 212,33 264,18 312,26"
                    fill="none"
                    stroke="#dc99a4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="312" cy="26" r="4.5" fill="#cf1736" />
                </svg>
                <div className="ops">
                  Last 7 nights &middot; from your wearable
                </div>
              </div>
              <div className="opw">
                <div className="opk">Cycle</div>
                <div className="opv">Day 4</div>
                <div className="op-dots">
                  <i className="on" />
                  <i className="on" />
                  <i className="on" />
                  <i className="on today" />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="ops">period &middot; tracked monthly</div>
              </div>
              <div className="opw">
                <div className="opk">Skin &amp; photos</div>
                <div className="op-thumbs">
                  <span
                    style={{
                      background: "linear-gradient(135deg,#ecd8d2,#d6b4ac)",
                    }}
                  />
                  <span
                    style={{
                      background: "linear-gradient(135deg,#f0dcd8,#e0b9c0)",
                    }}
                  />
                </div>
                <div className="ops">Retinol &middot; week 6</div>
              </div>
              <div className="opw">
                <div className="opk">Labs &amp; records</div>
                <div className="opv" style={{ fontSize: 32 }}>
                  128
                </div>
                <div className="ops">
                  LDL &middot; Jun 12 &middot; from your doctor
                </div>
              </div>
              <div className="opw">
                <div className="opk">Decision</div>
                <div className="opv" style={{ fontSize: 17 }}>
                  Retinol &mdash; in progress
                </div>
                <span className="op-pill">Paused 12 days ago</span>
              </div>
              <div className="opw span2">
                <div className="opk">What you noticed</div>
                <div className="opv">
                  &ldquo;My skin&rsquo;s been drier this month.&rdquo;
                </div>
                <div className="ops">in your own words &middot; Jun 18</div>
              </div>
              <div className="opw">
                <div className="opk">Resting heart</div>
                <div className="opv" style={{ fontSize: 32 }}>
                  62{" "}
                  <span
                    style={{
                      fontSize: 15,
                      color: "#8a807a",
                      fontFamily: "inherit",
                    }}
                  >
                    bpm
                  </span>
                </div>
                <div className="ops">steady this week</div>
              </div>
              <div className="opw span3 op-med">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3v5a4 4 0 0 0 8 0V3" />
                  <path d="M10 16a6 6 0 0 0 6 6 4 4 0 0 0 4-4v-2" />
                  <circle cx="20" cy="12" r="2" />
                </svg>
                <div>
                  <div className="opv" style={{ fontSize: 16, marginTop: 0 }}>
                    Medical records
                  </div>
                  <div className="ops" style={{ marginTop: 2 }}>
                    Labs, visit notes, and history &mdash; all in one place
                  </div>
                </div>
                <span className="arr">&rsaquo;</span>
              </div>
            </div>
            <div className="op-close">
              It all becomes your history &mdash; ready for your next decision.
            </div>
            <div style={{ marginTop: 38, textAlign: "center" }}>
              <StoreRow />
            </div>
          </div>
        </section>

        {/* SCIENCE + TRUST */}
        <section id="science" className="science">
          <div className="wrap">
            <div className="kicker">Built on real science</div>
            <h2 style={{ maxWidth: 820 }}>
              Skin is visible. The biology shaping it is not always obvious.
            </h2>
            <p style={{ maxWidth: 640 }}>
              DrRuby brings longitudinal observation together with carefully
              labeled scientific context&mdash;without turning uncertainty into
              a diagnosis or a sales pitch.
            </p>
            <div className="advisor-row">
              <div className="advisor-card">
                <img
                  className="advisor-photo"
                  src="/charles-brenner.webp"
                  alt="Dr. Charles Brenner"
                />
                <div>
                  <div className="advisor-name">
                    <a
                      href="https://en.wikipedia.org/wiki/Charles_Brenner_(biochemist)"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                      }}
                    >
                      Dr. Charles Brenner, PhD
                    </a>
                  </div>
                  <div className="advisor-role">Founding Science Advisor</div>
                  <div className="advisor-creds">
                    Biochemist &middot; Professor of Metabolic Regulation,
                    University of Helsinki
                  </div>
                </div>
              </div>
              <div className="advisor-card">
                <div className="adv-ph">+</div>
                <div>
                  <div className="advisor-name adv-soon">To be announced</div>
                  <div className="advisor-role">
                    Women&rsquo;s Health Advisor
                  </div>
                  <div className="advisor-creds adv-soon">
                    Placeholder &mdash; name &amp; credentials to be added
                  </div>
                </div>
              </div>
              <div className="advisor-card">
                <div className="adv-ph">+</div>
                <div>
                  <div className="advisor-name adv-soon">To be announced</div>
                  <div className="advisor-role">Dermatology Advisor</div>
                  <div className="advisor-creds adv-soon">
                    Placeholder &mdash; name &amp; credentials to be added
                  </div>
                </div>
              </div>
            </div>
            <div className="trust-points">
              <div>
                <div className="tp-h">Private by default</div>
                <div className="tp-p">
                  Your history is yours. Nothing is shared unless you explicitly
                  choose to.
                </div>
              </div>
              <div>
                <div className="tp-h">
                  Using DrRuby isn&rsquo;t joining research
                </div>
                <div className="tp-p">
                  Research is always separate, explicit, and voluntary &mdash;
                  you choose which scientist or doctor to join.
                </div>
              </div>
              <div>
                <div className="tp-h">You decide, not DrRuby</div>
                <div className="tp-p">
                  We help you prepare. The decision stays yours &mdash; with
                  your clinician.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="section soft">
          <div className="wrap">
            <div className="kicker">Your next decision</div>
            <h2>DrRuby remembers what happened last time.</h2>
            <div className="how-grid">
              <div className="how-visual">
                <div className="phone">
                  <div className="phone-status">
                    <span className="phone-time">9:41</span>
                    <svg
                      className="phone-icons"
                      width="62"
                      height="11"
                      viewBox="0 0 62 11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="0"
                        y="6"
                        width="3"
                        height="5"
                        rx=".5"
                        fill="currentColor"
                      />
                      <rect
                        x="5"
                        y="4"
                        width="3"
                        height="7"
                        rx=".5"
                        fill="currentColor"
                      />
                      <rect
                        x="10"
                        y="2"
                        width="3"
                        height="9"
                        rx=".5"
                        fill="currentColor"
                      />
                      <rect
                        x="15"
                        y="0"
                        width="3"
                        height="11"
                        rx=".5"
                        fill="currentColor"
                      />
                      <path
                        d="M25 5C27.3 2.7 31 2.7 33.3 5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M27 7.4C28.4 6 30 6 31.3 7.4"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                      <circle cx="29.2" cy="9.5" r=".9" fill="currentColor" />
                      <rect
                        x="41"
                        y="1"
                        width="18"
                        height="9"
                        rx="2.1"
                        stroke="currentColor"
                        strokeWidth="1.1"
                      />
                      <rect
                        x="60.5"
                        y="3.7"
                        width="1.5"
                        height="3.2"
                        rx=".7"
                        fill="currentColor"
                      />
                      <rect
                        x="43"
                        y="2.7"
                        width="14"
                        height="5.4"
                        rx=".9"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div className="phone-content">
                    <div className="phone-top">&larr; My Health History</div>
                    <div className="source-label red">Your History</div>
                    <div className="story-line">
                      <div className="story-step">
                        <span className="story-date">Mar 12</span>
                        <span className="story-title">Started Retinol</span>
                      </div>
                      <div className="story-step">
                        <span className="story-date">Week 2</span>
                        <span className="story-title">Dryness</span>
                      </div>
                      <div className="story-step">
                        <span className="story-date">Jun 1</span>
                        <span className="story-title">Stopped</span>
                      </div>
                    </div>
                    <div className="story-divider" />
                    <div className="source-label red">Today</div>
                    <div className="story-question">
                      Thinking about restarting?
                    </div>
                    <div className="story-note-label">
                      Based on your history
                    </div>
                    <div className="story-note-text">
                      Last time, dryness appeared after two weeks.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p
              className="sub"
              style={{
                textAlign: "center",
                maxWidth: 520,
                margin: "28px auto 0",
              }}
            >
              So your next decision doesn&rsquo;t start from zero &mdash; it
              starts with what you already know.
            </p>
            <div style={{ marginTop: 38, textAlign: "center" }}>
              <StoreRow />
            </div>
          </div>
        </section>

        {/* HEALTHSPAN — orbit */}
        <section id="healthspan" className="section soft">
          <div className="wrap">
            <div className="kicker">The long game</div>
            <h2>
              Don&rsquo;t fight aging.
              <br />
              <em>Age well.</em>
            </h2>
            <p className="sub">
              Skin is what you see &mdash; but sleep, hormones, and stress shape
              how you age. DrRuby keeps the full picture in one place, so you
              can care for the long game instead of chasing quick fixes.
            </p>
            <div className="orbit-wrap">
              <div className="orbit">
                <div className="orbit-center">
                  <span>
                    Your Skin
                    <br />
                    Journey
                  </span>
                </div>
                <div className="orbit-node n-sleep">
                  <span className="on-ico">
                    <svg viewBox="0 0 24 24">
                      <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />
                    </svg>
                  </span>
                  <small>Sleep</small>
                </div>
                <div className="orbit-node n-hormones">
                  <span className="on-ico">
                    <svg viewBox="0 0 24 24">
                      <path d="M9 3h6M10 3v5l-4.2 8.4A2 2 0 007.6 20h8.8a2 2 0 001.8-3.6L14 8V3" />
                    </svg>
                  </span>
                  <small>Hormones</small>
                </div>
                <div className="orbit-node n-stress">
                  <span className="on-ico">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 12h4l2-6 4 12 2-6h6" />
                    </svg>
                  </span>
                  <small>Stress</small>
                </div>
                <div className="orbit-node n-treatments">
                  <span className="on-ico">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 15L15 5a4 4 0 015.5 5.5L10.5 20A4 4 0 015 15z" />
                      <path d="M9 11l4 4" />
                    </svg>
                  </span>
                  <small>Treatments</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMEBACK — flow */}
        <section id="comeback" className="section soft">
          <div className="wrap" style={{ textAlign: "center", maxWidth: 920 }}>
            <h2>
              Most health apps buzz you all day.
              <br />
              <em>
                <span style={{ color: "#cf1736" }}>DrRuby</span> only speaks up
                when a decision matters.
              </em>
            </h2>
            <div className="cb-flow">
              <div className="cb-card">
                <div className="cb-badge">1</div>
                <div className="cb-h">Every decision</div>
                <div className="cb-p">becomes part of your understanding.</div>
              </div>
              <div className="cb-arrow">&rarr;</div>
              <div className="cb-card">
                <div className="cb-badge">2</div>
                <div className="cb-h">Every outcome</div>
                <div className="cb-p">teaches you something.</div>
              </div>
              <div className="cb-arrow">&rarr;</div>
              <div className="cb-card">
                <div className="cb-badge">3</div>
                <div className="cb-h">Every lesson</div>
                <div className="cb-p">makes the next decision easier.</div>
              </div>
            </div>
            <div className="cb-close">
              Every decision makes the next one better.
            </div>
            <div style={{ marginTop: 38, textAlign: "center" }}>
              <StoreRow />
            </div>
          </div>
        </section>

        {/* SKIN — formula */}
        <section id="skin" className="section">
          <div className="wrap">
            <div className="kicker">Before you decide</div>
            <h2>Every health decision deserves the full picture.</h2>
            <p className="sub">
              Search gives you information. DrRuby brings together your history,
              similar experiences, and the evidence &mdash; so you decide with
              confidence.
            </p>
            <div className="tt-synthesis" style={{ marginTop: 36 }}>
              <div className="tt-formula2">
                <span className="ff-term">
                  <i>
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="3.2" />
                      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
                    </svg>
                  </i>
                  Yourself
                </span>
                <b className="ff-op">+</b>
                <span className="ff-term">
                  <i>
                    <svg viewBox="0 0 24 24">
                      <circle cx="9" cy="9" r="2.6" />
                      <circle cx="16.5" cy="10" r="2.1" />
                      <path d="M4 19c0-2.8 2.2-4.6 5-4.6s5 1.8 5 4.6" />
                      <path d="M15 19c0-1.8 1-3.2 2.8-3.2S20.6 17 20.6 19" />
                    </svg>
                  </i>
                  Others
                </span>
                <b className="ff-op">+</b>
                <span className="ff-term">
                  <i>
                    <svg viewBox="0 0 24 24">
                      <path d="M9 3h6M10 3v5l-4.2 8.4A2 2 0 0 0 7.6 20h8.8a2 2 0 0 0 1.8-3.6L14 8V3" />
                    </svg>
                  </i>
                  Science
                </span>
                <b className="ff-op">&rarr;</b>
                <span className="ff-out">Better Health Decisions</span>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="section soft">
          <div className="wrap">
            <div style={{ textAlign: "center" }}>
              <div className="kicker">Membership</div>
              <h2>You never pay to unlock your own data.</h2>
              <p className="sub" style={{ margin: "0 auto" }}>
                That stays free, always. Pay once when a decision matters, or
                become a member if you want DrRuby with you for every decision.
              </p>
            </div>
            <div className="price-cards">
              <div className="price-card">
                <div className="price-tag free">
                  Always free &middot; no time limit
                </div>
                <div className="price-name">Free</div>
                <div className="price-value">DrRuby remembers your health.</div>
                <div className="price-line">
                  So it&rsquo;s ready to help when a decision matters.
                </div>
                <ul>
                  <li>Record photos, changes, decisions and outcomes</li>
                  <li>Keep your personal timeline</li>
                  <li>Receive basic summaries</li>
                  <li>Read public learning resources</li>
                </ul>
                <div className="price-amount">
                  $0<small> forever</small>
                </div>
                <div className="price-note">
                  Not a trial. Not a countdown. Free for as long as you use
                  DrRuby.
                </div>
                <DownloadCTA className="btn line">
                  Start Your Journey
                </DownloadCTA>
                <div className="price-foot">
                  Your history remains yours, whether or not you ever pay.
                </div>
              </div>
              <div className="price-card feature">
                <div className="price-tag">
                  For this one decision, right now
                </div>
                <div className="price-name">Decision</div>
                <div className="price-value">Understand this decision.</div>
                <div className="price-line">One-time. No subscription.</div>
                <ul>
                  <li>
                    Understand this decision in the context of your history
                  </li>
                  <li>
                    Yourself + Others + Science, brought together for this
                    decision
                  </li>
                  <li>Tradeoffs and questions worth considering</li>
                  <li>
                    Prepare more clearly for a conversation with your doctor
                  </li>
                </ul>
                <div
                  className="price-amount"
                  style={{ fontSize: 16, color: "#494441" }}
                >
                  Pricing announced before launch
                </div>
                <div className="price-note">
                  Paid once, per decision &mdash; no subscription required.
                </div>
                <DownloadCTA className="btn primary">
                  Understand This Decision
                </DownloadCTA>
                <div className="price-foot">
                  Pay only when a decision matters. Your history stays yours
                  either way.
                </div>
              </div>
              <div className="price-card">
                <div className="price-tag">
                  For every decision, going forward
                </div>
                <div className="price-name">Membership</div>
                <div className="price-value">
                  Understand yourself, continuously.
                </div>
                <div className="price-line">
                  For your next decision &mdash; and the one after that.
                </div>
                <ul>
                  <li>Everything in Decision, for every decision</li>
                  <li>Ongoing access to Yourself + Others + Science</li>
                  <li>Priority access as new learning becomes available</li>
                </ul>
                <div
                  className="price-amount"
                  style={{ fontSize: 16, color: "#494441" }}
                >
                  Pricing announced before launch
                </div>
                <div className="price-note">
                  A single, clear price &mdash; no ranges, no confusion.
                </div>
                <DownloadCTA className="btn line">Join Membership</DownloadCTA>
                <div className="price-foot">
                  Cancel anytime &mdash; your history is never deleted or
                  locked.
                </div>
              </div>
            </div>

            <div className="price-band">
              <div className="always">On every plan, always</div>
              <h3>Your trust is not a premium feature.</h3>
              <ul>
                <li>Your data belongs to you</li>
                <li>Private by default</li>
                <li>We never sell your personal data</li>
                <li>
                  We support your decisions. We don&rsquo;t make them for you
                </li>
                <li>Export or delete anytime</li>
              </ul>
              <div className="fine">
                We earn your trust before we earn your revenue.
              </div>
            </div>

            <details className="price-compare">
              <summary>Compare plans in detail &rarr;</summary>
              <table className="price-ctable">
                <thead>
                  <tr>
                    <th>What you get</th>
                    <th>Free</th>
                    <th>Decision</th>
                    <th>Membership</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="grp">
                    <td colSpan={4}>Build your history</td>
                  </tr>
                  <tr>
                    <td>Record photos, changes, decisions, outcomes</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr>
                    <td>Personal timeline &amp; basic summaries</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr className="grp">
                    <td colSpan={4}>Understand a decision</td>
                  </tr>
                  <tr>
                    <td>Your decision in the context of your history</td>
                    <td className="price-dash">&mdash;</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr>
                    <td>Relevant evidence &amp; expert perspectives</td>
                    <td className="price-dash">&mdash;</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr>
                    <td>Tradeoffs &amp; questions for your doctor</td>
                    <td className="price-dash">&mdash;</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr className="grp">
                    <td colSpan={4}>Learn from relevant experiences</td>
                  </tr>
                  <tr>
                    <td>A few relevant journeys, summarized</td>
                    <td className="price-dash">&mdash;</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr className="grp">
                    <td colSpan={4}>Ongoing access</td>
                  </tr>
                  <tr>
                    <td>Covers every future decision, not just one</td>
                    <td className="price-dash">&mdash;</td>
                    <td className="price-dash">&mdash;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr>
                    <td>Priority access as new learning becomes available</td>
                    <td className="price-dash">&mdash;</td>
                    <td className="price-dash">&mdash;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr className="grp">
                    <td colSpan={4}>Privacy &amp; ownership</td>
                  </tr>
                  <tr>
                    <td>
                      Your data belongs to you &middot; private by default
                    </td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr>
                    <td>Never sold &middot; export or delete anytime</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                  <tr>
                    <td>
                      We support your decisions. We don&rsquo;t make them.
                    </td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                    <td className="price-ck">&#10003;</td>
                  </tr>
                </tbody>
              </table>
            </details>

            <div className="price-faq">
              <div className="q">
                <h4>Will DrRuby sell my data?</h4>
                <p>
                  No &mdash; never, on any plan, including Free. DrRuby is
                  funded by members and by women who pay for a single Decision,
                  not by selling anyone&rsquo;s data.
                </p>
              </div>
              <div className="q">
                <h4>Do I have to pay to access my own history?</h4>
                <p>
                  No. Your history remains available to read and export, even if
                  you don&rsquo;t subscribe or later downgrade.
                </p>
              </div>
              <div className="q">
                <h4>Does DrRuby tell me what treatment to choose?</h4>
                <p>
                  No. DrRuby helps you understand context, evidence, experiences
                  and tradeoffs. The decision remains yours.
                </p>
              </div>
              <div className="q">
                <h4>
                  What&rsquo;s the difference between Decision and Membership?
                </h4>
                <p>
                  Decision unlocks full understanding for one decision, paid
                  once. Membership covers every decision as it comes up, for a
                  single ongoing price. Either way, your history stays free and
                  yours.
                </p>
              </div>
              <div className="q">
                <h4>What happens if I cancel?</h4>
                <p>
                  Your premium analysis stops, but your history is not deleted
                  or locked. You can continue to read and export it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="start" className="final">
          <div className="wrap">
            <div className="kicker">
              It doesn&rsquo;t get smarter. It gets more complete.
            </div>
            <h2>Build the health history behind your next decision.</h2>
            <p>Your first entry takes only a few minutes.</p>
            <p className="final-note">
              Nothing you&rsquo;ve tried is wasted. It becomes part of your
              health history.
            </p>
            <StoreRow />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="wrap">
          <div className="ft-logo">
            Dr<span>Ruby</span>.ai
          </div>
          <div className="ft-tag">Understand your body, over time.</div>
          <div className="ft-top">
            <div className="ft-cols">
              <div className="ft-col">
                <h4>Product</h4>
                <a href="#how">How It Works</a>
                <a href="#skin">Skin</a>
                <a href="#healthspan">Age well</a>
                <a href="#science">Trust</a>
                <a href="#pricing">Pricing</a>
              </div>
              <div className="ft-col">
                <h4>Company</h4>
                <a href="#">About</a>
                <a href="#">Careers</a>
                <a href="#">Newsroom</a>
                <a href="#">Security</a>
                <a href="#">Contact</a>
              </div>
              <div className="ft-col">
                <h4>For professionals</h4>
                <a className="ft-ic" href="#">
                  <svg viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M12 9v6M9 12h6" />
                  </svg>
                  For Clinics
                </a>
                <a className="ft-ic" href="/collaborate">
                  <svg viewBox="0 0 24 24">
                    <circle cx="9" cy="8" r="3" />
                    <circle cx="17" cy="9" r="2.4" />
                    <path d="M4 19c0-3 2.5-5 5-5s5 2 5 5M15 19c0-2 1-3.5 3-3.5s3 1.5 3 3.5" />
                  </svg>
                  Collaborate
                </a>
                <a href="#science">Research &amp; ethics</a>
              </div>
            </div>
            <div className="ft-sub">
              <div className="ft-sub-h">
                Learn to understand your body, <em>one decision at a time.</em>
              </div>
              <div className="ft-sub-p">
                Occasional notes on making better health decisions &mdash;
                grounded in your own history, not hype.
              </div>
              <FooterSubscribe />
            </div>
          </div>
          <div className="ft-bottom">
            <div className="ft-social">
              <a href="#" aria-label="Instagram">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4.98 3.5A2.5 2.5 0 112.5 6 2.5 2.5 0 014.98 3.5zM3 8.98h4V21H3zM9 8.98h3.8v1.64h.05a4.16 4.16 0 013.75-2.06c4 0 4.75 2.64 4.75 6.07V21h-4v-5.4c0-1.29 0-2.94-1.8-2.94s-2.07 1.4-2.07 2.85V21H9z" />
                </svg>
              </a>
              <a href="#" aria-label="X">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.9 2H22l-7.1 8.1L23 22h-6.6l-5.2-6.8L5.3 22H2l7.6-8.7L1.7 2h6.8l4.7 6.2L18.9 2zm-1.2 18h1.9L7.2 3.9H5.2z" />
                </svg>
              </a>
            </div>
            <div className="ft-legal">
              <span style={{ color: "#8c8581" }}>&copy; 2026 DrRuby.ai</span>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Consumer Health Data Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      <DownloadModal />
    </div>
  );
}
