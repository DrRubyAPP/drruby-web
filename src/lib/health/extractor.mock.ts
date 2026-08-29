import type { DocumentClass } from "@/lib/db/enums";
import type { HealthSource } from "~prisma/client";
import type { ExtractionResult, Extractor } from "./extractor";

/**
 * Mock 抽取实现（task-42 V1）
 *
 * - 按 fileName 关键词推断 documentClass（大小写不敏感）
 * - 按 documentClass 返回固定模板 parsedValues
 * - pleaseConfirm 字段返回（演示 Please confirm 标记）
 * - configureFailure 测试工具：下次 extract 返回 FAILED
 * - 手动录入不走 Extractor（直接 CONFIRMED）
 *
 * O3 真实选型延后；task-43 仅替换实现，不改 Extractor 接口契约
 */
export class MockExtractor implements Extractor {
  private failNext = false;

  /** 测试工具：下次 extract 返回 FAILED（一次性触发） */
  configureFailure(fail: boolean): void {
    this.failNext = fail;
  }

  async extract(source: HealthSource): Promise<ExtractionResult> {
    if (this.failNext) {
      this.failNext = false;
      return { status: "failed", error: "mock: extraction failed" };
    }

    const documentClass = inferDocumentClass(source.fileName);
    const parsedValues = mockValuesFor(documentClass);

    return {
      status: "done",
      parsedValues,
      confidence: "High",
      documentClass,
      // 演示 Please confirm 标记：所有未核实字段
      pleaseConfirm: ["mock_field_unverified"],
    };
  }
}

/** 按 fileName 关键词推断 documentClass（大小写不敏感） */
export function inferDocumentClass(fileName: string): DocumentClass {
  const name = fileName.toLowerCase();
  if (name.includes("lab") || name.includes("blood")) return "Lab";
  if (name.includes("imaging") || name.includes("mri")) return "Imaging";
  if (name.includes("pathology")) return "Pathology";
  if (name.includes("procedure")) return "Procedure";
  if (name.includes("visit") || name.includes("summary")) return "VisitSummary";
  return "Unknown";
}

/** 按 documentClass 返回固定模板 parsedValues（演示用） */
export function mockValuesFor(
  documentClass: DocumentClass,
): Record<string, unknown> {
  switch (documentClass) {
    case "Lab":
      return {
        items: [
          {
            name: "LDL",
            value: 130,
            unit: "mg/dL",
            refRange: "< 100",
            flag: "high",
          },
          {
            name: "HDL",
            value: 55,
            unit: "mg/dL",
            refRange: "> 40",
            flag: "normal",
          },
        ],
      };
    case "Imaging":
      return {
        items: [
          {
            name: "Finding",
            value: "Unremarkable",
            unit: "",
            refRange: "",
            flag: "normal",
          },
        ],
      };
    case "Pathology":
      return {
        items: [
          {
            name: "Specimen",
            value: "Benign",
            unit: "",
            refRange: "",
            flag: "normal",
          },
        ],
      };
    case "Procedure":
      return {
        items: [
          {
            name: "Procedure",
            value: "Completed",
            unit: "",
            refRange: "",
            flag: "normal",
          },
        ],
      };
    case "VisitSummary":
      return {
        items: [
          {
            name: "Assessment",
            value: "Stable",
            unit: "",
            refRange: "",
            flag: "normal",
          },
        ],
      };
    case "Unknown":
    default:
      return {
        items: [
          {
            name: "Sample",
            value: "—",
            unit: "",
            refRange: "",
            flag: "normal",
          },
        ],
      };
  }
}
