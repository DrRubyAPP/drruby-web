"use client";

import { ReactNode } from "react";
import PortalShell from "@/components/layout/PortalShell";
import "../portal.css";

export default function PortalMainLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
