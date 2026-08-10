import type { ConsentSettingDto, ContributionDto } from "./dto";

/** consent 项是否永久锁定（self 档永开不可切）。locked 缺省视为 false。 */
export function isLocked(s: ConsentSettingDto): boolean {
  return s.locked === true;
}

/** consent 项是否可切换（非 locked 即可切）。 */
export function canToggle(s: ConsentSettingDto): boolean {
  return !isLocked(s);
}

/** contribution 是否可分享（未分享才显示 "Share" 按钮）。 */
export function canShare(c: ContributionDto): boolean {
  return !c.shared;
}

/** contribution 是否可撤回（已分享才显示 "Withdraw" 按钮）。 */
export function canWithdrawContribution(c: ContributionDto): boolean {
  return c.shared;
}
