"use client";

import imageCompression from "browser-image-compression";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState } from "@/components/api";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type {
  CreateObservationEntryInput,
  DecisionEntryDto,
  ObservationDirection,
  UpdateObservationEntryInput,
} from "./dto";

/**
 * task-44 §28 Observation 表单（sub-plan-3 T9）
 *
 * - 新建模式（default）：POST /api/decisions/[id]/observations
 * - 修正模式（existingEntry 传入）：PATCH /api/decisions/[id]/observations/[entryId]
 *   - append-only 原则下保留 occurredAt/createdAt 不变（服务端处理）
 * - direction 四态（better/same/worse/not_sure）+ 非必填（§28 允许无方向描述）
 *   - 已选 direction 再点一次 → 取消（null）
 * - text 必填
 * - synthesis.photos 复用 /api/health/sources 上传链路（task-46）
 */
interface Props {
  decisionId: string;
  /** 传入则进入修正模式（PATCH） */
  existingEntry?: Pick<
    DecisionEntryDto,
    "id" | "text" | "direction" | "synthesis"
  >;
  onSaved?: () => void;
}

type ObservationPhoto = { recordId: string; summary?: string };

const MAX_PHOTOS = 5;
const PHOTO_ACCEPT = "image/jpeg,image/png";
const RAW_MAX_BYTES = 25 * 1024 * 1024;
const COMPRESS_OPTS = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1600,
  initialQuality: 0.82,
  useWebWorker: true,
};

const DIRECTIONS: readonly ObservationDirection[] = [
  "better",
  "same",
  "worse",
  "not_sure",
];

const SUBMIT_BTN: React.CSSProperties = {
  background: "var(--p-red)",
  color: "#fff",
  border: "none",
  padding: "12px 24px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const TEXTAREA: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--p-border)",
  padding: 10,
  fontFamily: "var(--p-serif)",
  fontSize: 15,
  marginBottom: 12,
  resize: "vertical",
  boxSizing: "border-box",
};

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#524d49",
  marginBottom: 4,
};

const HINT: React.CSSProperties = {
  fontSize: 12,
  color: "#a89a95",
  marginTop: 4,
};

const CHIP_BASE: React.CSSProperties = {
  border: "1px solid var(--p-border)",
  background: "#fff",
  color: "#524d49",
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  marginRight: 6,
};

const CHIP_ACTIVE: React.CSSProperties = {
  border: "1px solid var(--p-red)",
  background: "rgba(200,16,46,0.06)",
  color: "var(--p-red)",
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  marginRight: 6,
};

