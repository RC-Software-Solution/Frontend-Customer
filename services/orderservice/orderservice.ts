import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    const now = Date.now() / 1000;
    return decoded.exp < now;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Assume expired if can't decode
  }
};

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
      console.log('🔍 Token retrieved from AsyncStorage:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token) {
        // Check if token is expired
        const expired = isTokenExpired(token);
        console.log('⏰ Token expired?', expired);
        
        if (expired) {
          console.log('❌ Token is expired, removing from storage');
          await AsyncStorage.removeItem('token');
          // You might want to redirect to login here
          throw new Error('Token expired');
        }
        
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔒 Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
        console.log('📋 Full config headers:', JSON.stringify(config.headers, null, 2));
      } else {
        console.log('⚠️ No token found in AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error retrieving token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to log server responses
api.interceptors.response.use(
  (response) => {
    console.log('✅ Order service response:', response.status, response.statusText);
    return response;
  },
  (error) => {
    console.error('❌ Order service error response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
    });
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