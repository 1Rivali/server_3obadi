import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import ar from "./locales/ar";
import en from "./locales/en";

export type Locale = "ar" | "en";

const locales = { ar, en };

type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
        : Prefix extends ""
          ? K
          : `${Prefix}.${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return typeof value === "string" ? value : path;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(params[key] ?? "")
  );
}

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "admin_locale";

function detectInitialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ar" || stored === "en") return stored;
  return navigator.language.startsWith("ar") ? "ar" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const template = getNestedValue(
        locales[locale] as unknown as Record<string, unknown>,
        key
      );
      return interpolate(template, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, dir, setLocale, t }),
    [locale, dir, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function formatDate(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "ar" ? "ar-SY" : "en-US");
}

export function formatNumber(value: number, locale: Locale) {
  return value.toLocaleString(locale === "ar" ? "ar-SY" : "en-US");
}

export function translateAwardType(
  type: string | null,
  t: I18nContextValue["t"]
): string {
  if (!type) return "—";
  const map: Record<string, TranslationKey> = {
    points: "awards.typePoints",
    discount: "awards.typeDiscount",
    physical: "awards.typePhysical",
  };
  return map[type] ? t(map[type]) : type;
}

export function translateRole(
  role: string,
  t: I18nContextValue["t"]
): string {
  return role === "ADMIN" ? t("common.adminRole") : t("common.userRole");
}
