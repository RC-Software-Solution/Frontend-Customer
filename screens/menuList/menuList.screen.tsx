import React, { useCallback, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { addToCart, clearCart } from '@/store/cartSlice';
import { FoodItem } from '@/services/types/api.types';
import { MealType, MEAL_TYPES, buildTabs } from '@/services/menu/todayMenu';
import MenuRow from '@/components/menu/MenuRow';
import { useScreenPadding } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { color, radius, shadow, space, status } from '@/theme';

const label = (meal: string) => meal.charAt(0).toUpperCase() + meal.slice(1);

type Param = string | string[] | undefined;

const MenuListScreen = (params: { meal: Param; kind: Param }) => {
  // route params come from links too: a missing, repeated or unknown value falls back instead of crashing
  const first = (p: Param) => (Array.isArray(p) ? p[0] : p);
  const rawMeal = first(params.meal);
  const meal: MealType = MEAL_TYPES.includes(rawMeal as MealType) ? (rawMeal as MealType) : 'breakfast';
  const kind = first(params.kind) === 'nonveg' ? 'nonveg' : 'veg';

  const padding = useScreenPadding({ gutters: false });
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  // Home keeps this current (focus, AppState and session-transition refreshes), so the list follows it live
  const menu = useSelector((state: RootState) => state.menu.menu);
  const tab = useMemo(() => (menu ? buildTabs(menu)[meal] : null), [menu, meal]);

  const veg = kind === 'veg';
  const items = (veg ? tab?.veg : tab?.nonVeg) ?? [];
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleAdd = useCallback(
    (foodItem: FoodItem) => {
      if (!tab?.orderable) return;
      const item = {
        id: String(foodItem.id),
        food_item_id: foodItem.id,
        name: foodItem.name,
        price: parseFloat(foodItem.price),
        quantity: 1,
        image: foodItem.image_url ? { uri: foodItem.image_url } : require('../../assets/plate.jpeg'),
        meal_type: (veg ? 'veg' : 'non-veg') as 'veg' | 'non-veg',
        meal_time: meal,
        description: foodItem.description,
        // the session's own date (today), sent as the order's target_date
        session_date: tab.sessionDate,
      };

      // one meal per order: a dish from another meal replaces the cart, after asking
      const other = cartItems.find((i) => i.meal_time !== meal);
      if (!other) {
        dispatch(addToCart(item));
        return;
      }
      Alert.alert(
        'Start a new cart?',
        `Your cart has ${label(other.meal_time)} items. An order can only hold one meal, so adding this will clear it.`,
        [
          { text: 'Keep cart', style: 'cancel' },
          {
            text: 'Start new cart',
            onPress: () => {
              dispatch(clearCart());
              dispatch(addToCart(item));
            },
          },
        ]
      );
    },
    [tab, veg, meal, cartItems, dispatch]
  );

  const quantityOf = (food: FoodItem) =>
    cartItems.find((i) => i.name === food.name && i.meal_time === meal)?.quantity ?? 0;

  return (
    <View style={[styles.container, { paddingTop: padding.paddingTop }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color={color.ink} />
        </TouchableOpacity>
        <View style={styles.titles}>
          <AppText variant="h2" weight="bold" numberOfLines={1}>
            {veg ? 'Vegetarian' : 'Non-Vegetarian'} Items ({items.length})
          </AppText>
          <AppText variant="caption" tone="muted">
            {label(meal)}, today
          </AppText>
        </View>
      </View>

      {tab?.state === 'open' ? (
        <View style={[styles.strip, { backgroundColor: color.brandSoft }]}>
          <Ionicons name="time-outline" size={18} color={color.brandStrong} />
          <AppText variant="caption" weight="bold" tone="brand">
            {label(meal)} is open now
          </AppText>
        </View>
      ) : tab?.banner ? (
        <View style={[styles.strip, { backgroundColor: status.pending.bg }]}>
          <AppText variant="caption" weight="bold" style={{ color: status.pending.fg }}>
            {tab.banner}
          </AppText>
        </View>
      ) : null}

      {menu === null ? (
        <View style={styles.empty}>
          <EmptyState
            tone="error"
            icon="restaurant-outline"
            title="Menu not loaded"
            message="Open Home to load today's menu."
            actionLabel="Go to Home"
            onAction={() => router.replace('/(tabs)')}
          />
        </View>
      ) : (
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MenuRow item={item} quantity={quantityOf(item)} disabled={!tab?.orderable} onAdd={handleAdd} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState icon="restaurant-outline" title="No items" message={tab?.banner ?? undefined} />
          </View>
        }
      />
      )}

      {totalQuantity > 0 ? (
        <View style={{ paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: padding.paddingBottom }}>
          <TouchableOpacity
            style={styles.bar}
            onPress={() => router.push('/(routes)/cart')}
            accessibilityRole="button"
          >
            <AppText variant="body" weight="bold" tone="inverse">
              View cart ({totalQuantity})
            </AppText>
            <AppText variant="body" weight="bold" tone="inverse" numberOfLines={1}>
              {`Rs. ${totalAmount.toFixed(2)}`}
            </AppText>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, gap: space.xs },
  titles: { flexShrink: 1 },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.md,
    marginTop: space.md,
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  list: { padding: space.md, paddingTop: space.lg },
  empty: { marginTop: space.xl },
  bar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: color.ink,
    ...shadow.bar,
  },
});

export default MenuListScreen;
