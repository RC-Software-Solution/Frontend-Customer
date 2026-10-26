import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import OrderHistoryScreen from '../orderHistory/orderHistory.screen';
import { orderService } from '@/services';

jest.mock('@/services', () => ({ orderService: { getOrderHistory: jest.fn() } }));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

const history = orderService.getOrderHistory as jest.Mock;

const order = (id: string, over: Record<string, any> = {}) => ({
  order_id: id,
  customer_id: 'u1',
  target_date: '2026-10-26',
  meal_time: 'lunch',
  status: 'delivered',
  total_price: 250,
  created_at: '2026-10-26T04:00:00.000Z',
  items: [{ food_name: 'Chicken Rice', quantity: 2, meal_type: 'non-veg' }],
  ...over,
});
const page = (from: number, n: number) => Array.from({ length: n }, (_, i) => order(`ORD-${from + i}`));

const mount = async () => {
  await render(<OrderHistoryScreen />);
};
const endReached = () => act(async () => { fireEvent(screen.getByTestId('history-list'), 'endReached'); });
// FlatList renders only the first rows it is given: scroll to the end so the rows that were just appended are on screen
const showEnd = async (rows: number) => {
  const list = screen.getByTestId('history-list');
  const size = { width: 360, height: rows * 100 };
  await act(async () => {
    fireEvent(list, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 600 } } });
    fireEvent(list, 'contentSizeChange', size.width, size.height);
    fireEvent.scroll(list, { nativeEvent: { contentOffset: { x: 0, y: size.height - 600 }, contentSize: size, layoutMeasurement: { width: 360, height: 600 } } });
  });
};
const refresh = () => act(async () => { await screen.getByTestId('history-list').props.refreshControl.props.onRefresh(); });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('the rows', () => {
  it('asks for page 1 of 20 and shows every status as a chip, in the order returned, with no actions', async () => {
    const statuses = ['pending', 'delivered', 'completed', 'cancelled', 'delivery_failed'];
    history.mockResolvedValue(statuses.map((s, i) => order(`ORD-${i}`, { status: s })));
    await mount();

    expect(await screen.findByText('Pending')).toBeTruthy();
    expect(history).toHaveBeenCalledWith(1, 20);
    for (const label of ['Delivered', 'Completed', 'Cancelled', 'Delivery failed']) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getAllByText('Mon, 26 Oct, Lunch')).toHaveLength(5);
    expect(screen.getAllByText('Chicken Rice x 2')).toHaveLength(5);
    expect(screen.getAllByText('Rs. 250.00')).toHaveLength(5);
    const ids = screen.getAllByText(/^ORD-\d$/).map((n) => n.props.children);
    expect(ids).toEqual(['ORD-0', 'ORD-1', 'ORD-2', 'ORD-3', 'ORD-4']);
    expect(screen.queryByLabelText('Edit')).toBeNull();
    expect(screen.queryByLabelText('Cancel')).toBeNull();
  });
});

