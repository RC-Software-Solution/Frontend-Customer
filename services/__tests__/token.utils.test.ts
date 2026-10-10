import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenUtils } from '../utils/token.utils';
import { API_CONFIG } from '../config/api.config';
import { makeJwt, resetStorage, secureStore } from './testUtils';

const { ACCESS_TOKEN, REFRESH_TOKEN } = API_CONFIG.STORAGE_KEYS;
const REFRESH_URL = `${API_CONFIG.BASE_URLS.USER_SERVICE}/users/refresh-token`;

let http: MockAdapter;
beforeEach(async () => {
  http = new MockAdapter(axios);
  await resetStorage();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  http.restore();
  jest.restoreAllMocks();
});

describe('isTokenExpired', () => {
  it('is false for a token that expires in the future', () => {
    expect(TokenUtils.isTokenExpired(makeJwt(60))).toBe(false);
  });
  it('is true for an expired token', () => {
    expect(TokenUtils.isTokenExpired(makeJwt(-1))).toBe(true);
  });
  it('treats garbage as expired', () => {
    expect(TokenUtils.isTokenExpired('not-a-jwt')).toBe(true);
  });
});

describe('storage', () => {
  it('saves tokens in SecureStore, not AsyncStorage', async () => {
    await TokenUtils.saveTokens('a', 'r');
    expect(secureStore.get(ACCESS_TOKEN)).toBe('a');
    expect(secureStore.get(REFRESH_TOKEN)).toBe('r');
    expect(await AsyncStorage.getItem(ACCESS_TOKEN)).toBeNull();
  });

  it('migrates a token saved by an older version out of AsyncStorage', async () => {
    await AsyncStorage.setItem(ACCESS_TOKEN, 'legacy');
    expect(await TokenUtils.getAccessToken()).toBe('legacy');
    expect(secureStore.get(ACCESS_TOKEN)).toBe('legacy');
    expect(await AsyncStorage.getItem(ACCESS_TOKEN)).toBeNull();
  });

  it('clearTokens wipes both stores', async () => {
    await TokenUtils.saveTokens('a', 'r');
    await AsyncStorage.setItem(ACCESS_TOKEN, 'old');
    await TokenUtils.clearTokens();
    expect(await TokenUtils.getAccessToken()).toBeNull();
    expect(await TokenUtils.getRefreshToken()).toBeNull();
  });

  it('isAuthenticated reflects token validity', async () => {
    expect(await TokenUtils.isAuthenticated()).toBe(false);
    await TokenUtils.saveAccessToken(makeJwt(-5));
    expect(await TokenUtils.isAuthenticated()).toBe(false);
    await TokenUtils.saveAccessToken(makeJwt(60));
    expect(await TokenUtils.isAuthenticated()).toBe(true);
  });
});

describe('refresh', () => {
  it('returns null without calling the server when there is no refresh token', async () => {
    expect(await TokenUtils.refresh()).toBeNull();
    expect(http.history.post).toHaveLength(0);
  });

  it('saves the new access token and keeps the existing refresh token', async () => {
    await TokenUtils.saveTokens('old', 'refresh-1');
    http.onPost(REFRESH_URL).reply(200, { access_token: 'new' });

    expect(await TokenUtils.refresh()).toBe('new');
    expect(secureStore.get(ACCESS_TOKEN)).toBe('new');
    expect(secureStore.get(REFRESH_TOKEN)).toBe('refresh-1');
    expect(JSON.parse(http.history.post[0].data)).toEqual({ refresh_token: 'refresh-1' });
  });

  it('stores a rotated refresh token when the server sends one', async () => {
    await TokenUtils.saveTokens('old', 'refresh-1');
    http.onPost(REFRESH_URL).reply(200, { access_token: 'new', refresh_token: 'refresh-2' });
    await TokenUtils.refresh();
    expect(secureStore.get(REFRESH_TOKEN)).toBe('refresh-2');
  });

  it('returns null when the server rejects the refresh token', async () => {
    await TokenUtils.saveTokens('old', 'revoked');
    http.onPost(REFRESH_URL).reply(401, { message: 'Invalid or revoked refresh token' });
    expect(await TokenUtils.refresh()).toBeNull();
  });

  it('throws on a network error so callers can keep the session', async () => {
    await TokenUtils.saveTokens('old', 'refresh-1');
    http.onPost(REFRESH_URL).networkError();
    await expect(TokenUtils.refresh()).rejects.toBeTruthy();
    expect(secureStore.get(REFRESH_TOKEN)).toBe('refresh-1');
  });

  it('runs only one request when called several times at once', async () => {
    await TokenUtils.saveTokens('old', 'refresh-1');
    http.onPost(REFRESH_URL).reply(200, { access_token: 'new' });

    const results = await Promise.all([TokenUtils.refresh(), TokenUtils.refresh(), TokenUtils.refresh()]);

    expect(results).toEqual(['new', 'new', 'new']);
    expect(http.history.post).toHaveLength(1);
  });

  it('allows a fresh refresh after the previous one finished', async () => {
    await TokenUtils.saveTokens('old', 'refresh-1');
    http.onPost(REFRESH_URL).reply(200, { access_token: 'new' });
    await TokenUtils.refresh();
    await TokenUtils.refresh();
    expect(http.history.post).toHaveLength(2);
  });
});
