"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "../collaborate.css";

type PortalView = "dash" | "projects" | "inst" | "protocols" | "gov";

const PORTAL_NAV: { id: PortalView; label: string }[] = [
  { id: "dash", label: "Dashboard" },
  { id: "projects", label: "Active projects" },
  { id: "inst", label: "Institutions" },
  { id: "protocols", label: "Protocols" },
  { id: "gov", label: "Governance & data" },
];

/* ── Collaborator workspace (post sign-in) ──────────────────── */
export default function CollaboratorWorkspacePage() {
  const router = useRouter();
  const [view, setView] = useState<PortalView>("dash");

  return (
    <div className="dr-collab">
      <div className="cp">
        <div className="cp-wrap">
          <aside className="cp-side">
            <div className="cp-brand">
              <span className="the">The </span>Dr<b>Ruby</b> Collaborative
            </div>
            <div className="cp-role">Collaborator workspace</div>
            <div className="cp-nav">
              {PORTAL_NAV.map((item) => (
                <button
                  key={item.id}
                  className={`cp-item${view === item.id ? " active" : ""}`}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="cp-foot">
              <div className="cp-user">
                Dr. A. Researcher<span>research partner</span>
              </div>
              <button className="cp-signout" onClick={() => router.push("/collaborate")}>
                Sign out
              </button>
            </div>
          </aside>

          <main className="cp-main">
            {view === "dash" && (
              <div>
                <h1>Welcome back</h1>
                <div className="cp-lede">
                  Your collaborator workspace &mdash; the detail that isn&rsquo;t public.
                </div>
                <div className="cp-stat">
                  <div className="s">
                    <b>2</b>
                    <span>Active studies</span>
                  </div>
                  <div className="s">
                    <b>148</b>
                    <span>Enrolled participants</span>
                  </div>
                  <div className="s">
                    <b>3</b>
                    <span>Partner institutions</span>
                  </div>
                </div>
                <div className="cp-sec">
                  <div className="cp-sec-h">Recent activity</div>
                  <div className="cp-card">
                    <div className="cp-row">
                      <span>Perimenopause Sleep Study &mdash; 12 new enrollments</span>
                      <span className="r">2 days ago</span>
                    </div>
                    <div className="cp-row">
                      <span>Skin Aging Observation &mdash; protocol v1.2 posted</span>
                      <span className="r">1 week ago</span>
                    </div>
                    <div className="cp-row">
                      <span>New institution added to data-use agreement</span>
                      <span className="r">2 weeks ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === "projects" && (
              <div>
                <h1>Active projects</h1>
                <div className="cp-lede">
                  Specific studies, PIs, and status &mdash; visible to collaborators only.
                </div>
                <div className="cp-card">
                  <h4>
                    Perimenopause Sleep Study <span className="cp-tag">Recruiting</span>
                  </h4>
                  <div className="cp-meta">
                    PI: [name] &middot; [Institution] &middot; N=96 target &middot; IRB #2026-0142
                    &middot; Longitudinal, 12 weeks
                  </div>
                </div>
                <div className="cp-card">
                  <h4>
                    Skin Aging Observation <span className="cp-tag">Recruiting</span>
                  </h4>
                  <div className="cp-meta">
                    PI: [name] &middot; [Institution] &middot; Monthly photo protocol &middot; IRB
                    #2026-0157
                  </div>
                </div>
                <div className="cp-card">
                  <h4>
                    GLP-1 Journey <span className="cp-tag">In design</span>
                  </h4>
                  <div className="cp-meta">
                    Seeking OB/GYN + endocrinology collaborators &middot; protocol drafting
                  </div>
                </div>
              </div>
            )}

            {view === "inst" && (
              <div>
                <h1>Participating institutions</h1>
                <div className="cp-lede">Partners under active agreement. Not shown publicly.</div>
                <div className="cp-card">
                  <div className="cp-row">
                    <span>[University / Health system A]</span>
                    <span className="r">Data-use agreement &middot; active</span>
                  </div>
                  <div className="cp-row">
                    <span>[University B]</span>
                    <span className="r">IRB reliance &middot; active</span>
                  </div>
                  <div className="cp-row">
                    <span>[Clinic network C]</span>
                    <span className="r">Recruitment site</span>
                  </div>
                </div>
              </div>
            )}

            {view === "protocols" && (
              <div>
                <h1>Protocols</h1>
                <div className="cp-lede">Full study protocols and IRB materials.</div>
                <div className="cp-card">
                  <div className="cp-row">
                    <span>Perimenopause Sleep Study &mdash; Protocol v1.3 (PDF)</span>
                    <span className="r">Download</span>
                  </div>
                  <div className="cp-row">
                    <span>Skin Aging Observation &mdash; Protocol v1.2 (PDF)</span>
                    <span className="r">Download</span>
                  </div>
                  <div className="cp-row">
                    <span>Consent templates</span>
                    <span className="r">Download</span>
                  </div>
                </div>
              </div>
            )}

            {view === "gov" && (
              <div>
                <h1>Governance &amp; data</h1>
                <div className="cp-lede">Full governance documentation and data-use agreements.</div>
                <div className="cp-card">
                  <div className="cp-row">
                    <span>Data governance policy (PDF)</span>
                    <span className="r">Download</span>
                  </div>
                  <div className="cp-row">
                    <span>De-identification standard</span>
                    <span className="r">Download</span>
                  </div>
                  <div className="cp-row">
                    <span>Data-use agreement template</span>
                    <span className="r">Download</span>
                  </div>
                  <div className="cp-row">
                    <span>IRB oversight summary</span>
                    <span className="r">Download</span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
