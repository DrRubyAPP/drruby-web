"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ContributeDialog } from "@/components/sections/portal/ContributeDialog";
import { LibraryJourneys } from "@/components/sections/portal/LibraryJourneys";

export default function PortalLibraryPage() {
  const t = useTranslations("portal");
  const [contributeOpen, setContributeOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const cmToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <>
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
    </>
  );
}
