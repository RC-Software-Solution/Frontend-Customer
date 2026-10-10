/**
 * Menu Service
 * Handles all menu-related business logic and API calls
 */

import { MenuApiClient } from '../clients/menu-api.client';
import { ErrorUtils } from '../utils/error.utils';
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
  ApiResponse,
  TodayMenu,
  InventoryDecrementRequest,
  InventoryIncrementRequest
} from '../types/api.types';

export class MenuService {
  private menuApiClient: MenuApiClient;

  constructor() {
    this.menuApiClient = new MenuApiClient();
  }

  /**
   * Today's menu: sessions dated today in Sri Lanka, each upcoming/open/closed (server-computed).
   * Never returns other days. See services/menu/todayMenu.ts for how it is rendered.
   */
  async getTodaysMenu(): Promise<TodayMenu> {
    try {
      return await this.menuApiClient.getTodaysMenu();
    } catch (error) {
      console.error('Failed to get the menu for today:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  private getLocalISODate(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Food Items Methods
  /**
   * Get all food items
   */
  async getFoodItems(params: GetFoodItemsRequest = {}): Promise<FoodItemsResponse> {
    try {
      const response = await this.menuApiClient.getFoodItems(params);
      return response;
    } catch (error) {
      console.error('❌ Failed to get food items:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get food items by meal type
   */
  async getFoodItemsByType(mealType: 'veg' | 'non-veg' | 'other'): Promise<FoodItem[]> {
    try {
      const response = await this.menuApiClient.getFoodItems({ meal_type: mealType });
      return response.foodItems;
    } catch (error) {
      console.error('❌ Failed to get food items by type:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get single food item
   */
  async getFoodItem(id: number): Promise<FoodItem> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid food item ID is required');
      }

      const foodItem = await this.menuApiClient.getFoodItem(id);
      return foodItem;
    } catch (error) {
      console.error('❌ Failed to get food item:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Create food item
   */
  async createFoodItem(foodItemData: CreateFoodItemRequest): Promise<FoodItem> {
    try {
      this.validateFoodItemData(foodItemData);
      
      const foodItem = await this.menuApiClient.createFoodItem(foodItemData);
      
      console.log('✅ Food item created successfully:', foodItem.id);
      return foodItem;
    } catch (error) {
      console.error('❌ Food item creation failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Update food item
   */
  async updateFoodItem(id: number, foodItemData: UpdateFoodItemRequest): Promise<FoodItem> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid food item ID is required');
      }

      this.validateUpdateFoodItemData(foodItemData);

      const foodItem = await this.menuApiClient.updateFoodItem(id, foodItemData);
      
      console.log('✅ Food item updated successfully:', id);
      return foodItem;
    } catch (error) {
      console.error('❌ Food item update failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Delete food item
   */
  async deleteFoodItem(id: number): Promise<{ message: string }> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid food item ID is required');
      }

      const result = await this.menuApiClient.deleteFoodItem(id);
      
      console.log('✅ Food item deleted successfully:', id);
      return result;
    } catch (error) {
      console.error('❌ Food item deletion failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  // Meal Sessions Methods
  /**
   * Get all meal sessions
   */
  async getMealSessions(params: GetMealSessionsRequest = {}): Promise<ApiResponse<any>> {
    try {
      const response = await this.menuApiClient.getMealSessions(params);
      return response;
    } catch (error) {
      console.error('❌ Failed to get meal sessions:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get meal sessions by meal time
   */
  async getMealSessionsByTime(mealTime: 'breakfast' | 'lunch' | 'dinner'): Promise<MealSession[]> {
    try {
      const response = await this.menuApiClient.getMealSessions({ meal_time: mealTime });
      return (response as any)?.data?.data?.mealSessions || [];
    } catch (error) {
      console.error('❌ Failed to get meal sessions by time:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get meal sessions for today
   */
  async getTodaysMealSessions(): Promise<MealSession[]> {
    try {
      const today = this.getLocalISODate(); // YYYY-MM-DD local
      const response = await this.menuApiClient.getMealSessions({ date: today });
      return (response as any)?.data?.data?.mealSessions || [];
    } catch (error) {
      console.error('❌ Failed to get today\'s meal sessions:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get single meal session
   */
  async getMealSession(id: number): Promise<MealSession> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid meal session ID is required');
      }

      const mealSession = await this.menuApiClient.getMealSession(id);
      return mealSession;
    } catch (error) {
      console.error('❌ Failed to get meal session:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Create meal session
   */
  async createMealSession(sessionData: CreateMealSessionRequest): Promise<MealSession> {
    try {
      this.validateMealSessionData(sessionData);
      
      const mealSession = await this.menuApiClient.createMealSession(sessionData);
      
      console.log('✅ Meal session created successfully:', mealSession.id);
      return mealSession;
    } catch (error) {
      console.error('❌ Meal session creation failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Update meal session
   */
  async updateMealSession(id: number, sessionData: UpdateMealSessionRequest): Promise<MealSession> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid meal session ID is required');
      }

      const mealSession = await this.menuApiClient.updateMealSession(id, sessionData);
      
      console.log('✅ Meal session updated successfully:', id);
      return mealSession;
    } catch (error) {
      console.error('❌ Meal session update failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Delete meal session
   */
  async deleteMealSession(id: number): Promise<{ message: string }> {
    try {
      if (!id || id <= 0) {
        throw new Error('Valid meal session ID is required');
      }

      const result = await this.menuApiClient.deleteMealSession(id);
      
      console.log('✅ Meal session deleted successfully:', id);
      return result;
    } catch (error) {
      console.error('❌ Meal session deletion failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Add items to meal session
   */
  async addItemsToSession(sessionId: number, itemsData: AddItemsToSessionRequest): Promise<SessionItem[]> {
    try {
      if (!sessionId || sessionId <= 0) {
        throw new Error('Valid session ID is required');
      }

      this.validateAddItemsToSessionData(itemsData);

      const sessionItems = await this.menuApiClient.addItemsToSession(sessionId, itemsData);
      
      console.log('✅ Items added to session successfully:', sessionId);
      return sessionItems;
    } catch (error) {
      console.error('❌ Failed to add items to session:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  // Session Items Methods
  /**
   * Get items for a session
   */
  async getSessionItems(sessionId: number): Promise<SessionItem[]> {
    try {
      if (!sessionId || sessionId <= 0) {
        throw new Error('Valid session ID is required');
      }

      const sessionItems = await this.menuApiClient.getSessionItems(sessionId);
      return sessionItems;
    } catch (error) {
      console.error('❌ Failed to get session items:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Get meal session items by session (meal_time and date)
   */
  async getMealSessionItemsBySession(mealTime: string, date: string): Promise<any[]> {
    try {
      if (!mealTime || !['breakfast', 'lunch', 'dinner'].includes(mealTime)) {
        throw new Error('Valid meal time is required (breakfast, lunch, dinner)');
      }
      if (!date || !this.isValidDate(date)) {
        throw new Error('Valid date is required (YYYY-MM-DD format)');
      }

      console.log(`🔍 [MENU_SERVICE] Getting meal session items for ${mealTime} on ${date}`);
      const sessionItems = await this.menuApiClient.getMealSessionItemsBySession(mealTime, date);
      console.log(`✅ [MENU_SERVICE] Received ${sessionItems?.length || 0} items for ${mealTime}:`, JSON.stringify(sessionItems, null, 2));
      return sessionItems || [];
    } catch (error) {
      console.error('❌ Failed to get meal session items by session:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  // Inventory Management Methods
  /**
   * Decrement item availability
   */
  async decrementAvailability(data: InventoryDecrementRequest): Promise<SessionItem> {
    try {
      this.validateInventoryData(data);

      const result = await this.menuApiClient.decrementAvailability(data);
      
      console.log('✅ Availability decremented successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to decrement availability:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  /**
   * Increment item availability
   */
  async incrementAvailability(data: InventoryIncrementRequest): Promise<SessionItem> {
    try {
      this.validateInventoryData(data);

      const result = await this.menuApiClient.incrementAvailability(data);
      
      console.log('✅ Availability incremented successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to increment availability:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  // Health Check
  /**
   * Check service health
   */
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    try {
      const health = await this.menuApiClient.healthCheck();
      return health;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw ErrorUtils.createApiError(error);
    }
  }

  // Validation Methods
  /**
   * Validate food item data
   */
  private validateFoodItemData(data: CreateFoodItemRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Food item name is required');
    }
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Food item description is required');
    }
    if (!data.price || data.price <= 0) {
      throw new Error('Valid price is required');
    }
    if (!data.meal_type || !['veg', 'non-veg', 'other'].includes(data.meal_type)) {
      throw new Error('Valid meal type is required (veg, non-veg, other)');
    }
  }

  /**
   * Validate update food item data
   */
  private validateUpdateFoodItemData(data: UpdateFoodItemRequest): void {
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Food item name cannot be empty');
    }
    if (data.description !== undefined && data.description.trim().length === 0) {
      throw new Error('Food item description cannot be empty');
    }
    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Price must be greater than 0');
    }
    if (data.meal_type !== undefined && !['veg', 'non-veg', 'other'].includes(data.meal_type)) {
      throw new Error('Valid meal type is required (veg, non-veg, other)');
    }
  }

  /**
   * Validate meal session data
   */
  private validateMealSessionData(data: CreateMealSessionRequest): void {
    if (!data.date || !this.isValidDate(data.date)) {
      throw new Error('Valid date is required (YYYY-MM-DD format)');
    }
    if (!data.meal_time || !['breakfast', 'lunch', 'dinner'].includes(data.meal_time)) {
      throw new Error('Valid meal time is required (breakfast, lunch, dinner)');
    }
    if (!data.start_time || !this.isValidTime(data.start_time)) {
      throw new Error('Valid start time is required (HH:MM:SS format)');
    }
    if (!data.end_time || !this.isValidTime(data.end_time)) {
      throw new Error('Valid end time is required (HH:MM:SS format)');
    }
  }

  /**
   * Validate add items to session data
   */
  private validateAddItemsToSessionData(data: AddItemsToSessionRequest): void {
    if (!data.food_items || data.food_items.length === 0) {
      throw new Error('At least one food item is required');
    }

    data.food_items.forEach((item, index) => {
      if (!item.food_item_id || item.food_item_id <= 0) {
        throw new Error(`Item ${index + 1}: Valid food item ID is required`);
      }
      if (!item.available_quantity || item.available_quantity <= 0) {
        throw new Error(`Item ${index + 1}: Valid available quantity is required`);
      }
    });
  }

  /**
   * Validate inventory data
   */
  private validateInventoryData(data: InventoryDecrementRequest | InventoryIncrementRequest): void {
    if (!data.meal_session_id || data.meal_session_id <= 0) {
      throw new Error('Valid meal session ID is required');
    }
    if (!data.food_item_id || data.food_item_id <= 0) {
      throw new Error('Valid food item ID is required');
    }
    if (!data.quantity || data.quantity <= 0) {
      throw new Error('Valid quantity is required');
    }
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate time format (HH:MM:SS)
   */
  private isValidTime(timeString: string): boolean {
    const regex = /^\d{2}:\d{2}:\d{2}$/;
    if (!regex.test(timeString)) {
      return false;
    }
    
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
  }
}

