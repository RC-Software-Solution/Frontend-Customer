import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { updateQuantity, removeItem, clearCart } from '@/store/cartSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOrder } from '@/services/orderservice/orderservice';

// Helper function to normalize meal_type
const normalizeMealType = (mealType: string): 'veg' | 'non-veg' | 'other' => {
  const lowerCase = mealType.toLowerCase();
  if (lowerCase === 'veg') return 'veg';
  if (lowerCase === 'nonveg' || lowerCase === 'non-veg') return 'non-veg';
  return 'other'; // Fallback for safety
};

const CartScreen = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
  }, []);

  const handleLocalQuantityUpdate = (id: string, action: 'increase' | 'decrease') => {
    dispatch(updateQuantity({ id, type: action }));
  };

  const handleLocalRemoveItem = (id: string) => {
    dispatch(removeItem(id));
  };

  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleConfirmOrder = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to place an order.');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty.');
      return;
    }

    // Ensure all items have the same meal_time
    const mealTime = cartItems[0].meal_time;
    const allSameMealTime = cartItems.every((item) => item.meal_time === mealTime);
    if (!allSameMealTime) {
      Alert.alert('Error', 'All items in the cart must have the same meal time.');
      return;
    }

    const orderData = {
      customer_id: user.id,
      items: cartItems.map((item) => ({
        quantity: item.quantity,
        food_name: item.name,
        food_description: item.description || 'No description',
        meal_type: normalizeMealType(item.meal_type), // Normalize to ensure correct type
        price: item.price,
      })),
      total_price: totalAmount,
      meal_time: mealTime,
    };

    console.log('Order data sent:', JSON.stringify(orderData, null, 2));

    try {
      const response = await createOrder(orderData);
      Alert.alert('Success', `Order placed successfully! Order ID: ${response.data.order_id}`);
      dispatch(clearCart());
      router.push('/(tabs)');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
      if (errorMessage.includes('unpaid order')) {
        Alert.alert('Error', 'You have more than two unpaid orders. Please settle them first.');
      } else if (errorMessage.includes('Meal session not found')) {
        Alert.alert('Error', 'Selected meal session is not available. Please choose another time.');
      } else if (errorMessage.includes('Order limit reached')) {
        Alert.alert('Error', 'The meal session has reached its order limit. Try another session.');
      } else {
        Alert.alert('Error', errorMessage);
      }
      console.error('Error creating order:', error.response?.data || error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name='arrow-back' size={28} color='#000' />
      </TouchableOpacity>

      <Text style={styles.header}>🛒 Food Basket</Text>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Image source={item.image} style={styles.image} />
            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>Rs. {item.price.toFixed(2)}</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  onPress={() => handleLocalQuantityUpdate(item.id, 'decrease')}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => handleLocalQuantityUpdate(item.id, 'increase')}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleLocalRemoveItem(item.id)} style={styles.removeButton}>
              <Text style={styles.removeText}>✖</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Parcel Quantity: {totalQuantity}</Text>
        <Text style={styles.summaryText}>Total: Rs. {totalAmount.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmOrder}>
        <Text style={styles.confirmText}>CONFIRM ORDER</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#69bf70', textAlign: 'center', marginBottom: 30, marginTop: 60 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'relative',
    marginTop: 10,
    marginHorizontal: 16,
  },
  image: { width: 70, height: 70, borderRadius: 10 },
  details: { flex: 1, marginLeft: 10 },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { fontSize: 14, color: '#666' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  button: { backgroundColor: '#ddd', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  buttonText: { fontSize: 18, fontWeight: 'bold' },
  quantity: { marginHorizontal: 10, fontSize: 16, fontWeight: 'bold' },
  removeButton: { padding: 10 },
  removeText: { fontSize: 18, color: 'red' },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
    marginHorizontal: 16,
  },
  summaryText: { fontSize: 16, fontWeight: 'bold' },
  confirmButton: {
    backgroundColor: '#69bf70',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 50,
    width: '90%',
    alignSelf: 'center',
    marginHorizontal: 16,
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
});

export default CartScreen;