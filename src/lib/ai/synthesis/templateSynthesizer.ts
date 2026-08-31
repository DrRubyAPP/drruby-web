/**
 * task-43 D1 模板合成实现（Contract §15/§23）
 *
 * Yourself = healthContext 5 类（D5）+ yourselfContext fallback（B2）+ connected Records summary；
 * Others/Science = 静态语料片段（来自 decision-corpus.ts，B5/B9）；
 * combined = 三段拼接。
 *
 * trigger 文案调 llmTriggerHelper（D1），LLM 失败降级模板兜底（B6），
 * provenance 标 template+llm_trigger / template+llm_trigger_degraded。
 *
 * 真实 LLM synthesis 整体重写延后到 V1 之后（O3）；接口契约固定。
 */
import type {
  ChangeTrigger,
  HealthContextCategory,
  SynthesisProvenance,
} from "@/lib/db/enums";
import { HEALTH_CONTEXT_CATEGORIES } from "@/lib/db/enums";
import { generateTriggerLabel } from "./llmTriggerHelper";
import type {
  CitationRef,
  ConnectedRecordRef,
  HealthContext,
  SourceRef,
  SynthesisInput,
  SynthesisResult,
  Synthesizer,
} from "./types";

/** Yourself 5 类的标题文案（i18n 在 T13 替换为 t() key） */
const CATEGORY_LABELS: Record<HealthContextCategory, string> = {
  symptoms: "Symptoms",
  medications_treatments: "Medications & treatments",
  related_health_changes: "Related health changes",
  current_health_state: "Current health state",
  goals_concerns: "Goals & concerns",
};

const INSUFFICIENT_YOURSELF =
  "We don't have enough understanding of your health yet — add your health context to get a personalized summary.";

/** 把 healthContext 5 类 + Records 拼成 Yourself 段 */
function composeYourself(
  healthContext: HealthContext | null | undefined,
  yourselfContext: string | null | undefined,
  connectedRecords: ConnectedRecordRef[],
): { text: string; sufficient: boolean } {
  const parts: string[] = [];
  let hasAnyContext = false;

  if (healthContext && typeof healthContext === "object") {
    for (const cat of HEALTH_CONTEXT_CATEGORIES) {
      const v = healthContext[cat];
      if (v != null && v !== "") {
        const label = CATEGORY_LABELS[cat];
        const text = typeof v === "string" ? v : JSON.stringify(v);
        parts.push(`${label}: ${text}`);
        hasAnyContext = true;
      }
    }
  }

  // B2 fallback：healthContext 空但 yourselfContext 非空 → 兜底
  if (!hasAnyContext && yourselfContext) {
    parts.push(yourselfContext);
    hasAnyContext = true;
  }

  // connected Records 摘要（V1 直接拼接，§15 brief 风格）
  if (connectedRecords.length > 0) {
    parts.push("Connected records:");
    for (const r of connectedRecords) {
      parts.push(`- ${r.summary}`);
    }
    hasAnyContext = true;
  }

  if (!hasAnyContext) {
    return { text: INSUFFICIENT_YOURSELF, sufficient: false };
  }
  return { text: parts.join("\n"), sufficient: true };
}

/** 把 corpus 字符串 + Records 包成 sources 数组 */
function composeSources(
  connectedRecords: ConnectedRecordRef[],
  corpus: SynthesisInput["corpus"],
): SourceRef[] {
  const sources: SourceRef[] = [];
  for (const r of connectedRecords) {
    sources.push({
      type: "record",
      ref: r.id,
      summary: r.summary,
    });
  }
  if (corpus.others) {
    sources.push({
      type: "others",
      ref: corpus.othersVersion ?? "others",
      summary: corpus.others,
    });
  }
  if (corpus.science) {
    sources.push({
      type: "science",
      ref: corpus.scienceVersion ?? "science",
      summary: corpus.science,
    });
  }
  return sources;
}

/** citations [1]/[2]/... 按 source 顺序生成 */
function composeCitations(sources: SourceRef[]): CitationRef[] {
  return sources.map((s, i) => ({
    label: `[${i + 1}]`,
    ref: s.ref,
  }));
}

/**
 * 模板 Synthesizer 实现。
 *
 * 注：注入 generateTriggerLabel 便于测试替换；默认用模块级实现。
 */
export class TemplateSynthesizer implements Synthesizer {
  private readonly triggerFn: typeof generateTriggerLabel;

  constructor(opts: { triggerFn?: typeof generateTriggerLabel } = {}) {
    this.triggerFn = opts.triggerFn ?? generateTriggerLabel;
  }

  async synthesize(input: SynthesisInput): Promise<SynthesisResult> {
    const { decision, connectedRecords, corpus, changeTrigger } = input;

    const yourself = composeYourself(
      decision.healthContext,
      decision.yourselfContext,
      connectedRecords,
    );

    const others = corpus.others ?? "";
    const science = corpus.science ?? "";

    const combinedParts: string[] = [];
    if (yourself.sufficient) {
      combinedParts.push(`Yourself\n${yourself.text}`);
    } else {
      combinedParts.push(`Yourself\n${INSUFFICIENT_YOURSELF}`);
    }
    if (others) combinedParts.push(`Others\n${others}`);
    if (science) combinedParts.push(`Science\n${science}`);
    const combined = combinedParts.join("\n\n");

    const sources = composeSources(connectedRecords, corpus);
    const citations = composeCitations(sources);

    // trigger 人话文案（D1：LLM 调用，失败降级）
    const contextSummary =
      changeTrigger === "new_record"
        ? `New ${connectedRecords[0]?.kind ?? "record"} connected`
        : changeTrigger === "health_context_update"
          ? "Health context updated"
          : changeTrigger;
    const trigger = await this.triggerFn({
      trigger: changeTrigger,
      contextSummary,
    });

    let provenance: SynthesisProvenance;
    if (changeTrigger === "initial") {
      provenance = "initial";
    } else if (trigger.ok) {
      provenance = "template+llm_trigger";
    } else if (trigger.degraded) {
      provenance = "template+llm_trigger_degraded";
    } else {
      provenance = "template";
    }

    return {
      synthesis: {
        yourself: yourself.text,
        others,
        science,
        combined,
      },
      sources,
      citations,
      provenance,
      triggerHumanLabel: trigger.label,
    };
  }
}

// 显式 re-export 触发器类型/常量便于 orchestrator 调用
export type { ChangeTrigger };
