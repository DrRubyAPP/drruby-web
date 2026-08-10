/**
 * 镜像 /api/studies 的 DTO（见 src/app/api/studies/route.ts、
 * src/app/api/studies/[id]/enroll/route.ts、withdraw/route.ts）。
 * 不复用 server 端文件（避免拉入 prisma 依赖），独立声明同构 interface。
 */

/** study_enrollment.status — 3 值（参考 src/lib/db/enums.ts:159-163） */
export type StudyStatus = "invited" | "enrolled" | "completed";

/** GET /api/studies 返回项（目录 ⋈ 当前用户入组投影） */
export interface StudyDto {
  id: string;
  name: string;
  status: StudyStatus;
  arm?: string;
  consentGiven: boolean;
}

/**
 * POST /api/studies/[id]/enroll 入参。
 * `consentGiven` 必为 `true`（对齐 z.literal(true)）—— 未同意不得入组。
 */
export interface EnrollInput {
  consentGiven: true;
  arm?: string;
}

/** POST /api/studies/[id]/enroll 响应（201） */
export interface EnrollResponse {
  studyId: string;
  status: StudyStatus;
  arm?: string;
  consentGiven: boolean;
}

/** POST /api/studies/[id]/withdraw 响应 */
export interface WithdrawResponse {
  studyId: string;
  withdrawn: boolean;
  consentGiven: boolean;
}
