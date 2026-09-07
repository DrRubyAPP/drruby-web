import { describe, expect, it, vi } from "vitest";
import type { StorageProvider } from "@/lib/health/storage";
import type { LlmClient } from "@/lib/llm/client";
import type { HealthSource } from "~prisma/client";
import { OpenAiExtractor } from "./extractor.openai";

/** 构造 fake HealthSource（仅抽取用到的字段） */
function fakeSource(overrides: Partial<HealthSource> = {}): HealthSource {
  return {
    id: "src1",
    userId: "u1",
    fileName: "lab.png",
    mime: "image/png",
    hash: "h1",
    objectKey: "health/u1/src1/uuid.png",
    storageLifecycle: null,
    provenance: null,
    uploadedAt: new Date(),
    ...overrides,
  } as HealthSource;
}

function makeLlm(reply: string): {
  llm: LlmClient;
  chatComplete: ReturnType<typeof vi.fn>;
} {
  const chatComplete = vi.fn(async () => reply);
  return { llm: { chatComplete, isConfigured: () => true }, chatComplete };
}

function makeLlmThrow(err: unknown): LlmClient {
  return {
    chatComplete: vi.fn(async () => {
      throw err;
    }),
    isConfigured: () => true,
  };
}

function makeStorage(bytes: Uint8Array): {
  storage: StorageProvider;
  get: ReturnType<typeof vi.fn>;
} {
  const get = vi.fn(async () => bytes);
  return {
    storage: { get, put: vi.fn(), getSignedUrl: vi.fn(), delete: vi.fn() },
    get,
  };
}

const VALID_JSON = JSON.stringify({
  documentClass: "Lab",
  confidence: "Low",
  items: [
    { name: "LDL", value: 130, unit: "mg/dL", refRange: "< 100", flag: "high" },
    { name: "HDL", value: 55, unit: "mg/dL" },
  ],
  pleaseConfirm: ["LDL"],
});

describe("OpenAiExtractor（task-48 F1：视觉抽取 + zod 约束，绝不编造）", () => {
  it("图片 + 合法 JSON（含 ```json 围栏）→ done + items + pleaseConfirm", async () => {
    const { llm, chatComplete } = makeLlm(`\`\`\`json\n${VALID_JSON}\n\`\`\``);
    const { storage } = makeStorage(new Uint8Array([1, 2, 3]));
    const extractor = new OpenAiExtractor(llm, storage);

    const result = await extractor.extract(fakeSource());

    expect(result.status).toBe("done");
    expect(result.documentClass).toBe("Lab");
    expect(result.confidence).toBe("Low");
    expect(result.pleaseConfirm).toEqual(["LDL"]);
    expect(result.parsedValues).toEqual({
      items: [
        {
          name: "LDL",
          value: 130,
          unit: "mg/dL",
          refRange: "< 100",
          flag: "high",
        },
        { name: "HDL", value: 55, unit: "mg/dL" },
      ],
    });

    // 多模态调用形状：user content 数组含 text + image_url(data: URL)
    expect(chatComplete).toHaveBeenCalledTimes(1);
    const [messages, opts] = chatComplete.mock.calls[0] as unknown as [
      Array<{ role: string; content: string | Array<{ type: string }> }>,
      { timeoutMs?: number } | undefined,
    ];
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(typeof messages[0].content).toBe("string");
    const userContent = messages[1].content as Array<{
      type: string;
      image_url?: { url: string };
    }>;
    expect(userContent.some((p) => p.type === "text")).toBe(true);
    const img = userContent.find((p) => p.type === "image_url");
    expect(img?.image_url?.url).toBe("data:image/png;base64,AQID");
    // 30s 超时（F1）
    expect(opts?.timeoutMs).toBe(30_000);
  });

  it("PDF mime → failed 引导手输，且不打模型/不读存储（D-8）", async () => {
    const { llm, chatComplete } = makeLlm(VALID_JSON);
    const { storage, get } = makeStorage(new Uint8Array([1]));
    const extractor = new OpenAiExtractor(llm, storage);

    const result = await extractor.extract(
      fakeSource({
        mime: "application/pdf",
        objectKey: "health/u1/src1/uuid.pdf",
      }),
    );

    expect(result).toEqual({
      status: "failed",
      error: "PDF 暂不支持自动抽取，请手动录入",
    });
    expect(chatComplete).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it("mime 缺失 → 同 PDF 路径 failed（D-8：仅图片可抽）", async () => {
    const { llm, chatComplete } = makeLlm(VALID_JSON);
    const { storage } = makeStorage(new Uint8Array([1]));
    const extractor = new OpenAiExtractor(llm, storage);

    const result = await extractor.extract(fakeSource({ mime: null }));

    expect(result.status).toBe("failed");
    expect(chatComplete).not.toHaveBeenCalled();
  });

  it("缺 objectKey → failed 原件缺失，不触达存储/模型", async () => {
    const { llm, chatComplete } = makeLlm(VALID_JSON);
    const { storage, get } = makeStorage(new Uint8Array([1]));
    const extractor = new OpenAiExtractor(llm, storage);

    const result = await extractor.extract(fakeSource({ objectKey: null }));

    expect(result).toEqual({ status: "failed", error: "原件缺失，请重新上传" });
    expect(chatComplete).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it("模型返回非 JSON 乱码 → failed 解析失败（不编造）", async () => {
    const { llm } = makeLlm("抱歉，我无法处理这张图片。");
    const { storage } = makeStorage(new Uint8Array([1, 2]));
    const extractor = new OpenAiExtractor(llm, storage);

    const result = await extractor.extract(fakeSource());

    expect(result).toEqual({
      status: "failed",
      error: "抽取结果解析失败，请重试或手动录入",
    });
  });

  it("模型返回 JSON 但不符合 schema（非法 documentClass）→ failed（不编造）", async () => {
    const bad = JSON.stringify({
      documentClass: "Bloodwork",
      confidence: "High",
      items: [],
      pleaseConfirm: [],
    });
    const { llm } = makeLlm(bad);
    const { storage } = makeStorage(new Uint8Array([1, 2]));
    const extractor = new OpenAiExtractor(llm, storage);

    const result = await extractor.extract(fakeSource());

    expect(result.status).toBe("failed");
    expect(result.error).toBe("抽取结果解析失败，请重试或手动录入");
    expect(result.parsedValues).toBeUndefined();
  });

  it("模型调用抛错（超时/上游）→ failed 通用文案，不泄漏上游细节（C-4）", async () => {
    const llm = makeLlmThrow(new Error("upstream-secret-detail ECONNRESET"));
    const { storage } = makeStorage(new Uint8Array([1, 2]));
    const extractor = new OpenAiExtractor(llm, storage);

    const result = await extractor.extract(fakeSource());

    expect(result).toEqual({
      status: "failed",
      error: "抽取失败，请重试或手动录入",
    });
  });

  it("pleaseConfirm 缺省 → 返回空数组（§13：不确定性不隐藏，但无低置信项时为空）", async () => {
    const noPc = JSON.stringify({
      documentClass: "Lab",
      confidence: "High",
      items: [{ name: "HDL", value: 55 }],
    });
    const { llm } = makeLlm(noPc);
    const { storage } = makeStorage(new Uint8Array([1]));
    const extractor = new OpenAiExtractor(llm, storage);

    const result = await extractor.extract(fakeSource());

    expect(result.status).toBe("done");
    expect(result.pleaseConfirm).toEqual([]);
  });
});
