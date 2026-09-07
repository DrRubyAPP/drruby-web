import "server-only";
import type { StorageProvider } from "@/lib/health/storage";
import { getStorage } from "@/lib/health/storage";
import type { LlmClient } from "@/lib/llm/client";
import { openAiClient } from "@/lib/llm/client";
import type { HealthSource } from "~prisma/client";
import type { ExtractionResult, Extractor } from "./extractor";
import { extractionOutputSchema } from "./extractor.schema";

/**
 * OpenAI 视觉抽取实现（task-48 F1，D-1/D-7/D-8）
 *
 * - 仅处理 image/jpeg / image/png：转 base64 data: URL 送视觉模型，
 *   一次调用完成 OCR + 结构化（zod 约束 JSON 输出）
 * - PDF / 非图片 → 直接 failed 引导手输（D-8，不打模型）
 * - 解析失败 / 超时 → failed（绝不编造，§13 红线）
 * - 构造注入 LlmClient + StorageProvider（镜像 ask route 可注入模式，单测不打真实上游）
 */

/** V1 仅图片（D-8）；PDF 上传白名单保留但抽取落 FAILED 引导手输 */
const IMAGE_MIMES = new Set(["image/jpeg", "image/png"]);

/** 调用超时（F1）：超时降级 failed，可 Retry */
const EXTRACT_TIMEOUT_MS = 30_000;

const PDF_FALLBACK_ERROR = "PDF 暂不支持自动抽取，请手动录入";
const MISSING_SOURCE_ERROR = "原件缺失，请重新上传";
const PARSE_FAIL_ERROR = "抽取结果解析失败，请重试或手动录入";
const EXTRACT_FAIL_ERROR = "抽取失败，请重试或手动录入";

const EXTRACT_SYSTEM_PROMPT = [
  "You are a medical document data extraction assistant.",
  "Extract structured data from the image of a health document (e.g. a lab report).",
  "Respond with ONLY a valid JSON object, no markdown fences, no commentary, matching this schema:",
  "{",
  '  "documentClass": "Lab" | "Imaging" | "Pathology" | "Procedure" | "VisitSummary" | "Unknown",',
  '  "confidence": "High" | "Low" | "Unrecognized" | "Conflicting",',
  '  "items": [{ "name": string, "value": string | number | null, "unit": string, "refRange": string, "flag": string }],',
  '  "pleaseConfirm": string[]',
  "}",
  "Rules:",
  "- NEVER fabricate values. If a value is unreadable or uncertain, set value to null or omit the item entirely.",
  "- Put the name of every low-confidence or ambiguous item into pleaseConfirm.",
  '- "confidence" reflects overall extraction confidence: Unrecognized if the document type is unclear; Conflicting if items contradict each other.',
  "- Items may be empty if nothing can be reliably read, but never invent entries.",
].join("\n");

/**
 * 剥掉模型可能加的 ```json 围栏后解析 JSON（C-2）。
 * 解析失败返回 null（交给 zod safeParse 走 PARSE_FAIL_ERROR，绝不编造）。
 */
function parseJsonLoose(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const body = (fence ? fence[1] : trimmed).trim();
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

export class OpenAiExtractor implements Extractor {
  constructor(
    private readonly llm: LlmClient = openAiClient,
    private readonly storage: StorageProvider = getStorage(),
  ) {}

  async extract(source: HealthSource): Promise<ExtractionResult> {
    // D-8：V1 仅抽图片；PDF/未知类型直接引导手输，不打模型
    if (!source.mime || !IMAGE_MIMES.has(source.mime)) {
      return { status: "failed", error: PDF_FALLBACK_ERROR };
    }
    if (!source.objectKey) {
      return { status: "failed", error: MISSING_SOURCE_ERROR };
    }

    let raw: string;
    try {
      // task-46：StorageProvider.get 直读字节，不走 HTTP 绕路
      const bytes = await this.storage.get(source.objectKey);
      const dataUrl = `data:${source.mime};base64,${Buffer.from(bytes).toString("base64")}`;

      raw = await this.llm.chatComplete(
        [
          { role: "system", content: EXTRACT_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract this health document and return the JSON object only.",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        { timeoutMs: EXTRACT_TIMEOUT_MS },
      );
    } catch {
      // 超时/网络/上游错误 → failed（可 Retry）；cause 不进用户文案（C-4）
      return { status: "failed", error: EXTRACT_FAIL_ERROR };
    }

    // C-2：zod 严格约束；解析/校验失败一律 failed，绝不编造
    const parsed = extractionOutputSchema.safeParse(parseJsonLoose(raw));
    if (!parsed.success) {
      return { status: "failed", error: PARSE_FAIL_ERROR };
    }

    const { documentClass, confidence, items, pleaseConfirm } = parsed.data;
    return {
      status: "done",
      parsedValues: { items },
      confidence,
      documentClass,
      pleaseConfirm,
    };
  }
}
