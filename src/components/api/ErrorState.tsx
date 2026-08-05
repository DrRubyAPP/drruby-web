import "./api-states.css";

/** 错误态：展示对用户安全的 message + 可选重试。 */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="api-error">
      <div className="api-error-msg">{message}</div>
      {onRetry ? (
        <button type="button" className="api-retry" onClick={onRetry}>
          重试
        </button>
      ) : null}
    </div>
  );
}
