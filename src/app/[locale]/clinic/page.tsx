import type { Metadata } from "next";
import Link from "next/link";
import "./clinic.css";

export const metadata: Metadata = {
  title: "DrRuby.ai — Clinic Portal",
  description:
    "The clinic operating system — today's workbench. Patient data shown by authorization only, referrals routed through the DrRuby platform.",
};

/* ── Sidebar nav model ────────────────────────────────────── */
const NAV_SECTIONS: {
  section: string;
  items: { label: string; active?: boolean; badge?: string; badgeStrong?: boolean }[];
}[] = [
  { section: "Today", items: [{ label: "⊞ Workbench", active: true }] },
  {
    section: "Clinical",
    items: [
      { label: "◎ Review Queue", badge: "5" },
      { label: "◎ Skin Archive" },
      { label: "◎ Patients" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "◎ Appointments", badge: "3" },
      { label: "◎ Treatments & Billing" },
      { label: "◎ CRM & Follow-up" },
    ],
  },
  {
    section: "Platform",
    items: [
      { label: "◎ DrRuby Referrals", badge: "2", badgeStrong: true },
      { label: "◎ Finance & Fees" },
      { label: "◎ Compliance" },
    ],
  },
  {
    section: "Account",
    items: [{ label: "◎ Modules & Billing" }, { label: "◎ Clinic Settings" }],
  },
];

/* ── Review queue rows ────────────────────────────────────── */
type Trend = "up" | "down" | "stable";
const trendClass: Record<Trend, string> = {
  up: "trend-up",
  down: "trend-down",
  stable: "trend-stable",
};

const REVIEW_ROWS: {
  name: string;
  date: string;
  inflammatory: [Trend, string];
  pigmentation: [Trend, string];
  texture: [Trend, string];
  focus?: boolean;
}[] = [
  {
    name: "Sarah Mitchell",
    date: "Jun 8",
    inflammatory: ["stable", "↔ Stable"],
    pigmentation: ["down", "↓ Declining"],
    texture: ["up", "↑ Improving"],
    focus: true,
  },
  {
    name: "Mia Johnson",
    date: "Jun 7",
    inflammatory: ["up", "↑ Improving"],
    pigmentation: ["stable", "↔ Stable"],
    texture: ["up", "↑ Improving"],
  },
  {
    name: "Emily Carter",
    date: "Jun 6",
    inflammatory: ["up", "↑ Improving"],
    pigmentation: ["up", "↑ Improving"],
    texture: ["up", "↑ Strong"],
  },
  {
    name: "Rachel Thompson",
    date: "Jun 5",
    inflammatory: ["stable", "↔ Stable"],
    pigmentation: ["stable", "↔ Stable"],
    texture: ["stable", "↔ Stable"],
  },
  {
    name: "Claire Foster",
    date: "Jun 5",
    inflammatory: ["down", "↓ Declining"],
    pigmentation: ["down", "↓ Declining"],
    texture: ["stable", "↔ Stable"],
  },
];

/* ── Referral cards ───────────────────────────────────────── */
const REFERRALS: {
  name: string;
  meta: string;
  tags: { text: string; tone: "red" | "grey" }[];
  notes: string;
  requested: string;
  shared: string;
}[] = [
  {
    name: "Sophie Davis",
    meta: "Referred via DrRuby · Jun 10, 9:42am",
    tags: [
      { text: "Inflammatory Activity ↑", tone: "red" },
      { text: "Pigmentation ↓", tone: "grey" },
    ],
    notes:
      'Patient notes: "Persistent redness and uneven tone, 3 months. Concerned about early pigmentation."',
    requested: "Consultation",
    shared: "12-week history",
  },
  {
    name: "Jessica Moore",
    meta: "Referred via DrRuby · Jun 9, 3:15pm",
    tags: [
      { text: "Inflammatory Activity ↓", tone: "red" },
      { text: "Structural signals: Phase 2", tone: "grey" },
    ],
    notes:
      'Patient notes: "Persistent redness and texture concerns, 3 months. Interested in structural skin assessment."',
    requested: "Structural Assessment",
    shared: "8-week history",
  },
];

