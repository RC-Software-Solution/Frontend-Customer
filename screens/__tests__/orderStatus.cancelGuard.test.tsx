import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import OrderStatus from '../orderStatus/orderStatus.screen';
import { orderService, menuService } from '@/services';

jest.mock('@/services', () => {
  const auth = { user: { id: 'u1' }, isAuthenticated: true };
  return {
    useAuth: () => auth,
    orderService: { getUndeliveredOrdersToday: jest.fn(), deleteOrder: jest.fn(), updateOrder: jest.fn() },
    menuService: { getMealSessionItemsBySession: jest.fn() },
  };
});
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn(), router: { push: jest.fn() } }));

const orders = orderService as jest.Mocked<typeof orderService>;
const menu = menuService as jest.Mocked<typeof menuService>;

const pending = {
  order_id: 'ORD-1', customer_id: 'u1', target_date: '2026-10-11', meal_time: 'breakfast', status: 'pending', total_price: 300,
  items: [{ food_name: 'String Hoppers', quantity: 1, meal_type: 'veg' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  orders.getUndeliveredOrdersToday.mockResolvedValue([pending] as any);
  menu.getMealSessionItemsBySession.mockResolvedValue([
    { foodItem: { id: 1, name: 'String Hoppers', meal_type: 'veg', price: '300.00' } },
  ] as any);
});
afterEach(() => jest.restoreAllMocks());


it('two un-awaited presses of "Yes, Cancel" while deleteOrder is pending delete once', async () => {
  orders.deleteOrder.mockReturnValue(new Promise(() => {}) as any);
  await render(<OrderStatus />);
  await fireEvent.press(await screen.findByLabelText('Cancel'));
  const yes = screen.getByRole('button', { name: 'Yes, Cancel' });
  await act(async () => {
    fireEvent.press(yes);
    fireEvent.press(yes);
  });
  expect(orders.deleteOrder).toHaveBeenCalledTimes(1);
});
