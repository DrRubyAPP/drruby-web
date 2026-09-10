"use client";

import { ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";

export default function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div id="app-portal">
      <div className="ufw">
        <PortalSidebar />
        <div className="ufm">{children}</div>
      </div>
    </div>
  );
}
