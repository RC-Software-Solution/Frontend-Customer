/**
 * Authentication state
 * One shared AuthProvider at the app root; useAuth() reads it from anywhere.
 */

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/api.types';
import { authService } from '../instances';
import { setAuthExpiredHandler } from '../clients/base-api.client';
import { API_CONFIG } from '../config/api.config';

type LoginCredentials = { email: string; password: string; fcm_token?: string };

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  /** true only while the saved session is being restored on app launch */
  loading: boolean;
  hasSeenIntro: boolean;
  login: (credentials: LoginCredentials) => Promise<Awaited<ReturnType<typeof authService.login>>>;
  /** true after the server ended the session (not after a normal logout) */
  sessionExpired: boolean;
  dismissSessionExpired: () => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  markIntroSeen: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const authedRef = useRef(false);
  const loggingOutRef = useRef(false);
  authedRef.current = isAuthenticated;

  const reset = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      let ok = await authService.isAuthenticated();
      // Access token expired but a refresh token is saved: try to renew silently
      if (!ok && (await authService.getRefreshToken())) {
        ok = await authService.refreshAccessToken();
      }
      setIsAuthenticated(ok);
      setUser(ok ? await authService.getCurrentUser() : null);
    } catch (error) {
      console.error('Failed to restore session:', error);
      reset();
    }
  }, [reset]);

  // Restore session + intro flag on app launch
  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.INTRO_SEEN).catch(() => null);
      setHasSeenIntro(seen === 'true');
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setIsAuthenticated(true);
    setSessionExpired(false);
    return response;
  }, []);

  const logout = useCallback(async () => {
    loggingOutRef.current = true;
    try {
      await authService.logout();
    } finally {
      reset(); // clear local state even if the API call fails
      loggingOutRef.current = false;
    }
  }, [reset]);

  const deleteAccount = useCallback(async () => {
    await authService.deleteAccount();
    reset();
  }, [reset]);

  const markIntroSeen = useCallback(async () => {
    setHasSeenIntro(true);
    await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.INTRO_SEEN, 'true').catch(() => {});
  }, []);

  // API client calls this when the server rejects our token (401)
  useEffect(() => {
    setAuthExpiredHandler(() => {
      // Only a signed-in user whose session was cut off needs the message, not someone logging out
      if (authedRef.current && !loggingOutRef.current) setSessionExpired(true);
      logout();
    });
    return () => setAuthExpiredHandler(null);
  }, [logout]);

  const dismissSessionExpired = useCallback(() => setSessionExpired(false), []);

  const value = useMemo(
    () => ({ user, isAuthenticated, loading, hasSeenIntro, sessionExpired, dismissSessionExpired, login, logout, deleteAccount, refreshUser, markIntroSeen }),
    [user, isAuthenticated, loading, hasSeenIntro, sessionExpired, dismissSessionExpired, login, logout, deleteAccount, refreshUser, markIntroSeen],
  );

  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
