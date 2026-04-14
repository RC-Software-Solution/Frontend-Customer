# Menu Service Integration

## Overview
Successfully integrated the menu service with the React Native frontend using the same clean architecture pattern established for the user and order services. The integration replaces hardcoded menu data with real-time data from the backend menu service.

## Backend API Endpoints Integrated

### 1. **GET /api/food-items** - Get All Food Items
```typescript
// Query Parameters
?page=1&limit=10&meal_type=veg

// Response
{
  "success": true,
  "message": "Food items retrieved successfully",
  "data": {
    "foodItems": [
      {
        "id": 1,
        "name": "Chicken Biryani",
        "description": "Spicy rice dish with chicken",
        "price": "250.00",
        "meal_type": "non-veg",
        "image_url": "https://example.com/biryani.jpg",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. **GET /api/food-items/:id** - Get Single Food Item
### 3. **POST /api/food-items** - Create Food Item
### 4. **PUT /api/food-items/:id** - Update Food Item
### 5. **DELETE /api/food-items/:id** - Delete Food Item

### 6. **GET /api/meal-sessions** - Get Meal Sessions
### 7. **POST /api/meal-sessions** - Create Meal Session
### 8. **GET /api/meal-session-items/:session_id** - Get Session Items
### 9. **POST /api/inventory/decrement** - Decrement Availability
### 10. **POST /api/inventory/increment** - Increment Availability

## Frontend Implementation

### 1. **Updated Type Definitions** (`services/types/api.types.ts`)

```typescript
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

// Request/Response types
export interface GetFoodItemsRequest {
  page?: number;
  limit?: number;
  meal_type?: 'veg' | 'non-veg' | 'other';
}

export interface FoodItemsResponse {
  foodItems: FoodItem[];
  pagination: PaginationInfo;
}
```

### 2. **Menu API Client** (`services/clients/menu-api.client.ts`)

```typescript
export class MenuApiClient extends BaseApiClient {
  constructor() {
    super('MENU_SERVICE');
  }

  // Food Items API
  async getFoodItems(params: GetFoodItemsRequest = {}): Promise<FoodItemsResponse>
  async getFoodItem(id: number): Promise<FoodItem>
  async createFoodItem(foodItemData: CreateFoodItemRequest): Promise<FoodItem>
  async updateFoodItem(id: number, foodItemData: UpdateFoodItemRequest): Promise<FoodItem>
  async deleteFoodItem(id: number): Promise<{ message: string }>

  // Meal Sessions API
  async getMealSessions(params: GetMealSessionsRequest = {}): Promise<MealSessionsResponse>
  async getMealSession(id: number): Promise<MealSession>
  async createMealSession(sessionData: CreateMealSessionRequest): Promise<MealSession>
  async updateMealSession(id: number, sessionData: UpdateMealSessionRequest): Promise<MealSession>
  async deleteMealSession(id: number): Promise<{ message: string }>
  async addItemsToSession(sessionId: number, itemsData: AddItemsToSessionRequest): Promise<SessionItem[]>

  // Session Items API
  async getSessionItems(sessionId: number): Promise<SessionItem[]>
  async createSessionItem(sessionItemData: {...}): Promise<SessionItem>
  async updateSessionItem(id: number, quantity: number): Promise<SessionItem>
  async deleteSessionItem(id: number): Promise<{ message: string }>

  // Inventory Management API
  async decrementAvailability(data: InventoryDecrementRequest): Promise<SessionItem>
  async incrementAvailability(data: InventoryIncrementRequest): Promise<SessionItem>

  // Health Check
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }>
}
```

### 3. **Menu Service** (`services/menu/menu.service.ts`)

```typescript
export class MenuService {
  // Food Items Methods
  async getFoodItems(params: GetFoodItemsRequest = {}): Promise<FoodItemsResponse>
  async getFoodItemsByType(mealType: 'veg' | 'non-veg' | 'other'): Promise<FoodItem[]>
  async getFoodItem(id: number): Promise<FoodItem>
  async createFoodItem(foodItemData: CreateFoodItemRequest): Promise<FoodItem>
  async updateFoodItem(id: number, foodItemData: UpdateFoodItemRequest): Promise<FoodItem>
  async deleteFoodItem(id: number): Promise<{ message: string }>

