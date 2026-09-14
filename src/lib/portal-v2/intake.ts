import { z } from "zod";
import { healthRecordKindSchema } from "@/lib/db/enums";

export const attachmentSchema = z.object({
  fileName: z.string().min(1),
  mime: z.string().min(1),
});

export const pendingActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("suggest_tracking"),
    decisionId: z.string(),
    title: z.string(),
    cadence: z.string(),
  }),
  z.object({
    type: z.literal("ask_custom_tracking"),
    decisionId: z.string(),
  }),
]);

export type PendingAction = z.infer<typeof pendingActionSchema>;

export const intakeBodySchema = z.object({
  text: z.string().max(4_000).default(""),
  attachments: z.array(attachmentSchema).max(3).default([]),
  pendingAction: pendingActionSchema.optional(),
});

const llmInterpretationSchema = z.object({
  intent: z.enum([
    "started_treatment",
    "consideration",
    "health_record",
    "conversation",
  ]),
  title: z.string().min(1).max(200).optional(),
  topic: z.string().min(1).max(200).optional(),
  recordKind: healthRecordKindSchema.optional(),
  response: z.string().min(1).max(800).optional(),
});

export type IntakeInterpretation = z.infer<typeof llmInterpretationSchema>;

/** Parse an LLM JSON response without trusting it. The caller always has a
 * deterministic fallback, so an unconfigured model never blocks capture. */
export function parseInterpretation(value: string): IntakeInterpretation | null {
  const json = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return llmInterpretationSchema.safeParse(JSON.parse(json)).data ?? null;
  } catch {
    return null;
  }
}

function kindFromText(text: string): z.infer<typeof healthRecordKindSchema> {
  const lower = text.toLowerCase();
  if (/lab|blood|cholesterol|ldl|hdl|glucose|a1c|test result/.test(lower)) {
    return "lab";
  }
  if (/medication|medication|dose|prescription|mg\b/.test(lower)) {
    return "medication";
  }
  if (/symptom|pain|rash|fatigue|headache|sleep/.test(lower)) return "symptom";
  if (/thermage|treatment|procedure|laser|facial/.test(lower)) return "treatment";
  return "checkup";
}

/** Safe local fallback for development and for an unavailable AI provider. */
export function inferLocally(
  text: string,
  hasAttachment: boolean,
): IntakeInterpretation {
  const cleaned = text.trim();
  const started = /\b(i |i've |i have )?(started|began|had)\b/i.test(cleaned);
  const considering = /\b(considering|thinking about|should i|weighing)\b/i.test(
    cleaned,
  );
  const topic = cleaned
    .replace(/^.*?\b(started|began|had|considering|thinking about)\b\s*/i, "")
    .replace(/[.!?].*$/, "")
    .trim();

  if (started && topic) {
    return {
      intent: "started_treatment",
      topic,
      title: `Started ${topic}`,
      recordKind: "treatment",
    };
  }
  if (considering && topic) {
    return { intent: "consideration", topic, title: `Considering ${topic}` };
  }
  if (cleaned || hasAttachment) {
    return {
      intent: "health_record",
      title: cleaned || "Health document",
      recordKind: kindFromText(cleaned),
    };
  }
  return { intent: "conversation", response: "Tell me what is on your mind." };
}

export const INTAKE_SYSTEM_PROMPT = `You classify a DrRuby member's health capture. Return JSON only, with no markdown.
Choose exactly one intent: started_treatment, consideration, health_record, conversation.
Use started_treatment only when the member says she has started, received, or had a treatment/product/medication. Use consideration when she is weighing an option. Use health_record for a factual health update or a lab/image/PDF attachment.
For health_record choose recordKind from: lab, imaging, checkup, vitals, medication, symptom, treatment. Do not diagnose, infer a clinical result, or make treatment recommendations. Keep title and topic concise.`;
