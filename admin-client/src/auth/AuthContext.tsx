import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, clearToken, setToken } from "../api/client";

interface AuthState {
  name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthState | null;
  isAuthenticated: boolean;
  login: (mobile: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState | null>(() => {
    const stored = localStorage.getItem("admin_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (mobile: string, password: string) => {
    const res = await api.login(mobile, password);
    if (res.user.role !== "ADMIN") {
      throw new Error("Admin access required");
    }
    setToken(res.token);
    const authUser = { name: res.user.name, role: res.user.role };
    localStorage.setItem("admin_user", JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem("admin_user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
