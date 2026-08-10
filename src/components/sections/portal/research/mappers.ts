import type { StudyDto, StudyStatus } from "./dto";

/** status → badge label（mapper 维护，UI 透传渲染）。 */
export const STUDY_STATUS_TO_LABEL: Record<StudyStatus, string> = {
  invited: "Invited",
  enrolled: "Enrolled",
  completed: "Completed",
};

/** status → badge label */
export function statusToLabel(status: StudyStatus): string {
  return STUDY_STATUS_TO_LABEL[status];
}

/** 分组结果：open = 招募中未入组；yours = 已入组或已完成 */
export interface StudyGroups {
  open: StudyDto[]; // status === "invited"
  yours: StudyDto[]; // status === "enrolled" || "completed"
}

/** 把扁平列表分组为 open/yours 两组（保留原顺序）。 */
export function groupStudies(items: StudyDto[]): StudyGroups {
  const open: StudyDto[] = [];
  const yours: StudyDto[] = [];
  for (const s of items) {
    if (s.status === "invited") open.push(s);
    else yours.push(s); // enrolled | completed
  }
  return { open, yours };
}

/** 可入组：仅 invited 状态显示 "Join study" 按钮 */
export function isJoinable(s: StudyDto): boolean {
  return s.status === "invited";
}

/** 可退出：仅 enrolled 状态显示 "Withdraw" 按钮（completed 不可退） */
export function canWithdraw(s: StudyDto): boolean {
  return s.status === "enrolled";
}

/** 是否有 arm 字段可渲染（缺省/空串/纯空白都视为无） */
export function hasArm(s: StudyDto): boolean {
  return typeof s.arm === "string" && s.arm.trim().length > 0;
}
