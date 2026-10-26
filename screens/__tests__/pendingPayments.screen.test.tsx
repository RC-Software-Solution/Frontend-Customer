import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import PendingPaymentsScreen from '../pendingPayments/pendingPayments.screen';
import { orderService } from '@/services';

jest.mock('@/services', () => {
  const auth = { user: { id: 'u1' }, isAuthenticated: true }; // one object: the screen reloads when `user` changes identity
  return {
    useAuth: () => auth,
    orderService: { getPendingPaymentOrders: jest.fn() },
  };
});
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

const orders = orderService as jest.Mocked<typeof orderService>;

const order = (over: Record<string, any> = {}) => ({
  order_id: 'ORD-1',
  customer_id: 'u1',
  target_date: '2026-10-26',
  meal_time: 'lunch',
  status: 'delivered',
  total_price: 250,
  created_at: '2026-10-20T08:00:00.000Z',
  items: [],
  ...over,
});

const mount = async (list: any[]) => {
  orders.getPendingPaymentOrders.mockResolvedValue(list as any);
  await render(<PendingPaymentsScreen />);
  await waitFor(() => expect(orders.getPendingPaymentOrders).toHaveBeenCalled());
};

const two = [
  order(),
  order({ order_id: 'ORD-2', target_date: '2026-10-25', meal_time: 'dinner', status: 'delivery_failed', total_price: 300 }),
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('two unpaid orders', () => {
  it('shows the danger banner, the total card and one row per order', async () => {
    await mount(two);
    expect(await screen.findByText("You can't place new orders while you have 2 unpaid orders. Pay these to order again.")).toBeTruthy();
    expect(screen.getByText('Total unpaid')).toBeTruthy();
    expect(screen.getByText('Rs. 550.00')).toBeTruthy();
    expect(screen.getByText('2 orders')).toBeTruthy();
    expect(screen.getByText('ORD-1')).toBeTruthy();
    expect(screen.getByText('ORD-2')).toBeTruthy();
    expect(screen.getByText('Rs. 250.00')).toBeTruthy();
    expect(screen.getByText('Rs. 300.00')).toBeTruthy();
    expect(screen.getByText('Delivered')).toBeTruthy();
    expect(screen.getByText('Delivery failed')).toBeTruthy();
    expect(screen.getByText('Payments')).toBeTruthy();
    expect(screen.getByText('RC Caterings')).toBeTruthy();
  });
});

describe('one unpaid order', () => {
  it('shows the muted intro instead of the banner, and "1 order"', async () => {
    await mount([order()]);
    expect(await screen.findByText("Unpaid orders appear here. With 2 unpaid orders you can't place new ones.")).toBeTruthy();
    expect(screen.queryByText(/You can't place new orders/)).toBeNull();
    expect(screen.getByText('1 order')).toBeTruthy();
    expect(screen.getAllByText('Rs. 250.00')).toHaveLength(2); // the total card and the row
  });
});

describe('the row title', () => {
  it('is the meal date and meal, not the created date', async () => {
    await mount([order()]);
    expect(await screen.findByText('Mon, 26 Oct, Lunch')).toBeTruthy();
  });

  it('reads the weekday from the date string, with no timezone drift', async () => {
    await mount([order({ target_date: '2026-01-01', meal_time: 'breakfast' })]);
    expect(await screen.findByText('Thu, 1 Jan, Breakfast')).toBeTruthy();
  });

  it('falls back to the created_at date when there is no target_date', async () => {
    await mount([order({ target_date: undefined, created_at: '2026-10-25T08:00:00.000Z', meal_time: 'dinner' })]);
    expect(await screen.findByText('Sun, 25 Oct, Dinner')).toBeTruthy();
  });
});

describe('no unpaid orders', () => {
  it('shows the empty state', async () => {
    await mount([]);
    expect(await screen.findByText('No pending payments')).toBeTruthy();
    expect(screen.getByText('All your orders are paid')).toBeTruthy();
    expect(screen.queryByText('Total unpaid')).toBeNull();
  });
});
