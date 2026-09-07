import { describe, expect, it } from "vitest";
import type { HealthRecord } from "~prisma/client";
import { toRecordDTO } from "./dto";

function fakeRow(overrides: Partial<HealthRecord> = {}): HealthRecord {
  return {
    id: "r1",
    userId: "u1",
    sourceId: "s1",
    kind: "lab",
    documentClass: "Lab",
    title: "CBC panel",
    status: "EXTRACTED_DRAFT",
    confidence: "Low",
    parsedValues: { items: [] },
    pleaseConfirm: ["ldl"],
    extractionError: null,
    recordedAt: new Date("2026-06-01T00:00:00Z"),
    createdAt: new Date("2026-06-01T00:00:00Z"),
    updatedAt: new Date("2026-06-01T00:00:00Z"),
    source: null,
    objectKey: null,
    ocrStatus: "pending",
    ...overrides,
  } as HealthRecord;
}

describe("toRecordDTO（task-48 F3：pleaseConfirm 落库三环之 DTO 环）", () => {
  it("返回 pleaseConfirm（来自 DB 行，非前端猜测）", () => {
    const dto = toRecordDTO(fakeRow({ pleaseConfirm: ["ldl", "hba1c"] }));
    expect(dto.pleaseConfirm).toEqual(["ldl", "hba1c"]);
  });

  it("pleaseConfirm 空/缺省 → 空数组兜底", () => {
    expect(toRecordDTO(fakeRow({ pleaseConfirm: [] })).pleaseConfirm).toEqual(
      [],
    );
    expect(
      toRecordDTO(fakeRow({ pleaseConfirm: undefined })).pleaseConfirm,
    ).toEqual([]);
  });

  it("返回 error（extractionError 列，FAILED 态用户安全文案）", () => {
    const dto = toRecordDTO(
      fakeRow({
        status: "FAILED",
        extractionError: "PDF 暂不支持自动抽取，请手动录入",
      }),
    );
    expect(dto.status).toBe("FAILED");
    expect(dto.error).toBe("PDF 暂不支持自动抽取，请手动录入");
  });

  it("extractionError 缺省 → null", () => {
    expect(toRecordDTO(fakeRow()).error).toBeNull();
  });
});
