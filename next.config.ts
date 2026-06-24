import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prisma Client 作为外部包，不由 Next.js bundler 处理
  serverExternalPackages: ["@prisma/client"],
  // 确保 Prisma engine binary 被 standalone 产物追踪（pnpm 符号链接结构需显式包含）
  outputFileTracingIncludes: {
    "/": ["./node_modules/.prisma/**/*", "./node_modules/@prisma/**/*"],
  },
};

// Reads ./src/i18n/request.ts by default.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
