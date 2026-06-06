import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;
  const isAdmin = user?.role === 'admin';

  // ── Refresh token on app load ─────────────────────────────────────────────
  useEffect(() => {
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly cookie
      });

      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        setUser(data.user);
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch (_err) {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Auto-refresh access token before it expires (every 13 minutes) ────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(refreshSession, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshSession]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
    } catch (_err) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, [accessToken]);

  // ── Helper: authenticated fetch ───────────────────────────────────────────
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      const res = await fetch(url, { ...options, headers, credentials: 'include' });

      // If access token expired, try to refresh once
      if (res.status === 401) {
        await refreshSession();
        // Retry once with refreshed token
        const retryRes = await fetch(url, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        });
        return retryRes;
      }

      return res;
    },
    [accessToken, refreshSession]
  );

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isAuthenticated, isAdmin, isLoading, login, logout, authFetch, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
