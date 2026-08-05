/**
 * 全局 401 处理器注册表。fetch 层 / hooks 捕获 401 只调用 `notifyUnauthorized()`，
 * 由顶层客户端组件注册的处理器负责 locale-aware 跳登录——保持取数层可测、无 DOM 依赖。
 */
type UnauthorizedHandler = () => void;

let handler: UnauthorizedHandler | null = null;

/** 注册 401 处理器；返回注销函数（用于 `useEffect` cleanup）。 */
export function onUnauthorized(fn: UnauthorizedHandler): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

/** 触发已注册的 401 处理器（未注册则静默）。 */
export function notifyUnauthorized(): void {
  handler?.();
}
