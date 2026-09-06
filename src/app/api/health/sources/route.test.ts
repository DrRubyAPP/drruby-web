// @vitest-environment node
// multipart 请求体需 Node 原生 undici（jsdom 的 Request/FormData 无法 round-trip 到 req.formData()）
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
import { __resetStorageForTest } from "@/lib/health/storage";
import {
  asAnonymous,
  asUser,
  disconnectDb,
  makeUser,
  resetDb,
} from "@/lib/test/route-helpers";

vi.mock("@/lib/auth/session", async () =>
  (await import("@/lib/test/route-helpers")).sessionModuleMock(),
);

/** PDF 魔数 `%PDF` + 填充。 */
function pdfBytes(size = 32): Uint8Array<ArrayBuffer> {
  const b = new Uint8Array(new ArrayBuffer(size));
  b[0] = 0x25; // %
  b[1] = 0x50; // P
  b[2] = 0x44; // D
  b[3] = 0x46; // F
  return b;
}

/** 构造 multipart/form-data 上传请求。 */
function uploadRequest(
  file: File | null,
  extra: Record<string, string> = {},
): Request {
  const form = new FormData();
  if (file) form.append("file", file);
  form.append("kind", extra.kind ?? "lab");
  form.append("recordedAt", extra.recordedAt ?? "2026-03-01T00:00:00.000Z");
  return new Request("http://test/api", { method: "POST", body: form });
}

beforeAll(async () => {
  process.env.STORAGE_DRIVER = "local";
  process.env.LOCAL_STORAGE_DIR = await mkdtemp(join(tmpdir(), "dr-route-"));
});

describe("POST /api/health/sources 上传（multipart）", () => {
  beforeEach(async () => {
    await resetDb();
    __resetStorageForTest();
  });
  afterEach(disconnectDb);

  it("未登录 → 401", async () => {
    const { POST } = await import("./route");
    asAnonymous();
    const file = new File([pdfBytes()], "lab.pdf", { type: "application/pdf" });
    const res = await POST(uploadRequest(file));
    expect(res.status).toBe(401);
  });

  it("正常上传 PDF → 201，objectKey 形如 health/{userId}/{sourceId}/{uuid}.pdf", async () => {
    const { POST, GET } = await import("./route");
    const { healthSourceRepo } = await import("@/lib/db");
    const user = await makeUser("hs-ok@example.com");
    asUser(user.id);

    const file = new File([pdfBytes()], "lab.pdf", { type: "application/pdf" });
    const res = await POST(uploadRequest(file));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.sourceId).toBeTruthy();
    expect(body.recordId).toBeTruthy();

    const rows = await healthSourceRepo.listByUser(user.id);
    expect(rows[0].objectKey).toMatch(
      new RegExp(`^health/${user.id}/${body.sourceId}/[0-9a-f-]+\\.pdf$`),
    );
    expect(rows[0].mime).toBe("application/pdf");

    const list = await GET();
    const listed: Array<{ id: string }> = await list.json();
    expect(listed.some((r) => r.id === body.sourceId)).toBe(true);
  });

  it("缺 file 字段 → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("hs-nofile@example.com");
    asUser(user.id);
    const res = await POST(uploadRequest(null));
    expect(res.status).toBe(400);
  });

  it("空文件（0 字节）→ 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("hs-empty@example.com");
    asUser(user.id);
    const file = new File([new Uint8Array(0)], "empty.pdf", {
      type: "application/pdf",
    });
    const res = await POST(uploadRequest(file));
    expect(res.status).toBe(400);
  });

  it("扩展名伪装成 .pdf 的非 PDF → 400（按魔数拒绝）", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("hs-fake@example.com");
    asUser(user.id);
    const file = new File(
      [new TextEncoder().encode("hello not a pdf")],
      "x.pdf",
      {
        type: "application/pdf",
      },
    );
    const res = await POST(uploadRequest(file));
    expect(res.status).toBe(400);
  });

  it("超过 20MB → 400", async () => {
    const { POST } = await import("./route");
    const user = await makeUser("hs-big@example.com");
    asUser(user.id);
    const file = new File([pdfBytes(20 * 1024 * 1024 + 1)], "big.pdf", {
      type: "application/pdf",
    });
    const res = await POST(uploadRequest(file));
    expect(res.status).toBe(400);
  });

  it("GET 列表仅返回当前用户", async () => {
    const { POST, GET } = await import("./route");
    const u1 = await makeUser("hs-u1@example.com");
    const u2 = await makeUser("hs-u2@example.com");
    asUser(u1.id);
    await POST(
      uploadRequest(
        new File([pdfBytes()], "mine.pdf", { type: "application/pdf" }),
      ),
    );
    asUser(u2.id);
    await POST(
      uploadRequest(
        new File([pdfBytes()], "theirs.pdf", { type: "application/pdf" }),
      ),
    );

    const list = await GET();
    const rows: Array<{ fileName: string }> = await list.json();
    expect(rows).toHaveLength(1);
    expect(rows[0].fileName).toBe("theirs.pdf");
  });
});
