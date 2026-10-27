import { releaseApiUrl } from '../config/api.config';

describe('releaseApiUrl', () => {
  it('accepts an https URL', () => {
    expect(releaseApiUrl('https://api.example.com/api')).toBe('https://api.example.com/api');
  });

  it.each([undefined, '', 'http://api.example.com/api', 'http://192.168.1.5:4001/api'])('refuses %p', (url) => {
    expect(() => releaseApiUrl(url)).toThrow('EXPO_PUBLIC_API_URL must be an https:// URL in a release build');
  });
});
