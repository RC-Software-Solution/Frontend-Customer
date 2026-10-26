import React from 'react';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import HomeScreen from '../homeTab/home/home.screen';
import { AuthProvider } from '@/services';
import { store } from '@/store';
import { addToCart, clearCart } from '@/store/cartSlice';
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

const food = (id: number, name: string, meal_type: 'veg' | 'non-veg') =>
  ({ id, name, description: `${name} desc`, price: '300', meal_type, image_url: undefined, created_at: '', updated_at: '' }) as any;

const session = (meal_time: TodaySession['meal_time'], state: TodaySession['state'], over: Partial<TodaySession> = {}): TodaySession => ({
  id: 10,
  date: '2026-10-11',
  meal_time,
  start_time: '06:00:00',
  end_time: '09:30:00',
  state,
  opens_at: '2026-10-11T00:30:00.000Z',
  closes_at: '2026-10-11T04:00:00.000Z',
  items: [
    { id: 1, food_item_id: 1, available_quantity: 5, foodItem: food(1, 'String Hoppers', 'veg') },
    { id: 2, food_item_id: 2, available_quantity: 5, foodItem: food(2, 'Egg Hoppers', 'non-veg') },
  ],
  ...over,
});

const menu = (sessions: Partial<TodayMenu['sessions']>, now = '2026-10-11T02:00:00.000Z'): TodayMenu => ({
  date: '2026-10-11',
  now,
  sessions: { breakfast: null, lunch: null, dinner: null, ...sessions },
});

const mount = async (m: TodayMenu) => {
  menuSvc.getTodaysMenu.mockResolvedValue(m);
  await render(
    <Provider store={store}>
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    </Provider>,
  );
  await screen.findByText('RC Caterings');
};

const openTab = async (name: string) => fireEvent.press(screen.getByText(name));

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
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("today's tabs", () => {
  it('each tab says whether its session is open, upcoming, closed or not published', async () => {
    await mount(menu({
      breakfast: session('breakfast', 'closed'),
      lunch: session('lunch', 'open', { start_time: '11:00:00', end_time: '14:00:00' }),
      dinner: session('dinner', 'upcoming', { start_time: '18:00:00', end_time: '21:30:00' }),
    }));
    expect(screen.getByText('Closed')).toBeTruthy();
    expect(screen.getByText('Open now')).toBeTruthy();
    expect(screen.getByText('Opens 6:00 PM')).toBeTruthy();
  });

  it('an unpublished meal shows an empty tab with a message, and no menu sections', async () => {
    // Sunday/Monday: lunch is published for today, breakfast is not
    await mount(menu({ lunch: session('lunch', 'open') }));
    expect(screen.getAllByText('No menu')).toHaveLength(2); // breakfast and dinner
    expect(screen.getByText('No breakfast menu has been published for today.')).toBeTruthy();
    expect(screen.queryByText('Choose your preference')).toBeNull();
    expect(screen.queryByLabelText('Open Vegetarian Items')).toBeNull();
  });

  it('an open session has no banner and shows its items', async () => {
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    expect(screen.queryByText(/Ordering (opens|closed)/)).toBeNull();
    expect(screen.getByLabelText('Open Vegetarian Items')).toBeTruthy();
    expect(screen.getAllByText('1 item')).toHaveLength(2); // the count pills: 1 veg, 1 non-veg
  });

  it('an upcoming session explains when it opens and still lists its items', async () => {
    await mount(menu({ dinner: session('dinner', 'upcoming', { start_time: '18:00:00' }) }));
    await openTab('Dinner');
    expect(screen.getByText('Ordering opens today at 6:00 PM.')).toBeTruthy();
    expect(screen.getByLabelText('Open Vegetarian Items')).toBeTruthy();
    expect(screen.getAllByText('1 item')).toHaveLength(2);
  });

  it('a closed session explains when it closed', async () => {
    await mount(menu({ breakfast: session('breakfast', 'closed', { end_time: '09:30:00' }) }));
    expect(screen.getByText('Ordering closed today at 9:30 AM.')).toBeTruthy();
  });

  it('switching tabs switches the banner', async () => {
    await mount(menu({
      breakfast: session('breakfast', 'closed'),
      dinner: session('dinner', 'upcoming', { start_time: '18:00:00' }),
    }));
    expect(screen.getByText(/Ordering closed today/)).toBeTruthy();
    await openTab('Dinner');
    expect(screen.queryByText(/Ordering closed today/)).toBeNull();
    expect(screen.getByText('Ordering opens today at 6:00 PM.')).toBeTruthy();
  });
});

