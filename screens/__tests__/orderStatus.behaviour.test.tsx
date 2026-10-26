import React from 'react';
import { Alert } from 'react-native';
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
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn(), router: { push: jest.fn() } }));

const orders = orderService as jest.Mocked<typeof orderService>;
const menu = menuService as jest.Mocked<typeof menuService>;

const PREPARING_NOTE = "Being prepared, so it can't be changed now";

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

const openCancelDialog = async () => {
  await fireEvent.press(await screen.findByLabelText('Cancel'));
  expect(screen.getByText('Keep Order')).toBeTruthy();
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  menu.getMealSessionItemsBySession.mockResolvedValue([
    { foodItem: { id: 1, name: 'String Hoppers', meal_type: 'veg', price: '300.00' } },
    { foodItem: { id: 2, name: 'Egg Hoppers', meal_type: 'non-veg', price: '320.00' } },
  ] as any);
});
afterEach(() => jest.restoreAllMocks());

describe('actions by status', () => {
  it('pending: Edit and Cancel, no note', async () => {
    await mount([order({ status: 'pending' })]);
    expect(await screen.findByLabelText('Edit')).toBeTruthy();
    expect(screen.getByLabelText('Cancel')).toBeTruthy();
    expect(screen.queryByText(PREPARING_NOTE)).toBeNull();
    expect(screen.queryByText('Arriving soon')).toBeNull();
  });

  it('preparing: chip and note, no buttons', async () => {
    await mount([order({ status: 'preparing' })]);
    expect(await screen.findByText('Preparing')).toBeTruthy();
    expect(screen.getByText(PREPARING_NOTE)).toBeTruthy();
    expect(screen.queryByLabelText('Edit')).toBeNull();
    expect(screen.queryByLabelText('Cancel')).toBeNull();
  });

  it('delivering: "On the way" chip and note, no buttons', async () => {
    await mount([order({ status: 'delivering' })]);
    expect(await screen.findByText('On the way')).toBeTruthy();
    expect(screen.getByText('Arriving soon')).toBeTruthy();
    expect(screen.queryByLabelText('Edit')).toBeNull();
    expect(screen.queryByLabelText('Cancel')).toBeNull();
  });

  it('delivered (defensive): neither buttons nor a note', async () => {
    await mount([order({ status: 'delivered' })]);
    expect(await screen.findByText('Breakfast')).toBeTruthy();
    expect(screen.queryByLabelText('Edit')).toBeNull();
    expect(screen.queryByLabelText('Cancel')).toBeNull();
    expect(screen.queryByText(PREPARING_NOTE)).toBeNull();
    expect(screen.queryByText('Arriving soon')).toBeNull();
  });
});

describe('cancelling', () => {
  it('a refused cancel closes the dialog, shows the server reason and reloads the list', async () => {
    const reason = 'Order cannot be deleted outside the meal session time window';
    orders.deleteOrder.mockRejectedValue({ status: 400, message: reason });
    await mount();
    await openCancelDialog();
    await fireEvent.press(screen.getByText('Yes, Cancel'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Could not cancel order', reason));
    expect(screen.queryByText('Keep Order')).toBeNull();
    expect(orders.getUndeliveredOrdersToday).toHaveBeenCalledTimes(2);
  });

  it('a rejection with no message falls back to "Please try again." and still closes the dialog', async () => {
    orders.deleteOrder.mockRejectedValue({});
    await mount();
    await openCancelDialog();
    await fireEvent.press(screen.getByText('Yes, Cancel'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Could not cancel order', 'Please try again.'));
    expect(screen.queryByText('Keep Order')).toBeNull();
  });

  it('a successful cancel says so, closes the dialog and reloads the list', async () => {
    orders.deleteOrder.mockResolvedValue(undefined as any);
    await mount();
    await openCancelDialog();
    await fireEvent.press(screen.getByText('Yes, Cancel'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Success', 'Order cancelled successfully'));
    expect(screen.queryByText('Keep Order')).toBeNull();
    expect(orders.getUndeliveredOrdersToday).toHaveBeenCalledTimes(2);
  });

  it('two quick presses of "Yes, Cancel" delete once', async () => {
    orders.deleteOrder.mockResolvedValue(undefined as any);
    await mount();
    await openCancelDialog();
    const yes = screen.getByText('Yes, Cancel');
    await fireEvent.press(yes);
    await fireEvent.press(yes);
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(orders.deleteOrder).toHaveBeenCalledTimes(1);
  });
});

describe('editing', () => {
  it('a refused save shows the server message and keeps the edit modal open', async () => {
    orders.updateOrder.mockRejectedValue({ message: 'Some items are no longer available' });
    await mount();
    await fireEvent.press(await screen.findByLabelText('Edit'));
    await fireEvent.press(await screen.findByText('Save Changes'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'Some items are no longer available'));
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });
});
