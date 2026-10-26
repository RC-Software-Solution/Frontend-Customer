import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../auth/login/login.screen';
import { AuthProvider } from '@/services';
import { authService } from '@/services/instances';
import { setAuthExpiredHandler } from '@/services/clients/base-api.client';

jest.mock('@/services/instances', () => ({
  authService: {
    isAuthenticated: jest.fn(),
    getRefreshToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    deleteAccount: jest.fn(),
  },
  orderService: {},
  menuService: {},
}));
jest.mock('@/services/clients/base-api.client', () => {
  const actual = jest.requireActual('@/services/clients/base-api.client');
  return { ...actual, setAuthExpiredHandler: jest.fn() };
});
jest.mock('@/services/push/push.service', () => ({ getFcmToken: jest.fn(async () => 'fcm-123') }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const svc = authService as jest.Mocked<typeof authService>;
const customer = { id: 1, role: 'customer', email: 'c@x.com' } as any;
const admin = { id: 2, role: 'admin', email: 'a@x.com' } as any;

const mount = async () => {
  await render(
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>,
  );
  await screen.findByPlaceholderText('example@gmail.com');
};

const fill = async (email: string, password: string) => {
  await fireEvent.changeText(screen.getByPlaceholderText('example@gmail.com'), email);
  await fireEvent.changeText(screen.getByPlaceholderText('Password'), password);
};
const pressSignIn = () => fireEvent.press(screen.getAllByText('Sign In').at(-1)!);

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  svc.isAuthenticated.mockResolvedValue(false);
  svc.getRefreshToken.mockResolvedValue(null);
  svc.getCurrentUser.mockResolvedValue(null);
  svc.logout.mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('LoginScreen', () => {
  it('shows required-field errors and does not call the server when empty', async () => {
    await mount();
    await act(async () => pressSignIn());
    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(svc.login).not.toHaveBeenCalled();
  });

  it('signs in with the typed credentials and the device push token', async () => {
    svc.login.mockResolvedValue({ user: customer } as any);
    await mount();
    await fill('c@x.com', 'Passw0rd!');
    await act(async () => pressSignIn());
    await waitFor(() => expect(svc.login).toHaveBeenCalledWith({ email: 'c@x.com', password: 'Passw0rd!', fcm_token: 'fcm-123' }));
  });

  it('shows the server message when the password is wrong', async () => {
    svc.login.mockRejectedValue(new Error('Invalid credentials'));
    await mount();
    await fill('c@x.com', 'wrong');
    await act(async () => pressSignIn());
    expect(await screen.findByText('Invalid credentials')).toBeTruthy();
  });

  it('turns away a staff account with a clear message', async () => {
    svc.login.mockResolvedValue({ user: admin } as any);
    await mount();
    await fill('a@x.com', 'Passw0rd!');
    await act(async () => pressSignIn());
    expect(await screen.findByText(/customers only/i)).toBeTruthy();
    expect(svc.logout).toHaveBeenCalled();
  });

  it('tells the user when their session was ended by the server', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    svc.isAuthenticated.mockResolvedValue(true);
    svc.getCurrentUser.mockResolvedValue(customer);
    await mount();

    // the API client reports a 401 that could not be renewed
    const handler = (setAuthExpiredHandler as jest.Mock).mock.calls.at(-1)![0] as () => void;
    await act(async () => handler());

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Session expired', expect.stringMatching(/sign in again/i)));
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it('does not show the session-expired alert after a normal logout', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await mount();
    expect(alert).not.toHaveBeenCalled();
  });
});

describe('LoginScreen error routing and layout', () => {
  const reject = (e: object) => svc.login.mockRejectedValue(Object.assign(new Error((e as any).message), e));
  const submit = async () => {
    await fill('c@x.com', 'Passw0rd!');
    await act(async () => pressSignIn());
  };

  it('puts an API 401 under the password field, not in the banner', async () => {
    reject({ status: 401, message: 'Invalid credentials' });
    await mount();
    await submit();
    expect(await screen.findByText('Invalid credentials')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    ['pending', 'Your account is pending approval. Please wait for an admin to approve your account.', /pending approval/],
    ['deleted', 'Your account has been deleted. Please contact support.', /has been deleted/],
    ['disabled', 'Your account has been disabled. Please contact support.', /has been disabled/],
  ])('shows the %s 403 in the banner', async (_n, message, re) => {
    reject({ status: 403, message });
    await mount();
    await submit();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(within(screen.getByRole('alert')).getByText(re)).toBeTruthy();
  });

  it('shows the staff refusal in the banner', async () => {
    svc.login.mockResolvedValue({ user: admin } as any);
    await mount();
    await submit();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(within(screen.getByRole('alert')).getByText(/customers only/i)).toBeTruthy();
  });

  it('shows a network failure in the banner', async () => {
    reject({ status: 0, code: 'NETWORK_ERROR', message: 'Network error - please check your connection' });
    await mount();
    await submit();
    expect(within(await screen.findByRole('alert')).getByText(/Network error/)).toBeTruthy();
  });

  it('shows both required messages on an empty submit, no banner, no call', async () => {
    await mount();
    await act(async () => pressSignIn());
    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Password is required')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(svc.login).not.toHaveBeenCalled();
  });

  it('a new submit clears the previous banner and field errors', async () => {
    reject({ status: 403, message: 'Your account is pending approval.' });
    await mount();
    await submit();
    expect(await screen.findByRole('alert')).toBeTruthy();
    let release!: () => void;
    svc.login.mockReturnValue(new Promise<any>((r) => { release = () => r({ user: customer }); }));
    // not awaited: the press only settles once the (still pending) login does
    await act(async () => { void pressSignIn(); });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('Invalid credentials')).toBeNull();
    await act(async () => release());
  });

  it('Forgot Password? is a 48dp button that opens the reset flow', async () => {
    await mount();
    const forgot = screen.getByRole('button', { name: 'Forgot Password?' });
    expect(StyleSheet.flatten(forgot.props.style).minHeight).toBeGreaterThanOrEqual(48);
    await fireEvent.press(forgot);
    expect(router.push).toHaveBeenCalledWith('/(routes)/login/forgot-password');
  });

  it('keeps the Sign In button 12dp clear of the link and Sign Up opens sign-up', async () => {
    await mount();
    const signIn = screen.getByRole('button', { name: 'Sign In' });
    expect(StyleSheet.flatten(signIn.props.style).marginTop).toBeGreaterThanOrEqual(12);
    await fireEvent.press(screen.getByText('Sign Up'));
    expect(router.push).toHaveBeenCalledWith('/(routes)/sign-up');
  });
});
