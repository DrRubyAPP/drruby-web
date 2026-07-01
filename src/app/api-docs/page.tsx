import { notFound } from "next/navigation";
import { ApiDocs } from "./ApiDocs";

// 仅开发环境暴露 API 文档；生产环境返回 404，避免暴露内部接口结构。
export default function ApiDocsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ApiDocs />;
}
