import MockAdapter from 'axios-mock-adapter';
import { UserApiClient } from '../clients/user-api.client';
import { resetStorage } from './testUtils';

let client: UserApiClient;
let api: MockAdapter;

beforeEach(async () => {
  await resetStorage();
  client = new UserApiClient();
  api = new MockAdapter(client.getAxiosInstance());
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

const sent = (method: 'post' | 'put') => JSON.parse(api.history[method][0].data);

describe('what the app sends to the server (field names the server really reads)', () => {
  it('forgot password asks for the mobile 6-digit code', async () => {
    api.onPost('/users/forgot-password').reply(200, { message: 'sent' });
    await client.forgotPassword({ email: 'a@x.com' });
    expect(sent('post')).toEqual({ email: 'a@x.com', client: 'mobile' });
  });

  it('reset password sends email, code and newPassword (camelCase, as the server expects)', async () => {
    api.onPost('/users/reset-password').reply(200, { message: 'ok' });
    await client.resetPassword({ email: 'a@x.com', code: '123456', new_password: 'Brand-new-1' });
    expect(sent('post')).toEqual({ email: 'a@x.com', code: '123456', newPassword: 'Brand-new-1' });
  });

  it('change password sends current_password and new_password and returns the fresh tokens', async () => {
    api.onPost('/users/change-password').reply(200, { message: 'ok', access_token: 'a', refresh_token: 'r' });
    const r = await client.changePassword('old', 'new-pass');
    expect(sent('post')).toEqual({ current_password: 'old', new_password: 'new-pass' });
    expect(r).toMatchObject({ access_token: 'a', refresh_token: 'r' });
  });

  it('update profile PUTs the editable fields to /users/profile', async () => {
    api.onPut('/users/profile').reply(200, { id: '1', full_name: 'New Name' });
    const r = await client.updateProfile({ full_name: 'New Name', phone: '0771234567' });
    expect(sent('put')).toEqual({ full_name: 'New Name', phone: '0771234567' });
    expect(r.full_name).toBe('New Name');
  });

  it('a server validation message reaches the caller as the error message', async () => {
    api.onPost('/users/reset-password').reply(400, { error: 'Invalid or expired code' });
    await expect(client.resetPassword({ email: 'a@x.com', code: '000000', new_password: 'Brand-new-1' })).rejects.toMatchObject({
      message: 'Invalid or expired code',
      status: 400,
    });
  });
});