  // Meal Sessions Methods
  async getMealSessions(params: GetMealSessionsRequest = {}): Promise<MealSessionsResponse>
  async getMealSessionsByTime(mealTime: 'breakfast' | 'lunch' | 'dinner'): Promise<MealSession[]>
  async getTodaysMealSessions(): Promise<MealSession[]>
  async getMealSession(id: number): Promise<MealSession>
  async createMealSession(sessionData: CreateMealSessionRequest): Promise<MealSession>
  async updateMealSession(id: number, sessionData: UpdateMealSessionRequest): Promise<MealSession>
  async deleteMealSession(id: number): Promise<{ message: string }>
  async addItemsToSession(sessionId: number, itemsData: AddItemsToSessionRequest): Promise<SessionItem[]>

  // Session Items Methods
  async getSessionItems(sessionId: number): Promise<SessionItem[]>

  // Inventory Management Methods
  async decrementAvailability(data: InventoryDecrementRequest): Promise<SessionItem>
  async incrementAvailability(data: InventoryIncrementRequest): Promise<SessionItem>

  // Health Check
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }>
}
```

## Updated Home Screen

### **Key Changes Made:**

1. **Real-time Data Loading**: Replaced hardcoded menu data with API calls
2. **Loading States**: Added loading indicators while fetching data
3. **Authentication Integration**: Uses `useAuth` hook for authentication state
4. **Error Handling**: Comprehensive error handling with user-friendly messages
5. **Auto-refresh**: Refreshes data when screen comes into focus
6. **Dynamic Images**: Supports both local and remote images from backend

### **New Features:**

- **Loading States**: Shows spinner while loading menu items
- **Authentication Check**: Displays message if user is not logged in
- **Real-time Updates**: Refreshes menu data when screen gains focus
- **Dynamic Pricing**: Uses actual prices from backend
- **Image Support**: Supports both local and remote images
- **Error Recovery**: Graceful error handling with retry options

### **Data Flow:**

```typescript
// 1. Load menu data on component mount
useEffect(() => {
  loadMenuData();
}, [isAuthenticated]);

// 2. Refresh data when screen comes into focus
useFocusEffect(
  React.useCallback(() => {
    loadMenuData();
  }, [isAuthenticated])
);

// 3. Load food items by type
const loadMenuData = async () => {
  const [vegItems, nonVegItems] = await Promise.all([
    menuService.getFoodItemsByType('veg'),
    menuService.getFoodItemsByType('non-veg')
  ]);
  
  // Organize items by meal time
  setMenuData({
    breakfast: { Veg: vegItems, NonVeg: nonVegItems },
    lunch: { Veg: vegItems, NonVeg: nonVegItems },
    dinner: { Veg: vegItems, NonVeg: nonVegItems },
  });
};
```

## Usage Examples

### 1. **Getting Food Items**
```typescript
import { menuService } from '@/services';

// Get all food items
const response = await menuService.getFoodItems();

// Get food items by type
const vegItems = await menuService.getFoodItemsByType('veg');
const nonVegItems = await menuService.getFoodItemsByType('non-veg');

// Get food items with pagination
const paginatedItems = await menuService.getFoodItems({
  page: 1,
  limit: 10,
  meal_type: 'veg'
});
```

### 2. **Getting Meal Sessions**
```typescript
import { menuService } from '@/services';

// Get all meal sessions
const sessions = await menuService.getMealSessions();

// Get today's meal sessions
const todaysSessions = await menuService.getTodaysMealSessions();

// Get sessions by meal time
const lunchSessions = await menuService.getMealSessionsByTime('lunch');
```

### 3. **Inventory Management**
```typescript
import { menuService } from '@/services';

