// @vitest-environment node
// 读取路由返回流式字节 / 302，用 Node 原生运行时（与上传路由一致）
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  __resetStorageForTest,
  buildObjectKey,
  getStorage,
} from "@/lib/health/storage";
import {
  asUser,
  disconnectDb,
  makeUser,
  params,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

function bareGet(): Request {
  return new Request("http://test/api", { method: "GET" });
}

beforeAll(async () => {
  process.env.STORAGE_DRIVER = "local";
  process.env.LOCAL_STORAGE_DIR = await mkdtemp(join(tmpdir(), "dr-file-"));
});

describe("GET /api/health/sources/[id]/file 读取（local）", () => {
  beforeEach(async () => {
    await resetDb();
    __resetStorageForTest();
  });
  afterEach(disconnectDb);

  it("归属正常 → 200 流式返回，字节与写入一致 + Content-Type", async () => {
    const { GET } = await import("./route");
    const { healthSourceRepo } = await import("@/lib/db");
    const user = await makeUser("file-ok@example.com");
    asUser(user.id);

    // 建 source + 写对象（模拟上传已完成）
    const source = await healthSourceRepo.create(user.id, {
      fileName: "lab.pdf",
    });
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2, 3]);
    const key = buildObjectKey(user.id, source.id, "application/pdf");
    await getStorage().put(key, bytes, "application/pdf");
    await healthSourceRepo.update(source.id, {
      objectKey: key,
      mime: "application/pdf",
    });

    const res = await GET(bareGet(), params(source.id));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    const got = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(got)).toEqual(Array.from(bytes));
  });

  it("越权：用户 A 请求用户 B 的原件 → 404", async () => {
    const { GET } = await import("./route");
    const { healthSourceRepo } = await import("@/lib/db");
    const a = await makeUser("file-a@example.com");
    const b = await makeUser("file-b@example.com");
    // B 的原件
    asUser(b.id);
    const src = await healthSourceRepo.create(b.id, { fileName: "b.pdf" });
    const key = buildObjectKey(b.id, src.id, "application/pdf");
    await getStorage().put(
      key,
      new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      "application/pdf",
    );
    await healthSourceRepo.update(src.id, {
      objectKey: key,
      mime: "application/pdf",
    });

    // A 请求 B 的资源 → 404（不返回 403，避免存在性探测）
    asUser(a.id);
    const res = await GET(bareGet(), params(src.id));
    expect(res.status).toBe(404);
  });

  it("历史占位数据（无 objectKey）→ 404", async () => {
    const { GET } = await import("./route");
    const { healthSourceRepo } = await import("@/lib/db");
    const user = await makeUser("file-legacy@example.com");
    asUser(user.id);
    const src = await healthSourceRepo.create(user.id, { fileName: "old.pdf" });

    const res = await GET(bareGet(), params(src.id));
    expect(res.status).toBe(404);
  });
});
