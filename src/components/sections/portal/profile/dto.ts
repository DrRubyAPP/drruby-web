/**
 * 镜像 GET/POST /api/me 的 MeResponse（见 src/app/api/me/route.ts）。
 * 不复用 server 端文件（避免拉入 prisma/zod 依赖），独立声明同构 interface。
 * 供 profile / settings 两个岛共享（settings 岛 import 本文件）。
 */
export interface MeDto {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  role: string;
  subscriptionTier: string;
}

/** POST /api/me 入参（本轮仅 name） */
export interface UpdateMeInput {
  name: string;
}
