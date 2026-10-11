import { ErrorUtils } from '../utils/error.utils';

describe('ErrorUtils.createApiError', () => {
  it('reads the server message from either "message" or "error"', () => {
    expect(ErrorUtils.createApiError({ response: { status: 400, data: { message: 'Bad one' } } }).message).toBe('Bad one');
    expect(ErrorUtils.createApiError({ response: { status: 400, data: { error: 'Invalid or expired code' } } }).message).toBe('Invalid or expired code');
  });

  it('keeps the HTTP status of a server error', () => {
    expect(ErrorUtils.createApiError({ response: { status: 429, data: { error: 'Too many attempts' } } })).toMatchObject({ status: 429 });
  });

  it('describes a request that got no response as a network error', () => {
    expect(ErrorUtils.createApiError({ request: {} })).toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('wraps an ordinary Error', () => {
    expect(ErrorUtils.createApiError(new Error('boom'))).toMatchObject({ message: 'boom', code: 'UNKNOWN_ERROR' });
  });

  it('is idempotent: wrapping an already-wrapped error keeps its status and code', () => {
    // the API client wraps once in the response interceptor and again in each request helper
    const once = ErrorUtils.createApiError({ response: { status: 400, data: { error: 'Invalid or expired code' } } });
    expect(ErrorUtils.createApiError(once)).toEqual(once);

    const network = ErrorUtils.createApiError({ request: {} });
    expect(ErrorUtils.createApiError(network)).toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });
});
