/**
 * task-43 D2 RelevanceEngine 用的 topicSlug → Record 字段映射表
 *
 * 保守策略：表外组合不命中 → 不触发 regeneration。
 * 命中条件 = topicSlug 对应的 documentClass 集合或 kind 集合任一命中。
 *
 * 注：skincare/imaging 与皮肤照片相关；hrt/lab 与激素化验相关；
 * 其他实体（thermage/ultherapy/botox/laser/filler/clinic）按"皮肤医美类"映射到 Imaging。
 */
import type { TopicSlug } from "@/lib/db/enums";

/** topicSlug → 期望 Record.documentClass 集合 */
export const TOPIC_DOCUMENT_CLASS_MAP: Record<
  TopicSlug,
  ReadonlySet<string>
> = {
  hrt: new Set(["Lab"]),
  skincare: new Set(["Imaging"]),
  thermage: new Set(["Imaging"]),
  ultherapy: new Set(["Imaging"]),
  botox: new Set(["Imaging"]),
  laser: new Set(["Imaging"]),
  filler: new Set(["Imaging"]),
  clinic: new Set<string>(),
};

/** topicSlug → 期望 Record.kind 集合 */
export const TOPIC_KIND_MAP: Record<TopicSlug, ReadonlySet<string>> = {
  hrt: new Set(["lab"]),
  skincare: new Set(["imaging"]),
  thermage: new Set(["imaging"]),
  ultherapy: new Set(["imaging"]),
  botox: new Set(["imaging"]),
  laser: new Set(["imaging"]),
  filler: new Set(["imaging"]),
  clinic: new Set<string>(),
};
