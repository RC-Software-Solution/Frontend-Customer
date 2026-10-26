import { OrderService } from '../order/order.service';

const mockGetOrders = jest.fn();
jest.mock('../clients/order-api.client', () => ({
  OrderApiClient: jest.fn().mockImplementation(() => ({ getOrders: mockGetOrders })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockGetOrders.mockResolvedValue([]);
});
afterEach(() => jest.restoreAllMocks());

describe('getUndeliveredOrdersToday', () => {
  it('asks for pending, preparing and delivering orders created today', async () => {
    await new OrderService().getUndeliveredOrdersToday();
    expect(mockGetOrders).toHaveBeenCalledWith({
      type: 'current',
      status: 'pending,preparing,delivering',
      date_range: 'today',
    });
  });

  it('adds the meal time when one is given', async () => {
    await new OrderService().getUndeliveredOrdersToday('lunch');
    expect(mockGetOrders).toHaveBeenCalledWith({
      type: 'current',
      status: 'pending,preparing,delivering',
      date_range: 'today',
      meal_time: 'lunch',
    });
  });
});

describe('getPendingPaymentOrders', () => {
  it('asks for every unpaid order of any status, the same set checkout counts', async () => {
    await new OrderService().getPendingPaymentOrders();
    expect(mockGetOrders).toHaveBeenCalledTimes(1);
    expect(mockGetOrders).toHaveBeenCalledWith({ type: 'all', payment_status: 'unpaid', limit: 50 });
  });
});

describe('getOrderHistory', () => {
  it('pages type "all" with the page and limit it is given', async () => {
    await new OrderService().getOrderHistory(2, 20);
    expect(mockGetOrders).toHaveBeenCalledTimes(1);
    expect(mockGetOrders).toHaveBeenCalledWith({ type: 'all', page: 2, limit: 20 });
  });

  it('defaults to page 1, 20 a page', async () => {
    await new OrderService().getOrderHistory();
    expect(mockGetOrders).toHaveBeenCalledWith({ type: 'all', page: 1, limit: 20 });
  });
});

describe('createOrder logging', () => {
  const validOrder: any = {
    customer_id: 'u1',
    total_price: 300,
    meal_time: 'breakfast',
    items: [{ food_item_id: 1, quantity: 1, food_name: 'Hoppers', food_description: 'd', meal_time: 'breakfast', meal_type: 'veg', price: 300 }],
  };
  const withCreateRejecting = (error: any) => {
    const { OrderApiClient } = require('../clients/order-api.client');
    (OrderApiClient as jest.Mock).mockImplementationOnce(() => ({ createOrder: jest.fn().mockRejectedValue(error) }));
  };

  it('an expected 4xx refusal keeps its message and status and logs at warn level, not error', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    withCreateRejecting({ status: 400, message: 'Customer area not found' });
    await expect(new OrderService().createOrder(validOrder)).rejects.toMatchObject({ status: 400, message: 'Customer area not found' });
    expect(warn).toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('a 500 still logs at error level', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    withCreateRejecting({ status: 500, message: 'Server error' });
    await expect(new OrderService().createOrder(validOrder)).rejects.toMatchObject({ status: 500 });
    expect(console.error).toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
