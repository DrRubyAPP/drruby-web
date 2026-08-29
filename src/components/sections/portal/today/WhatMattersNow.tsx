"use client";

import { Skeleton } from "@/components/api";
import type { WmnResponse } from "@/components/sections/portal/decisions/dto";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "@/i18n/navigation";

interface WhatMattersNowProps {
  /** 父级已取的信封（避免二次请求）；未传则组件自取 */
  data?: WmnResponse | null;
}

/**
 * Home「What matters now」（§7–§9）：只消费 `/api/decisions/wmn` 的 cards，
 * 服务端已 P1/P2/P3 排序 + ≤3 + 去重；前端不重排、不重算可见性。
 * B1：cards<3 按实际数量显示，不占位填充。
 */
export function WhatMattersNow({ data }: WhatMattersNowProps) {
  const router = useRouter();
  // 父级传入则复用；否则自取（loading 兜底）
  const self = useApi<WmnResponse>(
    data === undefined ? "/api/decisions/wmn" : null,
  );
  const envelope = data ?? self.data;

  if (data === undefined && self.loading) return <Skeleton lines={3} />;
  if (!envelope || envelope.cards.length === 0) return null;

  return (
    <div className="sec">
      <div className="sec-h">What matters now</div>
      <div className="card">
        {envelope.cards.map((d, i) => (
          <div
            key={d.id}
            className={`dec${i === 0 ? " mn-primary" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/portal/decisions/${d.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/portal/decisions/${d.id}`);
              }
            }}
          >
            <div>
              <h4>{d.question}</h4>
              <div className="st">
                Updated {new Date(d.lastUserActivityAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
