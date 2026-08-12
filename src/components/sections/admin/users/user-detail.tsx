"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import { useApi } from "@/hooks/useApi";
import { useMutation } from "@/hooks/useMutation";
import { apiClient } from "@/lib/api/client";
import type { AdminUserDTO, AdminUserStatus } from "./dto";

interface Props {
  id: string;
  /** 由服务端壳通过 props 注入（getServerSession 读 admin.id），避免客户端获取 session。 */
  currentUserId: string;
}

type EditableStatus = "active" | "suspended";

/** PATCH body：name/role/status（status 不含 deleted，软删走独立流程）。 */
interface PatchBody {
  name: string;
  role: AdminUserDTO["role"];
  status: EditableStatus;
}

/**
 * 用户详情/编辑岛：GET /api/admin/users/{id} 渲染只读字段 + 编辑表单。
 * - loading（无 data）→ 骨架；error（无 data）→ ErrorState（可重试）
 * - 命中 → 只读字段（email 标题 + authProvider/emailVerified/subscription/timezone/createdAt/updatedAt）+ 编辑表单
 * - isSelf（id === currentUserId）→ role/status 禁用 + 顶部 loadSelfForbidden 提示 + submit 禁用
 * - 提交 → apiClient.patch → 成功 refetch + success 文案；失败 → updateFailed 文案
 */
export default function UserDetailIsland({ id, currentUserId }: Props) {
  const t = useTranslations("admin");
  const isSelf = id === currentUserId;

  const {
    data: user,
    error,
    loading,
    refetch,
  } = useApi<AdminUserDTO>(`/api/admin/users/${id}`);

  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminUserDTO["role"]>("user");
  const [status, setStatus] = useState<EditableStatus>("active");
  const [initialized, setInitialized] = useState(false);
  const [success, setSuccess] = useState(false);

  // user 数据到达后初始化表单值（仅一次）。deleted 不在 UI 选项中，回退为 suspended。
  useEffect(() => {
    if (user && !initialized) {
      setName(user.name ?? "");
      setRole(user.role);
      setStatus(user.status === "active" ? "active" : "suspended");
      setInitialized(true);
    }
  }, [user, initialized]);

  const mutation = useMutation(
    (body: PatchBody) =>
      apiClient.patch<AdminUserDTO>(`/api/admin/users/${id}`, body),
    {
      onSuccess: () => {
        setSuccess(true);
        refetch();
      },
    },
  );

  if (loading) {
    return <div className="text-dr-mid text-sm">Loading...</div>;
  }
  if (error) {
    return (
      <ErrorState
        message={t("users.detail.errors.notFound")}
        onRetry={refetch}
      />
    );
  }
  if (!user) {
    return (
      <div className="text-dr-mid text-sm">
        {t("users.detail.errors.notFound")}
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    mutation.mutate({ name, role, status });
  };

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/admin/users"
        className="text-xs text-dr-mid hover:text-dr-ink no-underline transition-colors self-start"
      >
        ← {t("users.detail.back")}
      </Link>

      {/* 只读字段 */}
      <section className="bg-dr-white border border-dr-border p-5">
        <h2 className="font-serif text-lg text-dr-ink mb-3">{user.email}</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-dr-mid">
              {t("users.detail.readonly.authProvider")}
            </dt>
            <dd className="text-dr-ink">{user.authProvider}</dd>
          </div>
          <div>
            <dt className="text-xs text-dr-mid">
              {t("users.detail.readonly.emailVerified")}
            </dt>
            <dd className="text-dr-ink">{user.emailVerified ? "✓" : "✗"}</dd>
          </div>
          <div>
            <dt className="text-xs text-dr-mid">
              {t("users.detail.readonly.subscriptionTier")}
            </dt>
            <dd className="text-dr-ink">{user.subscriptionTier}</dd>
          </div>
          <div>
            <dt className="text-xs text-dr-mid">
              {t("users.detail.readonly.timezone")}
            </dt>
            <dd className="text-dr-ink">{user.timezone}</dd>
          </div>
          <div>
            <dt className="text-xs text-dr-mid">
              {t("users.columns.createdAt")}
            </dt>
            <dd className="text-dr-ink">
              {new Date(user.createdAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-dr-mid">
              {t("users.detail.readonly.updatedAt")}
            </dt>
            <dd className="text-dr-ink">
              {new Date(user.updatedAt).toLocaleString()}
            </dd>
          </div>
        </dl>
      </section>

      {/* 编辑表单 */}
      <section className="bg-dr-white border border-dr-border p-5">
        <h2 className="font-serif text-lg text-dr-ink mb-3">
          {t("users.detail.form.title")}
        </h2>
        {isSelf && (
          <div className="text-xs text-dr-alert mb-3">
            {t("users.detail.errors.loadSelfForbidden")}
          </div>
        )}
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-dr-mid">
              {t("users.detail.form.name")}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-dr-border"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-dr-mid">
              {t("users.detail.form.role")}
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminUserDTO["role"])}
              disabled={isSelf}
              className="px-3 py-2 border border-dr-border disabled:bg-dr-off"
            >
              <option value="user">{t("users.role.user")}</option>
              <option value="clinic">{t("users.role.clinic")}</option>
              <option value="collaborator">
                {t("users.role.collaborator")}
              </option>
              <option value="admin">{t("users.role.admin")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-dr-mid">
              {t("users.detail.form.status")}
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EditableStatus)}
              disabled={isSelf}
              className="px-3 py-2 border border-dr-border disabled:bg-dr-off"
            >
              <option value="active">{t("users.status.active")}</option>
              <option value="suspended">{t("users.status.suspended")}</option>
            </select>
          </label>
          {mutation.error && (
            <div className="text-xs text-dr-alert">
              {t("users.detail.errors.updateFailed")}
            </div>
          )}
          {success && (
            <div className="text-xs text-dr-success">
              {t("users.detail.success.updated")}
            </div>
          )}
          <button
            type="submit"
            disabled={mutation.loading || isSelf}
            className="self-start px-4 py-2 bg-dr-ink text-white text-sm disabled:opacity-50"
          >
            {mutation.loading
              ? t("users.detail.form.saving")
              : t("users.detail.form.submit")}
          </button>
        </form>
      </section>
    </div>
  );
}
