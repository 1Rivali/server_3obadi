import { useCallback, useEffect, useState } from "react";
import { api, type AdminUser, type Paginated } from "../api/client";
import { Pagination } from "../components/Pagination";

export function UsersPage() {
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
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Users</h2>
          <p className="mt-1 text-sm text-slate-500">
            {result ? `${result.total} registered users` : "Loading..."}
          </p>
        </div>
        <input
          type="search"
          placeholder="Search by name or mobile..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
        />
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
              <th className="px-4 py-3 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Mobile</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Points</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Provider</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">Joined</th>
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
                  No users found
                </td>
              </tr>
            ) : (
              result.data.map((user) => (
                <tr key={user.user_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.mobile}</td>
                  <td className="px-4 py-3">{user.points.toLocaleString()}</td>
                  <td className="px-4 py-3 uppercase text-slate-500">
                    {user.sim_provider}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
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
