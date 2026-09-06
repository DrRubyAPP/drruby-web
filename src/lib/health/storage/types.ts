/**
 * 存储抽象层（task-46 D-5）—— 业务代码只依赖此接口，不依赖具体后端。
 *
 * 目标后端为 Cloudflare R2（S3 兼容），本地磁盘实现仅作开发/测试兜底，非生产方案。
 * 运行时按环境变量 `STORAGE_DRIVER=local|r2` 切换（见 `./index.ts` 工厂）。
 *
 * objectKey 命名规范（F4）：`health/{userId}/{sourceId}/{uuid}.{ext}`
 * —— 原文件名不进 key（避免路径穿越/中文编码/特殊字符），只存 DB fileName；
 * 含 uuid 保证不可枚举，即使签名 URL 泄露也无法批量遍历。
 */
export interface StorageProvider {
  /** 写入对象。key 由调用方按 F4 命名规范给定。 */
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  /**
   * 服务端读字节 —— task-48 OpenAI 抽取转 base64 直接依赖此方法，
   * 不走 HTTP 绕路。
   */
  get(key: string): Promise<Uint8Array>;
  /**
   * 短期签名 URL，仅由 F5 读取路由内部调用；默认 TTL 60s。
   * 本地实现返回读取路由 URL（带一次性签名参数），不返回磁盘路径。
   */
  getSignedUrl(key: string, opts?: { expiresIn?: number }): Promise<string>;
  delete(key: string): Promise<void>;
}

/** 签名 URL 默认有效期（秒）。 */
export const DEFAULT_SIGNED_URL_TTL = 60;
