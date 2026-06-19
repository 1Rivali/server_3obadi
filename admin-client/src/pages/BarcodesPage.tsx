import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  api,
  type AdminBarcode,
  type Agent,
  type Award,
  type Paginated,
} from "../api/client";
import { Pagination } from "../components/Pagination";
import {
  formatDate,
  translateAwardType,
  useI18n,
} from "../i18n/I18nContext";

export function BarcodesPage() {
  const { t, locale } = useI18n();
  const [result, setResult] = useState<Paginated<AdminBarcode> | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    count: 100,
    agent_id: 0,
    award_id: 0,
    isMetalized: true,
  });

  const load = useCallback(async () => {
    try {
      const data = await api.getBarcodes(page, 20, search, status || undefined);
      setResult(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("barcodes.loadFailed"));
    }
  }, [page, search, status, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([api.getAgents(), api.getAwards()]).then(([a, aw]) => {
      setAgents(a.data);
      setAwards(aw.data);
      if (a.data.length) setForm((f) => ({ ...f, agent_id: a.data[0].agent_id }));
      if (aw.data.length) setForm((f) => ({ ...f, award_id: aw.data[0].award_id }));
    });
  }, []);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError("");
    try {
      await api.generateBarcodes(form);
      setShowGenerate(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("barcodes.generateFailed"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="page-title">{t("barcodes.title")}</h2>
          <p className="mt-1 text-sm text-brand-700/70">
            {result
              ? t("barcodes.count", { count: result.total })
              : t("common.loading")}
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="btn-primary"
        >
          {t("barcodes.generate")}
        </button>
      </div>

      {showGenerate && (
        <form
          onSubmit={handleGenerate}
          className="mt-6 rounded-xl border border-brand-200/60 bg-white p-6 shadow-sm"
        >
          <h3 className="font-semibold text-brand-900">{t("barcodes.generateTitle")}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t("barcodes.countLabel")}
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={form.count}
                onChange={(e) =>
                  setForm({ ...form, count: parseInt(e.target.value, 10) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t("barcodes.agent")}
              </label>
              <select
                value={form.agent_id}
                onChange={(e) =>
                  setForm({ ...form, agent_id: parseInt(e.target.value, 10) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.agent_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                {t("barcodes.award")}
              </label>
              <select
                value={form.award_id}
                onChange={(e) =>
                  setForm({ ...form, award_id: parseInt(e.target.value, 10) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {awards.map((a) => (
                  <option key={a.award_id} value={a.award_id}>
                    {translateAwardType(a.award_type, t)} — {a.award_value}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isMetalized}
                  onChange={(e) =>
                    setForm({ ...form, isMetalized: e.target.checked })
                  }
                  className="rounded border-slate-300"
                />
                {t("barcodes.metalized")}
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={generating}
              className="btn-primary disabled:opacity-60"
            >
              {generating ? t("barcodes.generating") : t("barcodes.generateDownload")}
            </button>
            <button
              type="button"
              onClick={() => setShowGenerate(false)}
              className="btn-secondary"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex gap-3">
        <input
          type="search"
          placeholder={t("barcodes.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input-field"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{t("barcodes.allStatuses")}</option>
          <option value="used">{t("barcodes.statusUsed")}</option>
          <option value="unused">{t("barcodes.statusUnused")}</option>
          <option value="winner">{t("barcodes.statusWinner")}</option>
        </select>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="card-surface mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-100 text-sm">
            <thead className="bg-brand-50">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("barcodes.colId")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("barcodes.colStatus")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("barcodes.colAward")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("barcodes.colUser")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("barcodes.colAgent")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("barcodes.colCreated")}
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
                    {t("barcodes.noBarcodes")}
                  </td>
                </tr>
              ) : (
                result.data.map((b) => (
                  <tr key={b.barcode_id} className="hover:bg-slate-50">
                    <td
                      className="max-w-[200px] truncate px-4 py-3 font-mono text-xs"
                      dir="ltr"
                    >
                      {b.barcode_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {b.is_used && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            {t("barcodes.badgeUsed")}
                          </span>
                        )}
                        {b.winner && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                            {t("barcodes.badgeWinner")}
                          </span>
                        )}
                        {!b.is_used && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {t("barcodes.badgeUnused")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {translateAwardType(b.award_type, t)} — {b.award_value}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.user_name ?? t("common.empty")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.agent_name ?? t("common.empty")}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(b.created_at, locale)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
