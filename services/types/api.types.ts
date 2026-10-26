/**
 * API Types
 * Common types and interfaces used across all services
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User related types
export interface User extends BaseEntity {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  role: 'customer' | 'admin' | 'super_admin' | 'delivery_person';
  is_verified: boolean;
  fcm_token?: string;
}

/** GET /users/notices: admin announcements; area_id null = sent to everyone */
export interface Notice {
  id: number | string; // BIGINT: mysql2 may return it as a string
  title: string;
  body: string;
  area_id: number | string | null;
  createdAt: string;
}

export interface NoticesResponse {
  notices: Notice[];
  total: number;
  limit: number;
  offset: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  fcm_token?: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface SignupRequest {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role?: 'customer';
  fcm_token?: string;
}

export interface SignupResponse {
  user: User;
  message: string;
}

// Order related types
export interface OrderItem {
  // Optional on create: used by order-service to map to session items
  food_item_id?: number;
  quantity: number;
  food_name: string;
  food_description: string;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
  meal_type: 'veg' | 'non-veg' | 'other';
  price: number;
}

export interface OrderItemUpdate {
  food_item_id: number;
  quantity: number;
}

export interface Order extends BaseEntity {
  order_id: string;
  customer_id: string;
  target_date?: string;
  items: OrderItem[];
  total_price: number;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'completed' | 'cancelled' | 'delivery_failed';
  payment_status?: 'pending' | 'paid' | 'unpaid' | 'ignored';
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  customer_id: string;
  items: OrderItem[];
  total_price: number;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
}

export interface UpdateOrderRequest {
  items: OrderItemUpdate[];
}

export interface GetOrdersRequest {
  type?: 'current' | 'pending' | 'completed' | 'all';
  meal_time?: 'breakfast' | 'lunch' | 'dinner';
  status?: string; // comma-separated values like "pending,preparing"
  payment_status?: 'pending' | 'paid' | 'unpaid' | 'ignored';
  date_range?: 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'custom';
  start_date?: string; // when date_range = 'custom'
  end_date?: string;   // when date_range = 'custom'
  page?: number;
  limit?: number;
}

// Common request/response types
export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  /** the 6-digit code from the email */
  code: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
  /** fresh tokens for this device; every other device is signed out */
  access_token?: string;
  refresh_token?: string;
}

// Menu related types
export interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: string;
  meal_type: 'veg' | 'non-veg' | 'other';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MealSession {
  id: number;
  date: string;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  sessionItems?: SessionItem[];
}

export interface SessionItem {
  id: number;
  meal_session_id: number;
  food_item_id: number;
  available_quantity: number;
  created_at: string;
  updated_at: string;
  foodItem?: FoodItem;
}

/** upcoming = not open yet, open = orderable now, closed = window over (computed by the server) */
export type SessionState = 'upcoming' | 'open' | 'closed';

export interface TodaySession {
  id: number;
  date: string;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
  start_time: string;
  end_time: string;
  state: SessionState;
  opens_at: string;
  closes_at: string;
  items: Array<{
    id: number;
    food_item_id: number;
    available_quantity: number | null;
    foodItem?: FoodItem;
  }>;
}

/** GET /meal-sessions/today: sessions dated today in Sri Lanka; null = nothing published for that meal */
export interface TodayMenu {
  date: string;
  now: string;
  sessions: Record<'breakfast' | 'lunch' | 'dinner', TodaySession | null>;
}

export interface CreateFoodItemRequest {
  name: string;
  description: string;
  price: number;
  meal_type: 'veg' | 'non-veg' | 'other';
  image_url?: string;
}

export interface UpdateFoodItemRequest {
  name?: string;
  description?: string;
  price?: number;
  meal_type?: 'veg' | 'non-veg' | 'other';
  image_url?: string;
}

export interface CreateMealSessionRequest {
  date: string;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
  start_time: string;
  end_time: string;
}

export interface UpdateMealSessionRequest {
  start_time?: string;
  end_time?: string;
}

export interface AddItemsToSessionRequest {
  food_items: Array<{
    food_item_id: number;
    available_quantity: number;
  }>;
}

export interface GetFoodItemsRequest {
  page?: number;
  limit?: number;
  meal_type?: 'veg' | 'non-veg' | 'other';
}

export interface GetMealSessionsRequest {
  page?: number;
  limit?: number;
  meal_time?: 'breakfast' | 'lunch' | 'dinner';
  date?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FoodItemsResponse {
  foodItems: FoodItem[];
  pagination: PaginationInfo;
}

export interface MealSessionsResponse {
  mealSessions: MealSession[];
  pagination: PaginationInfo;
}

export interface InventoryDecrementRequest {
  meal_session_id: number;
  food_item_id: number;
  quantity: number;
}

export interface InventoryIncrementRequest {
  meal_session_id: number;
  food_item_id: number;
  quantity: number;
}
