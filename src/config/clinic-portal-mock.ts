// Clinic Portal (B2B) mock data — sourced from tech-index/index.html Clinic Portal
// mockup and website-clinic-portal.md spec. Replace with real API in production.
// Per spec §0.2: every patient record below is "authorized data only" — clinics
// see snapshots the patient explicitly shared, not the full DrRuby profile.

// ── Clinic identity (spec §1.1 sidebar header) ──
export const CLINIC_USER = {
  doctorName: "Dr. Sarah Williams",
  role: "Lead Dermatologist",
  initials: "SW",
  greeting: "Good morning, Dr. Williams",
};

export const CLINIC_PROFILE = {
  name: "Clarity Skin Clinic",
  topbarSub: "Wednesday Jun 10 · Clarity Skin Clinic",
};

// ── Sidebar navigation (spec §1.1) ──
export interface ClinicNavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  badgeTone?: "red" | "green";
}

export interface ClinicNavSection {
  label: string;
  items: ClinicNavItem[];
}

export const CLINIC_NAV: ClinicNavSection[] = [
  {
    label: "Today",
    items: [{ label: "Workbench", href: "/clinic", icon: "⊞" }],
  },
  {
    label: "Clinical",
    items: [
      { label: "AI Reports", href: "/clinic/reports/queue", icon: "◎", badge: "5" },
      { label: "Skin Archive", href: "/clinic/skin-archive", icon: "◎" },
      { label: "Patients", href: "/clinic/patients", icon: "◎" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Appointments", href: "/clinic/appointments", icon: "◎", badge: "3 new" },
      { label: "Treatments & Billing", href: "/clinic/treatments", icon: "◎" },
      { label: "CRM & Follow-up", href: "/clinic/crm", icon: "◎" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "DrRuby Referrals", href: "/clinic/referrals", icon: "◎", badge: "2", badgeTone: "green" },
      { label: "Finance & Fees", href: "/clinic/finance", icon: "◎" },
      { label: "Compliance", href: "/clinic/compliance", icon: "◎" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Modules & Billing", href: "/clinic/modules", icon: "◎" },
      { label: "Clinic Settings", href: "/clinic/settings", icon: "◎" },
    ],
  },
];

// ── Brenner Index score → tone (spec §2.1 ②, §5.4) ──
export type ScoreTone = "good" | "warn" | "alert";

export function toneForScore(score: number): ScoreTone {
  if (score >= 70) return "good";
  if (score >= 50) return "warn";
  return "alert";
}

export const SCORE_TONE_STYLE: Record<ScoreTone, string> = {
  good: "text-dr-success",
  warn: "text-dr-warn",
  alert: "text-dr-red",
};

// ── Patient (spec §5) ──
export type PatientStatus = "active" | "pending" | "new";

export interface Patient {
  id: string;
  name: string;
  ageRange: string;
  concern: string;
  lastScan: string;
  indices: { inflammation: number; pigment: number; collagen: number };
  authStatus: "authorized" | "partial" | "pending";
  status: PatientStatus;
  nextAppointment?: string;
}

export const PATIENTS: Patient[] = [
  {
    id: "pt-sarah-mitchell",
    name: "Sarah Mitchell",
    ageRange: "30–35",
    concern: "Persistent redness, uneven tone",
    lastScan: "Jun 8",
    indices: { inflammation: 61, pigment: 48, collagen: 74 },
    authStatus: "authorized",
    status: "active",
    nextAppointment: "Jun 10 · 1:00 PM",
  },
  {
    id: "pt-mia-johnson",
    name: "Mia Johnson",
    ageRange: "25–30",
    concern: "Post-treatment follow-up",
    lastScan: "Jun 7",
    indices: { inflammation: 78, pigment: 55, collagen: 82 },
    authStatus: "authorized",
    status: "active",
    nextAppointment: "Jun 10 · 10:30 AM",
  },
  {
    id: "pt-emily-carter",
    name: "Emily Carter",
    ageRange: "35–40",
    concern: "Barrier recovery tracking",
    lastScan: "Jun 6",
    indices: { inflammation: 84, pigment: 72, collagen: 88 },
    authStatus: "authorized",
    status: "active",
    nextAppointment: "Jun 10 · 9:00 AM",
  },
  {
    id: "pt-rachel-thompson",
    name: "Rachel Thompson",
    ageRange: "40–45",
    concern: "Pigmentation monitoring",
    lastScan: "Jun 5",
    indices: { inflammation: 66, pigment: 59, collagen: 63 },
    authStatus: "authorized",
    status: "pending",
  },
  {
    id: "pt-claire-foster",
    name: "Claire Foster",
    ageRange: "30–35",
    concern: "Inflammation flare-up",
    lastScan: "Jun 5",
    indices: { inflammation: 44, pigment: 41, collagen: 58 },
    authStatus: "authorized",
    status: "active",
  },
  {
    id: "pt-sophie-davis",
    name: "Sophie Davis",
    ageRange: "25–30",
    concern: "Persistent redness and uneven tone, 3 months",
    lastScan: "Jun 10",
    indices: { inflammation: 52, pigment: 48, collagen: 70 },
    authStatus: "authorized",
    status: "new",
    nextAppointment: "Jun 10 · 4:30 PM",
  },
  {
    id: "pt-jessica-moore",
    name: "Jessica Moore",
    ageRange: "35–40",
    concern: "Collagen loss assessment",
    lastScan: "Jun 9",
    indices: { inflammation: 44, pigment: 65, collagen: 51 },
    authStatus: "authorized",
    status: "new",
  },
];

export const PATIENT_STATUS_STYLE: Record<PatientStatus, string> = {
  active: "text-dr-success bg-[rgba(31,158,90,0.1)]",
  pending: "text-dr-warn bg-[rgba(184,106,0,0.1)]",
  new: "text-dr-red bg-[rgba(200,16,46,0.07)]",
};

// ── Workbench · AI Report queue (spec §2.1 ① ②) ──
export interface PendingReport {
  id: string;
  patientId: string;
  patientName: string;
  scanDate: string;
  indices: { inflammation: number; pigment: number; collagen: number };
  authStatus: "authorized";
  urgent?: boolean;
}

export const PENDING_REPORTS: PendingReport[] = [
  {
    id: "rpt-001",
    patientId: "pt-sarah-mitchell",
    patientName: "Sarah Mitchell",
    scanDate: "Jun 8",
    indices: { inflammation: 61, pigment: 48, collagen: 74 },
    authStatus: "authorized",
    urgent: true,
  },
  {
    id: "rpt-002",
    patientId: "pt-mia-johnson",
    patientName: "Mia Johnson",
    scanDate: "Jun 7",
    indices: { inflammation: 78, pigment: 55, collagen: 82 },
    authStatus: "authorized",
  },
  {
    id: "rpt-003",
    patientId: "pt-emily-carter",
    patientName: "Emily Carter",
    scanDate: "Jun 6",
    indices: { inflammation: 84, pigment: 72, collagen: 88 },
    authStatus: "authorized",
  },
  {
    id: "rpt-004",
    patientId: "pt-rachel-thompson",
    patientName: "Rachel Thompson",
    scanDate: "Jun 5",
    indices: { inflammation: 66, pigment: 59, collagen: 63 },
    authStatus: "authorized",
  },
  {
    id: "rpt-005",
    patientId: "pt-claire-foster",
    patientName: "Claire Foster",
    scanDate: "Jun 5",
    indices: { inflammation: 44, pigment: 41, collagen: 58 },
    authStatus: "authorized",
  },
];

// ── Workbench · Today's Appointments (spec §2.1 ③, §6.2) ──
export interface ClinicAppointment {
  id: string;
  time: string;
  meridiem: "AM" | "PM";
  patientName: string;
  type: string;
  state: "done" | "now" | "upcoming";
  isDrRubyReferral?: boolean;
}

export const TODAY_APPOINTMENTS: ClinicAppointment[] = [
  {
    id: "apt-t1",
    time: "9:00",
    meridiem: "AM",
    patientName: "Emily Carter",
    type: "Skin Follow-up · Done",
    state: "done",
  },
  {
    id: "apt-t2",
    time: "10:30",
    meridiem: "AM",
    patientName: "Mia Johnson",
    type: "Treatment Review · Done",
    state: "done",
  },
  {
    id: "apt-t3",
    time: "1:00",
    meridiem: "PM",
    patientName: "Sarah Mitchell",
    type: "Report Review · Now",
    state: "now",
  },
  {
    id: "apt-t4",
    time: "3:00",
    meridiem: "PM",
    patientName: "Rachel Thompson",
    type: "Skin Consultation",
    state: "upcoming",
  },
  {
    id: "apt-t5",
    time: "4:30",
    meridiem: "PM",
    patientName: "Sophie Davis",
    type: "Initial Consult · DrRuby Referral",
    state: "upcoming",
    isDrRubyReferral: true,
  },
];

export const APPOINTMENTS_TODAY_META = { total: 8, remaining: 3 };

// ── Workbench · New DrRuby Referrals (spec §2.1 ③, §9) ──
export interface DrRubyReferral {
  id: string;
  patientName: string;
  referredAt: string;
  indices: { label: string; value: number }[];
  patientNotes: string;
}

export const NEW_REFERRALS: DrRubyReferral[] = [
  {
    id: "ref-001",
    patientName: "Sophie Davis",
    referredAt: "Jun 10, 9:42am",
    indices: [
      { label: "Inflammation", value: 52 },
      { label: "Pigment", value: 48 },
    ],
    patientNotes:
      '"Persistent redness and uneven tone, 3 months. Concerned about early pigmentation."',
  },
  {
    id: "ref-002",
    patientName: "Jessica Moore",
    referredAt: "Jun 9, 3:15pm",
    indices: [
      { label: "Inflammation", value: 44 },
      { label: "Collagen", value: 51 },
    ],
    patientNotes:
      '"Looking for professional assessment of collagen loss and treatment options."',
  },
];

// ── Workbench · Finance Summary (spec §2.2) ──
export const FINANCE_KPIS = {
  thisMonthRevenue: { value: "$12,840", trend: "↑ 18% vs last month", tone: "up" },
  drRubyReferralIncome: {
    value: "$2,480",
    trend: "8 appointments this month",
    tone: "green",
  },
  platformModuleFee: {
    value: "$480/mo",
    trend: "Pro Plan · 4 modules active",
    tone: "neutral",
  },
  netFromDrRuby: {
    value: "+$2,000",
    trend: "Referral income minus platform fee",
    tone: "green",
  },
};

// ── AI Report review (spec §3.3) ──
export interface ReportFinding {
  level: "good" | "warn" | "alert";
  tag: string;
  title: string;
  desc: string;
}

export interface ReportReview {
  id: string;
  patientName: string;
  patientId: string;
  scanDate: string;
  authStatus: "authorized";
  indices: {
    inflammation: { value: number; trend: string };
    pigment: { value: number; trend: string };
    collagen: { value: number; trend: string };
  };
  aiDraft: {
    summary: string;
    findings: ReportFinding[];
  };
  authorizedData: string[];
}

export const REPORT_REVIEW: Record<string, ReportReview> = {
  "rpt-001": {
    id: "rpt-001",
    patientName: "Sarah Mitchell",
    patientId: "pt-sarah-mitchell",
    scanDate: "Jun 8, 2026",
    authStatus: "authorized",
    indices: {
      inflammation: { value: 61, trend: "↓ 8 vs last scan" },
      pigment: { value: 48, trend: "↓ 6 vs last scan" },
      collagen: { value: 74, trend: "↑ 3 vs last scan" },
    },
    aiDraft: {
      summary:
        "Barrier function showing mild inflammation with pigment changes concentrated on the cheeks. Collagen kinetics continue to improve, consistent with the peptide serum introduced 4 weeks ago. Recommend follow-up on pigmentation before adjusting protocol.",
      findings: [
        {
          level: "good",
          tag: "Positive",
          title: "Collagen Kinetics improving",
          desc: "Up 3 points vs last scan — consistent with peptide serum introduction 4 weeks ago.",
        },
        {
          level: "warn",
          tag: "Monitor",
          title: "Pigment Load decreasing",
          desc: "Down 6 points — sunscreen compliance may have dropped. Worth confirming with patient.",
        },
        {
          level: "alert",
          tag: "Action",
          title: "Inflammation elevated",
          desc: "61/100 — persisting above baseline. Consider reviewing topical routine and lifestyle factors.",
        },
      ],
    },
    authorizedData: [
      "Skin scan history (last 90 days)",
      "Three Brenner Indices (Inflammation, Pigment, Collagen)",
      "Self-reported concerns: redness, uneven tone",
    ],
  },
};

// ── Skin Archive (spec §4) ──
export interface ScanRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  bodyZone: string;
  indices: { inflammation: number; pigment: number; collagen: number };
  note?: string;
}

export const SCAN_RECORDS: ScanRecord[] = [
  {
    id: "scan-001",
    patientId: "pt-sarah-mitchell",
    patientName: "Sarah Mitchell",
    date: "Jun 8, 2026",
    bodyZone: "Left cheek",
    indices: { inflammation: 61, pigment: 48, collagen: 74 },
    note: "4-week follow-up after peptide serum",
  },
  {
    id: "scan-002",
    patientId: "pt-sarah-mitchell",
    patientName: "Sarah Mitchell",
    date: "May 11, 2026",
    bodyZone: "Left cheek",
    indices: { inflammation: 69, pigment: 54, collagen: 71 },
    note: "Baseline before peptide serum",
  },
  {
    id: "scan-003",
    patientId: "pt-mia-johnson",
    patientName: "Mia Johnson",
    date: "Jun 7, 2026",
    bodyZone: "Forehead",
    indices: { inflammation: 78, pigment: 55, collagen: 82 },
  },
  {
    id: "scan-004",
    patientId: "pt-emily-carter",
    patientName: "Emily Carter",
    date: "Jun 6, 2026",
    bodyZone: "Chin",
    indices: { inflammation: 84, pigment: 72, collagen: 88 },
    note: "Barrier recovery tracking",
  },
  {
    id: "scan-005",
    patientId: "pt-claire-foster",
    patientName: "Claire Foster",
    date: "Jun 5, 2026",
    bodyZone: "Right cheek",
    indices: { inflammation: 44, pigment: 41, collagen: 58 },
    note: "Inflammation flare-up — review trigger",
  },
];

// ── Treatments & Billing (spec §7) ──
export interface TreatmentPackage {
  id: string;
  patientName: string;
  name: string;
  totalSessions: number;
  usedSessions: number;
  price: string;
  validPeriod: string;
}

export const TREATMENT_PACKAGES: TreatmentPackage[] = [
  {
    id: "tp-001",
    patientName: "Sarah Mitchell",
    name: "Laser Rejuvenation · 6-session pack",
    totalSessions: 6,
    usedSessions: 2,
    price: "$1,800",
    validPeriod: "12 months",
  },
  {
    id: "tp-002",
    patientName: "Mia Johnson",
    name: "Chemical Peel · 4-session pack",
    totalSessions: 4,
    usedSessions: 3,
    price: "$960",
    validPeriod: "8 months",
  },
  {
    id: "tp-003",
    patientName: "Emily Carter",
    name: "Barrier Repair · 8-session pack",
    totalSessions: 8,
    usedSessions: 5,
    price: "$2,200",
    validPeriod: "12 months",
  },
];

export interface InvoiceRecord {
  id: string;
  date: string;
  patientName: string;
  item: string;
  amount: string;
  status: "paid" | "pending" | "overdue";
  hasReferralFee?: boolean;
}

export const INVOICES: InvoiceRecord[] = [
  {
    id: "inv-001",
    date: "Jun 10",
    patientName: "Emily Carter",
    item: "Skin Follow-up",
    amount: "$220",
    status: "paid",
  },
  {
    id: "inv-002",
    date: "Jun 10",
    patientName: "Mia Johnson",
    item: "Treatment Review · Chemical Peel",
    amount: "$240",
    status: "paid",
  },
  {
    id: "inv-003",
    date: "Jun 8",
    patientName: "Sophie Davis",
    item: "Initial Consult (DrRuby Referral)",
    amount: "$180",
    status: "pending",
    hasReferralFee: true,
  },
  {
    id: "inv-004",
    date: "Jun 5",
    patientName: "Claire Foster",
    item: "Inflammation Consult",
    amount: "$220",
    status: "overdue",
  },
];

// ── Finance & Fees (spec §10) ──
export const FINANCE_REPORT = {
  monthly: [
    { month: "January", revenue: "$11,200", referralIncome: "$1,840", fee: "$480" },
    { month: "February", revenue: "$10,980", referralIncome: "$1,640", fee: "$480" },
    { month: "March", revenue: "$12,440", referralIncome: "$2,100", fee: "$480" },
    { month: "April", revenue: "$11,860", referralIncome: "$1,920", fee: "$480" },
    { month: "May", revenue: "$10,880", referralIncome: "$2,080", fee: "$480" },
    { month: "June", revenue: "$12,840", referralIncome: "$2,480", fee: "$480" },
  ],
  conversionFunnel: [
    { stage: "DrRuby Referrals", value: 100 },
    { stage: "Appointment Confirmed", value: 78 },
    { stage: "Visit Completed", value: 64 },
    { stage: "Treatment Completed", value: 41 },
    { stage: "Repurchase", value: 28 },
  ],
};

// ── Compliance (spec §11) ──
export const COMPLIANCE_DOCS = [
  {
    id: "doc-001",
    type: "Informed Consent",
    patientName: "Sarah Mitchell",
    signedDate: "May 11, 2026",
    status: "archived",
  },
  {
    id: "doc-002",
    type: "Informed Consent",
    patientName: "Mia Johnson",
    signedDate: "May 25, 2026",
    status: "archived",
  },
  {
    id: "doc-003",
    type: "Treatment Plan Acknowledgment",
    patientName: "Emily Carter",
    signedDate: "Jun 6, 2026",
    status: "archived",
  },
  {
    id: "doc-004",
    type: "Informed Consent",
    patientName: "Sophie Davis",
    signedDate: "—",
    status: "pending",
  },
];

// ── Modules & Billing (spec §12) ──
export interface ClinicModule {
  id: string;
  name: string;
  status: "active" | "inactive";
  description: string;
}

export const CLINIC_MODULES: ClinicModule[] = [
  {
    id: "mod-skin-archive",
    name: "Skin Archive",
    status: "active",
    description: "Before/after comparison · AI scores · Authorized patient data",
  },
  {
    id: "mod-ai-reports",
    name: "AI Reports",
    status: "active",
    description: "AI drafts · Doctor review · Stay on DrRuby platform",
  },
  {
    id: "mod-appointments",
    name: "Appointments",
    status: "active",
    description: "DrRuby referrals · Multi-dim scheduling · Reminders",
  },
  {
    id: "mod-compliance",
    name: "Compliance",
    status: "active",
    description: "E-consents · Operating dashboard · Conversion tracking",
  },
  {
    id: "mod-treatments",
    name: "Treatments & Billing",
    status: "inactive",
    description: "Treatment packages · Invoices · CRM follow-up",
  },
];

export const CURRENT_PLAN = {
  name: "Pro Plan",
  price: "$480/mo",
  activeModules: 4,
  usage: {
    aiReports: "32 / 100",
    referrals: "8 / 25",
    appointments: "47 / 120",
  },
};

// ── Clinic Settings (spec §13) ──
export const CLINIC_SETTINGS = {
  profile: {
    name: "Clarity Skin Clinic",
    logo: "✦",
    address: "8215 Sunset Blvd, West Hollywood, CA",
    phone: "+1 (310) 555-0142",
    hours: "Mon–Sat · 9:00 AM – 6:00 PM",
    specialties: ["Dermatology", "Aesthetic"],
  },
  team: [
    {
      id: "tm-1",
      name: "Dr. Sarah Williams",
      role: "Lead Dermatologist",
      email: "s.williams@clarity.skin",
    },
    {
      id: "tm-2",
      name: "Dr. James Lee",
      role: "Dermatologist",
      email: "j.lee@clarity.skin",
    },
    {
      id: "tm-3",
      name: "Maya Patel",
      role: "Receptionist",
      email: "m.patel@clarity.skin",
    },
    {
      id: "tm-4",
      name: "Olivia Chen",
      role: "Admin",
      email: "o.chen@clarity.skin",
    },
  ],
  machines: [
    { id: "mc-1", name: "DermaScope Pro", purchased: "Jan 2025", lastService: "May 2026" },
    { id: "mc-2", name: "Laser X-3", purchased: "Aug 2024", lastService: "Apr 2026" },
  ],
};

// ── Patient detail (spec §5.2) ──
export interface PatientTimelineEntry {
  date: string;
  label: string;
  detail: string;
  type: "scan" | "report" | "treatment" | "appointment";
}

export function getPatientTimeline(patientId: string): PatientTimelineEntry[] {
  const map: Record<string, PatientTimelineEntry[]> = {
    "pt-sarah-mitchell": [
      { date: "Jun 8", label: "Skin scan uploaded", detail: "Inflammation 61 · Pigment 48 · Collagen 74", type: "scan" },
      { date: "Jun 8", label: "AI Report draft generated", detail: "Awaiting doctor review", type: "report" },
      { date: "May 11", label: "Skin scan (baseline)", detail: "Peptide serum introduced", type: "scan" },
      { date: "May 11", label: "Treatment pack purchased", detail: "Laser Rejuvenation · 6 sessions", type: "treatment" },
      { date: "May 11", label: "Informed consent signed", detail: "Archived to DrRuby platform", type: "appointment" },
      { date: "Jun 10", label: "Report Review · 1:00 PM", detail: "Today's appointment", type: "appointment" },
    ],
  };
  return map[patientId] ?? [];
}

export function getPatientById(id: string): Patient | undefined {
  return PATIENTS.find((p) => p.id === id);
}
