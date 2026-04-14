/**
 * Services Index
 * Main entry point for all services
 */

// Export configuration
export { API_CONFIG } from './config/api.config';
export type { ServiceName } from './config/api.config';

// Export types
export * from './types/api.types';

// Export utilities
export { TokenUtils } from './utils/token.utils';
export { ErrorUtils } from './utils/error.utils';

// Export API clients
export { BaseApiClient } from './clients/base-api.client';
export { UserApiClient } from './clients/user-api.client';
export { OrderApiClient } from './clients/order-api.client';
export { MenuApiClient } from './clients/menu-api.client';

// Export services
export { AuthenticationService } from './auth/authentication.service';
export { OrderService } from './order/order.service';
export { MenuService } from './menu/menu.service';

// Export hooks
export { useAuth } from './hooks/useAuth';

// Create singleton instances for easy use
import { AuthenticationService } from './auth/authentication.service';
import { OrderService } from './order/order.service';
import { MenuService } from './menu/menu.service';

// Singleton instances
export const authService = new AuthenticationService();
export const orderService = new OrderService();
export const menuService = new MenuService();

// Legacy API client for backward compatibility
import axios from 'axios';
import { API_CONFIG } from './config/api.config';

export const legacyApi = axios.create({
  baseURL: API_CONFIG.BASE_URLS.USER_SERVICE,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});
