import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { setAuthExpiredHandler } from '../clients/base-api.client';
import { authService } from '../instances';
import { API_CONFIG } from '../config/api.config';

jest.mock('../instances', () => ({
  authService: {
    isAuthenticated: jest.fn(),
    getRefreshToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));
jest.mock('../clients/base-api.client', () => ({ setAuthExpiredHandler: jest.fn() }));

const svc = authService as jest.Mocked<typeof authService>;
const customer = { id: 1, role: 'customer', email: 'c@x.com' } as any;
const admin = { id: 2, role: 'admin', email: 'a@x.com' } as any;

/** The handler the provider registered with the API client (what a real 401 would call). */
const expiredHandler = () => (setAuthExpiredHandler as jest.Mock).mock.calls.at(-1)![0] as () => void;

const mount = async () => {
  const hook = await renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider> });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  svc.isAuthenticated.mockResolvedValue(false);
  svc.getRefreshToken.mockResolvedValue(null);
  svc.getCurrentUser.mockResolvedValue(null);
  svc.logout.mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('restoring the session on launch', () => {
  it('starts signed out when nothing is saved', async () => {
    const { result } = await mount();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('signs in from a valid saved token', async () => {
    svc.isAuthenticated.mockResolvedValue(true);
    svc.getCurrentUser.mockResolvedValue(customer);
    const { result } = await mount();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(customer);
  });

  it('renews silently when the access token expired but a refresh token exists', async () => {
    svc.getRefreshToken.mockResolvedValue('r');
    svc.refreshAccessToken.mockResolvedValue(true);
    svc.getCurrentUser.mockResolvedValue(customer);
    const { result } = await mount();
    expect(svc.refreshAccessToken).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('stays signed out when renewal fails', async () => {
    svc.getRefreshToken.mockResolvedValue('r');
    svc.refreshAccessToken.mockResolvedValue(false);
    const { result } = await mount();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('remembers that the intro was already seen', async () => {
    await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.INTRO_SEEN, 'true');
    const { result } = await mount();
    expect(result.current.hasSeenIntro).toBe(true);
  });

  it('markIntroSeen persists the flag', async () => {
    const { result } = await mount();
    expect(result.current.hasSeenIntro).toBe(false);
    await act(() => result.current.markIntroSeen());
    expect(result.current.hasSeenIntro).toBe(true);
    expect(await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.INTRO_SEEN)).toBe('true');
  });
});

describe('login', () => {
  it('signs a customer in', async () => {
    svc.login.mockResolvedValue({ user: customer } as any);
    const { result } = await mount();
    await act(() => result.current.login({ email: 'c@x.com', password: 'pw' }));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(customer);
  });

  it('turns away staff accounts and clears their session', async () => {
    svc.login.mockResolvedValue({ user: admin } as any);
    const { result } = await mount();
    await act(async () => {
      await expect(result.current.login({ email: 'a@x.com', password: 'pw' })).rejects.toThrow(/customers only/i);
    });
    expect(svc.logout).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('propagates login errors (wrong password) and stays signed out', async () => {
    svc.login.mockRejectedValue(new Error('Invalid credentials'));
    const { result } = await mount();
    await act(async () => {
      await expect(result.current.login({ email: 'c@x.com', password: 'bad' })).rejects.toThrow('Invalid credentials');
    });
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe('logout and expiry', () => {
  const signedIn = async () => {
    svc.isAuthenticated.mockResolvedValue(true);
    svc.getCurrentUser.mockResolvedValue(customer);
    return mount();
  };

  it('logout signs out without flagging an expired session', async () => {
    const { result } = await signedIn();
    await act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.sessionExpired).toBe(false);
  });

  it('logs out and flags sessionExpired when the server ends a signed-in session', async () => {
    const { result } = await signedIn();
    await act(async () => expiredHandler()());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(result.current.sessionExpired).toBe(true);
    await act(async () => result.current.dismissSessionExpired());
    expect(result.current.sessionExpired).toBe(false);
  });

  it('does not flag sessionExpired when the user is already signed out', async () => {
    const { result } = await mount();
    await act(async () => expiredHandler()());
    expect(result.current.sessionExpired).toBe(false);
  });

  it('does not flag sessionExpired for a 401 caused by the logout call itself', async () => {
    const { result } = await signedIn();
    let finishLogout!: () => void;
    svc.logout.mockReturnValue(new Promise<void>((r) => (finishLogout = r)));

    let pending!: Promise<void>;
    await act(async () => {
      pending = result.current.logout();
    });
    await act(async () => expiredHandler()()); // server 401 arrives mid-logout
    await act(async () => {
      finishLogout();
      await pending;
    });

    expect(result.current.sessionExpired).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('a fresh login clears a previous expired-session flag', async () => {
    const { result } = await signedIn();
    await act(async () => expiredHandler()());
    await waitFor(() => expect(result.current.sessionExpired).toBe(true));
    svc.login.mockResolvedValue({ user: customer } as any);
    await act(() => result.current.login({ email: 'c@x.com', password: 'pw' }));
    expect(result.current.sessionExpired).toBe(false);
  });

  it('deleteAccount signs out', async () => {
    const { result } = await signedIn();
    svc.deleteAccount.mockResolvedValue(undefined);
    await act(() => result.current.deleteAccount());
    expect(result.current.isAuthenticated).toBe(false);
  });
});
