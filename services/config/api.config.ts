/**
 * API Configuration
 * Centralized configuration for all API endpoints and settings
 */

export const API_CONFIG = {
  // Base URLs for different services
  BASE_URLS: {
    USER_SERVICE: 'http://192.168.43.178:4001/api',
    ORDER_SERVICE: 'http://192.168.43.178:4002/api',
    MENU_SERVICE: 'http://192.168.43.178:4005/api',
    LOCATION_SERVICE: 'http://192.168.43.178:4004/api',
    DELIVERY_SERVICE: 'http://192.168.43.178:4006/api',
    PAYMENT_SERVICE: 'http://192.168.43.178:4007/api',
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
  },
} as const;

export type ServiceName = keyof typeof API_CONFIG.BASE_URLS;
