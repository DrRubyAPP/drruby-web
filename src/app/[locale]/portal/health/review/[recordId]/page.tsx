import { getTranslations } from "next-intl/server";
import PortalTopbar from "@/components/layout/PortalTopbar";
import { ReviewView } from "@/components/sections/portal/health/ReviewView";
import "../../portal.css";

/**
 * 复核抽取结果页（Contract §12/§13）。
 * 路由参数 recordId 对齐服务端 `/api/health/records/[id]`。
 * 上传成功后从 HealthView UploadDialog 跳转进入。
 */
export default async function ReviewPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const t = await getTranslations("portal");
  const { recordId } = await params;
  return (
    <div id="app-portal" className="flow-page">
      <PortalTopbar
        pageTitle={t("decisionsDetail.pageTitle")}
        pageSub=""
        backHref="/portal"
      />
      <div className="flow-body">
        <ReviewView recordId={recordId} />
      </div>
    </div>
  );
}
