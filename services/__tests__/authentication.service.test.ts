import { AuthenticationService } from '../auth/authentication.service';
import { TokenUtils } from '../utils/token.utils';
import { resetStorage } from './testUtils';

const mockApi = { login: jest.fn(), logout: jest.fn(), getProfile: jest.fn() };
jest.mock('../clients/user-api.client', () => ({ UserApiClient: jest.fn(() => mockApi) }));

const user = { id: 7, full_name: 'A', email: 'a@x.com', role: 'customer' };
let svc: AuthenticationService;

beforeEach(async () => {
  await resetStorage();
  Object.values(mockApi).forEach((f) => f.mockReset());
  svc = new AuthenticationService();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('login', () => {
  it('saves both tokens and caches the user', async () => {
    mockApi.login.mockResolvedValue({ access_token: 'a', refresh_token: 'r', user });
    await svc.login({ email: 'a@x.com', password: 'pw' });
    expect(await TokenUtils.getAccessToken()).toBe('a');
    expect(await TokenUtils.getRefreshToken()).toBe('r');
    expect(await svc.getCurrentUser()).toEqual(user);
  });
});

describe('logout', () => {
  beforeEach(async () => {
    mockApi.login.mockResolvedValue({ access_token: 'a', refresh_token: 'r', user });
    await svc.login({ email: 'a@x.com', password: 'pw' });
  });

  it('tells the server and clears the local session', async () => {
    mockApi.logout.mockResolvedValue({ message: 'ok' });
    await svc.logout();
    expect(mockApi.logout).toHaveBeenCalledTimes(1);
    expect(await TokenUtils.getAccessToken()).toBeNull();
    expect(await TokenUtils.getRefreshToken()).toBeNull();
    expect(await svc.getCurrentUser()).toBeNull();
  });

  it('still clears the local session when the server call fails', async () => {
    mockApi.logout.mockRejectedValue(new Error('offline'));
    await expect(svc.logout()).resolves.toBeUndefined();
    expect(await TokenUtils.getRefreshToken()).toBeNull();
  });
});

describe('refreshAccessToken', () => {
  beforeEach(async () => {
    await TokenUtils.saveTokens('a', 'r');
  });

  it('returns true when a new token was issued', async () => {
    jest.spyOn(TokenUtils, 'refresh').mockResolvedValue('new');
    expect(await svc.refreshAccessToken()).toBe(true);
    expect(await TokenUtils.getRefreshToken()).toBe('r');
  });

  it('ends the session when the server rejects the refresh token', async () => {
    jest.spyOn(TokenUtils, 'refresh').mockResolvedValue(null);
    expect(await svc.refreshAccessToken()).toBe(false);
    expect(await TokenUtils.getRefreshToken()).toBeNull();
  });

  it('keeps the session on a network error', async () => {
    jest.spyOn(TokenUtils, 'refresh').mockRejectedValue(new Error('network'));
    expect(await svc.refreshAccessToken()).toBe(false);
    expect(await TokenUtils.getRefreshToken()).toBe('r');
  });
});
