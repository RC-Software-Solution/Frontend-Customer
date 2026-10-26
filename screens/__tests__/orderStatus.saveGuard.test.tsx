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


const openEdit = async () => {
  await fireEvent.press(await screen.findByLabelText('Edit'));
  return screen.findByRole('button', { name: 'Save Changes' });
};

describe.each([
  ['updateOrder', () => orders.updateOrder, () => {}],
  ['deleteOrder (all items removed)', () => orders.deleteOrder, () => menu.getMealSessionItemsBySession.mockResolvedValue([] as any)],
])('Save Changes in-flight guard via %s', (_name, svc, setup) => {
  beforeEach(() => setup());

  it('two un-awaited presses while the call is pending make one call', async () => {
    svc().mockReturnValue(new Promise(() => {}) as any);
    await render(<OrderStatus />);
    const save = await openEdit();
    await act(async () => {
      fireEvent.press(save);
      fireEvent.press(save);
    });
    expect(svc()).toHaveBeenCalledTimes(1);
  });

  it('resets after resolve', async () => {
    svc().mockResolvedValue({} as any);
    await render(<OrderStatus />);
    await fireEvent.press(await openEdit());
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledTimes(1));
    await act(async () => {});
    await fireEvent.press(await openEdit()); // success closed the modal; reopen and save again
    await waitFor(() => expect(svc()).toHaveBeenCalledTimes(2));
  });

  it('resets after reject', async () => {
    svc().mockRejectedValue({ message: 'nope' });
    await render(<OrderStatus />);
    const save = await openEdit();
    await fireEvent.press(save);
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'nope'));
    await act(async () => {});
    await fireEvent.press(save);
    await waitFor(() => expect(svc()).toHaveBeenCalledTimes(2));
  });
});
