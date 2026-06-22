import type { ReactNode } from "react";

interface PortalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function PortalCard({
  title,
  children,
  className = "",
  bodyClassName = "",
}: PortalCardProps) {
  return (
    <div className={`bg-dr-white border border-dr-border p-5 ${className}`}>
      {title && (
        <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
          <span className="block w-2.5 h-px bg-dr-red" />
          {title}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
