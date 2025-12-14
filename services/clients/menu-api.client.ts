/**
 * Menu API Client
 * Handles all menu-related API calls
 */

import { BaseApiClient } from './base-api.client';
import { 
  FoodItem,
  MealSession,
  SessionItem,
  CreateFoodItemRequest,
  UpdateFoodItemRequest,
  CreateMealSessionRequest,
  UpdateMealSessionRequest,
  AddItemsToSessionRequest,
  GetFoodItemsRequest,
  GetMealSessionsRequest,
  FoodItemsResponse,
  MealSessionsResponse,
  InventoryDecrementRequest,
  InventoryIncrementRequest
} from '../types/api.types';

export class MenuApiClient extends BaseApiClient {
  constructor() {
    super('MENU_SERVICE');
  }

  // Food Items API
  /**
   * Get all food items
   */
  async getFoodItems(params: GetFoodItemsRequest = {}): Promise<FoodItemsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.meal_type) queryParams.append('meal_type', params.meal_type);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/food-items?${queryString}` : '/food-items';
    
    const response = await this.get<FoodItemsResponse>(url);
    // The response structure is nested: response.data.data contains the actual data
    return response.data;
  }

  /**
   * Get single food item
   */
  async getFoodItem(id: number): Promise<FoodItem> {
    const response = await this.get<FoodItem>(`/food-items/${id}`);
    return response.data;
  }

  /**
   * Create food item
   */
  async createFoodItem(foodItemData: CreateFoodItemRequest): Promise<FoodItem> {
    const response = await this.post<FoodItem>('/food-items', foodItemData);
    return response.data;
  }

  /**
   * Update food item
   */
  async updateFoodItem(id: number, foodItemData: UpdateFoodItemRequest): Promise<FoodItem> {
    const response = await this.put<FoodItem>(`/food-items/${id}`, foodItemData);
    return response.data;
  }

  /**
   * Delete food item
   */
  async deleteFoodItem(id: number): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>(`/food-items/${id}`);
    return response.data;
  }

  // Meal Sessions API
  /**
   * Get all meal sessions
   */
  async getMealSessions(params: GetMealSessionsRequest = {}): Promise<MealSessionsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.meal_time) queryParams.append('meal_time', params.meal_time);
    if (params.date) queryParams.append('date', params.date);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/meal-sessions?${queryString}` : '/meal-sessions';
    
    console.log(`🌐 [API_CLIENT] GET ${url} with params:`, JSON.stringify(params, null, 2));
    const response = await this.get<any>(url);
    console.log(`🌐 [API_CLIENT] Response received:`, JSON.stringify(response, null, 2));
    // Return the raw axios-like object { data: { success, data: { mealSessions... } } }
    return response;
  }

  /**
   * Get single meal session
   */
  async getMealSession(id: number): Promise<MealSession> {
    const response = await this.get<MealSession>(`/meal-sessions/${id}`);
    return response.data;
  }

  /**
   * Create meal session
   */
  async createMealSession(sessionData: CreateMealSessionRequest): Promise<MealSession> {
    const response = await this.post<MealSession>('/meal-sessions', sessionData);
    return response.data;
  }

  /**
   * Update meal session
   */
  async updateMealSession(id: number, sessionData: UpdateMealSessionRequest): Promise<MealSession> {
    const response = await this.put<MealSession>(`/meal-sessions/${id}`, sessionData);
    return response.data;
  }

  /**
   * Delete meal session
   */
  async deleteMealSession(id: number): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>(`/meal-sessions/${id}`);
    return response.data;
  }

  /**
   * Add items to meal session
   */
  async addItemsToSession(sessionId: number, itemsData: AddItemsToSessionRequest): Promise<SessionItem[]> {
    const response = await this.post<SessionItem[]>(`/meal-sessions/${sessionId}/items`, itemsData);
    return response.data;
  }

  // Session Items API
  /**
   * Get items for a session
   */
  async getSessionItems(sessionId: number): Promise<SessionItem[]> {
    const response = await this.get<SessionItem[]>(`/meal-session-items/${sessionId}`);
    return response.data;
  }

  /**
   * Get meal session items by meal_time and date via by-session endpoint
   * Example: /meal-session-items/by-session?meal_time=dinner&date=2025-10-05&check_availability=true
   */
  async getSessionItemsByMealTimeAndDate(
    mealTime: string,
    date: string,
    checkAvailability: boolean = true
  ): Promise<any[]> {
    const query = new URLSearchParams();
    query.append('meal_time', mealTime);
    query.append('date', date);
    if (checkAvailability) query.append('check_availability', 'true');

    const url = `/meal-session-items/by-session?${query.toString()}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localNow = new Date();
    const yyyy = localNow.getFullYear();
    const mm = String(localNow.getMonth() + 1).padStart(2, '0');
    const dd = String(localNow.getDate()).padStart(2, '0');
    const hh = String(localNow.getHours()).padStart(2, '0');
    const mi = String(localNow.getMinutes()).padStart(2, '0');
    const ss = String(localNow.getSeconds()).padStart(2, '0');
    const localStamp = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    console.log(`🌐 [API_CLIENT] GET ${url} | local ${tz} now=${localStamp}`);
    try {
      const response = await this.get<{ success: boolean; data: any[] }>(url);
      const items = (response?.data as any)?.data || [];
      const localNow2 = new Date();
      const hh2 = String(localNow2.getHours()).padStart(2, '0');
      const mi2 = String(localNow2.getMinutes()).padStart(2, '0');
      const ss2 = String(localNow2.getSeconds()).padStart(2, '0');
      const localStamp2 = `${yyyy}-${mm}-${dd} ${hh2}:${mi2}:${ss2}`;
      console.log(`🌐 [API_CLIENT] Response (${mealTime} ${date}) len=${Array.isArray(items) ? items.length : 0} | local ${tz} now=${localStamp2}`);
      return Array.isArray(items) ? items : [];
    } catch (e: any) {
      console.warn(`🌐 [API_CLIENT] ERROR ${url} | local ${tz} now=${new Date().toISOString()} | err=`, e);
      throw e;
    }
  }

  /**
   * Get meal session items by session (meal_time and date)
   */
  async getMealSessionItemsBySession(mealTime: string, date: string): Promise<any[]> {
    try {
      // First, get the meal session for the given date and meal_time
      const sessionQueryParams = new URLSearchParams();
      sessionQueryParams.append('meal_time', mealTime);
      sessionQueryParams.append('date', date);
      
      const sessionUrl = `/meal-sessions?${sessionQueryParams.toString()}`;
      console.log(`🌐 [API_CLIENT] GET ${sessionUrl} for session lookup`);
      const sessionResponse = await this.get<{data: {mealSessions: any[]}, success: boolean}>(sessionUrl);
      console.log(`🌐 [API_CLIENT] Session response:`, JSON.stringify(sessionResponse, null, 2));
      
      if (!sessionResponse.data.success || !sessionResponse.data.data.mealSessions || sessionResponse.data.data.mealSessions.length === 0) {
        console.log(`❌ [API_CLIENT] No sessions found for ${mealTime} on ${date}`);
        return [];
      }
      
      const mealSession = sessionResponse.data.data.mealSessions[0];
      console.log(`📋 [API_CLIENT] Found session:`, JSON.stringify(mealSession, null, 2));
      
      // Then, get the items for that meal session
      const itemsUrl = `/meal-session-items/${mealSession.id}`;
      console.log(`🌐 [API_CLIENT] GET ${itemsUrl} for items`);
      const itemsResponse = await this.get<{data: any[], success: boolean}>(itemsUrl);
      console.log(`🌐 [API_CLIENT] Items response:`, JSON.stringify(itemsResponse, null, 2));
      
      if (!itemsResponse.data.success) {
        console.log(`❌ [API_CLIENT] Items request failed for session ${mealSession.id}`);
        return [];
      }
      
      console.log(`✅ [API_CLIENT] Found ${itemsResponse.data.data?.length || 0} items for session ${mealSession.id}`);
      return itemsResponse.data.data || [];
    } catch (error) {
      console.error('❌ [API_CLIENT] Error getting meal session items:', error);
      return [];
    }
  }

  /**
   * Create session item
   */
  async createSessionItem(sessionItemData: {
    meal_session_id: number;
    food_item_id: number;
    available_quantity: number;
  }): Promise<SessionItem> {
    const response = await this.post<SessionItem>('/meal-session-items', sessionItemData);
    return response.data;
  }

  /**
   * Update session item
   */
  async updateSessionItem(id: number, quantity: number): Promise<SessionItem> {
    const response = await this.put<SessionItem>(`/meal-session-items/${id}`, {
      available_quantity: quantity
    });
    return response.data;
  }

  /**
   * Delete session item
   */
  async deleteSessionItem(id: number): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>(`/meal-session-items/${id}`);
    return response.data;
  }

  // Inventory Management API
  /**
   * Decrement item availability
   */
  async decrementAvailability(data: InventoryDecrementRequest): Promise<SessionItem> {
    const response = await this.post<SessionItem>('/inventory/decrement', data);
    return response.data;
  }

  /**
   * Increment item availability
   */
  async incrementAvailability(data: InventoryIncrementRequest): Promise<SessionItem> {
    const response = await this.post<SessionItem>('/inventory/increment', data);
    return response.data;
  }

  // Health Check
  /**
   * Check service health
   */
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await this.get<{ status: string; service: string; timestamp: string }>('/health');
    return response.data;
  }
}
