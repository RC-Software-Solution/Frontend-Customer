import { releaseApiUrl } from '../config/api.config';

describe('releaseApiUrl', () => {
  it('accepts an https URL', () => {
    expect(releaseApiUrl('https://api.example.com/api')).toBe('https://api.example.com/api');
  });

  it.each([undefined, '', 'http://api.example.com/api', 'http://192.168.1.5:4001/api'])('refuses %p', (url) => {
    expect(() => releaseApiUrl(url)).toThrow('EXPO_PUBLIC_API_URL must be an https:// URL in a release build');
  });
});

describe('dev service URLs', () => {
  const saved = process.env.EXPO_PUBLIC_API_URL;
  afterEach(() => {
    if (saved === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = saved;
  });

  it('fall back to the dev services when EXPO_PUBLIC_API_URL is set but empty', () => {
    expect(__DEV__).toBe(true);
    process.env.EXPO_PUBLIC_API_URL = '';
    jest.isolateModules(() => {
      const { API_CONFIG } = require('../config/api.config');
      expect(API_CONFIG.BASE_URLS.USER_SERVICE).toMatch(/^http:\/\/.*:4001\/api$/);
    });
  });
});
