import { NextResponse } from "next/server";
import { requireClinicUser } from "@/lib/auth/clinic";
import { clinicReportRepo } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import type { ReviewStatus } from "@/lib/db/enums";
import {
  ClinicReportDTO,
  toClinicReportDTO,
  UpdateClinicReportBody,
} from "../dto";

type Ctx = { params: Promise<{ id: string }> };

/** 报告审核状态机：ai_drafted → in_review → approved → sent（逆向/跳步均 422）。 */
const REPORT_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  ai_drafted: ["in_review"],
  in_review: ["approved"],
  approved: ["sent"],
  sent: [],
};

/**
 * Get report detail
 * @description 单条报告；归属不匹配按 404
 * @pathParams { id: string }
 * @response ClinicReportDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const row = await clinicReportRepo.findById(id);
  if (!row || row.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  return NextResponse.json(toClinicReportDTO(row));
});

/**
 * Advance report state machine
 * @description ai_drafted→in_review（记 reviewerUserId）→approved（写 finalContent）→sent（置 sentAt）；逆向/跳步 422
 * @pathParams { id: string }
 * @body UpdateClinicReportBody
 * @response ClinicReportDTO
 * @auth bearer
 * @responseSet auth
 * @openapi
 */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { clinicId } = await requireClinicUser();
  const { id } = await ctx.params;
  const existing = await clinicReportRepo.findById(id);
  if (!existing || existing.clinicId !== clinicId) {
    throw new AppError("NOT_FOUND", "不存在", 404);
  }
  const body = UpdateClinicReportBody.parse(await req.json());
  if (
    !REPORT_TRANSITIONS[existing.status as ReviewStatus].includes(body.status)
  ) {
    throw new AppError(
      "validation_error",
      `非法状态跃迁 ${existing.status} → ${body.status}`,
      422,
    );
  }
  const patch: {
    status: ReviewStatus;
    reviewerUserId?: string | null;
    finalContent?: unknown;
    sentAt?: Date | null;
  } = { status: body.status };
  if (body.status === "in_review") {
    patch.reviewerUserId = body.reviewerUserId ?? existing.reviewerUserId;
  }
  if (body.status === "approved") {
    patch.finalContent = body.finalContent ?? existing.finalContent;
  }
  if (body.status === "sent") {
    patch.sentAt = body.sentAt ? new Date(body.sentAt) : existing.sentAt ?? new Date();
  }
  const row = await clinicReportRepo.update(id, patch);
  return NextResponse.json(toClinicReportDTO(row));
});
