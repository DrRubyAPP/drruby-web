import type { DecisionType } from "@/components/sections/portal/decisions/dto";

/**
 * Others / Science 预置静态语料（Slice 1 种子，内容团队后续扩充）。
 * 护栏（A6/A7）：不排序、不计数、不暗示共识；Science 无个性化推荐用语。
 */

export type OthersDimensionKey = "helpful" | "difficult" | "varied" | "may-matter";
export type ScienceBlockKey = "benefits" | "risks" | "uncertainty";

export interface ScienceItem {
  text: string;
  source: string;
}

export interface DecisionCorpus {
  /** helpful / difficult / varied / may-matter 固定四维，无排序无数量 */
  others: Record<OthersDimensionKey, string[]>;
  /** benefits / risks / uncertainty 固定三块 + 来源标注 */
  science: Record<ScienceBlockKey, ScienceItem[]>;
}

const GENERIC: DecisionCorpus = {
  others: {
    helpful: [
      "Some people found it useful to write down what they wanted to change before deciding anything.",
      "Some found it helpful to ask what happens if it doesn't work.",
    ],
    difficult: [
      "For some, the hardest part was not knowing what a fair price would be.",
      "Some found the wait between deciding and seeing results difficult.",
    ],
    varied: [
      "People describe widely different experiences with the same thing.",
      "What worked for one person didn't for another.",
    ],
    "may-matter": [
      "Who performs it may matter.",
      "Your own timeline and expectations may matter.",
    ],
  },
  science: {
    benefits: [
      {
        text: "What this is known to do varies by topic — placeholder pending content team review.",
        source: "Placeholder — pending content team",
      },
    ],
    risks: [
      {
        text: "Common considerations vary by topic — placeholder pending content team review.",
        source: "Placeholder — pending content team",
      },
    ],
    uncertainty: [
      {
        text: "What remains uncertain varies by topic — placeholder pending content team review.",
        source: "Placeholder — pending content team",
      },
    ],
  },
};