// Decrement availability when order is placed
await menuService.decrementAvailability({
  meal_session_id: 1,
  food_item_id: 5,
  quantity: 2
});

// Increment availability when order is cancelled
await menuService.incrementAvailability({
  meal_session_id: 1,
  food_item_id: 5,
  quantity: 2
});
```

## Configuration Updates

### **API Configuration** (`services/config/api.config.ts`)
```typescript
export const API_CONFIG = {
  BASE_URLS: {
    USER_SERVICE: 'http://192.168.43.178:4001/api',
    ORDER_SERVICE: 'http://192.168.43.178:4002/api',
    MENU_SERVICE: 'http://192.168.43.178:4005/api', // Updated port
    // ... other services
  },
  // ... other config
};
```

### **Service Exports** (`services/index.ts`)
```typescript
// Export API clients
export { MenuApiClient } from './clients/menu-api.client';

// Export services
export { MenuService } from './menu/menu.service';

// Create singleton instances
export const menuService = new MenuService();
```

## Error Handling

The integration includes comprehensive error handling:

### 1. **Network Errors**
- Automatic retry logic
- User-friendly error messages
- Graceful fallbacks

### 2. **Validation Errors**
- Client-side validation before API calls
- Clear error messages for invalid data
- Prevents unnecessary API calls

### 3. **Server Errors**
- Specific error messages for different scenarios
- Retry options for transient errors
- Proper error logging

## Authentication Integration

- ✅ Automatic token management
- ✅ Request interceptors for authentication
- ✅ Automatic token refresh
- ✅ Logout handling

## Benefits of the Integration

### 1. **Real-time Data**
- Menu items are fetched from backend
- Always up-to-date pricing and availability
- Dynamic menu updates

### 2. **Consistency**
- Follows the same patterns as user and order services
- Consistent error handling across all services
- Uniform API client structure

### 3. **Maintainability**
- Clear separation of concerns
- Easy to add new menu-related features
- Centralized configuration

### 4. **Type Safety**
- Full TypeScript support
- Compile-time error checking
- IntelliSense support

### 5. **User Experience**
- Loading states and feedback
- Error handling with user-friendly messages
- Smooth data loading

## Testing the Integration

### 1. **Menu Loading Flow**
1. Open the home screen
2. Verify loading indicator appears
3. Check that menu items load from backend
4. Verify items are organized by type (Veg/Non-Veg)

### 2. **Authentication Flow**
1. Log out and open home screen
2. Verify "Please log in" message appears
3. Log in and verify menu loads

### 3. **Error Handling Flow**
1. Test with network errors
2. Verify appropriate error messages
3. Test retry functionality

## Future Enhancements

The architecture supports easy addition of new features:

1. **Meal Session Integration**: Filter items by actual meal sessions
2. **Real-time Updates**: WebSocket integration for live updates
3. **Image Optimization**: Caching and optimization for food images
4. **Search and Filter**: Advanced search and filtering capabilities
5. **Favorites**: User favorite items functionality
6. **Reviews and Ratings**: Food item reviews and ratings

## Files Modified

1. **`services/types/api.types.ts`** - Added menu-related types
2. **`services/clients/menu-api.client.ts`** - Created menu API client
3. **`services/menu/menu.service.ts`** - Created menu service
4. **`services/config/api.config.ts`** - Updated menu service URL
5. **`services/index.ts`** - Added menu service exports
6. **`screens/homeTab/home/home.screen.tsx`** - Updated to use real menu data

## Conclusion

The menu service integration is complete and follows the established patterns. The frontend now successfully communicates with the backend menu service, providing real-time menu data instead of hardcoded values. The architecture is scalable and maintainable, making it easy to add new features in the future.

The home screen now displays actual food items from the backend, with proper loading states, error handling, and authentication integration. Users can see real-time menu data with accurate pricing and descriptions, creating a more dynamic and engaging experience.











