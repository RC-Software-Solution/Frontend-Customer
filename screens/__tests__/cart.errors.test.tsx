import React from 'react';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import CartScreen from '../cart/cart.screen';
import { store } from '@/store';
import { addToCart, clearCart } from '@/store/cartSlice';
import { authService, orderService } from '@/services/instances';

jest.mock('@/services/instances', () => ({
  authService: { getCurrentUser: jest.fn() },
  orderService: { createOrder: jest.fn() },
  menuService: {},
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useNavigation: () => ({ goBack: jest.fn() }),
}));

const auth = authService as jest.Mocked<typeof authService>;
const orders = orderService as jest.Mocked<typeof orderService>;

const item = {
  id: '1',
  food_item_id: 1,
  name: 'String Hoppers',
  price: 300,
  quantity: 1,
  image: { uri: 'x' },
  meal_type: 'veg' as const,
  meal_time: 'breakfast' as const,
  description: '10 hoppers',
  session_date: '2026-10-11',
};

const UNPAID = 'You have 2 or more unpaid orders. Pay them to order again.';
const NO_AREA = "Your delivery area hasn't been assigned yet, so orders can't be placed. Please contact RC Caterings.";
const CLOSED = 'Order cannot be placed outside the meal session time window';
const CLOSED_BANNER = 'Ordering for this meal has closed. Choose another meal from the menu.';
const STALE_BANNER = 'Some items in your basket are no longer available. Update your basket and try again.';

let alert: jest.SpyInstance;
let warn: jest.SpyInstance;
let error: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  store.dispatch(clearCart());
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  auth.getCurrentUser.mockResolvedValue({ id: 'user-1' } as any);
  orders.createOrder.mockResolvedValue({ order_id: 42 } as any);
  error = jest.spyOn(console, 'error').mockImplementation(() => {});
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

const mount = async () => {
  store.dispatch(addToCart(item as any));
  await render(
    <Provider store={store}>
      <CartScreen />
    </Provider>,
  );
  await waitFor(() => expect(auth.getCurrentUser).toHaveBeenCalled());
};
const confirm = async () => {
  await fireEvent.press(screen.getByText('CONFIRM ORDER'));
};
// Reject once with the shaped error, press CONFIRM ORDER and wait for the refusal to land.
const refuse = async (rejection: any) => {
  orders.createOrder.mockRejectedValue(rejection);
  await mount();
  await confirm();
  await waitFor(() => expect(alert).toHaveBeenCalled());
};
const stillIntact = () => {
  expect(orders.createOrder).toHaveBeenCalledTimes(1); // no auto-retry, no auto-confirm
  expect(store.getState().cart.items).toHaveLength(1);
};

describe('refusals with a persistent banner and a next action', () => {
  it.each([
    ['unpaid orders', { status: 400, message: 'You have more than two unpaid order' }, UNPAID, UNPAID, 'View unpaid orders', '/(tabs)/pending-payments'],
    ['no delivery area', { status: 400, message: 'Customer area not found' }, NO_AREA, NO_AREA, 'Open Profile', '/(tabs)/profile'],
    ['closed meal window', { status: 400, message: CLOSED }, CLOSED, CLOSED_BANNER, 'Back to menu', '/(tabs)'],
  ])('%s', async (_name, rejection, alertText, bannerText, actionLabel, route) => {
    await refuse(rejection);

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith('Error', alertText);
    expect(within(screen.getByRole('alert')).getByText(bannerText)).toBeTruthy();
    stillIntact();

    const action = screen.getByRole('button', { name: actionLabel });
    expect(router.push).not.toHaveBeenCalled(); // showing the banner navigates nowhere
    await fireEvent.press(action);
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith(route);
    expect(orders.createOrder).toHaveBeenCalledTimes(1); // the action never confirms an order
  });

  it('the old plain-Error shape (no status) gets the same treatment', async () => {
    await refuse(new Error('You have more than two unpaid order'));
    expect(alert).toHaveBeenCalledWith('Error', UNPAID);
    expect(within(screen.getByRole('alert')).getByText(UNPAID)).toBeTruthy();
  });

  it.each([
    ['insufficient quantity', { status: 400, message: 'Insufficient quantity for one or more items' }, 'Insufficient quantity for one or more items'],
    ['items not found', { status: 404, message: 'One or more session items not found for this session' }, 'One or more session items not found for this session'],
  ])('stale basket: %s', async (_name, rejection, alertText) => {
    await refuse(rejection);

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith('Error', alertText);
    expect(within(screen.getByRole('alert')).getByText(STALE_BANNER)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /view unpaid orders|open profile|back to menu/i })).toBeNull(); // no action
    stillIntact();
  });
});

