interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}

export function StatCard({
  label,
  value,
  sub,
  accent = "bg-brand-500",
}: StatCardProps) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-brand-700/70">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {sub && <p className="mt-1 text-xs text-brand-700/50">{sub}</p>}
        </div>
        <div className={`h-2.5 w-2.5 rounded-full ${accent}`} />
      </div>
    </div>
  );
}
