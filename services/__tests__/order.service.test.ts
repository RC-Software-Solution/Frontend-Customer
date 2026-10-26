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
