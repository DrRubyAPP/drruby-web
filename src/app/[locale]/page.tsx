import FooterSubscribe from "@/components/FooterSubscribe";
import "./home-v5.css";
import {
  DownloadModal,
  StartJourneyButton,
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
            <div className="eyebrow">From today, and over time</div>
            <h1>
              Know your body,
              <em style={{ display: "block", marginTop: 14 }}>
                understand yourself over time.
              </em>
            </h1>
            <div className="lede">
              Capture what you notice, connect it to what you tried, and let
              your own history make your next decision easier. Skin is just the
              easiest place to start.
            </div>
            <div>
              <StartJourneyButton />
              <span className="note">
                Free to start. Your first entry takes less than a minute.
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src="/hero-woman.webp"
              alt="Woman reflecting on her skin journey"
            />
            <div className="hero-journey">
              <div className="hj-title">Your skin journey</div>
              <div className="hj-step">
                <span className="hj-dot" />
                <div className="hj-body">
                  <div className="hj-k">Started &middot; Mar 12</div>
                  <div className="hj-t">Retinol 0.025%</div>
                </div>
              </div>
              <div className="hj-step">
                <span className="hj-dot" />
                <div className="hj-body">
                  <div className="hj-k">Week 2 &middot; Mar 26</div>
                  <div className="hj-t">Dryness noticed</div>
                </div>
              </div>
              <div className="hj-step last">
                <span className="hj-dot" />
                <div className="hj-body">
                  <div className="hj-k">Today &middot; Jun 20</div>
                  <div className="hj-t">Continue this routine?</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="section soft">
          <div className="wrap">
            <div className="kicker">How it works</div>
            <h2>One decision. Three moments.</h2>
            <p className="sub">
              Instead of starting from scratch every time, DrRuby helps you
              build on your own experience.
            </p>
            <div className="how-grid">
              <div className="how-journey">
                <div className="hm">
                  <span className="hm-dot" />
                  <div className="hm-body">
                    <div className="hm-k">Before</div>
                    <h3>You have a question</h3>
                    <p>
                      &ldquo;Should I start retinol?&rdquo; &middot;
                      &ldquo;Should I try HRT?&rdquo; &middot; &ldquo;Should I
                      see this clinic?&rdquo;
                    </p>
                  </div>
                </div>
                <div className="hm">
                  <span className="hm-dot" />
                  <div className="hm-body">
                    <div className="hm-k">What happened</div>
                    <h3>Your experience, remembered</h3>
                    <p>
                      Started Retinol &rarr; dryness after two weeks &rarr;
                      stopped &rarr; skin recovered.
                    </p>
                  </div>
                </div>
                <div className="hm last">
                  <span className="hm-dot" />
                  <div className="hm-body">
                    <div className="hm-k">Next time</div>
                    <h3>You don&rsquo;t start from zero</h3>
                    <p>
                      &ldquo;Thinking about restarting? Last time, dryness
                      appeared after two weeks.&rdquo; DrRuby gives you your own
                      context &mdash; it never tells you what to do.
                    </p>
                  </div>
                </div>
              </div>
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
                    <div className="phone-top">&larr; My History</div>
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
          </div>
        </section>

        {/* SKIN — three things before you decide */}
        <section id="skin" className="section">
          <div className="wrap">
            <div className="kicker">Before you decide</div>
            <h2>Three things Google can&rsquo;t give you.</h2>
            <p className="sub">
              Google gives you information. DrRuby brings together your own
              experience, people like you, and the evidence &mdash; so your next
              decision is yours, made with more confidence.
            </p>
            <div className="three-things">
              <div className="tt">
                <div className="tt-k">You</div>
                <h3>Your own history</h3>
                <p>
                  Your photos, your timeline, your changes over time &mdash; the
                  one thing no one else has.
                </p>
                <div className="tt-ex">
                  Photo &rarr; Retinol &rarr; dryness &rarr; stopped &rarr;
                  recovered
                </div>
              </div>
              <div className="tt">
                <div className="tt-k">People like you</div>
                <h3>Similar journeys</h3>
                <p>
                  Women around your age and situation who tried the same thing
                  &mdash; what they actually experienced.
                </p>
                <div className="tt-ex">
                  Among women 45&ndash;55 who started retinol, many noticed
                  dryness around week 2 &mdash; and most who continued said it
                  settled.
                </div>
                <div className="tt-note">
                  Consented, structured experience &mdash; not a study, not a
                  recommendation.
                </div>
              </div>
              <div className="tt">
                <div className="tt-k">Evidence</div>
                <h3>What the field says</h3>
                <p>
                  Dermatologists&rsquo; perspectives and the evidence &mdash; in
                  plain language, with the uncertainty kept visible.
                </p>
                <div className="tt-ex">
                  What&rsquo;s supported &middot; what&rsquo;s still debated
                  &middot; where experts disagree
                </div>
              </div>
            </div>
            <div className="tt-synthesis">
              <div className="tt-sum">
                DrRuby brings the three together into a{" "}
                <strong>Decision Brief</strong> &mdash; what&rsquo;s known,
                what&rsquo;s still uncertain, and the questions worth asking. It
                never tells you what to do.
              </div>
              <div className="tt-formula">
                <span>You</span>
                <b>+</b>
                <span>People like you</span>
                <b>+</b>
                <span>Evidence</span>
                <b>=</b>
                <em>confidence in your own decision</em>
              </div>
            </div>
          </div>
        </section>

        {/* HEALTHSPAN — orbit */}
        <section id="healthspan" className="section soft">
          <div className="wrap">
            <div className="kicker">
              HealthSpan &middot; a second layer of context
            </div>
            <h2>
              Skin is what you see.
              <br />
              Sleep, hormones, and stress are part of the record too.
            </h2>
            <p className="sub">
              Sleep, hormones, stress, and treatments are part of your story
              too. DrRuby gives you one place to note them alongside your skin
              history, so the full picture is there when you need it &mdash; not
              scattered across separate apps.
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

        {/* SCIENCE */}
        <section id="science" className="science">
          <div className="wrap">
            <div className="kicker">Built on real science</div>
            <h2 style={{ maxWidth: 650 }}>
              Skin is visible. The biology shaping it is not always obvious.
            </h2>
            <p>
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
                  <div className="advisor-name">Dr. Charles Brenner, PhD</div>
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
          </div>
        </section>

        {/* TRUST */}
        <section id="trust" className="trust">
          <div className="wrap">
            <div className="kicker">Why trust DrRuby</div>
            <h2>
              Personal value first.
              <br />
              Research only by separate choice.
            </h2>
            <p className="trust-sub">
              Using DrRuby does not mean participating in research. Your
              personal history is useful on its own. Research is always
              separate, explicit, and voluntary.
            </p>
            <div className="trust-stack">
              <div className="trust-layer">
                <div className="trust-tag">You</div>
                <h3>Your decisions</h3>
                <p>
                  Preserved for your own clarity and confidence. This is where
                  everyone starts&mdash;and where most people stay.
                </p>
              </div>
              <div className="trust-layer">
                <div className="trust-tag">Research &middot; Optional</div>
                <h3>Decision Research Platform</h3>
                <p>
                  Separate consent, separate protocol, never automatic. Powered
                  by structured multiple N-of-1 research.
                </p>
              </div>
              <div className="trust-layer">
                <div className="trust-tag">Knowledge</div>
                <h3>Validated patterns</h3>
                <p>
                  Governed, traceable patterns may improve future decision
                  context. Research improves the platform&mdash;it never
                  replaces your decisions.
                </p>
              </div>
            </div>
            <div className="trust-note">
              Some decision journeys&mdash;shared only with your explicit
              consent&mdash;may also help research learn. Nothing here happens
              automatically.
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="start" className="final">
          <div className="wrap">
            <div className="kicker">
              It doesn&rsquo;t get smarter. It gets more complete.
            </div>
            <h2>Build the history behind your next decision.</h2>
            <p>Your first entry takes only a few minutes.</p>
            <p className="final-note">
              Nothing you&rsquo;ve tried is wasted. It becomes part of your
              health history.
            </p>
            <StartJourneyButton />
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
                <a href="#healthspan">HealthSpan</a>
                <a href="#science">Science</a>
                <a href="#trust">Trust</a>
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
                <a href="#trust">Research &amp; ethics</a>
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
