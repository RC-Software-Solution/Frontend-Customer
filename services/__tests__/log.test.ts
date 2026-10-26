import { logApiError } from '../utils/log';

let warn: jest.SpyInstance;
let err: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  err = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('logApiError', () => {
  it('logs an expected 4xx refusal at warn level, never as an error', () => {
    const e = { status: 400, message: 'm' };
    logApiError('x', e);
    expect(warn).toHaveBeenCalledWith('x', e);
    expect(err).not.toHaveBeenCalled();
  });

  it('logs a network failure at warn level', () => {
    logApiError('x', { status: 0, code: 'NETWORK_ERROR' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(err).not.toHaveBeenCalled();
  });

  it('logs a 403 at warn level', () => {
    logApiError('x', { status: 403 });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(err).not.toHaveBeenCalled();
  });

  it.each([
    ['a 500', { status: 500 }],
    ['a plain Error', new Error('boom')],
    ['undefined', undefined],
  ])('logs %s at error level', (_name, e) => {
    logApiError('x', e);
    expect(err).toHaveBeenCalledWith('x', e);
    expect(warn).not.toHaveBeenCalled();
  });
});
