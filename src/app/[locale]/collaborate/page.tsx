"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./collaborate.css";

/* ── Public invitation site ─────────────────────────────────── */
function CollaborativePublic({ onSignIn }: { onSignIn: () => void }) {
  const [contacted, setContacted] = useState(false);

  return (
    <div>
      <div className="strip">
        <div className="wrap">
          <span className="mono">The DrRuby Collaborative · a research platform</span>
          <a href="/">For individuals → drruby.ai</a>
        </div>
      </div>

      <nav>
        <div className="wrap">
          <div className="brand">
            <span className="the">The </span>Dr<span className="co">Ruby</span> Collaborative
          </div>
          <div className="navlinks">
            <a href="#method">Method</a>
            <a href="#collaborate">Collaborate</a>
            <a href="#governance">Governance</a>
          </div>
          <span style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
            <button
              className="link-btn"
              onClick={onSignIn}
              style={{ fontSize: 14, color: "var(--slate)" }}
            >
              Sign in
            </button>
            <a className="btn" href="#contact">
              Get in touch
            </a>
          </span>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="wrap">
            <div className="eyebrow">The DrRuby Collaborative</div>
            <h1>Build the future of longitudinal learning.</h1>
            <div className="lede">
              Join physicians, scientists, and institutions defining a new way to learn from
              real-world human experience &mdash; one person, observed carefully, over time.
            </div>
            <div className="hero-actions">
              <a className="btn" href="#collaborate">
                Collaborate with us
              </a>
              <a className="btn ghost" href="#method">
                See the method
              </a>
            </div>
            <div className="metarow">
              <div>
                <div className="k">What it is</div>
                <div className="v">
                  A shared platform turning structured, longitudinal self-observation into
                  research-grade data.
                </div>
              </div>
              <div>
                <div className="k">Design</div>
                <div className="v">
                  Prospective, multiple N-of-1 &mdash; individual trajectories, examined across
                  many.
                </div>
              </div>
              <div>
                <div className="k">Status</div>
                <div className="v">
                  Inviting founding clinical, research, and institutional collaborators.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METHOD */}
        <section className="section" id="method">
          <div className="wrap">
            <div className="kicker">The method · learn together</div>
            <h2 className="serif">One person, observed carefully, many times over.</h2>
            <div className="sub">
              Population studies tell you what happens on average. Multiple N-of-1 keeps each
              person&rsquo;s trajectory intact &mdash; then looks for structure across many of them.
              It is the engine underneath everything DrRuby does.
            </div>
            <div className="method">
              <div className="msteps">
                <div className="mstep">
                  <div className="n">01</div>
                  <div>
                    <b>Structured self-observation</b>
                    <p>
                      Context, treatments, and change captured over time in a consistent,
                      timestamped structure &mdash; original context never overwritten.
                    </p>
                  </div>
                </div>
                <div className="mstep">
                  <div className="n">02</div>
                  <div>
                    <b>Within-person trajectories</b>
                    <p>
                      Each participant becomes a longitudinal case &mdash; an N-of-1 series
                      preserving sequence, not just endpoints.
                    </p>
                  </div>
                </div>
                <div className="mstep">
                  <div className="n">03</div>
                  <div>
                    <b>Aggregation across many</b>
                    <p>
                      Patterns examined across many individual series &mdash; signal without
                      flattening each person into an average.
                    </p>
                  </div>
                </div>
                <div className="mstep">
                  <div className="n">04</div>
                  <div>
                    <b>Collaborator-led inquiry</b>
                    <p>
                      Clinicians and investigators define the questions; DrRuby provides the
                      longitudinal substrate.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mcard">
                <div className="k">Why multiple N-of-1</div>
                <div className="q serif">
                  Keep the individual&rsquo;s story intact &mdash; then look for what repeats across
                  many.
                </div>
                <div className="note">
                  Real-world, longitudinal, participant-generated observation. Not a clinical trial,
                  not a diagnostic claim &mdash; a substrate for careful questions.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COLLABORATE */}
        <section className="section wash" id="collaborate">
          <div className="wrap">
            <div className="kicker">Collaborate</div>
            <h2 className="serif">Four ways to build with us.</h2>
            <div className="sub">
              The entrance is open; the work inside is tailored to who you are. Research programs,
              protocols, data governance, and publications are defined together.
            </div>
            <div className="paths">
              <div className="path">
                <div className="path-ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M6 3v6a4 4 0 008 0V3" />
                    <path d="M10 15v1a5 5 0 0010 0v-2" />
                    <circle cx="20" cy="12" r="2" />
                  </svg>
                </div>
                <div className="pk">For Physicians</div>
                <h3>Clinical partnership</h3>
                <p>
                  Shape best-practice questions and see structured, longitudinal context from real
                  patients&rsquo; own records.
                </p>
                <ul>
                  <li>Co-design research questions</li>
                  <li>Best-practice database</li>
                  <li>Referral / hand-off design</li>
                </ul>
              </div>
              <div className="path">
                <div className="path-ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 3h6M10 3v6l-4.8 8.6A2 2 0 007 21h10a2 2 0 001.8-3.4L14 9V3" />
                  </svg>
                </div>
                <div className="pk">For Researchers</div>
                <h3>Longitudinal &amp; AI</h3>
                <p>
                  Access a growing, consented, de-identified longitudinal substrate for N-of-1 and
                  cohort inquiry.
                </p>
                <ul>
                  <li>Study design &amp; data access</li>
                  <li>Multiple N-of-1 methods</li>
                  <li>Joint publications</li>
                </ul>
              </div>
              <div className="path">
                <div className="path-ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-6h6v6" />
                  </svg>
                </div>
                <div className="pk">For Institutions</div>
                <h3>Universities, systems, foundations</h3>
                <p>
                  Partner at the program level &mdash; academic centers, health systems, and
                  funders.
                </p>
                <ul>
                  <li>Program-level collaboration</li>
                  <li>IRB &amp; data agreements</li>
                  <li>Multi-site research</li>
                </ul>
              </div>
              <div className="path">
                <div className="path-ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2.5l8.5 4.8v9.4L12 21.5 3.5 16.7V7.3z" />
                    <path d="M3.7 7.3L12 12l8.3-4.7M12 12v9.5" />
                  </svg>
                </div>
                <div className="pk">For Industry</div>
                <h3>Independent evaluation</h3>
                <p>
                  Independent, real-world evaluation of devices and products &mdash; never an
                  endorsement, never influenced by sponsorship.
                </p>
                <ul>
                  <li>Independent validation</li>
                  <li>Own consent &amp; rules</li>
                  <li>Results not for endorsement</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* MEMBERS */}
        <section className="section wash" id="members">
          <div className="wrap">
            <div className="kicker">For registered collaborators</div>
            <h2 className="serif">The details live behind sign-in.</h2>
            <div className="sub">
              This page is an open invitation. Specific active projects, participating institutions,
              collaboration opportunities, protocols, and full governance documentation are shared
              with registered collaborators.
            </div>
            <div className="paths" style={{ marginTop: 34 }}>
              <div className="path">
                <div className="pk">Inside</div>
                <h3>Active projects &amp; institutions</h3>
                <p>
                  Current studies, participating universities and health systems, principal
                  investigators, and how to join each.
                </p>
              </div>
              <div className="path">
                <div className="pk">Inside</div>
                <h3>Protocols &amp; governance documents</h3>
                <p>Full study protocols, IRB materials, and data-use agreements.</p>
              </div>
            </div>
            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a className="btn" href="#contact">
                Register to collaborate
              </a>
              <button className="btn ghost" onClick={onSignIn}>
                Sign in
              </button>
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
              Access is granted to verified clinicians, researchers, and institutional partners.
            </div>
          </div>
        </section>

        {/* GOVERNANCE */}
        <section className="section" id="governance">
          <div className="wrap">
            <div className="kicker">Governance &amp; ethics</div>
            <h2 className="serif">Built to be trusted with sensitive data.</h2>
            <div className="sub">
              Longitudinal health observation only works if the ethics come first. These are the
              commitments every collaborator can expect &mdash; and every participant is protected
              by.
            </div>
            <div className="govgrid">
              <div className="gov">
                <div className="gk">Ethics review</div>
                <b>IRB oversight</b>
                <p>
                  Human-subjects research runs under appropriate ethics review and approved
                  protocols &mdash; not ad hoc.
                </p>
              </div>
              <div className="gov">
                <div className="gk">Consent</div>
                <b>Informed &amp; specific</b>
                <p>
                  Research participation is opt-in, informed, and specific; participants can
                  withdraw.
                </p>
              </div>
              <div className="gov">
                <div className="gk">Data</div>
                <b>Governed &amp; de-identified</b>
                <p>
                  Research data is governed, minimized, and de-identified for analysis. Individual
                  histories are not a commodity.
                </p>
              </div>
              <div className="gov">
                <div className="gk">Integrity</div>
                <b>Original context preserved</b>
                <p>
                  Observations are append-only &mdash; original context is captured and never
                  overwritten.
                </p>
              </div>
            </div>
            <div className="boundary">
              <b>Using DrRuby is not the same as participating in research.</b> Most people simply
              use the personal app for themselves. Research participation is a distinct, consented
              step &mdash; never automatic, never assumed.
            </div>
            <div style={{ marginTop: 16, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              These are our public commitments. Full governance documentation, protocols, and
              data-use agreements are available to registered collaborators.
            </div>
            <div className="advisor">
              <div>
                <div className="badge">Founding science advisor</div>
                <h4>Charles Brenner, PhD</h4>
                <p>
                  Professor of Metabolic Regulation, University of Helsinki.{" "}
                  <span style={{ color: "#9aa2a8" }}>(Advisor listing pending confirmation.)</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="contact" id="contact">
          <div className="wrap">
            <div className="kicker" style={{ color: "var(--red)" }}>
              Get in touch
            </div>
            <h2 className="serif">Are you a clinician, researcher, or institution?</h2>
            <p>
              If you work in OB/GYN, dermatology, women&rsquo;s health, or longitudinal methods
              &mdash; or you represent a university, health system, or funder &mdash; we&rsquo;d like
              to talk.
            </p>
            {!contacted ? (
              <>
                <form
                  className="cform"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContacted(true);
                  }}
                >
                  <input
                    type="email"
                    required
                    placeholder="Your work email"
                    aria-label="Your work email"
                  />
                  <button className="btn" type="submit">
                    Contact the Collaborative
                  </button>
                </form>
                <div className="cnote">
                  For collaborators and prospective partners. We reply personally &mdash; no
                  marketing list.
                </div>
              </>
            ) : (
              <div className="cdone">Thank you &mdash; the Collaborative will be in touch.</div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <span>© 2026 The DrRuby Collaborative</span>
          <span className="mono">
            Presented separately from the consumer experience · Governance · Contact
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function CollaboratePage() {
  const router = useRouter();

  return (
    <div className="dr-collab">
      <CollaborativePublic onSignIn={() => router.push("/collaborate/workspace")} />
    </div>
  );
}
