import { useEffect, useState } from "react";
import { api, type Stats } from "../api/client";
import { StatCard } from "../components/StatCard";
import {
  formatDate,
  translateAwardType,
  useI18n,
} from "../i18n/I18nContext";

export function DashboardPage() {
  const { t, locale } = useI18n();
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
    return <p className="text-sm text-slate-500">{t("dashboard.loading")}</p>;
  }

  return (
    <div>
      <h2 className="page-title">{t("dashboard.title")}</h2>
      <p className="mt-1 text-sm text-brand-700/70">{t("dashboard.subtitle")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.totalUsers")}
          value={stats.totalUsers}
          accent="bg-brand-500"
        />
        <StatCard
          label={t("dashboard.totalBarcodes")}
          value={stats.totalBarcodes}
          sub={t("dashboard.barcodesSub", {
            used: stats.usedBarcodes,
            unused: stats.unusedBarcodes,
          })}
          accent="bg-brand-600"
        />
        <StatCard
          label={t("dashboard.winningBarcodes")}
          value={stats.winnerBarcodes}
          accent="bg-brand-400"
        />
        <StatCard
          label={t("dashboard.transitions")}
          value={stats.totalTransitions}
          sub={t("dashboard.transitionsSub", {
            count: stats.successfulTransitions,
          })}
          accent="bg-brand-700"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t("dashboard.agents")}
          value={stats.totalAgents}
          accent="bg-brand-800"
        />
        <StatCard
          label={t("dashboard.awards")}
          value={stats.totalAwards}
          accent="bg-brand-300"
        />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-brand-900">
          {t("dashboard.recentScans")}
        </h3>
        <div className="card-surface mt-4">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-brand-50">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("dashboard.colUser")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("dashboard.colAward")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("dashboard.colAgent")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-slate-500">
                  {t("dashboard.colScanned")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentScans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    {t("dashboard.noScans")}
                  </td>
                </tr>
              ) : (
                stats.recentScans.map((scan) => (
                  <tr key={scan.barcode_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{scan.user_name ?? t("common.empty")}</p>
                      <p className="text-xs text-slate-400" dir="ltr">
                        {scan.user_mobile}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {translateAwardType(scan.award_type, t)}
                      </span>
                      <span className="ms-2 text-slate-600">{scan.award_value}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {scan.agent_name ?? t("common.empty")}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {scan.used_at
                        ? formatDate(scan.used_at, locale)
                        : t("common.empty")}
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
