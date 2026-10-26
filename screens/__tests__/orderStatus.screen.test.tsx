import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import OrderStatus from '../orderStatus/orderStatus.screen';
import { orderService, menuService } from '@/services';

jest.mock('@/services', () => {
  const auth = { user: { id: 'u1' }, isAuthenticated: true }; // one object: the screen reloads when `user` changes identity
  return {
    useAuth: () => auth,
    orderService: { getUndeliveredOrdersToday: jest.fn(), deleteOrder: jest.fn(), updateOrder: jest.fn() },
    menuService: { getMealSessionItemsBySession: jest.fn() },
  };
});
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

const orders = orderService as jest.Mocked<typeof orderService>;
const menu = menuService as jest.Mocked<typeof menuService>;

const order = (over: Record<string, any> = {}) => ({
  order_id: 'ORD-1',
  customer_id: 'u1',
  target_date: '2026-10-11',
  meal_time: 'breakfast',
  status: 'pending',
  total_price: 300,
  items: [
    { food_name: 'String Hoppers', quantity: 1, meal_type: 'veg' },
    { food_name: 'Egg Hoppers', quantity: 2, meal_type: 'non-veg' },
  ],
  ...over,
});

const mount = async (list: any[] = [order()]) => {
  orders.getUndeliveredOrdersToday.mockResolvedValue(list as any);
  await render(<OrderStatus />);
  await waitFor(() => expect(orders.getUndeliveredOrdersToday).toHaveBeenCalled());
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  menu.getMealSessionItemsBySession.mockResolvedValue([
    { foodItem: { id: 1, name: 'String Hoppers', meal_type: 'veg', price: '300.00' } },
    { foodItem: { id: 2, name: 'Egg Hoppers', meal_type: 'non-veg', price: '320.00' } },
    { foodItem: { id: 3, name: 'Milk Rice', meal_type: 'veg', price: '250.00' } },
  ] as any);
});
afterEach(() => jest.restoreAllMocks());

describe('an order card', () => {
  it('shows the meal, id, status chip, each item, the total and Edit / Cancel', async () => {
    await mount();
    expect(await screen.findByText('Breakfast')).toBeTruthy();
    expect(screen.getByText('ORD-1')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('String Hoppers x 1')).toBeTruthy();
    expect(screen.getByText('Egg Hoppers x 2')).toBeTruthy();
    expect(screen.getByText('non-veg')).toBeTruthy();
    expect(screen.getByText('Rs. 300.00')).toBeTruthy();
    expect(screen.getByLabelText('Edit')).toBeTruthy();
    expect(screen.getByLabelText('Cancel')).toBeTruthy();
  });

  it('titles the screen and tells a preparing order from a pending one by its chip', async () => {
    await mount([order({ status: 'preparing' })]);
    expect(await screen.findByText('Preparing')).toBeTruthy();
    expect(screen.queryByText('Pending')).toBeNull();
    expect(screen.getByText('RC Caterings')).toBeTruthy();
    expect(screen.getByText('My Orders')).toBeTruthy();
  });

  it('shows the empty state when there are no orders', async () => {
    await mount([]);
    expect(await screen.findByText('No orders found')).toBeTruthy();
    expect(screen.getByText('Your current orders will appear here')).toBeTruthy();
  });
});

describe('cancelling', () => {
  it('"Keep Order" closes the dialog without cancelling', async () => {
    await mount();
    await fireEvent.press(await screen.findByLabelText('Cancel'));
    expect(screen.getByText('Cancel Order')).toBeTruthy();
    await fireEvent.press(screen.getByText('Keep Order'));
    expect(screen.queryByText('Keep Order')).toBeNull();
    expect(orders.deleteOrder).not.toHaveBeenCalled();
  });

  it('"Yes, Cancel" deletes that order', async () => {
    orders.deleteOrder.mockResolvedValue(undefined as any);
    await mount();
    await fireEvent.press(await screen.findByLabelText('Cancel'));
    await fireEvent.press(screen.getByText('Yes, Cancel'));
    await waitFor(() => expect(orders.deleteOrder).toHaveBeenCalledWith('ORD-1'));
  });
});

describe('the edit modal', () => {
  it('opens with the order items, steppers, add choices with prices, and Close / Save Changes', async () => {
    await mount();
    await fireEvent.press(await screen.findByLabelText('Edit'));
    expect(await screen.findByText('Edit Order')).toBeTruthy();
    expect(menu.getMealSessionItemsBySession).toHaveBeenCalledWith('breakfast', '2026-10-11');
    expect(screen.getByLabelText('Increase quantity of Egg Hoppers')).toBeTruthy();
    expect(screen.getByLabelText('Decrease quantity of Egg Hoppers')).toBeTruthy();
    expect(screen.getByLabelText('Remove Egg Hoppers')).toBeTruthy();
    expect(screen.getByText('Milk Rice')).toBeTruthy();
    expect(screen.getByText(/Rs\. 250\.00/)).toBeTruthy();
    expect(screen.getByText('Close')).toBeTruthy();
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('Save Changes sends the edited quantities', async () => {
    orders.updateOrder.mockResolvedValue(undefined as any);
    await mount();
    await fireEvent.press(await screen.findByLabelText('Edit'));
    await fireEvent.press(await screen.findByLabelText('Increase quantity of String Hoppers'));
    await fireEvent.press(screen.getByText('Save Changes'));
    await waitFor(() =>
      expect(orders.updateOrder).toHaveBeenCalledWith('ORD-1', {
        items: [
          { food_item_id: 1, quantity: 2 },
          { food_item_id: 2, quantity: 2 },
        ],
      }),
    );
  });
});