describe('refusals with an alert only', () => {
  it.each([
    ['no meal session', { status: 400, message: 'Meal session not found' }, expect.stringMatching(/not available for today/i)],
    ['offline', { status: 0, code: 'NETWORK_ERROR', message: 'Network error - please check your connection' }, 'No internet connection. Check it, then press CONFIRM ORDER again.'],
    ['disabled account', { status: 403, message: 'Account disabled' }, 'Your account is disabled. Please contact RC Caterings.'],
    ['other', { status: 400, message: 'Something unexpected' }, 'Something unexpected'],
    ['other, no message', { status: 418 }, 'Failed to place order. Please try again.'],
  ])('%s', async (_name, rejection, alertText) => {
    await refuse(rejection);

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith('Error', alertText);
    expect(screen.queryByRole('alert')).toBeNull();
    stillIntact();
  });

  it('a server error keeps the three-argument retry alert and nothing retries by itself', async () => {
    await refuse({ status: 500, message: 'Server error' });

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith('Error', expect.stringMatching(/retry/i), expect.any(Array));
    const buttons = alert.mock.calls[0][2] as any[];
    expect(buttons.filter((b) => b.text === 'Retry')).toHaveLength(1);
    expect(screen.queryByRole('alert')).toBeNull();
    stillIntact();
  });

  it('a server error on the retry itself is a plain alert, not another retry offer', async () => {
    await refuse({ status: 500, message: 'Server error' });
    const buttons = alert.mock.calls[0][2] as any[];
    await buttons.find((b) => b.text === 'Retry').onPress();

    await waitFor(() => expect(orders.createOrder).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(2));
    expect(alert).toHaveBeenLastCalledWith('Error', 'Server error');
    expect(store.getState().cart.items).toHaveLength(1);
  });
});

describe('the banner lifecycle', () => {
  it('the next CONFIRM ORDER clears the previous banner before the new result arrives', async () => {
    await refuse({ status: 400, message: 'Customer area not found' });
    expect(screen.getByRole('alert')).toBeTruthy();

    let settle!: (v: any) => void;
    orders.createOrder.mockReturnValue(new Promise((resolve) => (settle = resolve)) as any);
    // not awaited: the press only settles when the request does, and this one stays pending
    void confirm();
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull()); // gone while the request is still pending
    expect(screen.queryByRole('button', { name: 'Open Profile' })).toBeNull();
    expect(orders.createOrder).toHaveBeenCalledTimes(2);

    settle({ order_id: 5 });
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Success', expect.stringContaining('5')));
  });

  it('a different refusal replaces the banner instead of stacking a second one', async () => {
    await refuse({ status: 400, message: 'Customer area not found' });
    orders.createOrder.mockRejectedValue({ status: 400, message: CLOSED });
    await confirm();
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(2));
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(screen.getByRole('alert')).getByText(CLOSED_BANNER)).toBeTruthy();
    expect(screen.queryByText(NO_AREA)).toBeNull();
  });

  it('a refusal without a banner also clears the old one', async () => {
    await refuse({ status: 400, message: 'Customer area not found' });
    orders.createOrder.mockRejectedValue({ status: 0, code: 'NETWORK_ERROR' });
    await confirm();
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('a success clears the banner and the basket', async () => {
    await refuse({ status: 400, message: 'Customer area not found' });
    orders.createOrder.mockResolvedValue({ order_id: 9 } as any);
    await confirm();
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Success', expect.stringContaining('9')));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(store.getState().cart.items).toEqual([]);
  });
});

describe('logging', () => {
  it('an expected refusal logs at warn level, so no red error overlay', async () => {
    await refuse({ status: 400, message: 'Customer area not found' });
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it('a network failure logs at warn level', async () => {
    await refuse({ status: 0, code: 'NETWORK_ERROR', message: 'Network error - please check your connection' });
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it('a server error still logs at error level', async () => {
    await refuse({ status: 500, message: 'Server error' });
    expect(error).toHaveBeenCalled();
  });
});