describe('ordering from a tab', () => {
  it('a banner opens the Menu list for the active meal and that kind', async () => {
    await mount(menu({ breakfast: session('breakfast', 'closed'), dinner: session('dinner', 'open') }));
    await openTab('Dinner');
    await fireEvent.press(screen.getByLabelText('Open Non-Vegetarian Items'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/(routes)/menu', params: { meal: 'dinner', kind: 'nonveg' } });
    await fireEvent.press(screen.getByLabelText('Open Vegetarian Items'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/(routes)/menu', params: { meal: 'dinner', kind: 'veg' } });
  });

  it('each banner carries a count pill of its dishes', async () => {
    const two = session('breakfast', 'open');
    two.items.push({ id: 3, food_item_id: 3, available_quantity: 5, foodItem: food(3, 'Milk Rice', 'veg') });
    await mount(menu({ breakfast: two }));
    expect(screen.getByText('2 items')).toBeTruthy();
    expect(screen.getByText('1 item')).toBeTruthy();
  });

  it('the cart button shows the cart quantity as a badge and opens the cart', async () => {
    await mount(menu({ breakfast: session('breakfast', 'open') }));
    expect(screen.getByLabelText('View cart')).toBeTruthy(); // no badge while empty
    await act(async () => {
      store.dispatch(addToCart({ id: '1', name: 'String Hoppers', price: 300, quantity: 3, meal_type: 'veg', meal_time: 'breakfast', description: '' }));
    });
    expect(screen.getByLabelText('View cart, 3 items')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('View cart, 3 items'));
    expect(router.push).toHaveBeenCalledWith('/(routes)/cart');
  });

  it('returning to the app refreshes the menu, which the Menu list reads from the store', async () => {
    const { AppState } = require('react-native');
    const listeners: Array<(state: string) => void> = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, cb: (s: string) => void) => {
      listeners.push(cb);
      return { remove() {} };
    }) as any);

    await mount(menu({ breakfast: session('breakfast', 'open') }));
    expect(store.getState().menu.menu?.sessions.breakfast?.state).toBe('open');

    // the window closes while the app is in the background; coming back refreshes the menu
    menuSvc.getTodaysMenu.mockResolvedValue(menu({ breakfast: session('breakfast', 'closed') }));
    await act(async () => listeners.forEach((l) => l('active')));
    expect(await screen.findByText('Closed')).toBeTruthy();
    expect(store.getState().menu.menu?.sessions.breakfast?.state).toBe('closed');
  });
});

describe('keeping the screen current', () => {
  it('reloads at the moment an upcoming session opens', async () => {
    jest.useFakeTimers();
    const now = '2026-10-11T00:00:00.000Z';
    const opens = '2026-10-11T00:00:30.000Z'; // 30 s later
    menuSvc.getTodaysMenu.mockResolvedValue(
      menu({ breakfast: session('breakfast', 'upcoming', { opens_at: opens, closes_at: '2026-10-11T04:00:00.000Z' }) }, now),
    );
    await render(
      <Provider store={store}>
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      </Provider>,
    );
    await screen.findByText('RC Caterings');
    expect(menuSvc.getTodaysMenu).toHaveBeenCalledTimes(1);

    menuSvc.getTodaysMenu.mockResolvedValue(
      menu({ breakfast: session('breakfast', 'open', { opens_at: opens }) }, '2026-10-11T00:00:31.000Z'),
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(31_500); // 30 s to open + 1 s grace
    });

    expect(menuSvc.getTodaysMenu).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Open now')).toBeTruthy();
  });
});

describe('edge cases', () => {
  it('asks a logged-out user to log in', async () => {
    auth.isAuthenticated.mockResolvedValue(false);
    auth.getCurrentUser.mockResolvedValue(null);
    await render(
      <Provider store={store}>
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      </Provider>,
    );
    expect(await screen.findByText('Please log in to view menu items')).toBeTruthy();
    expect(menuSvc.getTodaysMenu).not.toHaveBeenCalled();
  });

  it('tells the user when the first load fails', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    menuSvc.getTodaysMenu.mockRejectedValue(new Error('offline'));
    await render(
      <Provider store={store}>
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      </Provider>,
    );
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', expect.stringMatching(/failed to load menu/i)));
  });
});
