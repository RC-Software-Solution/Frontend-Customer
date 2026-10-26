import React, { useState, useEffect } from 'react';
import { View, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { updateQuantity, removeItem, clearCart } from '@/store/cartSlice';
import { orderService, authService } from '@/services';
import { useScreenPadding } from '@/components/ui/Screen';
import { AppButton } from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { color, radius, shadow, space } from '@/theme';

// Helper function to normalize meal_type
const normalizeMealType = (mealType: string): 'veg' | 'non-veg' | 'other' => {
  const lowerCase = mealType.toLowerCase();
  if (lowerCase === 'veg') return 'veg';
  if (lowerCase === 'nonveg' || lowerCase === 'non-veg') return 'non-veg';
  return 'other'; // Fallback for safety
};

const CartScreen = () => {
  const padding = useScreenPadding({ gutters: false });
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser?.id) {
          setUser({ id: currentUser.id });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
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

  // Validate meal_time
  const validMealTimes = ['breakfast', 'lunch', 'dinner'];
  if (!validMealTimes.includes(mealTime)) {
    Alert.alert('Error', `Invalid meal time: ${mealTime}. Please select breakfast, lunch, or dinner.`);
    return;
  }

  // Determine target date using effective session date captured from menu
  const getLocalISODate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Prefer the session_date saved on cart items; fallback to local today
  const effectiveSessionDate = (cartItems[0] as any)?.session_date || getLocalISODate();
  const targetDate = effectiveSessionDate;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const nowLocal = new Date();
  const stamp = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2,'0')}-${String(nowLocal.getDate()).padStart(2,'0')} ${String(nowLocal.getHours()).padStart(2,'0')}:${String(nowLocal.getMinutes()).padStart(2,'0')}:${String(nowLocal.getSeconds()).padStart(2,'0')}`;
  console.log('Order details - tz:', tz, 'now_local:', stamp, 'meal_time:', mealTime, 'target_date:', targetDate);

  const orderData = {
    customer_id: user.id,
    items: cartItems.map((item) => ({
      food_item_id: (item as any).food_item_id,
      quantity: item.quantity,
      food_name: item.name,
      food_description: item.description || 'No description',
      meal_time: mealTime,
      meal_type: normalizeMealType(item.meal_type),
      price: item.price,
    })),
    total_price: totalAmount,
    meal_time: mealTime,
    target_date: targetDate, // Add target_date to match backend expectations
  };

  console.log('Order data sent:', JSON.stringify(orderData, null, 2));
  console.log('Current time (local):', stamp, '| Current time (ISO):', new Date().toISOString());

  const attemptOrder = async (retry = false) => {
    try {
      const response = await orderService.createOrder(orderData);
      Alert.alert('Success', `Order placed successfully! Order ID: ${response.order_id}`);
      dispatch(clearCart());
      router.push('/(tabs)');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to place order. Please try again.';
      console.error('Error creating order:', error);

      if (errorMessage.includes('unpaid order')) {
        Alert.alert('Error', 'You have more than two unpaid orders. Please settle them first.');
      } else if (errorMessage.includes('Meal session not found')) {
        Alert.alert('Error', 'The selected meal session is not available for today. Please choose another time or try again later.');
      } else if (errorMessage.includes('Order limit reached')) {
        Alert.alert('Error', 'The meal session has reached its order limit. Try another session.');
      } else if (errorMessage.includes('Server error') && !retry) {
        Alert.alert(
          'Error',
          'Something went wrong on the server. Would you like to retry the order?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => attemptOrder(true) },
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  await attemptOrder();
};
  return (
    <View style={[styles.container, { paddingTop: padding.paddingTop }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color={color.ink} />
        </TouchableOpacity>
        <AppText variant="h2" weight="bold">Food Basket</AppText>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <Image source={item.image} style={styles.image} />
            <View style={styles.details}>
              <AppText variant="body" weight="bold" numberOfLines={2}>{item.name}</AppText>
              <View style={styles.priceRow}>
                <AppText variant="caption" tone="muted" numberOfLines={1}>Rs. {item.price.toFixed(2)}</AppText>
                <AppText variant="caption" weight="bold" numberOfLines={1} style={styles.lineTotal}>
                  Rs. {(item.price * item.quantity).toFixed(2)}
                </AppText>
              </View>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  onPress={() => handleLocalQuantityUpdate(item.id, 'decrease')}
                  style={[styles.stepper, { backgroundColor: color.field }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease quantity of ${item.name}`}
                >
                  <Ionicons name="remove" size={24} color={color.ink} />
                </TouchableOpacity>
                <AppText variant="body" weight="bold" style={styles.quantity}>{item.quantity}</AppText>
                <TouchableOpacity
                  onPress={() => handleLocalQuantityUpdate(item.id, 'increase')}
                  style={[styles.stepper, { backgroundColor: color.brand }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Increase quantity of ${item.name}`}
                >
                  <Ionicons name="add" size={24} color={color.onBrand} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleLocalRemoveItem(item.id)}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name}`}
            >
              <Ionicons name="trash-outline" size={22} color={color.danger} />
            </TouchableOpacity>
          </Card>
        )}
      />

      <View style={[styles.sheet, { paddingBottom: padding.paddingBottom }]}>
        <View style={styles.summary}>
          <AppText variant="body" weight="bold" numberOfLines={1}>Parcel Quantity: {totalQuantity}</AppText>
          <AppText variant="body" weight="bold" numberOfLines={1}>Total: Rs. {totalAmount.toFixed(2)}</AppText>
        </View>
        <AppButton title="CONFIRM ORDER" onPress={handleConfirmOrder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, gap: space.xs },
  list: { padding: space.md },
  itemCard: { flexDirection: 'row', alignItems: 'center' },
  image: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: color.field },
  details: { flex: 1, marginLeft: space.sm },
  quantityControl: { flexDirection: 'row', alignItems: 'center', marginTop: space.xs },
  stepper: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 32, textAlign: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.xs },
  lineTotal: { flexShrink: 1, textAlign: 'right' },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    gap: space.md,
    padding: space.md,
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadow.bar,
  },
  summary: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
});

export default CartScreen;