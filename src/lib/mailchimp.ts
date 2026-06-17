import mailchimp from "@mailchimp/mailchimp_marketing";
import { createHash } from "node:crypto";

// ── Constants ───────────────────────────────────────────────────────
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const TAG_MAP: Record<string, string> = {
  home: "home-page",
  skin: "skin-page",
  healthspan: "healthspan-page",
};

// ── Types ───────────────────────────────────────────────────────────
export interface SubscribeInput {
  email?: string;
  firstName?: string;
  phone?: string;
  formId?: string;
  age?: string;
  concerns?: string;
  spend?: string;
  winning?: string;
}

export interface SubscribeResult {
  status: number;
  body: { ok?: boolean; message?: string; error?: string };
}

// ── Helpers ─────────────────────────────────────────────────────────
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

// ── Subscribe ───────────────────────────────────────────────────────
export async function subscribeMember(
  input: SubscribeInput
): Promise<SubscribeResult> {
  // Read env vars at request time (not module level) to avoid
  // serverless cold-start issues where env vars may not be available
  // during module initialization.
  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
  const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!API_KEY || !SERVER_PREFIX || !AUDIENCE_ID) {
    console.error(
      "[mailchimp] Missing required env vars: MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID"
    );
    return {
      status: 503,
      body: { error: "Service not configured. Please try again later." },
    };
  }

  mailchimp.setConfig({
    apiKey: API_KEY,
    server: SERVER_PREFIX,
  });

  const email = input.email?.trim().toLowerCase();
  const firstName = input.firstName?.trim() || "";
  const phone = input.phone?.trim() || "";
  const formId = input.formId?.trim() || "home";
  // Extra fields from the form
  const age = input.age?.trim() || "";
  const concerns = input.concerns?.trim() || "";
  const spend = input.spend?.trim() || "";
  const winning = input.winning?.trim() || "";

  if (!email) {
    return { status: 400, body: { error: "Email is required" } };
  }

  if (!EMAIL_RE.test(email)) {
    return {
      status: 400,
      body: { error: "Please enter a valid email address" },
    };
  }

  const mergeFields = {
    FNAME: firstName,
    PHONE: phone,
    AGE: age,
    CONCERNS: concerns,
    SPEND: spend,
    WINNING: winning,
  };

  try {
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
          merge_fields: mergeFields,
        });
        return {
          status: 200,
          body: { ok: true, message: "Welcome back! Resubscribed." },
        };
      }

      // Already subscribed — still update merge fields with latest data
      await mailchimp.lists.updateListMember(AUDIENCE_ID, emailHash, {
        merge_fields: mergeFields,
      });

      return {
        status: 200,
        body: { ok: true, message: "You're already subscribed!" },
      };
    } catch (e: unknown) {
      const mcErr = extractMailchimpError(e);
      // 404 = member doesn't exist, proceed to add
      if (mcErr.status !== 404) {
        console.error("[mailchimp] Lookup error:", mcErr);
        return {
          status: 500,
          body: { error: "Something went wrong. Please try again." },
        };
      }
    }

    // Add new member
    const tag = TAG_MAP[formId] || "home-page";
    await mailchimp.lists.addListMember(AUDIENCE_ID, {
      email_address: email,
      status: "subscribed",
      merge_fields: mergeFields,
      tags: [tag],
    });

    return { status: 200, body: { ok: true, message: "Subscribed!" } };
  } catch (err: unknown) {
    const mcErr = extractMailchimpError(err);

    if (mcErr.title === "Member Exists" || mcErr.detail?.includes("already")) {
      return {
        status: 200,
        body: { ok: true, message: "You're already subscribed!" },
      };
    }

    console.error("[mailchimp] Subscribe error:", mcErr);
    return {
      status: 500,
      body: { error: "Something went wrong. Please try again." },
    };
  }
}
