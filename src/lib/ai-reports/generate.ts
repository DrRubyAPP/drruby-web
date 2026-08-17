import "server-only";
import {
  aiReportRepo,
  bodyInsightRepo,
  hormoneReadingRepo,
  skinScanRepo,
} from "@/lib/db";
import type { AiReportType } from "@/lib/db/enums";
import type { AiReportFinding } from "@/lib/db/repositories/aiReport.repo";
import { AppError } from "@/lib/errors";
import { type LlmClient, type LlmUsage, openAiClient } from "@/lib/llm/client";
import { logger } from "@/lib/logger";
import type { AiReport, Prisma } from "~prisma/client";
import {
  buildBodyFindings,
  buildHormoneFindings,
  buildSkinFindings,
} from "./rules";

interface Draft {
  title: string;
  summary: string;
  findings: AiReportFinding[];
}

/** 按 type 取数源 + 规则提炼草稿；数据源为空 → null（上层转 422，不调 LLM 不落库） */
async function collectDraft(
  userId: string,
  type: AiReportType,
): Promise<Draft | null> {
  switch (type) {
    case "skin": {
      const scan = await skinScanRepo.findLatest(userId);
      if (!scan) return null;
      return {
        title: "皮肤状态报告",
        summary: scan.headline,
        findings: buildSkinFindings(scan),
      };
    }
    case "hormone": {
      const readings = await hormoneReadingRepo.listByUser(userId);
      if (readings.length === 0) return null;
      return {
        title: "激素周期报告",
        summary: `基于最近 ${Math.min(readings.length, 10)} 条读数的周期概览。`,
        findings: buildHormoneFindings(readings),
      };
    }
    case "body": {
      const [attentions, agings] = await Promise.all([
        bodyInsightRepo.listByUserAndKind(userId, "attention"),
        bodyInsightRepo.listByUserAndKind(userId, "aging_velocity"),
      ]);
      if (attentions.length === 0 && agings.length === 0) return null;
      return {
        title: "身体洞察报告",
        summary: "基于身体信号与衰老速度的综合概览。",
        findings: buildBodyFindings(attentions, agings),
      };
    }
  }
}

/**
 * LLM 仅润色 title/summary/desc；level/tag/数值绝不改（task-12 红线）。
 * 缺 key、上游失败、JSON 结构/条数不符 → 原文降级（degraded=true），不阻断落库。
 */
async function polish(
  draft: Draft,
  llm: LlmClient,
): Promise<{ draft: Draft; degraded: boolean; usage?: LlmUsage }> {
  if (!llm.isConfigured() || draft.findings.length === 0) {
    return { draft, degraded: true };
  }
  let usage: LlmUsage | undefined;
  try {
    const prompt =
      "以下是给女性健康决策助手用户的健康报告文案。请在不新增结论、不诊断、" +
      "保留不确定性、非指令性的前提下，把 title/summary 与每条 finding 的 title/desc " +
      "润色得更平和清晰。严格保持条数一致、不改变任何 level/tag，返回 JSON 对象，" +
      "含键 title、summary、findings（数组，每项含 title、desc）：\n" +
      JSON.stringify({
        title: draft.title,
        summary: draft.summary,
        findings: draft.findings.map((f) => ({ title: f.title, desc: f.desc })),
      });
    const raw = await llm.chatComplete([{ role: "user", content: prompt }], {
      onUsage: (u) => {
        usage = u;
      },
    });
    const parsed = JSON.parse(raw) as {
      title?: unknown;
      summary?: unknown;
      findings?: { title?: unknown; desc?: unknown }[];
    };
    if (
      !Array.isArray(parsed.findings) ||
      parsed.findings.length !== draft.findings.length
    ) {
      return { draft, degraded: true, usage };
    }
    return {
      draft: {
        title: typeof parsed.title === "string" ? parsed.title : draft.title,
        summary:
          typeof parsed.summary === "string" ? parsed.summary : draft.summary,
        findings: draft.findings.map((f, i) => ({
          level: f.level, // 规则定，LLM 不改
          tag: f.tag, // 规则定，LLM 不改
          title:
            typeof parsed.findings?.[i]?.title === "string"
              ? parsed.findings[i].title
              : f.title,
          desc:
            typeof parsed.findings?.[i]?.desc === "string"
              ? parsed.findings[i].desc
              : f.desc,
        })),
      },
      degraded: false,
      usage,
    };
  } catch {
    return { draft, degraded: true, usage };
  }
}

/**
 * 生成并**追加**一条 AI 报告（append-only，重复生成产生新纪录）。
 * @param userId 目标用户
 * @param type 报告类型 skin|hormone|body
 * @param deps.llm 可注入 LLM client（单测注入 fake；默认生产 openAiClient）
 */
export async function generateAiReport(
  userId: string,
  type: AiReportType,
  deps: { llm?: LlmClient } = {},
): Promise<AiReport> {
  const llm = deps.llm ?? openAiClient;

  const draft = await collectDraft(userId, type);
  if (!draft) {
    throw new AppError(
      "insufficient_data",
      "该类型暂无数据，无法生成报告",
      422,
    );
  }

  const { draft: polished, degraded, usage } = await polish(draft, llm);

  // 成本日志：只记 userId/类型/降级/usage（token 数），不含报告正文（PII）
  logger.info(
    { userId, reportType: type, degraded, usage },
    "ai_report_generated",
  );

  return aiReportRepo.create(userId, {
    type,
    title: polished.title,
    summary: polished.summary,
    findings: polished.findings,
    meta: {
      degraded,
      ...(usage ? { llm: usage } : {}),
      generatedAt: new Date().toISOString(),
    } as unknown as Prisma.InputJsonValue,
  });
}
