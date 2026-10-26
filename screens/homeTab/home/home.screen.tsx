import { View, TouchableOpacity, ScrollView, Image, Animated, StyleSheet, ActivityIndicator, Alert, AppState } from 'react-native';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RenderItem from '@/components/flatList/flatList';
import { router, useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/store/cartSlice';
import { RootState } from '@/store';
import { menuService, useAuth } from '@/services';
import { FoodItem, TodayMenu } from '@/services/types/api.types';
import { MealType, MEAL_TYPES, buildTabs, nextTransitionMs } from '@/services/menu/todayMenu';
import { useScreenPadding, StatusBarScrim } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { color, space, radius, shadow, status } from '@/theme';

const CART_FAB_SIZE = 56;

export type MenuItem = {
  name: string;
  description: string;
  price: number;
};

type Expansion = { [key in MealType]: { Veg: boolean; NonVeg: boolean } };

const HomeScreen = () => {
  const { isAuthenticated } = useAuth();
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const [activeButton, setActiveButton] = useState<MealType>('breakfast');
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<TodayMenu | null>(null);
  const [expansionState, setExpansionState] = useState<Expansion>({
    breakfast: { Veg: false, NonVeg: false },
    lunch: { Veg: false, NonVeg: false },
    dinner: { Veg: false, NonVeg: false },
  });
  const hasLoaded = useRef(false);

  const padding = useScreenPadding({ tabBar: true, gutters: false });
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  // What each meal tab shows is decided by the server (today's date in Sri Lanka, each
  // session upcoming/open/closed). Other days are never shown.
  const tabs = useMemo(() => (menu ? buildTabs(menu) : null), [menu]);

  const loadMenuData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      // spinner only for the first load; later refreshes update quietly
      if (!hasLoaded.current) setLoading(true);
      setMenu(await menuService.getTodaysMenu());
      hasLoaded.current = true;
    } catch (error) {
      console.error('Failed to load menu data:', error);
      if (!hasLoaded.current) Alert.alert('Error', 'Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Refresh when this screen is focused (also runs on first mount)
  useFocusEffect(
    useCallback(() => {
      loadMenuData();
    }, [loadMenuData])
  );

  // ...when the app returns from the background (the day may have changed overnight)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && loadMenuData());
    return () => sub.remove();
  }, [loadMenuData]);

  // ...and exactly when a session opens/closes or the day rolls over, so nothing goes stale on screen
  useEffect(() => {
    if (!menu) return;
    const ms = nextTransitionMs(menu);
    if (ms === null) return;
    const timer = setTimeout(loadMenuData, Math.min(ms, 2 ** 31 - 1) + 1000);
    return () => clearTimeout(timer);
  }, [menu, loadMenuData]);

  const handleViewCart = () => {
    const tab = tabs?.[activeButton];
    // only an open session can be ordered from; selections in other tabs are ignored
    const selectedList = tab?.orderable ? Object.keys(selectedItems).filter((name) => selectedItems[name]) : [];

    const cartFormattedItems = selectedList.flatMap((name) => {
      const vegItem = tab!.veg.find((item) => item.name === name);
      const nonVegItem = tab!.nonVeg.find((item) => item.name === name);
      const foodItem: FoodItem | undefined = vegItem || nonVegItem;
      if (!foodItem) return [];

      return [
        {
          id: foodItem.id.toString(),
          food_item_id: foodItem.id,
          name,
          price: parseFloat(foodItem.price),
          quantity: 1,
          image: foodItem.image_url ? { uri: foodItem.image_url } : require('../../../assets/plate.jpeg'),
          meal_type: (vegItem ? 'veg' : 'non-veg') as 'veg' | 'non-veg',
          meal_time: activeButton,
          description: foodItem.description,
          // the session's own date (today), sent as the order's target_date
          session_date: tab!.sessionDate,
        },
      ];
    });

    const itemsToAdd = cartFormattedItems.filter(
      (newItem) => !cartItems.some((existingItem: { name: string }) => existingItem.name === newItem.name)
    );
    itemsToAdd.forEach((item) => dispatch(addToCart(item)));

    router.push('/(routes)/cart');
  };

  const toggleSection = (category: MealType, section: 'Veg' | 'NonVeg') => {
    setExpansionState((prev) => ({
      ...prev,
      [category]: { ...prev[category], [section]: !prev[category][section] },
    }));
  };

  const handleMealSelection = (meal: string, isChecked: boolean) => {
    setSelectedItems((prev) => ({ ...prev, [meal]: isChecked }));
  };

  const renderSection = (
    title: string,
    banner: any,
    items: FoodItem[],
    expanded: boolean,
    onToggle: () => void,
    disabled: boolean
  ) => (
    <>
      <TouchableOpacity
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`Toggle ${title}`}
        accessibilityState={{ expanded }}
        style={{ marginTop: 20, marginHorizontal: space.md }}
      >
        <Image
          source={banner}
          resizeMode="cover"
          style={{ width: '100%', height: 150, alignSelf: 'center', borderRadius: radius.lg }}
        />
      </TouchableOpacity>
      <Animated.View style={{ height: expanded ? undefined : 0, overflow: 'hidden', marginHorizontal: space.md }}>
        {expanded && (
          <View>
            <AppText variant="body" weight="bold" tone="ink" style={{ marginTop: space.sm, marginBottom: space.md }}>
              {title} ({items.length})
            </AppText>
            {/* ponytail: bounded list (a handful of dishes per session), a nested FlatList would warn. Switch the screen to one SectionList if menus grow past ~30 items. */}
            {items.map((item) => (
              <RenderItem
                key={item.id}
                item={{ name: item.name, description: item.description, price: parseFloat(item.price) }}
                onPressCheckbox={handleMealSelection}
                isChecked={selectedItems[item.name] || false}
                disabled={disabled}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.brandStrong} />
          <AppText variant="body" tone="brand" weight="semibold" style={styles.loadingText}>
            Loading menu items...
          </AppText>
        </View>
      );
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.loadingContainer}>
          <AppText variant="body" tone="brand" weight="semibold" style={styles.loadingText}>
            Please log in to view menu items
          </AppText>
        </View>
      );
    }

    if (!tabs) {
      return (
        <View style={styles.loadingContainer}>
          <AppText variant="body" tone="brand" weight="semibold" style={styles.loadingText}>
            Could not load the menu. Pull back to this screen to retry.
          </AppText>
        </View>
      );
    }

    const tab = tabs[activeButton];
    const expansion = expansionState[activeButton];

    return (
      <View>
        <View style={{ alignItems: 'flex-start', marginTop: padding.paddingTop, marginHorizontal: space.md }}>
          <AppText variant="h1" weight="bold">
            RC Caterings
          </AppText>
        </View>
        <View
          style={{
            flexDirection: 'row',
            marginTop: space.lg,
            marginHorizontal: space.md,
            backgroundColor: color.surface,
            borderRadius: radius.lg,
            marginBottom: space.md,
            padding: space.xs,
          }}
        >
          {MEAL_TYPES.map((category) => {
            const selected = activeButton === category;
            return (
              <TouchableOpacity
                key={category}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  flex: 1,
                  minHeight: 64,
                  paddingVertical: space.md,
                  paddingHorizontal: space.sm,
                  backgroundColor: selected ? color.brand : 'transparent',
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setActiveButton(category)}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  tone={selected ? 'onBrand' : 'brand'}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </AppText>
                <AppText
                  variant="micro"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  tone={selected ? 'onBrand' : 'muted'}
                  style={{ marginTop: 2 }}
                >
                  {tabs[category].hint}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab.banner ? (
          <View style={styles.banner}>
            <AppText variant="body" weight="bold" style={{ color: status.pending.fg }}>
              {tab.banner}
            </AppText>
          </View>
        ) : null}

        {tab.state === 'empty' ? null : (
          <>
            <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: space.md }}>
              <AppText variant="h2" weight="bold">
                Choose Your Preference
              </AppText>
            </View>
            {renderSection(
              'Vegetarian Items',
              require('../../../assets/vegBack.jpg'),
              tab.veg,
              expansion.Veg,
              () => toggleSection(activeButton, 'Veg'),
              !tab.orderable
            )}
            {renderSection(
              'Non-Vegetarian Items',
              require('../../../assets/nonVegBackground.jpeg'),
              tab.nonVeg,
              expansion.NonVeg,
              () => toggleSection(activeButton, 'NonVeg'),
              !tab.orderable
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.bg }}>
      {/* Extra bottom room (FAB height + gap) so the last row can scroll clear of the cart button */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: padding.paddingBottom + CART_FAB_SIZE + space.lg }}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
      <StatusBarScrim background={color.bg} />
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: padding.paddingBottom + space.sm,
          right: space.md,
          backgroundColor: color.brand,
          borderRadius: radius.pill,
          width: CART_FAB_SIZE,
          height: CART_FAB_SIZE,
          justifyContent: 'center',
          alignItems: 'center',
          ...shadow.card,
        }}
        onPress={handleViewCart}
        accessibilityRole="button"
        accessibilityLabel="View cart"
      >
        <Ionicons name="cart-outline" size={28} color={color.onBrand} />
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    marginTop: 10,
  },
  banner: {
    marginTop: space.sm,
    marginHorizontal: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: status.pending.bg,
  },
});

export default HomeScreen;
