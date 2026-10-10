// Singleton instances (kept out of index.ts so hooks can import them without a require cycle)
import { AuthenticationService } from './auth/authentication.service';
import { OrderService } from './order/order.service';
import { MenuService } from './menu/menu.service';

export const authService = new AuthenticationService();
export const orderService = new OrderService();
export const menuService = new MenuService();
