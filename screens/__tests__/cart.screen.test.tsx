import React from 'react';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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

const item = (over: Record<string, any> = {}) => ({
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
  ...over,
});

const add = (...items: ReturnType<typeof item>[]) => items.forEach((i) => store.dispatch(addToCart(i as any)));

const mount = async () => {
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

let alert: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  store.dispatch(clearCart());
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  auth.getCurrentUser.mockResolvedValue({ id: 'user-1' } as any);
  orders.createOrder.mockResolvedValue({ order_id: 42 } as any);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('basket contents', () => {
  it('lists the items with the parcel count and total', async () => {
    add(item(), item({ id: '2', food_item_id: 2, name: 'Milk Rice', price: 250, quantity: 2 }));
    await mount();
    expect(screen.getByText('String Hoppers')).toBeTruthy();
    expect(screen.getByText('Milk Rice')).toBeTruthy();
    expect(screen.getByText('Parcel Quantity: 3')).toBeTruthy();
    expect(screen.getByText('Total: Rs. 800.00')).toBeTruthy();
  });

  it('+ and - change the quantity and the total, and quantity never drops below 1', async () => {
    add(item());
    await mount();
    await fireEvent.press(screen.getByLabelText('Increase quantity of String Hoppers'));
    expect(screen.getByText('Total: Rs. 600.00')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Decrease quantity of String Hoppers'));
    await fireEvent.press(screen.getByLabelText('Decrease quantity of String Hoppers'));
    expect(screen.getByText('Parcel Quantity: 1')).toBeTruthy();
  });

  it('the cross removes an item', async () => {
    add(item(), item({ id: '2', name: 'Milk Rice' }));
    await mount();
    await fireEvent.press(screen.getByLabelText('Remove String Hoppers'));
    expect(screen.queryByText('String Hoppers')).toBeNull();
    expect(screen.getByText('Milk Rice')).toBeTruthy();
  });
});

describe('placing the order', () => {
  it('sends the customer, meal time, the session date and each item, then clears the basket and goes home', async () => {
    add(item({ quantity: 2 }), item({ id: '2', food_item_id: 2, name: 'Egg Hoppers', price: 320, meal_type: 'non-veg' }));
    await mount();
    await confirm();

    await waitFor(() => expect(orders.createOrder).toHaveBeenCalledTimes(1));
    const sent = orders.createOrder.mock.calls[0][0] as any;
    expect(sent.customer_id).toBe('user-1');
    expect(sent.meal_time).toBe('breakfast');
    expect(sent.target_date).toBe('2026-10-11'); // the session's own date, not the phone's
    expect(sent.items.map((i: any) => [i.food_item_id, i.quantity, i.meal_type])).toEqual([
      [1, 2, 'veg'],
      [2, 1, 'non-veg'],
    ]);

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Success', expect.stringContaining('42')));
    expect(store.getState().cart.items).toEqual([]);
    expect(router.push).toHaveBeenCalledWith('/(tabs)');
  });

  it('refuses an empty basket', async () => {
    await mount();
    await confirm();
    expect(alert).toHaveBeenCalledWith('Error', 'Your cart is empty.');
    expect(orders.createOrder).not.toHaveBeenCalled();
  });

  it('asks you to log in when there is no user', async () => {
    auth.getCurrentUser.mockResolvedValue(null);
    add(item());
    await mount();
    await confirm();
    expect(alert).toHaveBeenCalledWith('Error', 'Please log in to place an order.');
    expect(orders.createOrder).not.toHaveBeenCalled();
  });

  it('refuses items from different meals in one order', async () => {
    add(item(), item({ id: '2', name: 'Rice', meal_time: 'lunch' }));
    await mount();
    await confirm();
    expect(alert).toHaveBeenCalledWith('Error', 'All items in the cart must have the same meal time.');
    expect(orders.createOrder).not.toHaveBeenCalled();
  });
});

describe('when the server says no', () => {
  const fail = async (message: string) => {
    orders.createOrder.mockRejectedValue(new Error(message));
    add(item());
    await mount();
    await confirm();
    await waitFor(() => expect(alert).toHaveBeenCalled());
  };

  it('explains the unpaid-orders limit', async () => {
    await fail('You have more than two unpaid order');
    expect(alert).toHaveBeenCalledWith('Error', expect.stringMatching(/unpaid orders/i));
  });

  it('explains a missing meal session', async () => {
    await fail('Meal session not found');
    expect(alert).toHaveBeenCalledWith('Error', expect.stringMatching(/not available for today/i));
  });

  it('passes other messages (like the closed window) through unchanged and keeps the basket', async () => {
    await fail('Order cannot be placed outside the meal session time window');
    expect(alert).toHaveBeenCalledWith('Error', 'Order cannot be placed outside the meal session time window');
    expect(store.getState().cart.items).toHaveLength(1);
  });

  it('offers a retry after a server error, and the retry sends the order again', async () => {
    orders.createOrder.mockRejectedValueOnce(new Error('Server error')).mockResolvedValueOnce({ order_id: 7 } as any);
    add(item());
    await mount();
    await confirm();

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', expect.stringMatching(/retry/i), expect.any(Array)));
    const buttons = alert.mock.calls.find((c) => Array.isArray(c[2]))![2] as any[];
    await buttons.find((b) => b.text === 'Retry').onPress();

    await waitFor(() => expect(orders.createOrder).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Success', expect.stringContaining('7')));
  });
});
