import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as api from '../lib/api';
import type { PublicUser } from '../lib/api';

const TOKEN_STORAGE_KEY = 'treasure_game_token';

interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  isLoading: boolean;
  signup: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    api
      .me(storedToken)
      .then(({ user }) => {
        setToken(storedToken);
        setUser(user);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signup = async (username: string, password: string) => {
    const { token, user } = await api.signup(username, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setToken(token);
    setUser(user);
  };

  const login = async (username: string, password: string) => {
    const { token, user } = await api.login(username, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setToken(token);
    setUser(user);
  };

  const logout = async () => {
    if (token) {
      await api.logout(token).catch(() => {});
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
