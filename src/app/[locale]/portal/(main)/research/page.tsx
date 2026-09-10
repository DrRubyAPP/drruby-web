"use client";

import { Link } from "@/i18n/navigation";
import { ResearchView } from "@/components/sections/portal/research/ResearchView";

export default function PortalResearchPage() {
  return (
    <>
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
          <Link
            href="/portal/settings"
            className="sub-row"
            style={{ cursor: "pointer" }}
          >
            <span>Your research participation</span>
            <span className="arr">Manage in Consent Center &rsaquo;</span>
          </Link>
        </div>
      </div>
    </>
  );
}
