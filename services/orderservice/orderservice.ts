// This file is deprecated. Use the new order service from @/services instead.
// Import the new order service:
// import { orderService } from '@/services';

// Legacy exports for backward compatibility
export { orderService as default } from '@/services';

// Legacy function exports for backward compatibility
export const createOrder = async (orderData: {
  customer_id: string;
  items: {
    quantity: number;
    food_name: string;
    food_description: string;
    meal_time: 'breakfast' | 'lunch' | 'dinner';
    meal_type: 'veg' | 'non-veg' | 'other';
    price: number;
  }[];
  total_price: number;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
}) => {
  const { orderService } = await import('@/services');
  return orderService.createOrder(orderData);
};

export const editOrder = async (orderId: string, orderData: {
  items: {
    food_item_id: number;
    quantity: number;
  }[];
}) => {
  const { orderService } = await import('@/services');
  return orderService.updateOrder(orderId, orderData);
};

export const deleteOrder = async (orderId: string) => {
  const { orderService } = await import('@/services');
  return orderService.deleteOrder(orderId);
};