/**
 * task-43 §15–§26 综合层类型定义。
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

/** A compact, current health-record view supplied to the Yourself summary. */
export interface CurrentHealthRecord {
  id: string;
  title: string;
  kind: string;
  documentClass?: string | null;
  parsedValues?: unknown;
  recordedAt: string;
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
  /** All of the member's current health records, rather than only linked ones. */
  currentHealthRecords?: CurrentHealthRecord[];
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
