import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BaseApiClient, setAuthExpiredHandler } from '../clients/base-api.client';
import { TokenUtils } from '../utils/token.utils';
import { API_CONFIG } from '../config/api.config';
import { resetStorage, secureStore } from './testUtils';

const REFRESH_URL = `${API_CONFIG.BASE_URLS.USER_SERVICE}/users/refresh-token`;

class TestClient extends BaseApiClient {
  constructor() {
    super('USER_SERVICE');
  }
  fetch(url: string) {
    return this.get(url);
  }
}

let refreshHttp: MockAdapter; // global axios: used by TokenUtils.refresh
let api: MockAdapter; // the client's own axios instance
let client: TestClient;
const onExpired = jest.fn();

beforeEach(async () => {
  await resetStorage();
  onExpired.mockClear();
  setAuthExpiredHandler(onExpired);
  refreshHttp = new MockAdapter(axios);
  client = new TestClient();
  api = new MockAdapter(client.getAxiosInstance());
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  refreshHttp.restore();
  setAuthExpiredHandler(null);
  jest.restoreAllMocks();
});

describe('request', () => {
  it('sends the saved access token as a Bearer header', async () => {
    await TokenUtils.saveTokens('tok', 'ref');
    api.onGet('/menu').reply(200, { ok: true });
    await client.fetch('/menu');
    expect(api.history.get[0].headers?.Authorization).toBe('Bearer tok');
  });

  it('sends no Authorization header when logged out', async () => {
    api.onGet('/public').reply(200, {});
    await client.fetch('/public');
    expect(api.history.get[0].headers?.Authorization).toBeUndefined();
  });
});

describe('401 handling', () => {
  it('renews the token and replays the request', async () => {
    await TokenUtils.saveTokens('expired', 'ref');
    refreshHttp.onPost(REFRESH_URL).reply(200, { access_token: 'fresh' });
    api.onGet('/orders').replyOnce(401).onGet('/orders').reply(200, { orders: [] });

    const res = await client.fetch('/orders');

    expect(res.data).toEqual({ orders: [] });
    expect(api.history.get).toHaveLength(2);
    expect(api.history.get[1].headers?.Authorization).toBe('Bearer fresh');
    expect(secureStore.get(API_CONFIG.STORAGE_KEYS.ACCESS_TOKEN)).toBe('fresh');
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('renews only once when several requests fail together', async () => {
    await TokenUtils.saveTokens('expired', 'ref');
    refreshHttp.onPost(REFRESH_URL).reply(200, { access_token: 'fresh' });
    api.onGet(/.*/).reply((config) =>
      config.headers?.Authorization === 'Bearer fresh' ? [200, {}] : [401],
    );

    await Promise.all([client.fetch('/a'), client.fetch('/b'), client.fetch('/c')]);

    expect(refreshHttp.history.post).toHaveLength(1);
  });

  it('logs out when the refresh token is rejected', async () => {
    await TokenUtils.saveTokens('expired', 'revoked');
    refreshHttp.onPost(REFRESH_URL).reply(401);
    api.onGet('/orders').reply(401);

    await expect(client.fetch('/orders')).rejects.toBeTruthy();

    expect(await TokenUtils.getAccessToken()).toBeNull();
    expect(await TokenUtils.getRefreshToken()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('logs out when there is no refresh token at all', async () => {
    await TokenUtils.saveAccessToken('expired');
    api.onGet('/orders').reply(401);
    await expect(client.fetch('/orders')).rejects.toBeTruthy();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when the refresh call fails on the network', async () => {
    await TokenUtils.saveTokens('expired', 'ref');
    refreshHttp.onPost(REFRESH_URL).networkError();
    api.onGet('/orders').reply(401);

    await expect(client.fetch('/orders')).rejects.toBeTruthy();

    expect(await TokenUtils.getRefreshToken()).toBe('ref');
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('does not loop forever if the retried request is still 401', async () => {
    await TokenUtils.saveTokens('expired', 'ref');
    refreshHttp.onPost(REFRESH_URL).reply(200, { access_token: 'fresh' });
    api.onGet('/orders').reply(401);

    await expect(client.fetch('/orders')).rejects.toBeTruthy();

    expect(api.history.get).toHaveLength(2); // original + exactly one retry
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('treats a 401 from /login as a wrong password, not an expired session', async () => {
    await TokenUtils.saveTokens('tok', 'ref');
    api.onGet('/users/login').reply(401);

    await expect(client.fetch('/users/login')).rejects.toBeTruthy();

    expect(refreshHttp.history.post).toHaveLength(0);
    expect(onExpired).not.toHaveBeenCalled();
    expect(await TokenUtils.getRefreshToken()).toBe('ref');
  });

  it('does not touch the session for non-401 errors', async () => {
    await TokenUtils.saveTokens('tok', 'ref');
    api.onGet('/boom').reply(500);
    await expect(client.fetch('/boom')).rejects.toBeTruthy();
    expect(onExpired).not.toHaveBeenCalled();
    expect(await TokenUtils.getAccessToken()).toBe('tok');
  });
});
