import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/users", label: "Users", icon: "👥" },
  { to: "/barcodes", label: "Barcodes", icon: "📱" },
  { to: "/awards", label: "Awards", icon: "🏆" },
  { to: "/agents", label: "Agents", icon: "🏢" },
  { to: "/transitions", label: "Transitions", icon: "💳" },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col bg-brand-900 text-white">
        <div className="border-b border-white/10 px-6 py-5">
          <h1 className="text-lg font-bold tracking-tight">3tech Admin</h1>
          <p className="mt-1 text-xs text-white/60">Rewards Management</p>
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
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
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
            className="mt-2 text-xs text-white/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-7xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
