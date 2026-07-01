import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// `server-only` / `client-only` throw when imported outside Next.js. Swap them
// for an empty stub so server modules (env, logger) stay importable in tests.
const emptyModule = fileURLToPath(
  new URL("./src/test/empty-module.ts", import.meta.url),
);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": emptyModule,
      "client-only": emptyModule,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // 仅扫描 src/ 下的测试，排除 a_docs/ 等非项目代码
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".next", "a_docs"],
    // repository 测试连真实 DB 共享数据，关闭文件并行避免冲突
    fileParallelism: false,
  },
});
