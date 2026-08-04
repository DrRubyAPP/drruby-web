import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { researchStudyRepo, studyEnrollmentRepo } from "@/lib/db";
import { studyEnrollmentStatusSchema } from "@/lib/db/enums";
import { handle } from "@/lib/errors";

/** App `types.ts` Study（目录 ⋈ 入组投影） */
export const StudyDTO = z.object({
  id: z.string(),
  name: z.string(),
  status: studyEnrollmentStatusSchema,
  arm: z.string().optional(),
  consentGiven: z.boolean(),
});
export const StudyListResponse = z.array(StudyDTO);

/**
 * List studies
 * @description 研究目录 ⋈ 当前用户入组：已入组用 enrollment 投影；
 *   未入组但招募中 → status=invited/consentGiven=false；未入组的非招募研究不展示
 * @response StudyListResponse
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async () => {
  const user = await requireUser();
  const [studies, enrollments] = await Promise.all([
    researchStudyRepo.list(),
    studyEnrollmentRepo.listByUser(user.id),
  ]);

  const enrollByStudy = new Map(enrollments.map((e) => [e.studyId, e]));
  const dto: z.infer<typeof StudyDTO>[] = [];
  for (const s of studies) {
    const e = enrollByStudy.get(s.id);
    // 未入组 + 非招募中：不向用户展示（避免暴露已关闭研究目录）
    if (!e && s.recruitmentStatus !== "recruiting") continue;
    dto.push({
      id: s.id,
      name: s.name,
      status: e ? studyEnrollmentStatusSchema.parse(e.status) : "invited",
      arm: e?.arm ?? undefined,
      consentGiven: e?.consentGiven ?? false,
    });
  }
  return NextResponse.json(StudyListResponse.parse(dto));
});
