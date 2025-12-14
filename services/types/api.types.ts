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
  role: 'customer' | 'admin' | 'delivery';
  is_verified: boolean;
  fcm_token?: string;
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
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
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
  type?: 'current' | 'history' | 'all' | 'pending';
  meal_time?: 'breakfast' | 'lunch' | 'dinner';
  status?: string; // comma-separated values like "pending,preparing"
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
  token: string;
  new_password: string;
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
