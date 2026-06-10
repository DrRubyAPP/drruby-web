import { NextResponse } from "next/server";

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
    { status: healthy ? 200 : 503 }
  );
}
