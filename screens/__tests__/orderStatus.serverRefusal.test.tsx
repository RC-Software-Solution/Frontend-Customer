import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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

describe('backend refusal of non-pending orders reaches the Alert', () => {
  it('cancel: shows "Only pending orders can be cancelled"', async () => {
    orders.deleteOrder.mockRejectedValue({ status: 400, message: 'Only pending orders can be cancelled' });
    await render(<OrderStatus />);
    await fireEvent.press(await screen.findByLabelText('Cancel'));
    await fireEvent.press(screen.getByText('Yes, Cancel'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Could not cancel order', 'Only pending orders can be cancelled'),
    );
  });

  it('edit save: shows "Only pending orders can be edited"', async () => {
    orders.updateOrder.mockRejectedValue({ status: 400, message: 'Only pending orders can be edited' });
    await render(<OrderStatus />);
    await fireEvent.press(await screen.findByLabelText('Edit'));
    await fireEvent.press(await screen.findByText('Save Changes'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'Only pending orders can be edited'));
  });
});
