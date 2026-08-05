import "./api-states.css";

/** 加载占位骨架屏。`lines` 控制条数。 */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="api-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <div className="api-skeleton-line" key={`skeleton-line-${i}`} />
      ))}
    </div>
  );
}
