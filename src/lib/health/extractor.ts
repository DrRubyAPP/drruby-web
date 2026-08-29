import type { DocumentClass, ExtractionConfidence } from "@/lib/db/enums";
import type { HealthSource } from "~prisma/client";

/**
 * 抽取结果（Contract §13 提取失败/不确定性）
 *
 * - status=done：抽取成功，parsedValues/confidence/documentClass 可用
 * - status=failed：抽取技术失败（保留原件、允许重传/手输/Retry）；parsedValues 缺失
 *
 * INSUFFICIENT 状态留 task-43（AI 状态机）；task-42 仅覆盖 done/failed。
 */
export interface ExtractionResult {
  status: "done" | "failed";
  parsedValues?: Record<string, unknown>;
  confidence?: ExtractionConfidence;
  documentClass?: DocumentClass;
  /** 需核实字段（Please confirm 标记，Contract §13） */
  pleaseConfirm?: string[];
  /** 失败原因（status=failed 时） */
  error?: string;
}

/**
 * 抽取服务接口（O3 真实选型延后；task-42 用 mock 实现）
 *
 * 真实实现（task-43+）：OCR + LLM 抽取；对象存储读取原件；置信阈值配置
 * mock 实现（task-42）：按 fileName 推断 documentClass + 返回固定 parsedValues
 *
 * 接口契约固定，task-43 仅替换实现不改接口（plan.md R10）
 */
export interface Extractor {
  extract(source: HealthSource): Promise<ExtractionResult>;
}

/** mock 抽取模拟 PROCESSING 延迟（毫秒）；V1 不实际等待，仅文档化 */
export const EXTRACTOR_MOCK_LATENCY_MS = 300;
