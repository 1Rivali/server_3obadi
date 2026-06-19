interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent = "bg-brand-500" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`h-2 w-2 rounded-full ${accent}`} />
      </div>
    </div>
  );
}
