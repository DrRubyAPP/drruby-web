import type { ReactNode } from "react";

// Standalone root layout for /api-docs — this route lives outside the [locale]
// segment (it must not be localized), so it needs its own <html>/<body>.
export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
