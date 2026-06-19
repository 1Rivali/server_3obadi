import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useI18n } from "../i18n/I18nContext";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(mobile, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("login.failed");
      setError(
        message === "Admin access required" ? t("login.adminRequired") : message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gradient px-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher variant="dark" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-brand-200/50 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-xl font-bold text-white shadow-lg">
            3
          </div>
          <h1 className="text-2xl font-bold text-brand-900">{t("login.title")}</h1>
          <p className="mt-2 text-sm text-brand-700/70">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-900">
              {t("login.mobile")}
            </label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder={t("login.mobilePlaceholder")}
              required
              dir="ltr"
              className="input-field py-2.5"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-900">
              {t("login.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field py-2.5"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>
      </div>
    </div>
  );
}
