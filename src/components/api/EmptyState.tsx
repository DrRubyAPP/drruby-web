import "./api-states.css";

/** 空态：无数据时展示。 */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="api-empty">
      <div className="api-empty-title">{title}</div>
      {hint ? <div>{hint}</div> : null}
    </div>
  );
}
