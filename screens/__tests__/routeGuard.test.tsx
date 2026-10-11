import React from 'react';
import { Text, Pressable } from 'react-native';
import { Slot, router } from 'expo-router';
import { renderRouter, screen, act, fireEvent } from 'expo-router/testing-library';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootLayout from '../../app/_layout';
import Index from '../../app/index';
import { useAuth } from '@/services';
import { authService } from '@/services/instances';
import { API_CONFIG } from '@/services/config/api.config';

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
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

const svc = authService as jest.Mocked<typeof authService>;
const customer = { id: 1, role: 'customer', email: 'c@x.com' } as any;

// Stand-ins for the real screens: the guard decides which one is reachable.
const LoginStub = () => {
  const { login } = useAuth();
  return (
    <>
      <Text>LOGIN SCREEN</Text>
      <Pressable accessibilityLabel="do login" onPress={() => login({ email: 'c@x.com', password: 'pw' })}>
        <Text>do login</Text>
      </Pressable>
    </>
  );
};
const HomeStub = () => {
  const { logout } = useAuth();
  return (
    <>
      <Text>HOME SCREEN</Text>
      <Pressable accessibilityLabel="do logout" onPress={() => logout()}>
        <Text>do logout</Text>
      </Pressable>
    </>
  );
};
const stub = (label: string) => () => <Text>{label}</Text>;

const routes = {
  _layout: RootLayout,
  index: Index,
  '(tabs)/_layout': () => <Slot />,
  '(tabs)/index': HomeStub,
  '(routes)/cart/index': stub('CART SCREEN'),
  '(routes)/onboarding/index': stub('ONBOARDING SCREEN'),
  '(routes)/welcome-intro/index': stub('INTRO SCREEN'),
  '(routes)/login/index': LoginStub,
  '(routes)/login/forgot-password': stub('FORGOT SCREEN'),
  '(routes)/login/reset-password': stub('RESET SCREEN'),
  '(routes)/sign-up/index': stub('SIGNUP SCREEN'),
  '(routes)/sign-up/signUpSecond': stub('SIGNUP2 SCREEN'),
  '(routes)/verifyAccount/index': stub('VERIFY SCREEN'),
};

const savedSession = () => {
  svc.isAuthenticated.mockResolvedValue(true);
  svc.getCurrentUser.mockResolvedValue(customer);
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  svc.isAuthenticated.mockResolvedValue(false);
  svc.getRefreshToken.mockResolvedValue(null);
  svc.getCurrentUser.mockResolvedValue(null);
  svc.logout.mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('where the app starts', () => {
  it('a brand-new user sees the intro first', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText('ONBOARDING SCREEN')).toBeTruthy();
  });

  it('a returning logged-out user goes straight to login (no intro)', async () => {
    await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.INTRO_SEEN, 'true');
    await renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText('LOGIN SCREEN')).toBeTruthy();
    expect(screen.queryByText('ONBOARDING SCREEN')).toBeNull();
  });

  it('a user with a saved session goes straight to home', async () => {
    savedSession();
    await renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText('HOME SCREEN')).toBeTruthy();
    expect(screen.queryByText('LOGIN SCREEN')).toBeNull();
  });

  it('shows nothing (splash stays up) until the saved session has been checked', async () => {
    let release!: () => void;
    svc.isAuthenticated.mockReturnValue(new Promise((r) => (release = () => r(true))));
    svc.getCurrentUser.mockResolvedValue(customer);

    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.queryByText('LOGIN SCREEN')).toBeNull();
    expect(screen.queryByText('ONBOARDING SCREEN')).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    await act(async () => release());
    expect(await screen.findByText('HOME SCREEN')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});

describe('the guard follows the login state', () => {
  it('logging in moves the user from login to home', async () => {
    await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.INTRO_SEEN, 'true');
    svc.login.mockResolvedValue({ user: customer } as any);
    await renderRouter(routes, { initialUrl: '/' });

    await fireEvent.press(await screen.findByLabelText('do login'));

    expect(await screen.findByText('HOME SCREEN')).toBeTruthy();
    expect(screen.queryByText('LOGIN SCREEN')).toBeNull();
  });

  it('logging out moves the user from home back to login', async () => {
    savedSession();
    await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.INTRO_SEEN, 'true');
    await renderRouter(routes, { initialUrl: '/' });
    await fireEvent.press(await screen.findByLabelText('do logout'));

    expect(await screen.findByText('LOGIN SCREEN')).toBeTruthy();
    expect(screen.queryByText('HOME SCREEN')).toBeNull();
  });
});

describe('screens behind the guard cannot be reached by navigating directly', () => {
  it('a logged-out user cannot open home or the cart', async () => {
    await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.INTRO_SEEN, 'true');
    await renderRouter(routes, { initialUrl: '/' });
    await screen.findByText('LOGIN SCREEN');

    await act(async () => router.push('/(tabs)'));
    await act(async () => router.push('/(routes)/cart'));

    expect(screen.queryByText('HOME SCREEN')).toBeNull();
    expect(screen.queryByText('CART SCREEN')).toBeNull();
  });

  it('a logged-in user cannot open the login or sign-up screens', async () => {
    savedSession();
    await renderRouter(routes, { initialUrl: '/' });
    await screen.findByText('HOME SCREEN');

    await act(async () => router.push('/(routes)/login'));
    await act(async () => router.push('/(routes)/sign-up'));

    expect(screen.queryByText('LOGIN SCREEN')).toBeNull();
    expect(screen.queryByText('SIGNUP SCREEN')).toBeNull();
  });

  it('a logged-out user can reach the forgot-password and reset-password screens', async () => {
    await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.INTRO_SEEN, 'true');
    await renderRouter(routes, { initialUrl: '/' });
    await screen.findByText('LOGIN SCREEN');

    await act(async () => router.push('/(routes)/login/forgot-password'));
    expect(await screen.findByText('FORGOT SCREEN')).toBeTruthy();
    await act(async () => router.push('/(routes)/login/reset-password'));
    expect(await screen.findByText('RESET SCREEN')).toBeTruthy();
  });

  it('a logged-in user cannot open the forgot-password or reset-password screens', async () => {
    savedSession();
    await renderRouter(routes, { initialUrl: '/' });
    await screen.findByText('HOME SCREEN');

    await act(async () => router.push('/(routes)/login/forgot-password'));
    await act(async () => router.push('/(routes)/login/reset-password'));
    expect(screen.queryByText('FORGOT SCREEN')).toBeNull();
    expect(screen.queryByText('RESET SCREEN')).toBeNull();
  });

  it('a logged-in user can open the cart', async () => {
    savedSession();
    await renderRouter(routes, { initialUrl: '/' });
    await screen.findByText('HOME SCREEN');
    await act(async () => router.push('/(routes)/cart'));
    expect(await screen.findByText('CART SCREEN')).toBeTruthy();
  });
});
