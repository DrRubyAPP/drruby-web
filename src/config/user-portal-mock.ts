// User Portal mock data — sourced from tech-index/index.html User Portal mockup
// and website-user-portal.md spec. Replace with real API in production.
// Spine 映射（a_docs/drruby-docs/product-spine.md）：
//   skin flow = CONSIDER+DECIDE(skin)，stack flow = CONSIDER+DECIDE(supplement)

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

// §4.1 skin consider flow — multi-select chip options
export const SKIN_CONSIDER_SYMPTOMS = [
  { id: "dryness", label: "Dryness" },
  { id: "dullness", label: "Dullness" },
  { id: "breakouts", label: "Breakouts" },
  { id: "less-firm", label: "Less firm" },
  { id: "all", label: "All of the above" },
] as const;

// §4.1 Loading data sources (fade-in one by one)
export const SKIN_CONSIDER_DATA_SOURCES = [
  "Sleep quality",
  "HRV trends",
  "Skin photos",
  "Cycle data",
];

// §5.1 stack consider flow — supplement options
export const STACK_CONSIDER_SUPPLEMENTS = [
  { id: "nmn", label: "NMN" },
  { id: "collagen", label: "Collagen" },
  { id: "vitamin-d", label: "Vitamin D" },
  { id: "magnesium", label: "Magnesium" },
  { id: "omega-3", label: "Omega-3" },
  { id: "other", label: "Other" },
] as const;

export const STACK_CONSIDER_DURATIONS = [
  { id: "lt-2w", label: "Less than 2 weeks" },
  { id: "2-4w", label: "2–4 weeks" },
  { id: "1-2m", label: "1–2 months" },
  { id: "3m-plus", label: "3+ months" },
] as const;

export const STACK_CONSIDER_DATA_SOURCES = [
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

// Mock answer for skin consider flow (skin changed — breakouts)
export const SKIN_CONSIDER_ANSWER: AnswerData = {
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

// Mock answer for stack consider flow — TOO_EARLY verdict (§5.2: < 4 weeks of use)
// §5.3: new supplement entry auto-enters TOO_EARLY verdict flow
export const STACK_CONSIDER_TOO_EARLY_ANSWER: AnswerData = {
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

// Mock answer for stack consider flow (Magnesium, 4+ weeks → CONTINUE)
export const STACK_CONSIDER_ANSWER: AnswerData = {
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