describe('the header', () => {
  it('has the title and a 48 dp Go back control that returns', async () => {
    history.mockResolvedValue([]);
    await mount();
    expect(await screen.findByText('Order history')).toBeTruthy();
    const back = screen.getByLabelText('Go back');
    const style = StyleSheet.flatten(back.props.style);
    expect(style.width).toBeGreaterThanOrEqual(48);
    expect(style.height).toBeGreaterThanOrEqual(48);
    await fireEvent.press(back);
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});

describe('empty and failed first loads', () => {
  it('empty: says there is no history yet', async () => {
    history.mockResolvedValue([]);
    await mount();
    expect(await screen.findByText('No order history yet')).toBeTruthy();
    expect(screen.getByText('Orders you have placed will appear here.')).toBeTruthy();
  });

  it('failure: shows the error with a retry that loads the rows', async () => {
    history.mockRejectedValueOnce(new Error('boom'));
    await mount();
    expect(await screen.findByText("Couldn't load your order history")).toBeTruthy();
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy();

    history.mockResolvedValueOnce([order('ORD-9')]);
    await fireEvent.press(screen.getByLabelText('Try again'));
    expect(await screen.findByText('ORD-9')).toBeTruthy();
    expect(history).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Couldn't load your order history")).toBeNull();
  });
});

describe('paging', () => {
  it('a full page asks for the next one on endReached and appends without duplicates', async () => {
    history.mockResolvedValueOnce(page(0, 20));
    await mount();
    await screen.findByText('ORD-0');

    history.mockResolvedValueOnce([...page(19, 1), ...page(20, 2)]); // ORD-19 repeats
    await endReached();
    await showEnd(22);
    expect(await screen.findByText('ORD-21')).toBeTruthy();
    expect(history).toHaveBeenLastCalledWith(2, 20);
    expect(screen.getAllByText('ORD-19')).toHaveLength(1);
  });

  it('a short second page stops further paging', async () => {
    history.mockResolvedValueOnce(page(0, 20));
    await mount();
    await screen.findByText('ORD-0');
    history.mockResolvedValueOnce(page(20, 3));
    await endReached();
    await showEnd(23);
    expect(await screen.findByText('ORD-22')).toBeTruthy();

    await endReached();
    expect(history).toHaveBeenCalledTimes(2);
  });

  it('a first page of fewer than 20 never pages', async () => {
    history.mockResolvedValueOnce(page(0, 3));
    await mount();
    await screen.findByText('ORD-2');
    await endReached();
    expect(history).toHaveBeenCalledTimes(1);
  });

  it('a failed next page keeps the list and offers a retry for page 2', async () => {
    history.mockResolvedValueOnce(page(0, 20));
    await mount();
    await screen.findByText('ORD-0');

    history.mockRejectedValueOnce(new Error('boom'));
    await endReached();
    const retry = await screen.findByLabelText("Couldn't load more. Try again");
    expect(screen.getByText('ORD-0')).toBeTruthy();
    await endReached(); // no paging while the failure is showing
    expect(history).toHaveBeenCalledTimes(2);

    history.mockResolvedValueOnce(page(20, 2));
    await fireEvent.press(retry);
    await showEnd(22);
    expect(await screen.findByText('ORD-21')).toBeTruthy();
    expect(history).toHaveBeenLastCalledWith(2, 20);
    expect(screen.queryByLabelText("Couldn't load more. Try again")).toBeNull();
  });
});

describe('pull to refresh', () => {
  it('asks for page 1 again and replaces the rows', async () => {
    history.mockResolvedValueOnce([order('ORD-OLD')]);
    await mount();
    await screen.findByText('ORD-OLD');

    history.mockResolvedValueOnce([order('ORD-NEW')]);
    await refresh();
    expect(history).toHaveBeenLastCalledWith(1, 20);
    expect(await screen.findByText('ORD-NEW')).toBeTruthy();
    expect(screen.queryByText('ORD-OLD')).toBeNull();
  });

  it('a failing refresh keeps the rows and shows no error state', async () => {
    history.mockResolvedValueOnce([order('ORD-OLD')]);
    await mount();
    await screen.findByText('ORD-OLD');

    history.mockRejectedValueOnce(new Error('boom'));
    await refresh();
    expect(screen.getByText('ORD-OLD')).toBeTruthy();
    expect(screen.queryByText("Couldn't load your order history")).toBeNull();
  });
});

describe('a request still in flight', () => {
  const held = () => {
    let settle!: (v: any) => void, fail!: (e: any) => void;
    const promise = new Promise<any>((res, rej) => { settle = res; fail = rej; });
    return { promise, settle, fail };
  };

  it('a second endReached while a page is loading issues no second request', async () => {
    history.mockResolvedValueOnce(page(0, 20));
    await mount();
    await screen.findByText('ORD-0');

    const next = held();
    history.mockReturnValueOnce(next.promise);
    await endReached();
    await endReached();
    expect(history).toHaveBeenCalledTimes(2);
    await act(async () => next.settle(page(20, 2)));
  });

  it('a failed refresh during a page load does not strand the paging', async () => {
    history.mockResolvedValueOnce(page(0, 20));
    await mount();
    await screen.findByText('ORD-0');

    const next = held();
    history.mockReturnValueOnce(next.promise);
    await endReached();
    expect(screen.getByLabelText('Loading more')).toBeTruthy();

    history.mockRejectedValueOnce(new Error('offline'));
    await refresh();
    expect(screen.getByText('ORD-0')).toBeTruthy();
    expect(screen.queryByText("Couldn't load your order history")).toBeNull();

    await act(async () => next.settle(page(20, 20))); // the page that was in flight still lands
    expect(screen.queryByLabelText('Loading more')).toBeNull();

    history.mockResolvedValueOnce(page(40, 1));
    await endReached();
    expect(history).toHaveBeenLastCalledWith(3, 20);
  });
});

describe('loading, offline and a failed refresh (Task 23)', () => {
  const OFFLINE = { status: 0, code: 'NETWORK_ERROR', message: 'Network error - please check your connection' };

  it('shows a skeleton while the first page is pending, not the old spinner text', async () => {
    history.mockReturnValue(new Promise(() => {}));
    await mount();
    expect(screen.getByLabelText('Loading')).toBeTruthy();
    expect(screen.queryByText('Loading order history...')).toBeNull();
  });

  it('an offline first load shows the shared error panel with the offline sentence and a retry', async () => {
    history.mockRejectedValueOnce(OFFLINE);
    await mount();
    expect(await screen.findByText("Couldn't load your order history")).toBeTruthy();
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();

    history.mockResolvedValueOnce([order('ORD-9')]);
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('ORD-9')).toBeTruthy();
  });

  it('a failed refresh keeps the rows and shows one muted line, which a good refresh removes', async () => {
    history.mockResolvedValueOnce([order('ORD-OLD')]);
    await mount();
    await screen.findByText('ORD-OLD');

    history.mockRejectedValueOnce(OFFLINE);
    await refresh();
    expect(screen.getByText('ORD-OLD')).toBeTruthy();
    expect(screen.getByText("Couldn't refresh. Pull down to try again.").props.accessibilityLiveRegion).toBe('polite');

    history.mockResolvedValueOnce([order('ORD-NEW')]);
    await refresh();
    expect(screen.queryByText("Couldn't refresh. Pull down to try again.")).toBeNull();
  });
  it('a server failure on the first load says something went wrong, not that the connection is down, and retry works', async () => {
    history.mockRejectedValueOnce({ status: 500, message: 'Server error' });
    await mount();
    expect(await screen.findByText("Couldn't load your order history")).toBeTruthy();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy();
    expect(screen.queryByText('Check your connection and try again.')).toBeNull();

    history.mockResolvedValueOnce([order('ORD-9')]);
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText('ORD-9')).toBeTruthy();
    expect(screen.queryByText("Couldn't load your order history")).toBeNull();
  });
});
