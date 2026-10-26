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
  payment_status: 'unpaid',
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

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('a delivery_failed order is an unpaid order like any other', () => {
  it('alone: the Delivery failed chip, no Delivered chip, the muted intro, 1 order', async () => {
    await mount([order({ status: 'delivery_failed', failure_reason: 'Nobody home', target_date: '2026-10-25', meal_time: 'dinner' })]);
    expect(await screen.findByText('Delivery failed')).toBeTruthy();
    expect(screen.queryByText('Delivered')).toBeNull();
    expect(screen.queryByText(/You can't place new orders/)).toBeNull();
    expect(screen.getByText("Unpaid orders appear here. With 2 unpaid orders you can't place new ones.")).toBeTruthy();
    expect(screen.getByText('1 order')).toBeTruthy();
    expect(screen.getByText('Sun, 25 Oct, Dinner')).toBeTruthy();
  });

  it('mixed with two delivered ones: the banner and the count say 3, the same count checkout blocks on', async () => {
    await mount([
      order({ order_id: 'ORD-1' }),
      order({ order_id: 'ORD-2', status: 'delivery_failed', total_price: 300 }),
      order({ order_id: 'ORD-3' }),
    ]);
    expect(await screen.findByText("You can't place new orders while you have 3 unpaid orders. Pay these to order again.")).toBeTruthy();
    expect(screen.getByText('Rs. 800.00')).toBeTruthy();
    expect(screen.getByText('3 orders')).toBeTruthy();
    expect(screen.getByText('Delivery failed')).toBeTruthy();
    expect(screen.getAllByText('Delivered')).toHaveLength(2);
  });
});
