import { useCallback, useEffect, useState } from "react";
import { api, type AdminTransition, type Paginated } from "../api/client";
import { Pagination } from "../components/Pagination";
import { formatDate, formatNumber, useI18n } from "../i18n/I18nContext";

export function TransitionsPage() {
  const { t, locale } = useI18n();
  const [result, setResult] = useState<Paginated<AdminTransition> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.getTransitions(page, 20);
      setResult(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("transitions.loadFailed"));
    }
  }, [page, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div>
        <h2 className="page-title">{t("transitions.title")}</h2>
        <p className="mt-1 text-sm text-brand-700/70">{t("transitions.subtitle")}</p>
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
                {t("transitions.colUser")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("transitions.colAmount")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("transitions.colProvider")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("transitions.colStatus")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-slate-500">
                {t("transitions.colDate")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!result ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t("common.loading")}
                </td>
              </tr>
            ) : result.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t("transitions.noTransitions")}
                </td>
              </tr>
            ) : (
              result.data.map((item) => (
                <tr key={item.transition_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.user_name ?? t("common.empty")}</p>
                    <p className="text-xs text-slate-400" dir="ltr">
                      {item.user_mobile}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {item.amount != null
                      ? formatNumber(item.amount, locale)
                      : t("common.empty")}
                  </td>
                  <td className="px-4 py-3 uppercase text-slate-500">
                    {item.provider ?? t("common.empty")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.is_success && item.is_accepted
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.is_success && item.is_accepted
                        ? t("transitions.success")
                        : t("transitions.failed")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(item.sent_at, locale)}
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
