import { useCallback, useEffect, useState } from "react";
import { api, type AdminTransition, type Paginated } from "../api/client";
import { Pagination } from "../components/Pagination";

export function TransitionsPage() {
  const [result, setResult] = useState<Paginated<AdminTransition> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.getTransitions(page, 20);
      setResult(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transitions");
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Transitions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Point redemption / mobile recharge history
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">User</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Provider</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!result ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : result.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No transitions found
                </td>
              </tr>
            ) : (
              result.data.map((t) => (
                <tr key={t.transition_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.user_name ?? "—"}</p>
                    <p className="text-xs text-slate-400">{t.user_mobile}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {t.amount?.toLocaleString() ?? "—"}
                  </td>
                  <td className="px-4 py-3 uppercase text-slate-500">
                    {t.provider ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.is_success && t.is_accepted
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t.is_success && t.is_accepted ? "Success" : "Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(t.sent_at).toLocaleString()}
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
