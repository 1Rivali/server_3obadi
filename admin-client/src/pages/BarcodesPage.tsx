import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  api,
  type AdminBarcode,
  type Agent,
  type Award,
  type Paginated,
} from "../api/client";
import { Pagination } from "../components/Pagination";

export function BarcodesPage() {
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
      setError(err instanceof Error ? err.message : "Failed to load barcodes");
    }
  }, [page, search, status]);

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
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Barcodes</h2>
          <p className="mt-1 text-sm text-slate-500">
            {result ? `${result.total} total barcodes` : "Loading..."}
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Generate Barcodes
        </button>
      </div>

      {showGenerate && (
        <form
          onSubmit={handleGenerate}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900">Generate New Barcodes</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Count
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
                Agent
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
                Award
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
                    {a.award_type} — {a.award_value}
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
                Metalized
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={generating}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate & Download XLSX"}
            </button>
            <button
              type="button"
              onClick={() => setShowGenerate(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex gap-3">
        <input
          type="search"
          placeholder="Search by barcode ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="used">Used</option>
          <option value="unused">Unused</option>
          <option value="winner">Winners</option>
        </select>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Barcode ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Award
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  User
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Agent
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!result ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : result.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No barcodes found
                  </td>
                </tr>
              ) : (
                result.data.map((b) => (
                  <tr key={b.barcode_id} className="hover:bg-slate-50">
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs">
                      {b.barcode_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {b.is_used && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            Used
                          </span>
                        )}
                        {b.winner && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            Winner
                          </span>
                        )}
                        {!b.is_used && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            Unused
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {b.award_type} — {b.award_value}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.user_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.agent_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(b.created_at).toLocaleDateString()}
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
