import { useEffect, useState } from "react";
import { api, type Stats } from "../api/client";
import { StatCard } from "../components/StatCard";

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (!stats) {
    return <p className="text-sm text-slate-500">Loading dashboard...</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
      <p className="mt-1 text-sm text-slate-500">
        Overview of your 3tech rewards platform
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.totalUsers} accent="bg-blue-500" />
        <StatCard
          label="Total Barcodes"
          value={stats.totalBarcodes}
          sub={`${stats.usedBarcodes} used · ${stats.unusedBarcodes} unused`}
          accent="bg-violet-500"
        />
        <StatCard
          label="Winning Barcodes"
          value={stats.winnerBarcodes}
          accent="bg-amber-500"
        />
        <StatCard
          label="Transitions"
          value={stats.totalTransitions}
          sub={`${stats.successfulTransitions} successful`}
          accent="bg-emerald-500"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Agents" value={stats.totalAgents} accent="bg-rose-500" />
        <StatCard label="Awards" value={stats.totalAwards} accent="bg-cyan-500" />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-900">Recent Scans</h3>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">User</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Award</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Agent</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Scanned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentScans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No scans yet
                  </td>
                </tr>
              ) : (
                stats.recentScans.map((scan) => (
                  <tr key={scan.barcode_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{scan.user_name ?? "—"}</p>
                      <p className="text-xs text-slate-400">{scan.user_mobile}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {scan.award_type}
                      </span>
                      <span className="ml-2 text-slate-600">{scan.award_value}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{scan.agent_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {scan.used_at
                        ? new Date(scan.used_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