export function ObservationForm({ decisionId, existingEntry, onSaved }: Props) {
  const t = useTranslations("portal.decisionsDetail.observe");
  const isEdit = Boolean(existingEntry);
  const [text, setText] = useState(existingEntry?.text ?? "");
  const [direction, setDirection] = useState<ObservationDirection | null>(
    existingEntry?.direction ?? null,
  );
  const [photos, setPhotos] = useState<ObservationPhoto[]>(
    existingEntry?.synthesis?.photos ?? [],
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // 新建：POST /observations
  const create = useMutation(
    (input: CreateObservationEntryInput) =>
      apiClient.post<DecisionEntryDto>(
        `/api/decisions/${decisionId}/observations`,
        input,
      ),
    {
      onSuccess: () => {
        setText("");
        setDirection(null);
        setPhotos([]);
        setValidationError(null);
        setPhotoNotice(null);
        onSaved?.();
      },
    },
  );

  // 修正：PATCH /observations/[entryId]
  const update = useMutation(
    (input: UpdateObservationEntryInput & { entryId: string }) =>
      apiClient.patch<DecisionEntryDto>(
        `/api/decisions/${decisionId}/observations/${input.entryId}`,
        {
          text: input.text,
          direction: input.direction,
          synthesis: input.synthesis,
        },
      ),
    {
      onSuccess: () => {
        setValidationError(null);
        onSaved?.();
      },
    },
  );

  const submitting = create.loading || update.loading || photoUploading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setValidationError("observation.errorTextRequired");
      return;
    }
    setValidationError(null);
    const synthesis =
      photos.length > 0
        ? {
            photos,
          }
        : undefined;
    if (isEdit && existingEntry) {
      update.mutate({
        entryId: existingEntry.id,
        text: text.trim(),
        direction,
        synthesis,
      });
    } else {
      create.mutate({
        text: text.trim(),
        direction: direction ?? undefined,
        ...(synthesis ? { synthesis } : {}),
      });
    }
  }

  function toggleDirection(d: ObservationDirection) {
    setDirection((prev) => (prev === d ? null : d));
  }

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    setValidationError(null);
    setPhotoNotice(null);
    if (picked.length === 0) return;
    if (photos.length + picked.length > MAX_PHOTOS) {
      setValidationError("observation.photoTooMany");
      return;
    }

    for (const file of picked) {
      if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
        setValidationError("observation.photoHeic");
        return;
      }
      if (!PHOTO_ACCEPT.split(",").includes(file.type)) {
        setValidationError("observation.photoInvalidType");
        return;
      }
      if (file.size > RAW_MAX_BYTES) {
        setValidationError("observation.photoTooLarge");
        return;
      }
    }

    setPhotoUploading(true);
    try {
      const uploaded: ObservationPhoto[] = [];
      for (const file of picked) {
        let toUpload = file;
        try {
          toUpload = await imageCompression(file, COMPRESS_OPTS);
        } catch {
          setPhotoNotice("observation.photoCompressFailed");
          toUpload = file;
        }

        const form = new FormData();
        form.append("file", toUpload, file.name);
        form.append("kind", "imaging");
        form.append("recordedAt", new Date().toISOString());
        const res = await apiClient.postForm<{
          sourceId: string;
          recordId: string;
        }>("/api/health/sources", form);
        uploaded.push({ recordId: res.recordId, summary: file.name });
      }
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "observation.photoUploadFailed",
      );
    } finally {
      setPhotoUploading(false);
    }
  }

  function removePhoto(recordId: string) {
    setPhotos((prev) => prev.filter((photo) => photo.recordId !== recordId));
  }

  const error = create.error || update.error;

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 12 }}>
        <span style={LABEL}>{t("observation.directionLabel")}</span>
        <p style={HINT}>{t("observation.directionHint")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 8 }}>
          {DIRECTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDirection(d)}
              style={direction === d ? CHIP_ACTIVE : CHIP_BASE}
              aria-pressed={direction === d}
            >
              {t(`observation.direction.${d}`)}
            </button>
          ))}
        </div>
        {/* direction 非必填（§28 允许无方向描述），不渲染"取消"按钮 —
            用户可点击已选 direction 取消 */}
      </div>
      <div>
        <label htmlFor="obs-text" style={LABEL}>
          {t("observation.textLabel")}
        </label>
        <textarea
          id="obs-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={TEXTAREA}
          placeholder={t("observation.textPlaceholder")}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="obs-photos" style={LABEL}>
          {t("observation.photosLabel")}
        </label>
        <input
          id="obs-photos"
          type="file"
          accept={PHOTO_ACCEPT}
          multiple
          disabled={submitting || photos.length >= MAX_PHOTOS}
          onChange={handlePhotoPick}
          style={{ display: "block", fontSize: 13, marginTop: 6 }}
        />
        <p style={HINT}>{t("observation.photosHint")}</p>
        {photoUploading && (
          <p style={{ fontSize: 13, color: "#7c746f", marginTop: 6 }}>
            {t("observation.photoUploading")}
          </p>
        )}
        {photoNotice && (
          <p style={{ fontSize: 13, color: "#7c746f", marginTop: 6 }}>
            {t(photoNotice)}
          </p>
        )}
        {photos.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
            {photos.map((photo, index) => (
              <li
                key={photo.recordId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  border: "1px solid var(--p-border)",
                  padding: "6px 8px",
                  marginTop: 6,
                  fontSize: 12,
                  color: "#524d49",
                }}
              >
                <span>
                  {photo.summary ||
                    t("observation.photoFallback", { index: index + 1 })}
                  {" · "}
                  {photo.recordId}
                </span>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.recordId)}
                  disabled={submitting}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--p-red)",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  {t("observation.photoRemove")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {validationError && (
        <p style={{ fontSize: 13, color: "var(--p-red)", marginBottom: 12 }}>
          {validationError.startsWith("observation.")
            ? t(validationError)
            : validationError}
        </p>
      )}
      {error && (
        <ErrorState
          message={error.message}
          onRetry={() => {
            create.reset();
            update.reset();
          }}
        />
      )}
      <button type="submit" disabled={submitting} style={SUBMIT_BTN}>
        {submitting
          ? t("observation.submitting")
          : isEdit
            ? t("observation.save")
            : t("observation.submit")}
      </button>
    </form>
  );
}
