import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
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
