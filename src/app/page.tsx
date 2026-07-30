import FooterSubscribe from "@/components/FooterSubscribe";
import "./home-v5.css";

/* ── Store button icons ─────────────────────────────────────── */
function AppleIcon() {
  return (
    <svg viewBox="0 0 384 512" aria-hidden="true">
      <path
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
        fill="#111"
      />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true">
      <path
        d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"
        fill="#111"
      />
    </svg>
  );
}

function StoreRow() {
  return (
    <span className="store-row">
      <a className="store-btn" href="#" aria-label="Download on the App Store">
        <AppleIcon />
        <span>App Store</span>
      </a>
      <a className="store-btn" href="#" aria-label="Get it on Google Play">
        <GooglePlayIcon />
        <span>Google Play</span>
      </a>
    </span>
  );
}

export default function Home() {
  return (
    <div className="dr-v5">
      <nav>
        <div
          className="wrap"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div className="logo">
            Dr<span>Ruby</span>.ai
          </div>
          <div className="navlinks">
            <a href="#how">How It Works</a>
            <a href="#skin">Skin</a>
            <a href="#healthspan">Age well</a>
            <a href="#">For Clinics</a>
            <a href="/collaborate">Collaborate</a>
            <a href="#science">Trust</a>
            <a href="/pricing">Pricing</a>
          </div>
          <div className="actions">
            <a className="btn ghost" href="#">
              Log in
            </a>
            <a className="store-btn" href="#" aria-label="Download DrRuby">
              <AppleIcon />
              <span>Download</span>
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="wrap hero">
          <div className="hero-copy">
            <div className="eyebrow">A women&rsquo;s health app</div>
            <h1>
              DrRuby turns your health history into <em>better decisions.</em>
            </h1>
            <div className="lede">
              Bring everything together.
              <br />
              So every decision starts with the full picture.
            </div>
            <div>
              <StoreRow />
              <span className="note">Launching soon. Free to start.</span>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/hero-woman.webp" alt="Woman reflecting on her skin journey" />
          </div>
        </section>

        {/* ONE PLACE */}
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
              Your notes, photos, cycle, labs, and decisions &mdash; in one place, so every decision
              starts with the full picture.
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
                <div className="ops">Last 7 nights &middot; from your wearable</div>
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
                  <span style={{ background: "linear-gradient(135deg,#ecd8d2,#d6b4ac)" }} />
                  <span style={{ background: "linear-gradient(135deg,#f0dcd8,#e0b9c0)" }} />
                </div>
                <div className="ops">Retinol &middot; week 6</div>
              </div>
              <div className="opw">
                <div className="opk">Labs &amp; records</div>
                <div className="opv" style={{ fontSize: 32 }}>
                  128
                </div>
                <div className="ops">LDL &middot; Jun 12 &middot; from your doctor</div>
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
                <div className="opv">&ldquo;My skin&rsquo;s been drier this month.&rdquo;</div>
                <div className="ops">in your own words &middot; Jun 18</div>
              </div>
              <div className="opw">
                <div className="opk">Resting heart</div>
                <div className="opv" style={{ fontSize: 32 }}>
                  62{" "}
                  <span style={{ fontSize: 15, color: "#8a807a", fontFamily: "inherit" }}>bpm</span>
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

        {/* SCIENCE */}
        <section id="science" className="science">
          <div className="wrap">
            <div className="kicker">Built on real science</div>
            <h2 style={{ maxWidth: 820 }}>
              Skin is visible. The biology shaping it is not always obvious.
            </h2>
            <p style={{ maxWidth: 640 }}>
              DrRuby brings longitudinal observation together with carefully labeled scientific
              context&mdash;without turning uncertainty into a diagnosis or a sales pitch.
            </p>
            <div className="advisor-row">
              <div className="advisor-card">
                <img className="advisor-photo" src="/charles-brenner.webp" alt="Dr. Charles Brenner" />
                <div>
                  <div className="advisor-name">Dr. Charles Brenner, PhD</div>
                  <div className="advisor-role">Founding Science Advisor</div>
                  <div className="advisor-creds">
                    Biochemist &middot; Professor of Metabolic Regulation, University of Helsinki
                  </div>
                </div>
              </div>
              <div className="advisor-card">
                <div className="adv-ph">+</div>
                <div>
                  <div className="advisor-name adv-soon">To be announced</div>
                  <div className="advisor-role">Women&rsquo;s Health Advisor</div>
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
            <div
              className="trust-points"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 22,
                marginTop: 46,
                borderTop: "1px solid rgba(0,0,0,.08)",
                paddingTop: 34,
              }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1614" }}>
                  Private by default
                </div>
                <div style={{ fontSize: 13.5, color: "#6b635e", marginTop: 5, lineHeight: 1.55 }}>
                  Your history is yours. Nothing is shared unless you explicitly choose to.
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1614" }}>
                  Using DrRuby isn&rsquo;t joining research
                </div>
                <div style={{ fontSize: 13.5, color: "#6b635e", marginTop: 5, lineHeight: 1.55 }}>
                  Research is always separate, explicit, and voluntary &mdash; you choose which
                  scientist or doctor to join.
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1614" }}>
                  You decide, not DrRuby
                </div>
                <div style={{ fontSize: 13.5, color: "#6b635e", marginTop: 5, lineHeight: 1.55 }}>
                  We help you prepare. The decision stays yours &mdash; with your clinician.
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
                      <rect x="0" y="6" width="3" height="5" rx=".5" fill="currentColor" />
                      <rect x="5" y="4" width="3" height="7" rx=".5" fill="currentColor" />
                      <rect x="10" y="2" width="3" height="9" rx=".5" fill="currentColor" />
                      <rect x="15" y="0" width="3" height="11" rx=".5" fill="currentColor" />
                      <path d="M25 5C27.3 2.7 31 2.7 33.3 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <path d="M27 7.4C28.4 6 30 6 31.3 7.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <circle cx="29.2" cy="9.5" r=".9" fill="currentColor" />
                      <rect x="41" y="1" width="18" height="9" rx="2.1" stroke="currentColor" strokeWidth="1.1" />
                      <rect x="60.5" y="3.7" width="1.5" height="3.2" rx=".7" fill="currentColor" />
                      <rect x="43" y="2.7" width="14" height="5.4" rx=".9" fill="currentColor" />
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
                    <div className="story-question">Thinking about restarting?</div>
                    <div className="story-note-label">Based on your history</div>
                    <div className="story-note-text">
                      Last time, dryness appeared after two weeks.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="sub" style={{ textAlign: "center", maxWidth: 520, margin: "28px auto 0" }}>
              So your next decision doesn&rsquo;t start from zero &mdash; it starts with what you
              already know.
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
              Skin is what you see &mdash; but sleep, hormones, and stress shape how you age. DrRuby
              keeps the full picture in one place, so you can care for the long game instead of
              chasing quick fixes.
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

        {/* COMEBACK */}
        <section id="comeback" className="section soft">
          <div className="wrap" style={{ textAlign: "center", maxWidth: 920 }}>
            <h2>
              Most health apps buzz you all day.
              <br />
              <em>
                <span style={{ color: "#cf1736" }}>DrRuby</span> only speaks up when a decision
                matters.
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
            <div className="cb-close">Every decision makes the next one better.</div>
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
              Search gives you information. DrRuby brings together your history, similar experiences,
              and the evidence &mdash; so you decide with confidence.
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
                  You
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
                  People like you
                </span>
                <b className="ff-op">+</b>
                <span className="ff-term">
                  <i>
                    <svg viewBox="0 0 24 24">
                      <path d="M9 3h6M10 3v5l-4.2 8.4A2 2 0 0 0 7.6 20h8.8a2 2 0 0 0 1.8-3.6L14 8V3" />
                    </svg>
                  </i>
                  Evidence
                </span>
                <b className="ff-op">=</b>
                <span className="ff-out">Confidence in your own decision</span>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="start" className="final">
          <div className="wrap">
            <div className="kicker">It doesn&rsquo;t get smarter. It gets more complete.</div>
            <h2>Build the health history behind your next decision.</h2>
            <p>Your first entry takes only a few minutes.</p>
            <p className="final-note">
              Nothing you&rsquo;ve tried is wasted. It becomes part of your health history.
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
                <a href="#science">Trust</a>
                <a href="/pricing">Pricing</a>
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
                Occasional notes on making better health decisions &mdash; grounded in your own
                history, not hype.
              </div>
              <FooterSubscribe />
            </div>
          </div>
          <div className="ft-bottom">
            <div className="ft-social">
              <a href="#" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.98 3.5A2.5 2.5 0 112.5 6 2.5 2.5 0 014.98 3.5zM3 8.98h4V21H3zM9 8.98h3.8v1.64h.05a4.16 4.16 0 013.75-2.06c4 0 4.75 2.64 4.75 6.07V21h-4v-5.4c0-1.29 0-2.94-1.8-2.94s-2.07 1.4-2.07 2.85V21H9z" />
                </svg>
              </a>
              <a href="#" aria-label="X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
    </div>
  );
}
