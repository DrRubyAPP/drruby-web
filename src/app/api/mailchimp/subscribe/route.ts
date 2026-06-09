import { NextRequest, NextResponse } from "next/server";
import mailchimp from "@mailchimp/mailchimp_marketing";
import { createHash } from "node:crypto";

// ── Env validation ──────────────────────────────────────────────────
const API_KEY = process.env.MAILCHIMP_API_KEY;
const SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

if (!API_KEY || !SERVER_PREFIX || !AUDIENCE_ID) {
  console.error(
    "[mailchimp] Missing required env vars: MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID"
  );
}

mailchimp.setConfig({
  apiKey: API_KEY ?? "",
  server: SERVER_PREFIX ?? "",
});

// ── Helpers ─────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TAG_MAP: Record<string, string> = {
  home: "home-page",
  skin: "skin-page",
  healthspan: "healthspan-page",
};

function extractMailchimpError(err: unknown): {
  status?: number;
  title?: string;
  detail?: string;
} {
  const body = (err as { response?: { body?: Record<string, unknown> } })
    ?.response?.body;
  return {
    status: (err as { status?: number })?.status,
    title: (body?.title as string) ?? undefined,
    detail: (body?.detail as string) ?? undefined,
  };
}

// ── Route handler ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!API_KEY || !SERVER_PREFIX || !AUDIENCE_ID) {
    console.error("[mailchimp] Cannot process request — env vars missing");
    return NextResponse.json(
      { error: "Service not configured. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const email = (body.email as string)?.trim().toLowerCase();
    const firstName = (body.firstName as string)?.trim() || "";
    const phone = (body.phone as string)?.trim() || "";
    const formId = (body.formId as string)?.trim() || "home";
    // Extra fields from the form
    const age = (body.age as string)?.trim() || "";
    const concerns = (body.concerns as string)?.trim() || "";
    const spend = (body.spend as string)?.trim() || "";
    const winning = (body.winning as string)?.trim() || "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const emailHash = createHash("md5").update(email).digest("hex");

    // Check if member already exists
    try {
      const existing = await mailchimp.lists.getListMember(
        AUDIENCE_ID,
        emailHash
      );

      if (existing.status === "unsubscribed") {
        // Re-subscribe and update merge fields
        await mailchimp.lists.updateListMember(AUDIENCE_ID, emailHash, {
          status: "subscribed",
          merge_fields: {
            FNAME: firstName,
            PHONE: phone,
            AGE: age,
            CONCERNS: concerns,
            SPEND: spend,
            WINNING: winning,
          },
        });
        return NextResponse.json({
          ok: true,
          message: "Welcome back! Resubscribed.",
        });
      }

      // Already subscribed — still update merge fields with latest data
      await mailchimp.lists.updateListMember(AUDIENCE_ID, emailHash, {
        merge_fields: {
          FNAME: firstName,
          PHONE: phone,
          AGE: age,
          CONCERNS: concerns,
          SPEND: spend,
          WINNING: winning,
        },
      });

      return NextResponse.json({
        ok: true,
        message: "You're already subscribed!",
      });
    } catch (e: unknown) {
      const mcErr = extractMailchimpError(e);
      // 404 = member doesn't exist, proceed to add
      if (mcErr.status !== 404) {
        console.error("[mailchimp] Lookup error:", mcErr);
        return NextResponse.json(
          { error: "Something went wrong. Please try again." },
          { status: 500 }
        );
      }
    }

    // Add new member
    const tag = TAG_MAP[formId] || "home-page";
    await mailchimp.lists.addListMember(AUDIENCE_ID, {
      email_address: email,
      status: "subscribed",
      merge_fields: {
        FNAME: firstName,
        PHONE: phone,
        AGE: age,
        CONCERNS: concerns,
        SPEND: spend,
        WINNING: winning,
      },
      tags: [tag],
    });

    return NextResponse.json({ ok: true, message: "Subscribed!" });
  } catch (err: unknown) {
    const mcErr = extractMailchimpError(err);

    if (
      mcErr.title === "Member Exists" ||
      mcErr.detail?.includes("already")
    ) {
      return NextResponse.json({
        ok: true,
        message: "You're already subscribed!",
      });
    }

    console.error("[mailchimp] Subscribe error:", mcErr);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
