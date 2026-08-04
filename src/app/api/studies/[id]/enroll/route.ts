import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { researchStudyRepo, studyEnrollmentRepo } from "@/lib/db";
import { studyEnrollmentStatusSchema } from "@/lib/db/enums";
import { AppError, handle } from "@/lib/errors";

/**
 * 入组入参：逐项知情同意。
 * `consentGiven` 必须为 `true`（`z.literal(true)`），否则 400 —— 未同意不得入组。
 */
export const EnrollBody = z.object({
  arm: z.string().optional().describe("分组臂（可选）"),
  consentGiven: z.literal(true).describe("逐项知情同意，必须为 true"),
});

/** 入组结果（对齐 App Study 的入组投影字段） */
export const EnrollmentResponse = z.object({
  studyId: z.string(),
  status: studyEnrollmentStatusSchema,
  arm: z.string().optional(),
  consentGiven: z.boolean(),
});

type Ctx = { params: Promise<{ id: string }> };

/**
 * Enroll into study
 * @description 入组某研究（逐项知情同意，consentGiven 必 true）。(studyId,userId) 唯一 → 重复入组幂等
 * @body EnrollBody
 * @response EnrollmentResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const user = await requireUser();
  const { id: studyId } = await ctx.params;

  const study = await researchStudyRepo.findById(studyId);
  if (!study) throw new AppError("NOT_FOUND", "研究不存在", 404);

  const body = EnrollBody.parse(await req.json());
  const enrollment = await studyEnrollmentRepo.enroll({
    studyId,
    userId: user.id,
    status: "enrolled",
    arm: body.arm ?? null,
    consentGiven: body.consentGiven,
  });

  return NextResponse.json(
    EnrollmentResponse.parse({
      studyId: enrollment.studyId,
      status: studyEnrollmentStatusSchema.parse(enrollment.status),
      arm: enrollment.arm ?? undefined,
      consentGiven: enrollment.consentGiven,
    }),
    { status: 201 },
  );
});
