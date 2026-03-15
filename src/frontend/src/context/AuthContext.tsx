import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { MessUser } from "../types/mess";

const STORAGE_KEY = "mess_auth";

interface AuthState {
  user: MessUser | null;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string, users: MessUser[]) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as MessUser;
        return { user, isAdmin: user.role === "admin" };
      }
    } catch {
      // ignore
    }
    return { user: null, isAdmin: false };
  });

  useEffect(() => {
    if (authState.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authState.user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [authState.user]);

  const login = (
    username: string,
    password: string,
    users: MessUser[],
  ): boolean => {
    const found = users.find(
      (u) => u.username === username && u.password === password,
    );
    if (found) {
      setAuthState({ user: found, isAdmin: found.role === "admin" });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({ user: null, isAdmin: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
