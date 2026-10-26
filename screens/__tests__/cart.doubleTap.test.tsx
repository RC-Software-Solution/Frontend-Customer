import React from 'react';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react-native';
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

let alert: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  store.dispatch(clearCart());
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  auth.getCurrentUser.mockResolvedValue({ id: 'user-1' } as any);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

// Returns the button element, so a press still works if the label is swapped for a spinner.
const idle = () => waitFor(() => expect(screen.getByRole('button', { name: 'CONFIRM ORDER' })).not.toBeDisabled());
const mount = async () => {
  store.dispatch(addToCart(item as any));
  await render(
    <Provider store={store}>
      <CartScreen />
    </Provider>,
  );
  await waitFor(() => expect(auth.getCurrentUser).toHaveBeenCalled());
  return screen.getByRole('button', { name: 'CONFIRM ORDER' });
};

describe('CONFIRM ORDER double tap', () => {
  it('two presses while createOrder is pending send one order', async () => {
    let settle!: (v: any) => void;
    orders.createOrder.mockReturnValue(new Promise((resolve) => (settle = resolve)) as any);
    const button = await mount();

    await act(async () => {
      fireEvent.press(button);
      fireEvent.press(button);
    });
    expect(orders.createOrder).toHaveBeenCalledTimes(1);

    settle({ order_id: 1 });
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Success', expect.any(String)));
    await idle();
  });

  it('resets after success', async () => {
    orders.createOrder.mockResolvedValue({ order_id: 1 } as any);
    const button = await mount();

    await fireEvent.press(button);
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
    await idle();
    await act(async () => { store.dispatch(addToCart(item as any)); }); // success emptied the basket
    await fireEvent.press(button);
    await waitFor(() => expect(orders.createOrder).toHaveBeenCalledTimes(2));
  });

  it('resets after failure', async () => {
    orders.createOrder.mockRejectedValue({ status: 400, message: 'Something unexpected' });
    const button = await mount();

    await fireEvent.press(button);
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));
    await idle();
    await fireEvent.press(button);
    await waitFor(() => expect(orders.createOrder).toHaveBeenCalledTimes(2));
  });
});
