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
