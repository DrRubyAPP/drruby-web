import type { ImageInfo } from "~prisma/client";
import {
  type CaptureDevice,
  captureDeviceSchema,
  type FaceSide,
  faceSideSchema,
  type LightingScore,
  lightingScoreSchema,
  type McsLevel,
  mcsLevelSchema,
} from "@/lib/db/enums";
import { prisma } from "@/lib/db/prisma";

export interface CreateImageInfoInput {
  userId: string;
  sessionId: string;
  studyWeek: number;
  s3ObjectKey: string;
  capturedAt: Date;
  mcsLevel?: McsLevel | null;
  lightingScore?: LightingScore | null;
  anatomicalSite?: string | null;
  faceSide: FaceSide;
  deviceId?: string | null;
  captureDevice: CaptureDevice;
}

function validateInput(input: CreateImageInfoInput): void {
  faceSideSchema.parse(input.faceSide);
  captureDeviceSchema.parse(input.captureDevice);
  if (input.mcsLevel !== undefined && input.mcsLevel !== null) {
    mcsLevelSchema.parse(input.mcsLevel);
  }
  if (input.lightingScore !== undefined && input.lightingScore !== null) {
    lightingScoreSchema.parse(input.lightingScore);
  }

  // §8 条件必填：dermoscope 采集必须关联 device_capture
  // DB 层有 CHECK 兜底，repo 层提前校验给出更清晰错误
  if (input.captureDevice === "dermoscope" && !input.deviceId) {
    throw new Error(
      "image_info 条件必填：capture_device='dermoscope' 时 device_id 不可为空",
    );
  }
}

export async function create(input: CreateImageInfoInput): Promise<ImageInfo> {
  validateInput(input);
  return prisma.imageInfo.create({ data: input });
}

export async function findBySessionAndWeek(
  sessionId: string,
  studyWeek: number,
): Promise<ImageInfo[]> {
  return prisma.imageInfo.findMany({
    where: { sessionId, studyWeek },
    orderBy: { capturedAt: "asc" },
  });
}
