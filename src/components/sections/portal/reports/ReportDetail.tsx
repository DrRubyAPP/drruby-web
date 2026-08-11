"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/api/ErrorState";
import MedicalDisclaimer from "@/components/common/MedicalDisclaimer";
import { useApi } from "@/hooks/useApi";
import {
  formatRecordedAt,
  type HealthRecordDto,
  kindLabelKey,
  statusLabelKey,
} from "./dto";

/**
 * 报告详情岛：复用 GET /api/health/reports 列表数据，按路由 id 客户端 find。
 * - loading（无 data）→ 骨架；error（无 data）→ ErrorState（可重试）
 * - 命中 → 真 DTO 字段（title / kind / source? / status / 日期）+ 返回链接 + 静态免责声明
 * - 未命中 → 友好「未找到」态（非 500）+ 返回链接
 */
export function ReportDetail({ id }: { id: string }) {
  const { data, error, loading, refetch } = useApi<HealthRecordDto[]>(
    "/api/health/reports",
  );
  const t = useTranslations("portal.reports");

  const backLink = (
    <Link
      href="/portal/reports"
      className="text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-mid no-underline hover:text-dr-ink transition-colors inline-block mb-4"
    >
      {t("backToList")}
    </Link>
  );

  if (loading && !data) {
    return (
      <div data-testid="report-detail-skeleton">
        {backLink}
        <div className="h-4 w-32 bg-dr-off mb-3" />
        <div className="h-10 w-64 bg-dr-off" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        {backLink}
        <ErrorState message={t("loadError")} onRetry={refetch} />
      </div>
    );
  }

  const report = data?.find((r) => r.id === id) ?? null;

  if (!report) {
    return (
      <div>
        {backLink}
        <div className="bg-dr-white border border-dr-border p-8 text-center">
          <p className="text-[13px] text-dr-mid leading-[1.7]">
            {t("notFound")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {backLink}

      <div className="mb-5">
        <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid mb-1">
          {formatRecordedAt(report.recordedAt)}
        </div>
        <h1 className="font-serif text-[32px] md:text-[40px] font-light text-dr-ink leading-[1.15]">
          {report.title}
        </h1>
      </div>

      <div className="bg-dr-white border border-dr-border p-5 mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-1 text-dr-ink bg-dr-off">
            {t(kindLabelKey(report.kind))}
          </span>
          <span className="text-[8px] font-bold tracking-[0.14em] uppercase px-2 py-1 bg-dr-off text-dr-mid border border-dr-border">
            {t(statusLabelKey(report.ocrStatus))}
          </span>
        </div>
        {report.source ? (
          <div className="text-[12px] text-dr-ink">
            <span className="text-dr-mid">{t("sourceLabel")}</span> ·{" "}
            {report.source}
          </div>
        ) : null}
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
