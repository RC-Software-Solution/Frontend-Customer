/**
 * Usage Examples
 * Examples of how to use the new service architecture
 */

import { authService, orderService } from '../index';
import { CreateOrderRequest, Order } from '../types/api.types';

// ============================================================================
// Authentication Examples
// ============================================================================

export const authenticationExamples = {
  // Login user
  async loginUser() {
    try {
      const response = await authService.login({
        email: 'user@example.com',
        password: 'password123',
        fcm_token: 'optional-fcm-token'
      });
      
      console.log('Login successful:', response);
      // User is now authenticated and tokens are stored
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  },

  // Signup user
  async signupUser() {
    try {
      const response = await authService.signup({
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        address: '123 Main St, City, State',
        role: 'customer',
        fcm_token: 'optional-fcm-token'
      });
      
      console.log('Signup successful:', response);
    } catch (error) {
      console.error('Signup failed:', error.message);
    }
  },

  // Check authentication status
  async checkAuthStatus() {
    const isAuthenticated = await authService.isAuthenticated();
    console.log('User is authenticated:', isAuthenticated);
  },

  // Get current user
  async getCurrentUser() {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        console.log('Current user:', user);
      } else {
        console.log('No user logged in');
      }
    } catch (error) {
      console.error('Failed to get current user:', error.message);
    }
  },

  // Logout user
  async logoutUser() {
    try {
      await authService.logout();
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  }
};

// ============================================================================
// Order Examples
// ============================================================================

export const orderExamples = {
  // Create a new order
  async createOrder() {
    try {
      const orderData: CreateOrderRequest = {
        customer_id: 'user-uuid-here',
        items: [
          {
            quantity: 2,
            food_name: 'Chicken Biryani',
            food_description: 'Spicy rice with chicken',
            meal_type: 'non-veg',
            price: 250
          },
          {
            quantity: 1,
            food_name: 'Vegetable Curry',
            food_description: 'Mixed vegetables in curry',
            meal_type: 'veg',
            price: 150
          }
        ],
        total_price: 650,
        meal_time: 'lunch',
        delivery_address: '123 Main St, City, State',
        special_instructions: 'Please make it less spicy'
      };

      const order = await orderService.createOrder(orderData);
      console.log('Order created:', order);
    } catch (error) {
      console.error('Failed to create order:', error.message);
    }
  },

  // Get user orders
  async getUserOrders() {
    try {
      const orders = await orderService.getUserOrders(1, 10);
      console.log('User orders:', orders);
    } catch (error) {
      console.error('Failed to get user orders:', error.message);
    }
  },

  // Get orders by status
  async getPendingOrders() {
    try {
      const orders = await orderService.getOrdersByStatus('pending', 1, 10);
      console.log('Pending orders:', orders);
    } catch (error) {
      console.error('Failed to get pending orders:', error.message);
    }
  },

  // Track order
  async trackOrder(orderId: string) {
    try {
      const tracking = await orderService.trackOrder(orderId);
      console.log('Order tracking:', tracking);
    } catch (error) {
      console.error('Failed to track order:', error.message);
    }
  },

  // Cancel order
  async cancelOrder(orderId: string) {
    try {
      await orderService.cancelOrder(orderId);
      console.log('Order cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel order:', error.message);
    }
  }
};

// ============================================================================
// React Component Examples
// ============================================================================

export const reactComponentExamples = {
  // Login screen example
  loginScreen: `
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { authService } from '@/services';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await authService.login({ email, password });
      // Navigate to main app
      // router.push('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <TouchableOpacity onPress={handleLogin} disabled={loading}>
        <Text>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  );
}`,

  // Order list example
  orderListScreen: `
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import { orderService, Order } from '@/services';

export default function OrderListScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderService.getUserOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await orderService.cancelOrder(orderId);
      loadOrders(); // Refresh the list
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View>
      <Text>Order #{item.id}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Total: ${item.total_price}</Text>
      <TouchableOpacity onPress={() => handleCancelOrder(item.id)}>
        <Text>Cancel Order</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={orders}
      renderItem={renderOrder}
      keyExtractor={(item) => item.id}
    />
  );
}`
};

// ============================================================================
// Error Handling Examples
// ============================================================================

export const errorHandlingExamples = {
  // Basic error handling
  async basicErrorHandling() {
    try {
      await authService.login({ email: 'invalid', password: 'wrong' });
    } catch (error) {
      // Error is automatically formatted
      console.error('Error:', error.message);
      
      // Check error type
      if (error.code === 'NETWORK_ERROR') {
        console.log('Network issue - check connection');
      } else if (error.status === 401) {
        console.log('Invalid credentials');
      }
    }
  },

  // Retry logic example
  async retryExample() {
    let retries = 3;
    while (retries > 0) {
      try {
        const orders = await orderService.getUserOrders();
        return orders;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};











