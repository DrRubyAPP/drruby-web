import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
