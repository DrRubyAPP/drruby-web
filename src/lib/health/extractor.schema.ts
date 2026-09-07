import { z } from "zod";
import {
  documentClassSchema,
  extractionConfidenceSchema,
} from "@/lib/db/enums";

/**
 * 抽取输出 zod 约束（task-48 F1，C-2）
 *
 * 模型须按此 schema 返回 JSON；解析失败 / 不符 schema → 抽取降级 failed，
 * 绝不「尽力猜」回退（§13 红线：不得编造缺失数值）。
 */

/** 单条结构化项（镜像前端 ParsedValueItem，V1 schema） */
export const parsedValueItemSchema = z.object({
  name: z.string(),
  value: z.union([z.string(), z.number()]).nullable().optional(),
  unit: z.string().optional(),
  refRange: z.string().optional(),
  flag: z.string().optional(),
});

/** 视觉抽取整体输出 */
export const extractionOutputSchema = z.object({
  /** 文档分类（Lab|Imaging|Pathology|Procedure|VisitSummary|Unknown） */
  documentClass: documentClassSchema,
  /** 整体置信（High|Low|Unrecognized|Conflicting） */
  confidence: extractionConfidenceSchema,
  /** 结构化条目；读不清的项不放 value 或置 null */
  items: z.array(parsedValueItemSchema),
  /** 需核实字段名（低置信/模糊项，§13 不确定性不得隐藏） */
  pleaseConfirm: z.array(z.string()).default([]),
});

export type ExtractionOutput = z.infer<typeof extractionOutputSchema>;
