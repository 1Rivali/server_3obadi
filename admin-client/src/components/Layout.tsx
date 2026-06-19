import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Layout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const navItems = [
    { to: "/", label: t("nav.dashboard"), icon: "📊" },
    { to: "/users", label: t("nav.users"), icon: "👥" },
    { to: "/barcodes", label: t("nav.barcodes"), icon: "📱" },
    { to: "/awards", label: t("nav.awards"), icon: "🏆" },
    { to: "/agents", label: t("nav.agents"), icon: "🏢" },
    { to: "/transitions", label: t("nav.transitions"), icon: "💳" },
  ];

  return (
    <div className="flex min-h-screen bg-brand-50">
      <aside className="fixed inset-y-0 start-0 z-10 flex w-64 flex-col bg-brand-gradient text-white shadow-xl">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t("nav.brand")}</h1>
              <p className="mt-1 text-xs text-white/70">{t("nav.subtitle")}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-white/60 transition-colors hover:text-white"
          >
            {t("nav.signOut")}
          </button>
        </div>
      </aside>

      <main className="ms-64 flex-1">
        <div className="mx-auto max-w-7xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
