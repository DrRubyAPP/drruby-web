/**
 * 镜像 /api/consent 与 /api/contributions 的 DTO（见
 * src/app/api/consent/route.ts、src/app/api/consent/[id]/route.ts、
 * src/app/api/contributions/route.ts、src/app/api/contributions/[id]/route.ts）。
 * 不复用 server 端文件（避免拉入 prisma 依赖），独立声明同构 interface。
 */

/** GET /api/consent 返回项（三档隐私开关，self 档 locked=true 永开） */
export interface ConsentSettingDto {
  id: string;
  title: string;
  description: string;
  value: boolean;
  locked?: boolean;
}

/** POST /api/consent/[id] 入参 */
export interface UpdateConsentInput {
  value: boolean;
}

/** POST /api/consent/[id] 响应 */
export type UpdateConsentResponse = ConsentSettingDto;

/** GET /api/contributions 返回项（数据贡献，opt-in 可撤回） */
export interface ContributionDto {
  id: string;
  title: string;
  description: string;
  shared: boolean;
}

/** POST /api/contributions/[id] 入参（可撤回：true↔false 均可） */
export interface UpdateContributionInput {
  shared: boolean;
}

/** POST /api/contributions/[id] 响应 */
export type UpdateContributionResponse = ContributionDto;
