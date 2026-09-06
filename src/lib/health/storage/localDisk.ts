import { accessSync, constants as fsConstants, mkdirSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { AppError } from "@/lib/errors";
import { DEFAULT_SIGNED_URL_TTL, type StorageProvider } from "./types";

/**
 * 本地磁盘存储（开发/测试兜底，非生产）。
 *
 * - 落盘目录：`LOCAL_STORAGE_DIR`，默认项目根 `.uploads/`（须入 .gitignore）
 * - `getSignedUrl` 不返回磁盘路径，返回 F5 读取路由 URL（该路由 requireUser 鉴权）
 * - `get` 直接 readFile；`put` 自动 mkdir -p 父目录
 * - 构造时校验目录可写，不可写则抛明确错误
 */
export class LocalDiskStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = resolve(
      baseDir ?? process.env.LOCAL_STORAGE_DIR ?? ".uploads",
    );
    // 启动即校验目录存在且可写，避免运行到上传才炸。
    try {
      mkdirSync(this.baseDir, { recursive: true });
      accessSync(this.baseDir, fsConstants.W_OK);
    } catch (cause) {
      throw new AppError(
        "STORAGE_DIR_NOT_WRITABLE",
        `本地存储目录不可写：${this.baseDir}`,
        500,
        { cause },
      );
    }
  }

  /** 把 key 解析为 baseDir 下的绝对路径，并防止路径穿越逃出 baseDir。 */
  private pathFor(key: string): string {
    const full = resolve(join(this.baseDir, key));
    if (full !== this.baseDir && !full.startsWith(this.baseDir + sep)) {
      throw new AppError("STORAGE_INVALID_KEY", "非法存储 key", 400);
    }
    return full;
  }

  async put(
    key: string,
    bytes: Uint8Array,
    _contentType: string,
  ): Promise<void> {
    const full = this.pathFor(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, bytes);
  }

  async get(key: string): Promise<Uint8Array> {
    const full = this.pathFor(key);
    try {
      const buf = await readFile(full);
      return new Uint8Array(buf);
    } catch (cause) {
      throw new AppError("STORAGE_OBJECT_NOT_FOUND", "对象不存在", 404, {
        cause,
      });
    }
  }

  /**
   * 本地不做真正的对象签名：读取由 F5 路由的 requireUser + 归属校验守卫，
   * 此处仅返回该路由 URL（带过期时间戳，语义对齐短期）。key 第二段即 sourceId。
   */
  async getSignedUrl(
    key: string,
    opts?: { expiresIn?: number },
  ): Promise<string> {
    const sourceId = key.split("/")[2];
    if (!sourceId) {
      throw new AppError("STORAGE_INVALID_KEY", "非法存储 key", 400);
    }
    const ttl = opts?.expiresIn ?? DEFAULT_SIGNED_URL_TTL;
    // 相对 URL：读取路由自身鉴权，exp 仅表意短期。
    return `/api/health/sources/${sourceId}/file?exp=${ttl}`;
  }

  async delete(key: string): Promise<void> {
    const full = this.pathFor(key);
    try {
      await unlink(full);
    } catch (cause) {
      // 不存在视为已删除（幂等）；其他错误上抛。
      if ((cause as NodeJS.ErrnoException)?.code !== "ENOENT") {
        throw cause;
      }
    }
  }
}
