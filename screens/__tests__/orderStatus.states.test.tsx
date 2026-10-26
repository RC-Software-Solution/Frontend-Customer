import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import OrderStatus from '../orderStatus/orderStatus.screen';
import { orderService } from '@/services';

jest.mock('@/services', () => {
  const auth = { user: { id: 'u1' }, isAuthenticated: true }; // one object: the screen reloads when `user` changes identity
  return {
    useAuth: () => auth,
    orderService: { getUndeliveredOrdersToday: jest.fn(), deleteOrder: jest.fn(), updateOrder: jest.fn() },
    menuService: { getMealSessionItemsBySession: jest.fn() },
  };
});
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn(), router: { push: jest.fn() } }));

const orders = orderService as jest.Mocked<typeof orderService>;

const OFFLINE = { status: 0, code: 'NETWORK_ERROR', message: 'Network error - please check your connection' };
const order = (over: Record<string, any> = {}) => ({
  order_id: 'ORD-1',
  customer_id: 'u1',
  target_date: '2026-10-11',
  meal_time: 'breakfast',
  status: 'pending',
  total_price: 300,
  items: [{ food_name: 'String Hoppers', quantity: 1, meal_type: 'veg' }],
  ...over,
});
const refresh = () => act(async () => { await screen.getByTestId('orders-list').props.refreshControl.props.onRefresh(); });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('loading', () => {
  it('shows a skeleton while the first request is pending, not the old spinner text', async () => {
    orders.getUndeliveredOrdersToday.mockReturnValue(new Promise(() => {}));
    await render(<OrderStatus />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
    expect(screen.queryByText('Loading orders...')).toBeNull();
    expect(screen.getByLabelText('Order history')).toBeTruthy();
  });
});

describe('an error with nothing loaded', () => {
  it('offline: an error panel instead of "No orders found", no alert, and retry loads the rows', async () => {
    orders.getUndeliveredOrdersToday.mockRejectedValueOnce(OFFLINE);
    await render(<OrderStatus />);
    expect(await screen.findByText("Couldn't load your orders")).toBeTruthy();
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
    expect(screen.queryByText('No orders found')).toBeNull();
    expect(screen.getByLabelText('Order history')).toBeTruthy();
    expect(Alert.alert).not.toHaveBeenCalled();

    orders.getUndeliveredOrdersToday.mockResolvedValue([order()] as any);
    fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('String Hoppers x 1')).toBeTruthy();
    expect(screen.queryByText("Couldn't load your orders")).toBeNull();
  });

  it('a server failure says something went wrong', async () => {
    orders.getUndeliveredOrdersToday.mockRejectedValue({ status: 500, message: 'Server error' });
    await render(<OrderStatus />);
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
    expect(screen.queryByText('Check your connection and try again.')).toBeNull();
  });
});

describe('a failed refresh with rows on screen', () => {
  it('keeps the rows and shows one muted line, which a later good refresh removes', async () => {
    orders.getUndeliveredOrdersToday.mockResolvedValue([order()] as any);
    await render(<OrderStatus />);
    expect(await screen.findByText('String Hoppers x 1')).toBeTruthy();

    orders.getUndeliveredOrdersToday.mockRejectedValueOnce(OFFLINE);
    await refresh();
    expect(screen.getByText('String Hoppers x 1')).toBeTruthy();
    const line = screen.getByText("Couldn't refresh. Pull down to try again.");
    expect(line.props.accessibilityLiveRegion).toBe('polite');
    expect(screen.queryByText("Couldn't load your orders")).toBeNull();

    await refresh();
    expect(screen.queryByText("Couldn't refresh. Pull down to try again.")).toBeNull();
    expect(screen.getByText('String Hoppers x 1')).toBeTruthy();
  });
});

describe('empty', () => {
  it('keeps its two strings, adds "Browse the menu" to the menu tab, and keeps the history link', async () => {
    orders.getUndeliveredOrdersToday.mockResolvedValue([]);
    await render(<OrderStatus />);
    expect(await screen.findByText('No orders found')).toBeTruthy();
    expect(screen.getByText('Your current orders will appear here')).toBeTruthy();
    expect(screen.getByLabelText('Order history')).toBeTruthy();
    fireEvent.press(screen.getByText('Browse the menu'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)');
  });
});