export default function ClinicPage() {
  return (
    <div className="dr-clinic">
      <div className="screen">
        {/* ── Section header ── */}
        <div className="sec-header">
          <div>
            <div className="sec-title">
              Clinic Portal — <em>Today&apos;s Workbench</em>
            </div>
            <div className="sec-sub">诊所操作系统 · 数据由患者授权 · DrRuby 平台转介</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link className="sec-back" href="/">
              ← Homepage
            </Link>
            <div className="sec-badge">Web Only · B2B</div>
          </div>
        </div>

        <div>
          <div className="anno">首屏 — 今日工作台（三件最重要的事）</div>

          <div className="clinic-wrap">
            {/* ── Sidebar ── */}
            <aside className="cp-sidebar">
              <div className="cps-header">
                <div className="cps-logo">
                  Dr<span>Ruby</span>
                </div>
                <div className="cps-clinic">Clarity Skin Clinic</div>
              </div>
              <nav className="cps-nav">
                {NAV_SECTIONS.map((group) => (
                  <div key={group.section}>
                    <div className="cps-section">{group.section}</div>
                    {group.items.map((item) => (
                      <div
                        key={item.label}
                        className={`cps-item${item.active ? " active" : ""}`}
                      >
                        {item.label}
                        {item.badge && (
                          <span
                            className="cps-badge"
                            style={item.badgeStrong ? { background: "var(--red)" } : undefined}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </nav>
              <div className="cps-user">
                <div className="cps-dr">Dr. Sarah Williams</div>
                <div className="cps-role">Lead Dermatologist</div>
              </div>
            </aside>

            {/* ── Main ── */}
            <main className="cp-main">
              <div className="cp-topbar">
                <div>
                  <div className="ctb-title">Good morning, Dr. Chen</div>
                  <div className="ctb-sub">Wednesday Jun 10 · Clarity Skin Clinic</div>
                </div>
                <div className="ctb-right">
                  <div className="ctb-auth">
                    <span className="ctb-auth-dot" />
                    Patient data shown by authorization only
                  </div>
                  <button className="ctb-btn">Generate Report</button>
                </div>
              </div>

              <div className="cp-content">
                {/* ① Priority banner — Review Queue */}
                <div className="priority-banner">
                  <div className="pb-left">
                    <div className="pb-num">5</div>
                    <div>
                      <div className="pb-title">
                        Review Queue — 5 summaries awaiting your review
                      </div>
                      <div className="pb-desc">
                        Patients are waiting — review, edit if needed, then send. Reports stay on
                        DrRuby platform.
                      </div>
                    </div>
                  </div>
                  <button className="ctb-btn" style={{ flexShrink: 0 }}>
                    Review Reports →
                  </button>
                </div>

                {/* Review queue preview */}
                <div className="c-card" style={{ borderTop: "none" }}>
                  <div className="c-card-head">
                    <div className="c-card-title">Review Queue (5)</div>
                    <span className="card-note">
                      AI-drafted summaries · Doctor review required before sending
                    </span>
                  </div>
                  <table className="patient-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Scan Date</th>
                        <th>Inflammatory Activity</th>
                        <th>Pigmentation</th>
                        <th>Texture &amp; Structure</th>
                        <th>Data Auth</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {REVIEW_ROWS.map((row) => (
                        <tr key={row.name} className={row.focus ? "row-focus" : undefined}>
                          <td>
                            <span className="pt-name">{row.name}</span>
                          </td>
                          <td>{row.date}</td>
                          <td>
                            <span className={trendClass[row.inflammatory[0]]}>
                              {row.inflammatory[1]}
                            </span>
                          </td>
                          <td>
                            <span className={trendClass[row.pigmentation[0]]}>
                              {row.pigmentation[1]}
                            </span>
                          </td>
                          <td>
                            <span className={trendClass[row.texture[0]]}>{row.texture[1]}</span>
                          </td>
                          <td>
                            <span className="auth-dot">● Authorized</span>
                          </td>
                          <td>
                            <button
                              className="appt-btn start"
                              style={{ fontSize: 14, padding: "3px 10px" }}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="privacy-note">
                    🔒 <strong>Data Privacy:</strong> You are seeing only data each patient has
                    explicitly authorized to share with this clinic. Patients can revoke access at
                    any time from their DrRuby app. Full patient profiles remain on DrRuby platform.
                  </div>
                </div>

                {/* ② Today's Appointments + ③ New Referrals */}
                <div className="cp-two">
                  {/* Today's Appointments */}
                  <div className="c-card">
                    <div className="c-card-head">
                      <div className="c-card-title">Today&apos;s Appointments</div>
                      <span className="card-note">8 total · 3 remaining</span>
                    </div>
                    <div className="appt-list">
                      <div className="appt-item done">
                        <div className="appt-time">
                          9:00<small>AM</small>
                        </div>
                        <div className="appt-patient">
                          <div className="appt-pt-name">Emily Carter</div>
                          <div className="appt-pt-type">Skin Follow-up · Done</div>
                        </div>
                      </div>
                      <div className="appt-item done">
                        <div className="appt-time">
                          10:30<small>AM</small>
                        </div>
                        <div className="appt-patient">
                          <div className="appt-pt-name">Mia Johnson</div>
                          <div className="appt-pt-type">Treatment Review · Done</div>
                        </div>
                      </div>
                      <div className="appt-item now">
                        <div className="appt-time">
                          1:00<small>PM</small>
                        </div>
                        <div className="appt-patient">
                          <div className="appt-pt-name">Sarah Mitchell</div>
                          <div className="appt-pt-type">
                            Report Review · <span className="hl">Now</span>
                          </div>
                        </div>
                        <div className="appt-actions">
                          <button className="appt-btn start">Start</button>
                        </div>
                      </div>
                      <div className="appt-item">
                        <div className="appt-time">
                          3:00<small>PM</small>
                        </div>
                        <div className="appt-patient">
                          <div className="appt-pt-name">Rachel Thompson</div>
                          <div className="appt-pt-type">Skin Consultation</div>
                        </div>
                        <div className="appt-actions">
                          <button className="appt-btn view">View</button>
                        </div>
                      </div>
                      <div className="appt-item">
                        <div className="appt-time">
                          4:30<small>PM</small>
                        </div>
                        <div className="appt-patient">
                          <div className="appt-pt-name">Sophie Davis</div>
                          <div className="appt-pt-type">
                            Initial Consult · <span className="referral">DrRuby Referral</span>
                          </div>
                        </div>
                        <div className="appt-actions">
                          <button className="appt-btn view">View</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New Referrals from DrRuby */}
                  <div className="c-card card-red-top">
                    <div className="c-card-head">
                      <div className="ref-head-title">New DrRuby Referrals</div>
                      <span className="ref-count">2 NEW</span>
                    </div>
                    <div className="ref-list">
                      {REFERRALS.map((ref) => (
                        <div key={ref.name} className="ref-card">
                          <div className="ref-card-head">
                            <div>
                              <div className="ref-name">{ref.name}</div>
                              <div className="ref-meta">{ref.meta}</div>
                            </div>
                            <span className="ref-new">NEW</span>
                          </div>
                          <div className="ref-tags">
                            {ref.tags.map((tag) => (
                              <div key={tag.text} className={`ref-tag ${tag.tone}`}>
                                {tag.text}
                              </div>
                            ))}
                          </div>
                          <div className="ref-notes">{ref.notes}</div>
                          <div className="ref-facts">
                            <div>
                              <span className="k">Requested:</span>{" "}
                              <span className="v">{ref.requested}</span>
                            </div>
                            <div>
                              <span className="k">Shared:</span>{" "}
                              <span className="v">{ref.shared}</span>
                            </div>
                          </div>
                          <div className="ref-warn">
                            ⚠ Showing authorized data only · Patient controls full access
                          </div>
                          <div className="ref-actions">
                            <button className="appt-btn start">Accept</button>
                            <button className="appt-btn view">View Profile</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Finance summary strip */}
                <div className="finance-strip">
                  <div className="finance-cell">
                    <div className="kpi-label">This Month Revenue</div>
                    <div className="kpi-val">$12,840</div>
                    <div className="kpi-trend">
                      <span className="up">↑ 18%</span> vs last month
                    </div>
                  </div>
                  <div className="finance-cell">
                    <div className="kpi-label">DrRuby Referral Income</div>
                    <div className="kpi-val red">$2,480</div>
                    <div className="kpi-trend">8 appointments this month</div>
                  </div>
                  <div className="finance-cell">
                    <div className="kpi-label">Platform Module Fee</div>
                    <div className="kpi-val mut">
                      $480<small>/mo</small>
                    </div>
                    <div className="kpi-trend">Pro Plan · 4 modules active</div>
                  </div>
                  <div className="finance-cell net">
                    <div className="kpi-label">Net from DrRuby</div>
                    <div className="kpi-val red">+$2,000</div>
                    <div className="kpi-trend">Referral income minus platform fee</div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
