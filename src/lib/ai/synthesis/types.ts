/**
 * task-43 §15–§26 综合层类型定义（D1：模板为主 + 小处 LLM）
 *
 * 接口风格对齐 task-42 `Extractor`（src/lib/health/extractor.ts）。
 * 真实 LLM synthesis 整体重写延后到 V1 之后（O3）；本接口契约固定，
 * task-43+ 仅替换实现不改接口（plan.md R10）。
 */
import type {
  ChangeTrigger,
  HealthContextCategory,
  SynthesisProvenance,
} from "@/lib/db/enums";

/** §19 Yourself 结构化 5 类（D5）— V1 全部为字符串值；后续可扩展为嵌套对象 */
export type HealthContext = Partial<Record<HealthContextCategory, string>>;

/** connected Record 引用（snapshot 时取摘要，保证历史可还原 R3） */
export interface ConnectedRecordRef {
  id: string;
  kind: string;
  documentClass?: string | null;
  summary: string;
}

/** snapshot sources 数组项 */
export interface SourceRef {
  type: "record" | "others" | "science";
  ref: string;
  summary: string;
}

/** snapshot citations 数组项 */
export interface CitationRef {
  label: string;
  ref: string;
}

/** Synthesizer 输入 */
export interface SynthesisInput {
  decision: {
    id: string;
    question: string;
    topicSlug?: string | null;
    topic?: string | null;
    /** §19/D5 结构化 5 类（优先） */
    healthContext?: HealthContext | null;
    /** task-42 B2 fallback 扁平文本（healthContext 为空时兜底） */
    yourselfContext?: string | null;
  };
  connectedRecords: ConnectedRecordRef[];
  /** 静态语料（Others/Science）— 从 decision-corpus.ts 取 */
  corpus: {
    others?: string;
    science?: string;
    othersVersion?: string;
    scienceVersion?: string;
  };
  changeTrigger: ChangeTrigger;
}

/** Synthesizer 输出 */
export interface SynthesisResult {
  /** 综合文本三视角 + combined */
  synthesis: {
    yourself: string;
    others: string;
    science: string;
    combined: string;
  };
  sources: SourceRef[];
  citations: CitationRef[];
  provenance: SynthesisProvenance;
  /** §23 人话原因（不露原始 trigger 值；LLM 生成，失败降级模板） */
  triggerHumanLabel?: string;
}

/** §15/D1 综合服务接口 */
export interface Synthesizer {
  synthesize(input: SynthesisInput): Promise<SynthesisResult>;
}
