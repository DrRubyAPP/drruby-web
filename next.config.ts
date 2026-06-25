import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prisma 7 driver adapter：pg 含可选 native 绑定，交给 Node 运行时而非 bundler
  // （generated client 位于源码树 prisma/generated，由 bundler 正常处理）
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

// Reads ./src/i18n/request.ts by default.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
