/**
 * API Configuration
 * Centralized configuration for all API endpoints and settings
 */

import Constants from 'expo-constants';

// Release builds get one https base (the API gateway) from eas.json. Expo inlines EXPO_PUBLIC_*
// at bundle time, so this must stay a literal `process.env.EXPO_PUBLIC_API_URL` read.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function releaseApiUrl(url: string | undefined): string {
  if (!url?.startsWith('https://')) {
    throw new Error('EXPO_PUBLIC_API_URL must be an https:// URL in a release build');
  }
  return url;
}

// Reuse the LAN IP the device already reached Metro on, so a new DHCP lease
// doesn't strand the app on a stale host. In tunnel mode hostUri is an
// *.exp.direct name that only proxies Metro's port, so ignore anything
// that isn't a literal IP and go straight to the LAN.
function devServiceUrl(port: number): string {
  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  const host = metroHost && /^\d{1,3}(\.\d{1,3}){3}$/.test(metroHost) ? metroHost : '127.0.0.1';
  return `http://${host}:${port}/api`;
}

// devServiceUrl is referenced only on the __DEV__ side, so the minifier drops it (and its
// 127.0.0.1) from release bundles; scripts/check-bundle.mjs verifies that.
const serviceUrl = (port: number) => (__DEV__ ? API_URL || devServiceUrl(port) : releaseApiUrl(API_URL));

export const API_CONFIG = {
  // Base URLs for different services
  BASE_URLS: {
    USER_SERVICE: serviceUrl(4001),
    ORDER_SERVICE: serviceUrl(4002),
    MENU_SERVICE: serviceUrl(4005),
  },
  
  // Common settings
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    INTRO_SEEN: 'has_seen_intro',
  },
} as const;

export type ServiceName = keyof typeof API_CONFIG.BASE_URLS;
