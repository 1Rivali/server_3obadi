import { useI18n } from "../i18n/I18nContext";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-brand-100 px-4 py-3">
      <p className="text-sm text-brand-700/70">
        {t("common.pageOf", { page, total: totalPages })}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50 disabled:opacity-40"
        >
          {t("common.previous")}
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50 disabled:opacity-40"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}
