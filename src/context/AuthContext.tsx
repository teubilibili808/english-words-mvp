import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiPost } from '../utils/apiClient';

export type AuthUser = {
  username: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthLoaded: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AUTH_USER_KEY = 'auth_user';
const AUTH_TOKEN_KEY = 'auth_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    const loadAuthUser = async () => {
      try {
        const [rawUser, rawToken] = await Promise.all([
          AsyncStorage.getItem(AUTH_USER_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
        ]);
        if (!rawUser || !rawToken) {
          setUser(null);
          return;
        }

        const parsedUser = JSON.parse(rawUser) as Partial<AuthUser>;
        if (parsedUser && typeof parsedUser.username === 'string' && parsedUser.username) {
          setUser({ username: parsedUser.username });
          return;
        }

        setUser(null);
      } catch {
        setUser(null);
      } finally {
        setIsAuthLoaded(true);
      }
    };

    void loadAuthUser();
  }, []);

  const login = async (username: string, password: string) => {
    const result = await apiPost<{
      success: boolean;
      token: string;
      user: AuthUser;
    }>(
      '/auth/login',
      {
        username,
        password,
      },
      false
    );

    const nextUser = { username: result.user.username };
    setUser(nextUser);
    await Promise.all([
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser)),
      AsyncStorage.setItem(AUTH_TOKEN_KEY, result.token),
    ]);
  };

  const logout = async () => {
    setUser(null);
    await Promise.all([AsyncStorage.removeItem(AUTH_USER_KEY), AsyncStorage.removeItem(AUTH_TOKEN_KEY)]);
  };

  const value = useMemo(
    () => ({ user, isAuthLoaded, login, logout }),
    [user, isAuthLoaded]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
