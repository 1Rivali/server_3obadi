import { useI18n } from "../i18n/I18nContext";

interface LanguageSwitcherProps {
  variant?: "dark" | "light";
}

export function LanguageSwitcher({ variant = "dark" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  function toggle() {
    setLocale(locale === "ar" ? "en" : "ar");
  }

  const styles =
    variant === "dark"
      ? "border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
      : "border-slate-300 text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${styles}`}
      title={t("nav.language")}
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
