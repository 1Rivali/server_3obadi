import { useCallback, useEffect, useState } from "react";
import { api, type AdminUser, type Paginated } from "../api/client";
import { Pagination } from "../components/Pagination";
import {
  formatDate,
  formatNumber,
  translateRole,
  useI18n,
} from "../i18n/I18nContext";

export function UsersPage() {
  const { t, locale } = useI18n();
  const [result, setResult] = useState<Paginated<AdminUser> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.getUsers(page, 20, search);
      setResult(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("users.loadFailed"));
    }
  }, [page, search, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="page-title">{t("users.title")}</h2>
          <p className="mt-1 text-sm text-brand-700/70">
            {result
              ? t("users.count", { count: result.total })
              : t("common.loading")}
          </p>
        </div>
        <input
          type="search"
          placeholder={t("users.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input-field"
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="card-surface mt-6">
        <table className="min-w-full divide-y divide-brand-100 text-sm">
          <thead className="bg-brand-50">
            <tr>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("users.colName")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("users.colMobile")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("users.colPoints")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("users.colProvider")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("users.colRole")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("users.colJoined")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!result ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {t("common.loading")}
                </td>
              </tr>
            ) : result.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {t("users.noUsers")}
                </td>
              </tr>
            ) : (
              result.data.map((user) => (
                <tr key={user.user_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600" dir="ltr">
                    {user.mobile}
                  </td>
                  <td className="px-4 py-3">
                    {formatNumber(user.points, locale)}
                  </td>
                  <td className="px-4 py-3 uppercase text-slate-500">
                    {user.sim_provider}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-brand-100 text-brand-700"
                          : "bg-brand-50 text-brand-800/70"
                      }`}
                    >
                      {translateRole(user.role, t)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(user.created_at, locale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {result && (
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
