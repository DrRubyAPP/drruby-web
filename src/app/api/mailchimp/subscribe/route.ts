import { NextRequest, NextResponse } from "next/server";
import mailchimp from "@mailchimp/mailchimp_marketing";
import { createHash } from "node:crypto";

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY!,
  server: process.env.MAILCHIMP_SERVER_PREFIX!,
});

const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID!;

const TAG_MAP: Record<string, string> = {
  home: "home-page",
  skin: "skin-page",
  healthspan: "healthspan-page",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email as string)?.trim().toLowerCase();
    const firstName = (body.firstName as string)?.trim() || "";
    const phone = (body.phone as string)?.trim() || "";
    const formId = (body.formId as string)?.trim() || "home";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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
        await mailchimp.lists.updateListMember(AUDIENCE_ID, emailHash, {
          status: "subscribed",
        });
        return NextResponse.json({
          ok: true,
          message: "Welcome back! Resubscribed.",
        });
      }

      return NextResponse.json({
        ok: true,
        message: "You're already subscribed!",
      });
    } catch (e: any) {
      // 404 = member doesn't exist, proceed to add
      if (e?.status !== 404) {
        console.error("Mailchimp lookup error:", e?.response?.body ?? e);
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
      },
      tags: [tag],
    });

    return NextResponse.json({ ok: true, message: "Subscribed!" });
  } catch (err: any) {
    const title = err?.response?.body?.title;
    if (
      title === "Member Exists" ||
      err?.response?.body?.detail?.includes?.("already")
    ) {
      return NextResponse.json({
        ok: true,
        message: "You're already subscribed!",
      });
    }

    console.error("Mailchimp subscribe error:", err?.response?.body ?? err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
