interface UserAvatarProps {
  /** 头像图片地址（如 Google 头像）；缺省时回退到姓名首字母的默认头像。 */
  image?: string | null;
  name?: string | null;
  email?: string | null;
  /** 图片 alt / 首字母无障碍标签，缺省用 name/email。 */
  label?: string;
  className?: string;
}

/** 从姓名或邮箱推导首字母，作为无头像时的默认头像文本。 */
function initialsFrom(name?: string | null, email?: string | null): string {
  const src = (name || email || "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

/**
 * 圆形用户头像（纯展示，不含链接/交互）。有图片时显示图片，否则显示姓名
 * 首字母的默认头像。无 hook，可同时用于 Server 与 Client Component；
 * 交互（下拉、跳转）由外层容器负责。
 */
export default function UserAvatar({
  image,
  name,
  email,
  label,
  className,
}: UserAvatarProps) {
  const alt = label || name || email || "Account";
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full overflow-hidden bg-dr-ink text-white ring-1 ring-dr-border ${className ?? ""}`}
    >
      {image ? (
        // 远程头像用原生 img，避免 next/image 远程域名白名单配置。
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-[12px] font-semibold tracking-[0.06em]">
          {initialsFrom(name, email)}
        </span>
      )}
    </span>
  );
}
