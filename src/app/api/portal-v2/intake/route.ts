import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  decisionHealthRecordRepo,
  decisionRepo,
  healthRecordRepo,
  observationRepo,
  prisma,
  timelineEventRepo,
} from "@/lib/db";
import { handle } from "@/lib/errors";
import { openAiClient } from "@/lib/llm/client";
import {
  INTAKE_SYSTEM_PROMPT,
  inferLocally,
  intakeBodySchema,
  type PendingAction,
  parseInterpretation,
} from "@/lib/portal-v2/intake";

async function interpret(
  text: string,
  attachments: { fileName: string; mime: string }[],
) {
  const fallback = inferLocally(text, attachments.length > 0);
  if (!openAiClient.isConfigured()) return fallback;
  try {
    const raw = await openAiClient.chatComplete([
      { role: "system", content: INTAKE_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ text, attachments }),
      },
    ]);
    return parseInterpretation(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

async function initialHealthContext(userId: string) {
  const records = await prisma.healthRecord.findMany({
    where: { userId },
    orderBy: { recordedAt: "desc" },
    take: 12,
    select: { id: true, title: true, kind: true, recordedAt: true },
  });
  return {
    source: "my_health",
    importedAt: new Date().toISOString(),
    records: records.map((record) => ({
      ...record,
      recordedAt: record.recordedAt.toISOString(),
    })),
  };
}

async function performPendingAction(
  pending: PendingAction,
  text: string,
  userId: string,
) {
  const decision = await decisionRepo.findById(pending.decisionId);
  if (!decision || decision.userId !== userId) {
    return {
      message: "I could not find that decision. Please try again.",
      pendingAction: null,
    };
  }
  const accepted = /^(yes|yep|yeah|sure|please|ok|okay)\b/i.test(text.trim());
  if (pending.type === "suggest_tracking") {
    if (!accepted) {
      return {
        message: "No problem. What else would you like to keep an eye on?",
        pendingAction: { type: "ask_custom_tracking", decisionId: decision.id },
      };
    }
    // "Skin condition" is a qualitative symptom metric, not a distinct
    // record kind. Persist the start of tracking in My Health as well as in
    // the observation plan, so the decision and longitudinal health history
    // share a durable, explicitly connected reference point.
    if (pending.title.trim().toLowerCase() === "skin condition") {
      await observationRepo.createSkinConditionTracking({
        userId,
        decisionId: decision.id,
        cadence: pending.cadence,
      });
      return {
        message: `I’ll help you track ${pending.title.toLowerCase()} ${pending.cadence}. Is there anything else you’d like to watch during this process?`,
        pendingAction: { type: "ask_custom_tracking", decisionId: decision.id },
      };
    }
    await observationRepo.create({
      userId,
      decisionId: decision.id,
      title: pending.title,
      cadence: pending.cadence,
    });
    await timelineEventRepo.create(userId, {
      kind: "note",
      importance: "minor",
      title: `Started observing ${pending.title}`,
      decisionId: decision.id,
      source: "you",
      occurredAt: new Date(),
    });
    return {
      message: `I’ll help you track ${pending.title.toLowerCase()} ${pending.cadence}. Is there anything else you’d like to watch during this process?`,
      pendingAction: { type: "ask_custom_tracking", decisionId: decision.id },
    };
  }
  if (!text.trim()) {
    return { message: "What would you like to track?", pendingAction: pending };
  }
  await observationRepo.create({
    userId,
    decisionId: decision.id,
    title: text.trim(),
  });
  await timelineEventRepo.create(userId, {
    kind: "note",
    importance: "minor",
    title: `Started observing ${text.trim()}`,
    decisionId: decision.id,
    source: "you",
    occurredAt: new Date(),
  });
  return {
    message: `Added “${text.trim()}” to what you’re tracking. You can update it whenever something changes.`,
    pendingAction: null,
  };
}

/**
 * AI-first portal capture. The model may interpret free text, but this route
 * alone validates ownership and performs writes. Attachments currently store
 * provenance metadata; binary storage/extraction can be added behind this API
 * without changing the composer contract.
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = intakeBodySchema.parse(await req.json());

  if (body.pendingAction) {
    return NextResponse.json(
      await performPendingAction(body.pendingAction, body.text, user.id),
    );
  }

  const parsed = await interpret(body.text, body.attachments);
  if (parsed.intent === "conversation") {
    return NextResponse.json({
      message: parsed.response ?? "Tell me what is on your mind.",
      pendingAction: null,
    });
  }

  if (
    parsed.intent === "consideration" ||
    parsed.intent === "started_treatment"
  ) {
    const topic = parsed.topic ?? parsed.title ?? body.text.trim();
    const existing = await prisma.decision.findFirst({
      where: { userId: user.id, topic: { equals: topic, mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
    });
    const decision =
      existing ??
      (await decisionRepo.create(user.id, {
        question:
          parsed.intent === "started_treatment"
            ? `I started ${topic}`
            : `I am considering ${topic}`,
        topic,
        type: "treatment",
        ...(parsed.intent === "started_treatment"
          ? {
              lifecycle: "DECIDED" as const,
              decisionKind: "action" as const,
              outcome: "decided_to_do_it" as const,
            }
          : {}),
      }));

    if (!existing) {
      await decisionRepo.updateHealthContext(decision.id, {
        healthContext: await initialHealthContext(user.id),
        status: "unconfirmed",
      });
      if (parsed.intent === "consideration") {
        await timelineEventRepo.create(user.id, {
          kind: "decision",
          importance: "minor",
          title: `Started considering ${topic}`,
          decisionId: decision.id,
          source: "you",
          occurredAt: new Date(),
        });
      }
    }

    if (parsed.intent === "started_treatment") {
      const record = await healthRecordRepo.create(user.id, {
        kind: "treatment",
        title: parsed.title ?? `Started ${topic}`,
        recordedAt: new Date(),
        status: "CONFIRMED",
        ocrStatus: "manual",
      });
      await decisionHealthRecordRepo.connect(
        decision.id,
        record.id,
        "assistant",
      );
      await timelineEventRepo.create(user.id, {
        kind: "treatment",
        importance: "important",
        title: `Started ${topic}`,
        decisionId: decision.id,
        source: "you",
        occurredAt: new Date(),
      });
      return NextResponse.json({
        message: `I’ve recorded that you started ${topic}. Many women find a weekly skin-condition check-in useful for noticing change over time. Would you like to do that?`,
        decisionId: decision.id,
        pendingAction: {
          type: "suggest_tracking",
          decisionId: decision.id,
          title: "Skin condition",
          cadence: "weekly",
        },
      });
    }
    return NextResponse.json({
      message: `I’ve started a private decision space for ${topic} and brought in your current health context. Tell me what matters most to you about it.`,
      decisionId: decision.id,
      pendingAction: null,
    });
  }

  const attachmentTitle = body.attachments[0]?.fileName;
  const record = await healthRecordRepo.create(user.id, {
    kind: parsed.recordKind ?? "checkup",
    title:
      (parsed.title ?? attachmentTitle ?? body.text.trim()) || "Health update",
    recordedAt: new Date(),
    status: "CONFIRMED",
    ocrStatus: "manual",
    objectKey: attachmentTitle ?? null,
  });
  await timelineEventRepo.create(user.id, {
    kind: parsed.recordKind === "lab" ? "lab" : "note",
    importance: "minor",
    title: attachmentTitle
      ? `Added ${attachmentTitle} to health history`
      : `Added health update: ${record.title}`,
    source: "you",
    occurredAt: new Date(),
  });
  return NextResponse.json({
    message: attachmentTitle
      ? `I added ${attachmentTitle} to your health history. I’ll identify its type as we process it.`
      : "I added that to your health history.",
    healthRecordId: record.id,
    pendingAction: null,
  });
});
