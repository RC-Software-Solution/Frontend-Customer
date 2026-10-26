import React from 'react';
import { Alert, AppState } from 'react-native';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import HomeScreen from '../homeTab/home/home.screen';
import { AuthProvider } from '@/services';
import { store } from '@/store';
import { clearCart } from '@/store/cartSlice';
import { setMenu } from '@/store/menuSlice';
import { authService, menuService } from '@/services/instances';
import { TodayMenu, TodaySession } from '@/services/types/api.types';

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
  menuService: { getTodaysMenu: jest.fn() },
}));
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    router: { push: jest.fn(), replace: jest.fn() },
    useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]),
  };
});

const auth = authService as jest.Mocked<typeof authService>;
const menuSvc = menuService as jest.Mocked<typeof menuService>;

const OFFLINE = { status: 0, code: 'NETWORK_ERROR', message: 'Network error - please check your connection' };

const food = (id: number, name: string, meal_type: 'veg' | 'non-veg') =>
  ({ id, name, description: `${name} desc`, price: '300', meal_type, image_url: undefined, created_at: '', updated_at: '' }) as any;

const session = (meal_time: TodaySession['meal_time'], state: TodaySession['state']): TodaySession => ({
  id: 10,
  date: '2026-10-11',
  meal_time,
  start_time: '06:00:00',
  end_time: '09:30:00',
  state,
  opens_at: '2026-10-11T00:30:00.000Z',
  closes_at: '2026-10-11T04:00:00.000Z',
  items: [{ id: 1, food_item_id: 1, available_quantity: 5, foodItem: food(1, 'String Hoppers', 'veg') }],
});

const menu = (): TodayMenu => ({
  date: '2026-10-11',
  now: '2026-10-11T02:00:00.000Z',
  sessions: { breakfast: session('breakfast', 'open'), lunch: null, dinner: null },
});

const mount = () =>
  render(
    <Provider store={store}>
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    </Provider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  store.dispatch(clearCart());
  store.dispatch(setMenu(null));
  auth.isAuthenticated.mockResolvedValue(true);
  auth.getRefreshToken.mockResolvedValue(null);
  auth.getCurrentUser.mockResolvedValue({ id: 'u1', role: 'customer' } as any);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it('the first load shows a skeleton, not the spinner text', async () => {
  menuSvc.getTodaysMenu.mockReturnValue(new Promise(() => {}));
  await mount();
  expect(await screen.findByLabelText('Loading')).toBeTruthy();
  expect(screen.queryByText('Loading menu items...')).toBeNull();
});

it('an offline first load shows the error panel, still raises the pinned alert once, and retry shows the tabs', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  menuSvc.getTodaysMenu.mockRejectedValueOnce(OFFLINE);
  await mount();
  expect(await screen.findByText("Couldn't load the menu")).toBeTruthy();
  expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
  expect(screen.queryByText('Could not load the menu. Pull back to this screen to retry.')).toBeNull();
  expect(alert).toHaveBeenCalledTimes(1);
  expect(alert).toHaveBeenCalledWith('Error', expect.stringMatching(/failed to load menu/i));

  menuSvc.getTodaysMenu.mockResolvedValue(menu());
  fireEvent.press(screen.getByText('Tap to retry'));
  expect(await screen.findByText('RC Caterings')).toBeTruthy();
  expect(screen.getByText('Open now')).toBeTruthy();
  expect(screen.queryByText("Couldn't load the menu")).toBeNull();
});

it('a failure after a good load keeps the tabs and shows no error panel', async () => {
  let wake: (s: string) => void = () => {};
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, cb: (s: string) => void) => {
    wake = cb;
    return { remove: jest.fn() };
  }) as any);
  menuSvc.getTodaysMenu.mockResolvedValueOnce(menu());
  await mount();
  expect(await screen.findByText('Open now')).toBeTruthy();

  menuSvc.getTodaysMenu.mockRejectedValueOnce(OFFLINE);
  await act(async () => { wake('active'); });
  await waitFor(() => expect(menuSvc.getTodaysMenu).toHaveBeenCalledTimes(2));
  expect(screen.getByText('Open now')).toBeTruthy();
  expect(screen.queryByText("Couldn't load the menu")).toBeNull();
});
