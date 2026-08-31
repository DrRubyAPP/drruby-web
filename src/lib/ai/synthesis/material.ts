/**
 * task-43 D4 MaterialDetector（Contract §17）
 *
 * 信息类别集合 diff：
 * - connected Records 按 (kind, documentClass) 分桶；新桶出现 / 桶内值变化 → material
 * - healthContext 5 类内容变化 → material
 * - corpus 版本变 → material
 * - 同桶新增支持证据（同 kind+documentClass，无值变化）→ 非 material（§22）
 *
 * 纯函数；不依赖 LLM（D4）。
 *
 * 注：措辞/格式/引用顺序/文风重写/同义重述 → 非 material，但本检测器输入是
 * 结构化数据（Records + healthContext + corpusVersion），不参与文案比较，
 * 故这些场景天然不会触发 material（D4 模板对同输入确定）。
 */
import { HEALTH_CONTEXT_CATEGORIES } from "@/lib/db/enums";
import type { ConnectedRecordRef, HealthContext } from "./types";

export interface MaterialInput {
  /** 上一次 Snapshot 时的 connected Records 集合 */
  prevConnectedRecords: ConnectedRecordRef[];
  /** 本次 regen 时新 connected Records 集合 */
  newConnectedRecords: ConnectedRecordRef[];
  /** 上一次 Snapshot 时的 healthContext（结构化 5 类） */
  prevHealthContext?: HealthContext | null;
  /** 本次 regen 时的 healthContext */
  newHealthContext?: HealthContext | null;
  /** Others/Science 语料版本是否变（B2/§22） */
  corpusVersionChanged: boolean;
}

export interface MaterialResult {
  material: boolean;
  /** 判定原因（机器可读，便于日志/单测） */
  reason: string;
}

/** 按 (kind, documentClass) 分桶；桶内存 id → summary 映射（用于值变化检测） */
function bucketRecords(
  records: ConnectedRecordRef[],
): Map<string, Map<string, string>> {
  const buckets = new Map<string, Map<string, string>>();
  for (const r of records) {
    const key = `${r.kind}|${r.documentClass ?? "null"}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = new Map();
      buckets.set(key, bucket);
    }
    bucket.set(r.id, r.summary);
  }
  return buckets;
}

/** 取 healthContext 5 类内容字符串（用于 diff） */
function serializeHealthContext(
  hc: HealthContext | null | undefined,
): Map<string, string> {
  const out = new Map<string, string>();
  if (!hc || typeof hc !== "object") return out;
  for (const cat of HEALTH_CONTEXT_CATEGORIES) {
    const v = hc[cat];
    out.set(
      cat,
      typeof v === "string" ? v : v == null ? "" : JSON.stringify(v),
    );
  }
  return out;
}

/**
 * 判定本次 regen 是否构成 material synthesis change（D4）。
 *
 * 算法：
 * 1. 把 prev/new Records 按 (kind, documentClass) 分桶
 * 2. 新桶出现 → material（信息类别集合扩大）
 * 3. 同桶内既存 Record 的 summary 变化 → material（同类别值变化）
 * 4. 同桶新增 supporting evidence（新 id 但既有 summary 内容不变）→ 非 material
 * 5. healthContext 5 类任一变化 → material
 * 6. corpusVersionChanged=true → material
 */
export function detectMaterialChange(input: MaterialInput): MaterialResult {
  // (6) corpus 版本变
  if (input.corpusVersionChanged) {
    return { material: true, reason: "corpus version changed" };
  }

  // (5) healthContext 类别变化
  const prevHC = serializeHealthContext(input.prevHealthContext);
  const newHC = serializeHealthContext(input.newHealthContext);
  for (const cat of HEALTH_CONTEXT_CATEGORIES) {
    const a = prevHC.get(cat) ?? "";
    const b = newHC.get(cat) ?? "";
    if (a !== b) {
      return {
        material: true,
        reason: `health context category "${cat}" changed`,
      };
    }
  }

  // (1)-(4) Records 分桶 diff
  const prevBuckets = bucketRecords(input.prevConnectedRecords);
  const newBuckets = bucketRecords(input.newConnectedRecords);

  // (2) 新桶出现
  for (const key of newBuckets.keys()) {
    if (!prevBuckets.has(key)) {
      return {
        material: true,
        reason: `new record category "${key}" appeared`,
      };
    }
  }

  // (3) 同桶内值变化（id 既存但 summary 变）
  for (const [key, newBucket] of newBuckets.entries()) {
    const prevBucket = prevBuckets.get(key);
    if (!prevBucket) continue; // 已在 (2) 处理为新桶
    for (const [id, newSummary] of newBucket.entries()) {
      const prevSummary = prevBucket.get(id);
      if (prevSummary !== undefined && prevSummary !== newSummary) {
        return {
          material: true,
          reason: `record "${id}" value changed in category "${key}"`,
        };
      }
    }
    // (4) 同桶新增 supporting evidence（新 id，但不算 material）
    // 落到此分支 = 既存 Records 都未变值，新增 id 是 supporting → 非 material
  }

  // 全无变化 → 非 material（B1：freshness check 但 Current 不变）
  return { material: false, reason: "no material change" };
}
