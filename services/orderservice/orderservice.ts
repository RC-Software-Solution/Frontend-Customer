import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.43.178:4002/api', // Order service port
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include authentication token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

export const createOrder = async (orderData: {
  customer_id: string; // Changed to string for UUID
  items: {
    quantity: number;
    food_name: string;
    food_description: string; // Made required to match backend
    meal_time: 'breakfast' | 'lunch' | 'dinner';
    meal_type: 'veg' | 'non-veg' | 'other';
    price: number;
  }[];
  total_price: number;
  meal_time: 'breakfast' | 'lunch' | 'dinner';
}) => {
  return api.post('/orders', orderData);
};

// Optional: Add edit and delete functions if needed
export const editOrder = async (orderId: string, orderData: {
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
  return api.put(`/orders/${orderId}`, orderData);
};

export const deleteOrder = async (orderId: string) => {
  return api.delete(`/orders/${orderId}`);
};