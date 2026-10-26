import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import PendingPaymentsScreen from '../pendingPayments/pendingPayments.screen';
import { orderService } from '@/services';

jest.mock('@/services', () => {
  const auth = { user: { id: 'u1' }, isAuthenticated: true }; // one object: the screen reloads when `user` changes identity
  return {
    useAuth: () => auth,
    orderService: { getPendingPaymentOrders: jest.fn() },
  };
});
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn(), router: { push: jest.fn() } }));

const orders = orderService as jest.Mocked<typeof orderService>;

const OFFLINE = { status: 0, code: 'NETWORK_ERROR', message: 'Network error - please check your connection' };
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
const refresh = () => act(async () => { await screen.getByTestId('payments-list').props.refreshControl.props.onRefresh(); });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it('shows a skeleton while the first request is pending, not the old spinner text', async () => {
  orders.getPendingPaymentOrders.mockReturnValue(new Promise(() => {}));
  await render(<PendingPaymentsScreen />);
  expect(screen.getByLabelText('Loading')).toBeTruthy();
  expect(screen.queryByText('Loading pending payments...')).toBeNull();
});

it('offline with nothing loaded: an error panel instead of "No pending payments", no alert, retry shows the rows', async () => {
  orders.getPendingPaymentOrders.mockRejectedValueOnce(OFFLINE);
  await render(<PendingPaymentsScreen />);
  expect(await screen.findByText("Couldn't load your payments")).toBeTruthy();
  expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
  expect(screen.queryByText('No pending payments')).toBeNull();
  expect(Alert.alert).not.toHaveBeenCalled();

  orders.getPendingPaymentOrders.mockResolvedValue([order()] as any);
  fireEvent.press(screen.getByText('Tap to retry'));
  expect(await screen.findByText('Total unpaid')).toBeTruthy();
  expect(screen.queryByText("Couldn't load your payments")).toBeNull();
});

it('a server failure says something went wrong', async () => {
  orders.getPendingPaymentOrders.mockRejectedValue({ status: 500, message: 'Server error' });
  await render(<PendingPaymentsScreen />);
  expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
});

it('a failed refresh keeps the rows and shows one muted line, which a later good refresh removes', async () => {
  orders.getPendingPaymentOrders.mockResolvedValue([order()] as any);
  await render(<PendingPaymentsScreen />);
  expect(await screen.findByText('Total unpaid')).toBeTruthy();

  orders.getPendingPaymentOrders.mockRejectedValueOnce(OFFLINE);
  await refresh();
  expect(screen.getByText('Total unpaid')).toBeTruthy();
  expect(screen.getByText("Couldn't refresh. Pull down to try again.").props.accessibilityLiveRegion).toBe('polite');
  expect(screen.queryByText("Couldn't load your payments")).toBeNull();

  await refresh();
  expect(screen.queryByText("Couldn't refresh. Pull down to try again.")).toBeNull();
});

it('keeps its empty strings', async () => {
  orders.getPendingPaymentOrders.mockResolvedValue([]);
  await render(<PendingPaymentsScreen />);
  expect(await screen.findByText('No pending payments')).toBeTruthy();
  expect(screen.getByText('All your orders are paid')).toBeTruthy();
});
