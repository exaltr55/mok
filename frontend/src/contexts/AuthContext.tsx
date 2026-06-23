import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  type AuthUser,
  clearCurrentUserId,
  clearToken,
  getMe,
  getToken,
  loginApi,
  registerApi,
  setCurrentUserId,
  setToken,
} from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, timezone?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    getMe()
      .then((me) => {
        setCurrentUserId(me.id);
        setUser(me);
      })
      .catch(() => {
        clearToken();
        clearCurrentUserId();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginApi(email, password);
    setToken(res.access_token);
    setCurrentUserId(res.user.id);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, timezone?: string) => {
    const res = await registerApi(email, password, name, timezone);
    setToken(res.access_token);
    setCurrentUserId(res.user.id);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearCurrentUserId();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const me = await getMe();
    setCurrentUserId(me.id);
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
