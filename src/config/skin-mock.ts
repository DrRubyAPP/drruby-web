// MOCK DATA — replace with real API in MVP user portal task
// Data sourced from tech-index/index.html Skin page mockup

export const BRENNER_INDICES = [
  {
    id: "inflammation",
    eyebrow: "Index 01",
    name: "Inflammation Index",
    score: 72,
    max: 100,
    level: "good" as const,
    desc: "Measures skin redness, reactive markers, and oxidative stress signals. Lower inflammation → slower aging.",
    trend: { dir: "up" as const, text: "↑ +6 pts since last scan" },
  },
  {
    id: "pigment",
    eyebrow: "Index 02",
    name: "Pigment Load Index",
    score: 58,
    max: 100,
    level: "warn" as const,
    desc: "Tracks uneven pigmentation, UV damage accumulation, and melanin distribution patterns over time.",
    trend: { dir: "dn" as const, text: "↓ −3 pts — sun exposure detected" },
  },
  {
    id: "collagen",
    eyebrow: "Index 03",
    name: "Collagen Kinetics Index",
    score: 81,
    max: 100,
    level: "good" as const,
    desc: "Assesses structural skin density, elasticity, and collagen turnover rate — requires SkinScope for full accuracy.",
    trend: { dir: "up" as const, text: "↑ +9 pts this quarter" },
  },
];

// 8 scan data points over 90 days
export const TREND_DATA = [
  { date: "Mar 10", infl: 48, pigm: 52, coll: 55 },
  { date: "Mar 25", infl: 52, pigm: 49, coll: 58 },
  { date: "Apr 8", infl: 55, pigm: 50, coll: 62 },
  { date: "Apr 22", infl: 58, pigm: 53, coll: 65 },
  { date: "May 6", infl: 60, pigm: 55, coll: 68 },
  { date: "May 20", infl: 64, pigm: 52, coll: 72 },
  { date: "Jun 1", infl: 66, pigm: 54, coll: 75 },
  { date: "Jun 8", infl: 72, pigm: 58, coll: 81, highlight: true },
];

export const AI_FINDINGS = [
  {
    level: "good" as const,
    title: "Barrier function strengthening",
    desc: "Inflammation score up 6pts. Consistent with peptide serum introduction 4 weeks ago.",
    tag: "Positive",
  },
  {
    level: "warn" as const,
    title: "UV pigmentation accumulation",
    desc: "Pigment Load down 3pts. Sunscreen compliance may have dropped — cross-referenced with weather data.",
    tag: "Monitor",
  },
  {
    level: "alert" as const,
    title: "Upgrade scan for Collagen accuracy",
    desc: "Collagen Kinetics Index is estimated. SkinScope attachment will give full cross-polarized reading.",
    tag: "Action",
  },
];

export const PRODUCT_RECS = [
  { icon: "☀️", name: "SPF 50 Mineral Sunscreen", reason: "Addresses pigment drop", match: 96 },
  { icon: "🧴", name: "Niacinamide Brightening Serum", reason: "Pigment Load correction", match: 91 },
  { icon: "💊", name: "Collagen Peptide Complex", reason: "Supports collagen index", match: 88 },
  { icon: "🔬", name: "SkinScope Attachment", reason: "Unlock full Collagen data", match: null, price: "$99 — Upgrade", isUpgrade: true },
];

export const IMAGE_QUALITY_CHECKS = [
  { id: "focus", label: "Focus & sharpness", passed: true },
  { id: "lighting", label: "Too dark — move to better light", passed: false },
  { id: "coverage", label: "Skin area coverage", passed: true },
  { id: "steady", label: "Steady — no motion blur", passed: true },
];
