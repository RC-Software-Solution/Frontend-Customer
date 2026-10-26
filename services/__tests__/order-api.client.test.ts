import MockAdapter from 'axios-mock-adapter';
import { OrderApiClient } from '../clients/order-api.client';
import { resetStorage } from './testUtils';

let client: OrderApiClient;
let api: MockAdapter;

beforeEach(async () => {
  await resetStorage();
  client = new OrderApiClient();
  api = new MockAdapter(client.getAxiosInstance());
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

const query = () => new URLSearchParams(api.history.get[0].url!.split('?')[1]);

const row = (over: Record<string, any> = {}) => ({
  id: 'ORD-1',
  customer_id: 'u1',
  target_date: '2026-10-26',
  meal_time: 'lunch',
  status: 'delivery_failed',
  total_price: '250.00',
  created_at: '2026-10-20T08:00:00.000Z',
  updated_at: '2026-10-20T08:00:00.000Z',
  order_items: [{ food_name: 'Rice', quantity: 1, price: '250.00', meal_type: 'rice' }],
  ...over,
});

describe('what getOrders sends', () => {
  it('forwards payment_status next to type and limit', async () => {
    api.onGet(/\/orders/).reply(200, { orders: [] });
    await client.getOrders({ type: 'all', payment_status: 'unpaid', limit: 50 });
    expect(api.history.get[0].url).toMatch(/^\/orders\?/);
    const q = query();
    expect(q.get('type')).toBe('all');
    expect(q.get('payment_status')).toBe('unpaid');
    expect(q.get('limit')).toBe('50');
  });

  it('turns page 2 of 20 into offset=20&limit=20', async () => {
    api.onGet(/\/orders/).reply(200, { orders: [] });
    await client.getOrders({ type: 'all', page: 2, limit: 20 });
    const q = query();
    expect(q.get('offset')).toBe('20');
    expect(q.get('limit')).toBe('20');
  });
});

describe('what getOrders returns', () => {
  it('keeps payment_status and failure_reason on the mapped order', async () => {
    api.onGet(/\/orders/).reply(200, {
      orders: [row({ payment_status: 'unpaid', failure_reason: 'Nobody home' })],
    });
    const [o] = await client.getOrders({ type: 'all' });
    expect(o).toMatchObject({ order_id: 'ORD-1', status: 'delivery_failed', payment_status: 'unpaid', failure_reason: 'Nobody home' });
  });

  it('maps a row without them to undefined instead of crashing', async () => {
    api.onGet(/\/orders/).reply(200, { orders: [row()] });
    const [o] = await client.getOrders({ type: 'all' });
    expect(o.payment_status).toBeUndefined();
    expect(o.failure_reason).toBeUndefined();
  });

  it('maps a null failure_reason to undefined', async () => {
    api.onGet(/\/orders/).reply(200, { orders: [row({ payment_status: 'paid', failure_reason: null })] });
    const [o] = await client.getOrders({ type: 'all' });
    expect(o.failure_reason).toBeUndefined();
  });
});

describe('order history paging', () => {
  it('getOrders type all, page 2 of 20 sends type=all&offset=20&limit=20', async () => {
    api.onGet(/\/orders/).reply(200, { orders: [] });
    await client.getOrders({ type: 'all', page: 2, limit: 20 });
    expect(api.history.get[0].url).toBe('/orders?type=all&offset=20&limit=20');
  });
});