/** 各 type 占位语料（B5：缺失时回退 GENERIC） */
const CORPUS: Partial<Record<DecisionType, DecisionCorpus>> = {
  thermage: {
    others: {
      helpful: [
        "Some people said seeing photos over months, not days, helped them judge results.",
        "Some asked their clinician what happens if results are subtle.",
      ],
      difficult: [
        "Some found the cost hard to weigh against gradual, subtle results.",
        "Some described discomfort during the procedure as difficult.",
      ],
      varied: [
        "Some noticed firmer texture over 2–3 months; others noticed little change.",
        "Results seemed to vary from person to person.",
      ],
      "may-matter": [
        "Who performs the procedure may matter.",
        "Skin condition and age may matter.",
      ],
    },
    science: {
      benefits: [
        {
          text: "Radiofrequency treatments are studied for skin tightening — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      risks: [
        {
          text: "Temporary redness and swelling have been described — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      uncertainty: [
        {
          text: "How long results last remains uncertain — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
    },
  },
  ultherapy: {
    others: {
      helpful: [
        "Some people said understanding the sensation level beforehand helped them decide.",
        "Some found it useful to ask about retreatment timing.",
      ],
      difficult: [
        "Some described the procedure as uncomfortable.",
        "Some found gradual results hard to judge.",
      ],
      varied: [
        "Some saw lifting over months; others saw little visible change.",
      ],
      "may-matter": ["Degree of skin laxity may matter.", "Practitioner experience may matter."],
    },
    science: {
      benefits: [
        {
          text: "Ultrasound-based lifting is studied for specific areas — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      risks: [
        {
          text: "Temporary tenderness and redness have been described — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      uncertainty: [
        {
          text: "Durability of results remains uncertain — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
    },
  },
  botox: {
    others: {
      helpful: [
        "Some people said choosing an experienced injector mattered most to them.",
        "Some found it useful to ask how often they'd need to repeat it.",
      ],
      difficult: [
        "Some found the recurring cost and maintenance difficult to plan.",
        "Some worried about looking 'frozen'.",
      ],
      varied: ["Some loved the softening effect; others preferred a natural look without it."],
      "may-matter": ["Injector technique may matter.", "Dose and placement may matter."],
    },
    science: {
      benefits: [
        {
          text: "Neuromodulators are well studied for expression lines — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      risks: [
        {
          text: "Temporary bruising and asymmetry have been described — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      uncertainty: [
        {
          text: "Long-term use effects are still being studied — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
    },
  },
  laser: {
    others: {
      helpful: [
        "Some people said planning for downtime was the most useful preparation.",
        "Some found taking photos before each session helpful for comparison.",
      ],
      difficult: [
        "Some found multiple sessions and healing time difficult to schedule.",
        "Some found post-treatment sensitivity hard to manage.",
      ],
      varied: ["Results and healing seemed to differ widely between people."],
      "may-matter": ["Skin type and tone may matter.", "Type of laser may matter."],
    },
    science: {
      benefits: [
        {
          text: "Laser resurfacing is studied for texture and pigment — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      risks: [
        {
          text: "Redness, swelling, and pigment changes have been described — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      uncertainty: [
        {
          text: "Risk of pigment change varies by skin tone and remains an active research area — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
    },
  },
  filler: {
    others: {
      helpful: [
        "Some people said asking to see before/after photos of the injector's own work helped.",
        "Some found starting with a small amount helped them decide.",
      ],
      difficult: [
        "Some worried about reversibility and what happens as it wears off.",
        "Some found swelling in the first days concerning.",
      ],
      varied: ["Some loved the volume restoration; others felt it wasn't worth maintaining."],
      "may-matter": ["Product type may matter.", "Injection area may matter."],
    },
    science: {
      benefits: [
        {
          text: "Hyaluronic acid fillers are studied for volume restoration — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      risks: [
        {
          text: "Swelling, bruising, and rarely vascular complications have been described — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      uncertainty: [
        {
          text: "Long-term tissue effects are still being studied — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
    },
  },
  hrt: {
    others: {
      helpful: [
        "Some people said tracking symptoms before the conversation with their clinician helped.",
        "Some found it useful to prepare questions about types and delivery methods.",
      ],
      difficult: [
        "Some found conflicting headlines hard to weigh.",
        "Some described the decision as feeling higher-stakes than others.",
      ],
      varied: ["Experiences with the same regimen differed widely between people."],
      "may-matter": ["Symptom profile may matter.", "Personal and family history may matter."],
    },
    science: {
      benefits: [
        {
          text: "Hormone therapy is studied for menopausal symptom relief — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      risks: [
        {
          text: "Known risks depend on age, timing, and personal history — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      uncertainty: [
        {
          text: "Individual risk-benefit balance remains a topic of ongoing research — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
    },
  },
  skincare: {
    others: {
      helpful: [
        "Some people said introducing one product at a time helped them tell what worked.",
        "Some found taking bare-face photos weekly helpful.",
      ],
      difficult: [
        "Some found the purge phase of actives discouraging.",
        "Some found marketing claims hard to evaluate.",
      ],
      varied: ["The same ingredient worked beautifully for some and not others."],
      "may-matter": ["Skin barrier state may matter.", "Consistency over months may matter."],
    },
    science: {
      benefits: [
        {
          text: "Ingredients like retinoids are well studied — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      risks: [
        {
          text: "Irritation and photosensitivity with some actives have been described — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      uncertainty: [
        {
          text: "Long-term combination effects are less studied — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
    },
  },
  clinic: {
    others: {
      helpful: [
        "Some people said a first consultation with no pressure to book helped them compare.",
        "Some found it useful to ask what happens if they're unhappy with results.",
      ],
      difficult: [
        "Some found clinics pushing package deals difficult to navigate.",
        "Some found it hard to judge credentials.",
      ],
      varied: ["Experiences at the same clinic were described differently by different people."],
      "may-matter": ["Who performs the treatment may matter.", "Aftercare arrangements may matter."],
    },
    science: {
      benefits: [
        {
          text: "This section covers clinic choice rather than a treatment — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      risks: [
        {
          text: "Considerations around credentials and consent — placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
      uncertainty: [
        {
          text: "Placeholder pending content team review.",
          source: "Placeholder — pending content team",
        },
      ],
    },
  },
};

/** type → 语料；null / not_sure / 缺失 → 通用占位（B5/B9） */
export function getDecisionCorpus(
  type: DecisionType | null | undefined,
): DecisionCorpus {
  if (!type || type === "not_sure") return GENERIC;
  return CORPUS[type] ?? GENERIC;
}
