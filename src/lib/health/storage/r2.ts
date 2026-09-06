import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as presign } from "@aws-sdk/s3-request-presigner";
import { AppError } from "@/lib/errors";
import { DEFAULT_SIGNED_URL_TTL, type StorageProvider } from "./types";

/** 最小 S3 客户端契约 —— 便于测试注入 mock，不必连真实 R2。 */
export type S3Like = Pick<S3Client, "send" | "config">;

export interface R2Options {
  /** 测试可注入 mock client；生产留空则按 env 构造。 */
  client?: S3Like;
  bucket?: string;
}

/**
 * Cloudflare R2 存储（S3 兼容，生产目标后端）。
 *
 * endpoint 固定 `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`，region `auto`。
 * 凭据缺失时**不静默降级**：构造即抛错，禁止回退 local（回退会掩盖配置事故）。
 */
export class R2StorageProvider implements StorageProvider {
  private readonly client: S3Like;
  private readonly bucket: string;

  constructor(opts?: R2Options) {
    if (opts?.client) {
      this.client = opts.client;
      this.bucket = opts.bucket ?? process.env.R2_BUCKET ?? "test-bucket";
      return;
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = opts?.bucket ?? process.env.R2_BUCKET;

    const missing = [
      ["R2_ACCOUNT_ID", accountId],
      ["R2_ACCESS_KEY_ID", accessKeyId],
      ["R2_SECRET_ACCESS_KEY", secretAccessKey],
      ["R2_BUCKET", bucket],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      throw new AppError(
        "STORAGE_R2_MISCONFIGURED",
        `STORAGE_DRIVER=r2 但缺少环境变量：${missing.join(", ")}`,
        500,
      );
    }

    this.bucket = bucket as string;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
    });
  }

  async put(
    key: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Uint8Array> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const body = res.Body as
      | { transformToByteArray?: () => Promise<Uint8Array> }
      | undefined;
    if (!body?.transformToByteArray) {
      throw new AppError("STORAGE_OBJECT_NOT_FOUND", "对象不存在", 404);
    }
    return body.transformToByteArray();
  }

  async getSignedUrl(
    key: string,
    opts?: { expiresIn?: number },
  ): Promise<string> {
    return presign(
      this.client as S3Client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: opts?.expiresIn ?? DEFAULT_SIGNED_URL_TTL },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
