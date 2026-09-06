import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { R2StorageProvider, type S3Like } from "./r2";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/obj?sig=abc"),
}));

function mockClient(sendImpl?: (cmd: unknown) => unknown): {
  client: S3Like;
  send: ReturnType<typeof vi.fn>;
} {
  const send = vi.fn(async (cmd: unknown) => sendImpl?.(cmd) ?? {});
  return { client: { send, config: {} } as unknown as S3Like, send };
}

describe("R2StorageProvider（mock S3 client）", () => {
  const OLD = { ...process.env };
  beforeEach(() => {
    process.env.R2_ACCOUNT_ID = "";
    process.env.R2_ACCESS_KEY_ID = "";
    process.env.R2_SECRET_ACCESS_KEY = "";
    process.env.R2_BUCKET = "";
  });
  afterEach(() => {
    process.env = { ...OLD };
    vi.clearAllMocks();
  });

  it("put → PutObjectCommand，带 Bucket/Key/Body/ContentType", async () => {
    const { client, send } = mockClient();
    const store = new R2StorageProvider({ client, bucket: "b1" });
    const bytes = new Uint8Array([1, 2, 3]);
    await store.put("health/u/s/x.pdf", bytes, "application/pdf");
    const cmd = send.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(PutObjectCommand);
    expect(cmd.input).toMatchObject({
      Bucket: "b1",
      Key: "health/u/s/x.pdf",
      Body: bytes,
      ContentType: "application/pdf",
    });
  });

  it("get → GetObjectCommand，Body.transformToByteArray 转 Uint8Array", async () => {
    const bytes = new Uint8Array([7, 8, 9]);
    const { client, send } = mockClient(() => ({
      Body: { transformToByteArray: async () => bytes },
    }));
    const store = new R2StorageProvider({ client, bucket: "b1" });
    const got = await store.get("k");
    expect(send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
    expect(Array.from(got)).toEqual([7, 8, 9]);
  });

  it("delete → DeleteObjectCommand", async () => {
    const { client, send } = mockClient();
    const store = new R2StorageProvider({ client, bucket: "b1" });
    await store.delete("k");
    expect(send.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand);
  });

  it("getSignedUrl → 走 presigner，默认 60s", async () => {
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { client } = mockClient();
    const store = new R2StorageProvider({ client, bucket: "b1" });
    const url = await store.getSignedUrl("k");
    expect(url).toBe("https://signed.example/obj?sig=abc");
    expect(getSignedUrl).toHaveBeenCalledWith(
      client,
      expect.any(GetObjectCommand),
      { expiresIn: 60 },
    );
  });

  it("凭据缺失 → 构造即抛错（不静默降级）", () => {
    expect(() => new R2StorageProvider()).toThrowError(
      /R2_ACCOUNT_ID|缺少环境变量/,
    );
  });
});
