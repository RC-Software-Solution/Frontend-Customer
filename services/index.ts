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
export { useAuth, AuthProvider } from './hooks/useAuth';

// Singleton instances
export { authService, orderService, menuService } from './instances';
