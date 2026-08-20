// User Portal mock data — sourced from tech-index/index.html User Portal mockup
// and website-user-portal.md spec. Replace with real API in production.

export type InsightPriority = "P0" | "P1" | "P2" | "P3";

export interface ProactiveInsight {
  id: string;
  priority: InsightPriority;
  headline: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
  source?: string;
}

// §6 Proactive Insight — currently triggered (only 1 within 72h)
export const ACTIVE_INSIGHT: ProactiveInsight | null = {
  id: "insight-001",
  priority: "P1",
  headline: "I noticed your HRV dropped 18% in the last 10 days",
  detail:
    "The last time your HRV dropped like this, your skin changed 10 days later. Worth a quick check-in.",
  ctaLabel: "Look into this →",
  ctaHref: "/portal/moment/skin",
  source: "Pattern matched · Jun 14",
};

// §3.2 Three Trigger entries (fixed order, cannot reorder)
export interface HomeTrigger {
  id: "skin-changed" | "stack-worth" | "feel-different";
  index: string;
  title: string;
  subtitle: string;
  href: string;
  comingSoon?: boolean;
}

export const HOME_TRIGGERS: HomeTrigger[] = [
  {
    id: "skin-changed",
    index: "01",
    title: "My skin changed",
    subtitle: "Something looks or feels different lately",
    href: "/portal/moment/skin",
  },
  {
    id: "stack-worth",
    index: "02",
    title: "Is this worth it?",
    subtitle: "Check if a supplement or product is helping you",
    href: "/portal/moment/stack",
  },
  {
    id: "feel-different",
    index: "03",
    title: "I feel different",
    subtitle: "Energy, sleep, mood, hormonal changes",
    href: "/portal/moment/feel",
    comingSoon: true,
  },
];

