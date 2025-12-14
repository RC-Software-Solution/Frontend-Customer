/**
 * Order Service
 * Handles all order-related business logic and API calls
 */

import { OrderApiClient } from '../clients/order-api.client';
import { ErrorUtils } from '../utils/error.utils';
import { 
  Order, 
  CreateOrderRequest, 
  UpdateOrderRequest,
  GetOrdersRequest
} from '../types/api.types';

export class OrderService {
  private orderApiClient: OrderApiClient;

  constructor() {
    this.orderApiClient = new OrderApiClient();
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderRequest): Promise<{ order_id: string; message: string }> {
    try {
      // Validate order data
      this.validateOrderData(orderData);
      
      const result = await this.orderApiClient.createOrder(orderData);
      
      console.log('✅ Order created successfully:', result.order_id);
      return result;
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const order = await this.orderApiClient.getOrder(orderId);
      return order;
    } catch (error) {
      console.error('❌ Failed to get order:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get orders with filters
   */
  async getOrders(params: GetOrdersRequest = {}): Promise<Order[]> {
    try {
      const orders = await this.orderApiClient.getOrders(params);
      return orders;
    } catch (error) {
      console.error('❌ Failed to get orders:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get current orders (active orders)
   */
  async getCurrentOrders(mealTime?: 'breakfast' | 'lunch' | 'dinner'): Promise<Order[]> {
    try {
      const orders = await this.orderApiClient.getCurrentOrders(mealTime);
      return orders;
    } catch (error) {
      console.error('❌ Failed to get current orders:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get undelivered orders for today (pending, preparing)
   */
  async getUndeliveredOrdersToday(mealTime?: 'breakfast' | 'lunch' | 'dinner'): Promise<Order[]> {
    try {
      const params: GetOrdersRequest = {
        type: 'current',
        status: 'pending,preparing',
        date_range: 'today',
      };
      if (mealTime) params.meal_time = mealTime;
      const orders = await this.orderApiClient.getOrders(params);
      return orders;
    } catch (error) {
      console.error('❌ Failed to get undelivered orders:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get pending payment orders (unpaid orders) - all time, not just today
   */
  async getPendingPaymentOrders(): Promise<Order[]> {
    try {
      // Use backend 'pending' type which returns delivered + unpaid for the authenticated customer
      const params: GetOrdersRequest = { type: 'pending' };
      console.log('🔍 Fetching pending payment orders with params:', params);
      const orders = await this.orderApiClient.getOrders(params);
      console.log('📋 Received pending payment orders:', orders);
      return orders;
    } catch (error) {
      console.error('❌ Failed to get pending payment orders:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(mealTime?: 'breakfast' | 'lunch' | 'dinner'): Promise<Order[]> {
    try {
      const orders = await this.orderApiClient.getOrderHistory(mealTime);
      return orders;
    } catch (error) {
      console.error('❌ Failed to get order history:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, orderData: UpdateOrderRequest): Promise<{ message: string }> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      // Validate update data
      this.validateUpdateOrderData(orderData);

      const result = await this.orderApiClient.updateOrder(orderId, orderData);
      
      console.log('✅ Order updated successfully:', orderId);
      return result;
    } catch (error) {
      console.error('❌ Order update failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId: string): Promise<{ message: string }> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const result = await this.orderApiClient.deleteOrder(orderId);
      console.log('✅ Order deleted successfully:', orderId);
      return result;
    } catch (error) {
      console.error('❌ Order deletion failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Validate order data before creation
   */
  private validateOrderData(orderData: CreateOrderRequest): void {
    if (!orderData.customer_id) {
      throw new Error('Customer ID is required');
    }
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    if (orderData.total_price <= 0) {
      throw new Error('Total price must be greater than 0');
    }
    if (!orderData.meal_time) {
      throw new Error('Meal time is required');
    }

    // Validate each item
    orderData.items.forEach((item, index) => {
      if (!item.food_name) {
        throw new Error(`Item ${index + 1}: Food name is required`);
      }
      if (!item.food_description) {
        throw new Error(`Item ${index + 1}: Food description is required`);
      }
      if (!item.meal_time) {
        throw new Error(`Item ${index + 1}: Meal time is required`);
      }
      if (!item.meal_type) {
        throw new Error(`Item ${index + 1}: Meal type is required`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.price <= 0) {
        throw new Error(`Item ${index + 1}: Price must be greater than 0`);
      }
    });
  }

  /**
   * Validate order update data
   */
  private validateUpdateOrderData(orderData: UpdateOrderRequest): void {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Validate items
    orderData.items.forEach((item, index) => {
      if (!item.food_item_id || item.food_item_id <= 0) {
        throw new Error(`Item ${index + 1}: Valid food item ID is required`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
      }
    });
  }
}
