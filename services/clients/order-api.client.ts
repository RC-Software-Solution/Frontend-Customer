/**
 * Order API Client
 * Handles all order-related API calls
 */

import { BaseApiClient } from './base-api.client';
import { 
  Order, 
  CreateOrderRequest, 
  UpdateOrderRequest,
  GetOrdersRequest
} from '../types/api.types';

export class OrderApiClient extends BaseApiClient {
  constructor() {
    super('ORDER_SERVICE');
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderRequest): Promise<{ order_id: string; message: string }> {
    const response = await this.post<{ order_id: string; message: string }>('/orders', orderData);
    return response.data;
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await this.get<Order>(`/orders/${orderId}`);
    return response.data;
  }

  /**
   * Get orders with filters
   */
  async getOrders(params: GetOrdersRequest = {}): Promise<Order[]> {
    const queryParams = new URLSearchParams();
    
    if (params.type) queryParams.append('type', params.type);
    if (params.meal_time) queryParams.append('meal_time', params.meal_time);
    if (params.status) queryParams.append('status', params.status);
    if (params.date_range) queryParams.append('date_range', params.date_range);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.page) {
      // Convert page to offset (page 1 = offset 0, page 2 = offset 10, etc.)
      const limit = params.limit || 10;
      const offset = (params.page - 1) * limit;
      queryParams.append('offset', offset.toString());
    }
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/orders?${queryString}` : '/orders';
    
    const response = await this.get<{ orders: any[]; limit?: number; offset?: number; message?: string }>(url);
    const raw = Array.isArray((response.data as any)?.orders) ? (response.data as any).orders : [];
    // Map backend shape -> frontend Order shape
    const mapped: Order[] = raw.map((o: any) => ({
      id: o.id,
      created_at: o.created_at,
      updated_at: o.updated_at,
      order_id: o.id,
      customer_id: o.customer_id,
      target_date: o.target_date,
      items: Array.isArray(o.order_items) ? o.order_items.map((it: any) => ({
        food_item_id: it.food_item_id, // may be undefined; backend stores names; keep optional
        quantity: it.quantity,
        food_name: it.food_name,
        food_description: it.food_description,
        meal_time: o.meal_time,
        meal_type: it.meal_type,
        price: Number(it.price),
      })) : [],
      total_price: Number(o.total_price),
      meal_time: o.meal_time,
      status: o.status,
    }));
    return mapped;
  }

  /**
   * Get current orders (active orders)
   */
  async getCurrentOrders(mealTime?: 'breakfast' | 'lunch' | 'dinner'): Promise<Order[]> {
    const params: GetOrdersRequest = { type: 'current' };
    if (mealTime) params.meal_time = mealTime;
    
    return this.getOrders(params);
  }

  /**
   * Get order history
   */
  async getOrderHistory(mealTime?: 'breakfast' | 'lunch' | 'dinner'): Promise<Order[]> {
    const params: GetOrdersRequest = { type: 'history' };
    if (mealTime) params.meal_time = mealTime;
    
    return this.getOrders(params);
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, orderData: UpdateOrderRequest): Promise<{ message: string }> {
    const response = await this.put<{ message: string }>(`/orders/${orderId}`, orderData);
    return response.data;
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId: string): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>(`/orders/${orderId}`);
    return response.data;
  }
}
