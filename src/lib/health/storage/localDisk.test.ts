import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalDiskStorageProvider } from "./localDisk";

describe("LocalDiskStorageProvider", () => {
  let dir: string;
  let store: LocalDiskStorageProvider;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "dr-storage-"));
    store = new LocalDiskStorageProvider(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("put/get 往返：字节一致（key 含子目录时自动建父目录）", async () => {
    const key = "health/u1/s1/abc.pdf";
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    await store.put(key, bytes, "application/pdf");
    const got = await store.get(key);
    expect(Array.from(got)).toEqual(Array.from(bytes));
  });

  it("delete 后 get 抛 404；重复 delete 幂等不抛", async () => {
    const key = "health/u1/s2/x.png";
    await store.put(key, new Uint8Array([9]), "image/png");
    await store.delete(key);
    await expect(store.get(key)).rejects.toMatchObject({ status: 404 });
    // 幂等：删不存在的对象不报错
    await expect(store.delete(key)).resolves.toBeUndefined();
  });

  it("getSignedUrl 返回读取路由 URL（含 sourceId），不暴露磁盘路径", async () => {
    const url = await store.getSignedUrl("health/u1/src-42/y.jpg");
    expect(url).toContain("/api/health/sources/src-42/file");
    expect(url).not.toContain(dir);
  });

  it("路径穿越 key 被拒（逃出 baseDir）", async () => {
    await expect(
      store.put("../evil.txt", new Uint8Array([1]), "application/pdf"),
    ).rejects.toMatchObject({ status: 400 });
  });
});
