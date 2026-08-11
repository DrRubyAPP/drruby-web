"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/api/ErrorState";
import { useApi } from "@/hooks/useApi";
import { AddReportDialog } from "./AddReportDialog";
import {
  formatRecordedAt,
  type HealthRecordDto,
  kindLabelKey,
  statusLabelKey,
} from "./dto";

/**
 * 报告列表岛：GET /api/health/reports 渲染真数据。
 * - loading（无 data）→ 骨架；error（无 data）→ ErrorState（可重试）
 * - 空列表 → 引导态；非空 → 卡片（title / kind badge / source? / status badge / 日期）→ 详情
 * - 顶部 AddReportDialog（人工录入），成功后 refetch
 */
export function ReportsList() {
  const { data, error, loading, refetch } = useApi<HealthRecordDto[]>(
    "/api/health/reports",
  );
  const t = useTranslations("portal.reports");

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("listTitle", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[560px]">
            {t("listSub")}
          </p>
        </div>
        <AddReportDialog onCreated={refetch} />
      </div>

      {loading && !data ? (
        <div data-testid="reports-skeleton" className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-dr-white border border-dr-border p-5 h-[92px]"
            >
              <div className="h-3 w-24 bg-dr-off mb-2" />
              <div className="h-5 w-48 bg-dr-off" />
            </div>
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState message={t("loadError")} onRetry={refetch} />
      ) : data && data.length === 0 ? (
        <div className="bg-dr-white border border-dr-border p-8 text-center">
          <p className="text-[13px] text-dr-mid leading-[1.7] max-w-[420px] mx-auto">
            {t("empty")}
          </p>
          <p className="text-[11px] text-dr-red font-semibold tracking-[0.14em] uppercase mt-3">
            {t("emptyCta")} ↑
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(data ?? []).map((r) => (
            <Link
              key={r.id}
              href={`/portal/reports/${r.id}`}
              className="bg-dr-white border border-dr-border p-5 no-underline text-dr-ink hover:border-dr-mid transition-colors block"
            >
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-dr-mid mb-1">
                    {formatRecordedAt(r.recordedAt)}
                  </div>
                  <div className="font-serif text-[20px] font-light text-dr-ink leading-tight">
                    {r.title}
                  </div>
                  {r.source ? (
                    <div className="text-[11px] text-dr-mid mt-1">
                      {t("sourceLabel")} · {r.source}
                    </div>
                  ) : null}
                </div>
                <span className="text-[8px] font-bold tracking-[0.14em] uppercase px-2 py-1 bg-dr-off text-dr-mid border border-dr-border">
                  {t(statusLabelKey(r.ocrStatus))}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-1 text-dr-ink bg-dr-off">
                  {t(kindLabelKey(r.kind))}
                </span>
                <span className="ml-auto text-[10px] font-semibold tracking-[0.14em] uppercase text-dr-red">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
