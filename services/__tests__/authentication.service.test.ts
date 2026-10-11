import { AuthenticationService } from '../auth/authentication.service';
import { TokenUtils } from '../utils/token.utils';
import { resetStorage } from './testUtils';

const mockApi = { login: jest.fn(), logout: jest.fn(), getProfile: jest.fn(), changePassword: jest.fn(), resetPassword: jest.fn(), updateProfile: jest.fn() };
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

describe('changePassword', () => {
  it('keeps this device signed in with the fresh tokens the server returns', async () => {
    await TokenUtils.saveTokens('old-access', 'old-refresh');
    mockApi.changePassword.mockResolvedValue({ message: 'ok', access_token: 'new-access', refresh_token: 'new-refresh' });
    await svc.changePassword('old', 'brand-new');
    expect(mockApi.changePassword).toHaveBeenCalledWith('old', 'brand-new');
    expect(await TokenUtils.getAccessToken()).toBe('new-access');
    expect(await TokenUtils.getRefreshToken()).toBe('new-refresh');
  });

  it('leaves the tokens alone if the server returns none', async () => {
    await TokenUtils.saveTokens('old-access', 'old-refresh');
    mockApi.changePassword.mockResolvedValue({ message: 'ok' });
    await svc.changePassword('old', 'brand-new');
    expect(await TokenUtils.getRefreshToken()).toBe('old-refresh');
  });

  it('passes the server message up when the current password is wrong, without touching the session', async () => {
    await TokenUtils.saveTokens('a', 'r');
    mockApi.changePassword.mockRejectedValue({ message: 'Current password is incorrect', status: 400 });
    await expect(svc.changePassword('bad', 'brand-new')).rejects.toMatchObject({ message: 'Current password is incorrect' });
    expect(await TokenUtils.getRefreshToken()).toBe('r');
  });
});

describe('resetPassword', () => {
  it('sends the email, the code and the new password', async () => {
    mockApi.resetPassword.mockResolvedValue({ message: 'ok' });
    await svc.resetPassword('a@x.com', '123456', 'brand-new');
    expect(mockApi.resetPassword).toHaveBeenCalledWith({ email: 'a@x.com', code: '123456', new_password: 'brand-new' });
  });
});

describe('updateProfile', () => {
  it('caches the updated user so the app shows the new details straight away', async () => {
    await TokenUtils.saveTokens('a', 'r');
    const updated = { id: 7, full_name: 'New Name', email: 'a@x.com', role: 'customer' };
    mockApi.updateProfile.mockResolvedValue(updated);
    await svc.updateProfile({ full_name: 'New Name' });
    expect(await svc.getCurrentUser()).toEqual(updated);
  });
});