// Sidebar navigation structure (§1.1)
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  active?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const PORTAL_NAV: NavSection[] = [
  {
    label: "My Health",
    items: [
      { label: "Dashboard", href: "/portal", icon: "◉", active: true },
      { label: "Skin Analysis", href: "/portal/skin", icon: "◎" },
      { label: "Healthspan", href: "/portal/healthspan", icon: "◎" },
      { label: "My Health Profile", href: "/portal/profile", icon: "◎" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { label: "AI Reports", href: "/portal/reports", icon: "◎", badge: "2" },
      { label: "Personal Coach", href: "/portal/coach", icon: "◎" },
    ],
  },
  {
    label: "Care",
    items: [
      { label: "Book a Clinic", href: "/portal/clinic", icon: "◎" },
      { label: "Products & Plans", href: "/portal/products", icon: "◎" },
      { label: "Appointments", href: "/portal/appointments", icon: "◎" },
    ],
  },
];

// User info (mock)
// TODO: PortalHome.tsx（dead code）迁移 session 后删除此 export；PortalSidebar/
// PortalTopbar 已在 task-24 改用 authClient.useSession，不再读此处。
export const PORTAL_USER = {
  firstName: "Ruby",
  fullName: "Ruby Johnson",
  email: "rubysun@gmail.com",
  initials: "RJ",
  connectedSources: 4,
};

// §2.1 Onboarding screen 1 — single question with chip options
export const ONBOARDING_CONCERNS = [
  { id: "skin-tired", label: "My skin looks tired / dull" },
  { id: "breakouts", label: "I'm breaking out more than usual" },
  { id: "skin-changed", label: "My skin changed and I don't know why" },
  { id: "supplements", label: "I want to know if my supplements are working" },
  {
    id: "feel-different",
    label: "I feel different — energy, sleep, or mood",
  },
] as const;

// §4.1 Moment 1 — multi-select chip options
export const MOMENT1_SYMPTOMS = [
  { id: "dryness", label: "Dryness" },
  { id: "dullness", label: "Dullness" },
  { id: "breakouts", label: "Breakouts" },
  { id: "less-firm", label: "Less firm" },
  { id: "all", label: "All of the above" },
] as const;

// §4.1 Loading data sources (fade-in one by one)
export const MOMENT1_DATA_SOURCES = [
  "Sleep quality",
  "HRV trends",
  "Skin photos",
  "Cycle data",
];

// §5.1 Moment 2 — supplement options
export const MOMENT2_SUPPLEMENTS = [
  { id: "nmn", label: "NMN" },
  { id: "collagen", label: "Collagen" },
  { id: "vitamin-d", label: "Vitamin D" },
  { id: "magnesium", label: "Magnesium" },
  { id: "omega-3", label: "Omega-3" },
  { id: "other", label: "Other" },
] as const;

export const MOMENT2_DURATIONS = [
  { id: "lt-2w", label: "Less than 2 weeks" },
  { id: "2-4w", label: "2–4 weeks" },
  { id: "1-2m", label: "1–2 months" },
  { id: "3m-plus", label: "3+ months" },
] as const;

export const MOMENT2_DATA_SOURCES = [
  "Skin health status",
  "Sleep depth",
  "HRV trend",
];

// §5.2 Verdict types
export type VerdictType = "CONTINUE" | "STOP" | "PARTIAL" | "TOO_EARLY";

export interface VerdictConfig {
  type: VerdictType;
  borderColor: string;
  bgColor: string;
  textColor: string;
  headline: string;
}

export const VERDICT_CONFIG: Record<VerdictType, VerdictConfig> = {
  CONTINUE: {
    type: "CONTINUE",
    borderColor: "border-dr-success",
    bgColor: "bg-[rgba(31,158,90,0.06)]",
    textColor: "text-dr-success",
    headline: "It's working. Keep going.",
  },
  STOP: {
    type: "STOP",
    borderColor: "border-dr-red",
    bgColor: "bg-[rgba(200,16,46,0.05)]",
    textColor: "text-dr-red",
    headline: "No signal in your data. Pause and save the money.",
  },
  PARTIAL: {
    type: "PARTIAL",
    borderColor: "border-dr-warn",
    bgColor: "bg-[rgba(184,106,0,0.06)]",
    textColor: "text-dr-warn",
    headline: "Working for [X]. Not for [Y].",
  },
  TOO_EARLY: {
    type: "TOO_EARLY",
    borderColor: "border-[#4fc3f7]",
    bgColor: "bg-[rgba(79,195,247,0.06)]",
    textColor: "text-[#4fc3f7]",
    headline: "Give it [N] more weeks. We'll check again.",
  },
};

// §7.1 Answer page — 6-block structure
export interface AnswerDataCard {
  icon: string;
  metricName: string;
  currentValue: string;
  delta: string;
  deltaDir: "up" | "down" | "flat";
  trend: number[]; // mini trend bar values
}

export interface AnswerData {
  headline: string;
  subtitle: string;
  dataCards: AnswerDataCard[];
  explanation: string;
  actionCard: {
    timeframe: string;
    text: string;
  };
  saveCard: string;
  isRefer?: boolean;
  referText?: string;
}

// Mock answer for Moment 1 (skin changed — breakouts)
export const MOMENT1_ANSWER: AnswerData = {
  headline: "This isn't just your skin.",
  subtitle: "Based on your last 6 weeks of data",
  dataCards: [
    {
      icon: "😴",
      metricName: "Sleep recovery",
      currentValue: "61/100",
      delta: "↓ 18% vs baseline",
      deltaDir: "down",
      trend: [78, 76, 74, 70, 66, 62, 61],
    },
    {
      icon: "❤️",
      metricName: "HRV (SDNN)",
      currentValue: "32 ms",
      delta: "↓ 22% vs baseline",
      deltaDir: "down",
      trend: [44, 42, 40, 38, 35, 33, 32],
    },
    {
      icon: "🌡️",
      metricName: "Cycle day",
      currentValue: "Day 24",
      delta: "→ No significant change",
      deltaDir: "flat",
      trend: [24, 24, 24, 24, 24, 24, 24],
    },
  ],
  explanation:
    "Your skin barrier weakened before the visible changes. Sleep recovery and HRV both dropped over the past 10 days — this pattern typically precedes breakouts by 7–10 days. The inflammation you're seeing is systemic, not topical.",
  actionCard: {
    timeframe: "Next 7 days",
    text: "Prioritize sleep consistency over duration. Same bedtime every night — even on weekends.",
  },
  saveCard:
    "Adding a new serum right now won't help — this is systemic, not topical. Save the $80.",
};

// Mock answer for Moment 2 — TOO_EARLY verdict (§5.2: < 4 weeks of use)
// §5.3: new supplement entry auto-enters TOO_EARLY verdict flow
export const MOMENT2_TOO_EARLY_ANSWER: AnswerData = {
  headline: "Too early to tell — but we're watching.",
  subtitle: "Based on patterns typical for women your age · 2 weeks in",
  dataCards: [
    {
      icon: "😴",
      metricName: "Sleep depth",
      currentValue: "—",
      delta: "→ No significant change",
      deltaDir: "flat",
      trend: [50, 51, 50, 52, 51, 50, 51],
    },
    {
      icon: "❤️",
      metricName: "HRV (SDNN)",
      currentValue: "38 ms",
      delta: "→ No significant change",
      deltaDir: "flat",
      trend: [37, 38, 38, 39, 38, 38, 38],
    },
    {
      icon: "🧴",
      metricName: "Skin redness",
      currentValue: "—",
      delta: "→ No significant change",
      deltaDir: "flat",
      trend: [60, 60, 60, 60, 60, 60, 60],
    },
  ],
  explanation:
    "Magnesium typically takes 2–4 weeks to show measurable effects on sleep depth and HRV. Your data so far is stable — no degradation, but no signal yet. We'll check again at the 4-week mark.",
  actionCard: {
    timeframe: "Next 2 weeks",
    text: "Keep taking it consistently. Don't adjust the dose — we need a stable baseline to read the signal.",
  },
  saveCard:
    "Don't stack a second sleep supplement hoping for faster results. The data needs time, not more inputs.",
};

// §5.4 Supplement → target indicator mapping (Brenner-reviewed)
export const SUPPLEMENT_TARGETS: Record<
  string,
  { primary: string[]; secondary: string[]; onsetWeeks: string }
> = {
  nmn: {
    primary: ["HRV", "Activity energy"],
    secondary: ["Sleep depth", "Barrier state"],
    onsetWeeks: "8–12",
  },
  collagen: {
    primary: ["Barrier state", "Skin hydration"],
    secondary: ["Joint comfort (self-report)"],
    onsetWeeks: "4–8",
  },
  "vitamin-d": {
    primary: ["Sleep quality", "Mood (self-report)"],
    secondary: ["Barrier state"],
    onsetWeeks: "4–6",
  },
  magnesium: {
    primary: ["Sleep depth", "HRV"],
    secondary: ["Stress (self-report)"],
    onsetWeeks: "2–4",
  },
  "omega-3": {
    primary: ["Barrier state", "HRV"],
    secondary: ["Inflammation (self-report)"],
    onsetWeeks: "6–10",
  },
  other: {
    primary: ["User-defined target"],
    secondary: [],
    onsetWeeks: "6 (default)",
  },
};

// Mock answer for Moment 2 (Magnesium, 4+ weeks → CONTINUE)
export const MOMENT2_ANSWER: AnswerData = {
  headline: "Your magnesium is doing its job.",
  subtitle: "Based on 4 weeks of data since you started",
  dataCards: [
    {
      icon: "😴",
      metricName: "Sleep depth",
      currentValue: "+14%",
      delta: "↑ 14% vs baseline",
      deltaDir: "up",
      trend: [50, 52, 55, 58, 60, 62, 64],
    },
    {
      icon: "❤️",
      metricName: "HRV (SDNN)",
      currentValue: "41 ms",
      delta: "↑ 9% vs baseline",
      deltaDir: "up",
      trend: [36, 37, 38, 39, 40, 40, 41],
    },
    {
      icon: "🧴",
      metricName: "Skin redness",
      currentValue: "−12%",
      delta: "↓ 12% vs baseline",
      deltaDir: "down",
      trend: [60, 58, 55, 52, 50, 48, 47],
    },
  ],
  explanation:
    "Magnesium Glycinate is showing a clear signal across your sleep and HRV data. Sleep depth improved most in the first 2 weeks; HRV gains are more recent. Skin redness trended down in parallel — consistent with magnesium's role in autonomic recovery.",
  actionCard: {
    timeframe: "This week",
    text: "Continue 400mg before bed. No need to increase dose — your data shows the current dose is sufficient.",
  },
  saveCard:
    "Don't add a separate sleep supplement. Your sleep is already improving on magnesium alone.",
};

// §11 AI Coach — chat messages mock
export interface CoachMessage {
  id: string;
  type: "insight" | "user" | "system" | "explain";
  content: string;
  timestamp?: string;
  meta?: {
    label?: string;
    source?: string;
    actions?: { label: string; href?: string }[];
  };
}

export const COACH_MESSAGES: CoachMessage[] = [
  {
    id: "m1",
    type: "insight",
    content:
      "Your Recovery Score dropped 15% this week (Day 7–14). Cross-referencing your intervention log: you stopped Magnesium Glycinate on Jun 7.",
    meta: {
      label: "⚡ Insight Engine detected a change",
      source: "Abbasi et al., 2012 · evidence: rct",
      actions: [
        { label: "Resume + track 4 weeks" },
        { label: "Show my trend" },
      ],
    },
  },
  {
    id: "m2",
    type: "user",
    content: "I started magnesium again yesterday, 400mg before bed",
    timestamp: "Jun 14 · 9:42am",
  },
  {
    id: "m3",
    type: "system",
    content:
      "Magnesium Glycinate 400mg · Start date Jun 13. I'll track your Recovery Score and HRV over the next 4 weeks and tell you if we see a response.",
    meta: { label: "✓ LOGGED TO INTERVENTION GRAPH" },
  },
  {
    id: "m4",
    type: "explain",
    content:
      "Your Skin Score rose 4 points this month. The main driver is hydration (+18%) — consistent with your new HA serum (started May 22). Your Collagen Index is still at 58; this is the gap to watch.",
    meta: {
      label: "You tapped: Skin Score 78 ↑+4",
      source:
        "Based on: Skin scan Jun 5 · Wearable sleep data · Intervention log",
    },
  },
];

export const COACH_QUICK_CHIPS = [
  "Why is my Vitamin D low?",
  "I started HRT today",
  "Explain my collagen score",
];

// §12.2 AI Reports — list
export interface AIReport {
  id: string;
  date: string;
  title: string;
  summary: string;
  findings: {
    level: "good" | "warn" | "alert";
    tag: string;
    title: string;
    desc: string;
  }[];
  status: "new" | "viewed";
}

export const AI_REPORTS: AIReport[] = [
  {
    id: "rpt-2026-06-08",
    date: "Jun 8, 2026",
    title: "Skin + Healthspan Analysis",
    summary: "8 scans over 90 days · 4 data sources",
    status: "new",
    findings: [
      {
        level: "good",
        tag: "Positive",
        title: "Barrier function strengthening",
        desc: "Inflammation score up 6pts. Consistent with peptide serum introduction 4 weeks ago.",
      },
      {
        level: "warn",
        tag: "Monitor",
        title: "UV pigmentation accumulation",
        desc: "Pigment Load down 3pts. Sunscreen compliance may have dropped.",
      },
      {
        level: "alert",
        tag: "Action",
        title: "Vitamin D below optimal range",
        desc: "Recommend supplementation — see product suggestions.",
      },
    ],
  },
  {
    id: "rpt-2026-05-20",
    date: "May 20, 2026",
    title: "Healthspan Quarterly Review",
    summary: "Sleep, HRV, and supplement efficacy",
    status: "viewed",
    findings: [
      {
        level: "good",
        tag: "Positive",
        title: "HRV trending up 9%",
        desc: "Consistent with magnesium glycinate introduction 4 weeks ago.",
      },
      {
        level: "warn",
        tag: "Monitor",
        title: "Sleep consistency irregular",
        desc: "Bedtime variance increased 22 min over 14 days.",
      },
    ],
  },
];

// §12.1 Health Profile — connected data sources
export const CONNECTED_SOURCES = [
  { id: "apple-health", name: "Apple Health", status: "connected", icon: "🍎" },
  { id: "oura", name: "Oura Ring", status: "connected", icon: "💍" },
  {
    id: "skin-scan",
    name: "DrRuby Skin Scans",
    status: "connected",
    icon: "📸",
  },
  { id: "manual", name: "Manual entries", status: "connected", icon: "✍️" },
  { id: "labs", name: "Blood panel", status: "available", icon: "🧪" },
  { id: "whoop", name: "Whoop", status: "available", icon: "⌚" },
];

// §12.3 Clinic Booking — partner clinics
export interface PartnerClinic {
  id: string;
  name: string;
  specialty: string;
  location: string;
  distance: string;
  rating: number;
  nextAvailable: string;
}

export const PARTNER_CLINICS: PartnerClinic[] = [
  {
    id: "clarity",
    name: "Clarity Skin Clinic",
    specialty: "Dermatology",
    location: "West Hollywood, LA",
    distance: "2.4 mi",
    rating: 4.9,
    nextAvailable: "Jun 25",
  },
  {
    id: "meridian",
    name: "Meridian Women's Health",
    specialty: "Women's Health · Hormonal",
    location: "Beverly Hills, LA",
    distance: "5.1 mi",
    rating: 4.8,
    nextAvailable: "Jun 28",
  },
  {
    id: "brenner-derm",
    name: "Brenner Dermatology Associates",
    specialty: "Dermatology · Aesthetic",
    location: "Pasadena, LA",
    distance: "8.7 mi",
    rating: 4.7,
    nextAvailable: "Jul 2",
  },
];

// §12.4 Products & Plans
export interface ProductItem {
  id: string;
  icon: string;
  name: string;
  reason: string;
  match: number | null;
  price?: string;
  inUse?: boolean;
  isUpgrade?: boolean;
}

export const PORTAL_PRODUCTS: ProductItem[] = [
  {
    id: "vit-d",
    icon: "💊",
    name: "Vitamin D3 + K2",
    reason: "Addresses your deficiency",
    match: 94,
    inUse: true,
  },
  {
    id: "ha-serum",
    icon: "🧴",
    name: "HA Serum — Hydration",
    reason: "Supports skin improvement",
    match: 89,
    inUse: true,
  },
  {
    id: "mag-glyc",
    icon: "🌙",
    name: "Magnesium Glycinate",
    reason: "Cortisol + sleep support",
    match: 87,
    inUse: true,
  },
  {
    id: "skinscope",
    icon: "🔬",
    name: "SkinScope Attachment",
    reason: "Unlock full Collagen data",
    match: null,
    price: "$99 — Upgrade",
    isUpgrade: true,
  },
];

// Appointments
export interface Appointment {
  id: string;
  date: string;
  time: string;
  clinic: string;
  doctor: string;
  type: string;
  status: "upcoming" | "completed" | "cancelled";
}

export const APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1",
    date: "Jun 25",
    time: "10:30 AM",
    clinic: "Clarity Skin Clinic",
    doctor: "Dr. Sarah Williams",
    type: "Skin Consultation",
    status: "upcoming",
  },
  {
    id: "apt-2",
    date: "Jul 18",
    time: "2:00 PM",
    clinic: "Meridian Women's Health",
    doctor: "Dr. Lisa Park",
    type: "Hormonal Health Follow-up",
    status: "upcoming",
  },
  {
    id: "apt-3",
    date: "May 12",
    time: "11:00 AM",
    clinic: "Clarity Skin Clinic",
    doctor: "Dr. Sarah Williams",
    type: "Skin Scan Review",
    status: "completed",
  },
];

// Recent activity timeline
export const RECENT_ACTIVITY = [
  { date: "Jun 8", label: "AI Report generated", done: true },
  { date: "Jun 5", label: "Skin scan uploaded", done: true },
  { date: "Jun 2", label: "Appointment booked — Jun 25", done: true },
  { date: "May 30", label: "Blood panel data connected", done: true },
  { date: "Upcoming", label: "Follow-up scan due Jun 20", done: false },
];
