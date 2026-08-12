"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import { useApi } from "@/hooks/useApi";
import type { AdminUserListResponse } from "./dto";

/**
 * 用户列表岛：GET /api/admin/users 渲染真数据。
 * - URL 同步：?search= 与 ?page=（搜索时重置 page）
 * - loading（无 data）→ 骨架文案；error（无 data）→ ErrorState（可重试）
 * - 空列表（无 search）→ empty；空列表（有 search）→ noResults
 * - 表格 6 列：email / name / role / status / createdAt / lastLoginAt
 */
export default function UsersListIsland() {
  const t = useTranslations("admin");
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  const path = `/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`;
  const { data, error, loading, refetch } = useApi<AdminUserListResponse>(path);

  // search 参数变化时同步输入框（如浏览器后退）
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const onSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParams);
      if (searchInput) params.set("search", searchInput);
      else params.delete("search");
      params.delete("page"); // 搜索时重置分页
      router.push(`/admin/users?${params.toString()}`);
    },
    [searchInput, searchParams, router],
  );

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    router.push(`/admin/users?${params.toString()}`);
  };

  if (loading) {
    return <div className="text-dr-mid text-sm">Loading...</div>;
  }
  if (error) {
    return <ErrorState message={t("users.loadError")} onRetry={refetch} />;
  }

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const searchForm = (
    <form onSubmit={onSearch} className="flex gap-2">
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder={t("users.searchPlaceholder")}
        className="flex-1 px-3 py-2 border border-dr-border text-sm"
      />
      <button type="submit" className="px-4 py-2 bg-dr-ink text-white text-sm">
        {t("users.search")}
      </button>
    </form>
  );

  if (users.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {searchForm}
        <div className="text-dr-mid text-sm">
          {search ? t("users.noResults") : t("users.empty")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {searchForm}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-dr-border text-left text-xs text-dr-mid">
              <th className="py-2 pr-3 font-medium">
                {t("users.columns.email")}
              </th>
              <th className="py-2 pr-3 font-medium">
                {t("users.columns.name")}
              </th>
              <th className="py-2 pr-3 font-medium">
                {t("users.columns.role")}
              </th>
              <th className="py-2 pr-3 font-medium">
                {t("users.columns.status")}
              </th>
              <th className="py-2 pr-3 font-medium">
                {t("users.columns.createdAt")}
              </th>
              <th className="py-2 pr-3 font-medium">
                {t("users.columns.lastLoginAt")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-dr-border hover:bg-dr-off"
              >
                <td className="py-2 pr-3">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-dr-ink no-underline hover:text-dr-red transition-colors"
                  >
                    {u.email}
                  </Link>
                </td>
                <td className="py-2 pr-3">{u.name ?? "-"}</td>
                <td className="py-2 pr-3">{t(`users.role.${u.role}`)}</td>
                <td className="py-2 pr-3">
                  {u.status === "deleted" ? "-" : t(`users.status.${u.status}`)}
                </td>
                <td className="py-2 pr-3">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2 pr-3">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-dr-mid">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          className="px-3 py-1 border border-dr-border disabled:opacity-50 hover:text-dr-ink transition-colors"
        >
          {t("users.pagination.prev")}
        </button>
        <span>
          {t("users.pagination.page", { current: page, total: totalPages })}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
          className="px-3 py-1 border border-dr-border disabled:opacity-50 hover:text-dr-ink transition-colors"
        >
          {t("users.pagination.next")}
        </button>
      </div>
    </div>
  );
}
