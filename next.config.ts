import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // 部署用 `next start`（Railway 保留全量 node_modules），不使用 standalone 精简产物；
  // 保留 output: "standalone" 只会白生成用不到的 .next/standalone 并触发启动告警。
  // Prisma 7 driver adapter：pg 含可选 native 绑定，交给 Node 运行时而非 bundler
  // （generated client 位于源码树 prisma/generated，由 bundler 正常处理）
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

// Reads ./src/i18n/request.ts by default.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
