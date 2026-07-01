import { NextResponse } from "next/server";
import { z } from "zod";

const ConfigState = z.enum(["configured", "missing"]);

export const HealthResponse = z.object({
  status: z.enum(["ok", "degraded"]),
  mailchimp: z.object({
    apiKey: ConfigState,
    serverPrefix: ConfigState,
    audienceId: ConfigState,
  }),
});

/**
 * Health check
 * @description 返回服务与 Mailchimp 配置的健康状态
 * @response HealthResponse
 * @openapi
 */
export async function GET() {
  const hasApiKey = !!process.env.MAILCHIMP_API_KEY;
  const hasServerPrefix = !!process.env.MAILCHIMP_SERVER_PREFIX;
  const hasAudienceId = !!process.env.MAILCHIMP_AUDIENCE_ID;

  const healthy = hasApiKey && hasServerPrefix && hasAudienceId;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      mailchimp: {
        apiKey: hasApiKey ? "configured" : "missing",
        serverPrefix: hasServerPrefix ? "configured" : "missing",
        audienceId: hasAudienceId ? "configured" : "missing",
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
