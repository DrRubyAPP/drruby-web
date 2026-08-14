import { NextResponse } from "next/server";
import { z } from "zod";
import { buildHistorySummary } from "@/lib/ask/history";
import { SYSTEM_PROMPT } from "@/lib/ask/prompt";
import { rateLimit } from "@/lib/auth/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { handle } from "@/lib/errors";
import {
  type ChatMessage,
  type LlmClient,
  openAiClient,
} from "@/lib/llm/client";

/**
 * OpenAI 兼容入参：仅接受 user/assistant 消息——`system` 护栏由服务端强制注入，
 * 客户端传入的 system 会被 Zod 拒（400），无法覆盖护栏；`model` 亦由服务端受控。
 */
export const AskBody = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

/** OpenAI 兼容出参，对齐 App llm.ts 的 `json.choices[0].message.content` 解析。 */
export const AskResponse = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        role: z.literal("assistant"),
        content: z.string(),
      }),
    }),
  ),
});

// 便于测试注入 mock client（生产用 openAiClient）。
let client: LlmClient = openAiClient;
export function __setClient(c: LlmClient): void {
  client = c;
}

/**
 * Ask DrRuby
 * @description 服务端护栏 LLM 代理：强制注入 SYSTEM_PROMPT 护栏与用户个人史摘要，
 * 只保留客户端 user/assistant 消息，返回 OpenAI 兼容结构。秘钥与历史仅服务端使用。
 * @body AskBody
 * @response AskResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();

  // per-user 令牌桶限流（best-effort 内存；多实例需 Redis，见 auth/rate-limit.ts）。
  // capacity=20, refillRate=1/3 per s → 20 req/min，Retry-After=3s
  await rateLimit(user.id, {
    routeTag: "ask",
    capacity: 20,
    refillRate: 1 / 3,
  });

  const body = AskBody.parse(await req.json());
  const summary = await buildHistorySummary(user.id);

  // 服务端强制组装：护栏 → 历史摘要（可选）→ 客户端消息。
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(summary ? [{ role: "system" as const, content: summary }] : []),
    ...body.messages,
  ];

  const content = await client.chatComplete(messages);
  return NextResponse.json(
    AskResponse.parse({
      choices: [{ message: { role: "assistant", content } }],
    }),
  );
});
