import { View, Text, TouchableOpacity, ScrollView, Image, Animated, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RenderItem from '@/components/flatList/flatList';
import { router, useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/store/cartSlice';
import { RootState } from '@/store';
import { menuService, useAuth } from '@/services';
import { FoodItem } from '@/services/types/api.types';
import { useScreenPadding, StatusBarScrim } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { color, space, radius, shadow } from '@/theme';

const CART_FAB_SIZE = 60;

// Define types for menu categories
type MealType = 'breakfast' | 'lunch' | 'dinner';
export type MenuItem = {
  name: string;
  description: string;
  price: number;
};
type MenuDataType = {
  [key in MealType]: {
    Veg: FoodItem[];
    NonVeg: FoodItem[];
  };
};
type ExpansionState = {
  [key in MealType]: {
    Veg: boolean;
    NonVeg: boolean;
  };
};

// Helper function to normalize meal_type
const normalizeMealType = (mealType: string): 'veg' | 'non-veg' | 'other' => {
  const lowerCase = mealType.toLowerCase();
  if (lowerCase === 'veg') return 'veg';
  if (lowerCase === 'nonveg' || lowerCase === 'non-veg') return 'non-veg';
  return 'other'; // Fallback for safety
};

const HomeScreen = () => {
  const { isAuthenticated } = useAuth();
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const [activeButton, setActiveButton] = useState<MealType>('breakfast');
  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState<MenuDataType>({
    breakfast: { Veg: [], NonVeg: [] },
    lunch: { Veg: [], NonVeg: [] },
    dinner: { Veg: [], NonVeg: [] },
  });
  const [expansionState, setExpansionState] = useState<ExpansionState>({
    breakfast: { Veg: false, NonVeg: false },
    lunch: { Veg: false, NonVeg: false },
    dinner: { Veg: false, NonVeg: false },
  });
  const [effectiveDates, setEffectiveDates] = useState<{ [key in MealType]: string | null }>({
    breakfast: null,
    lunch: null,
    dinner: null,
  });
  const [dateLabels, setDateLabels] = useState<{ [key in MealType]: string }>({
    breakfast: '',
    lunch: '',
    dinner: '',
  });

  const padding = useScreenPadding({ tabBar: true, gutters: false });
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const loadMenuData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load meal session items for each meal time using smart lookup
      // Do not pass a UTC-sliced date; let the service use true local date
      const [breakfastResult, lunchResult, dinnerResult] = await Promise.all([
        menuService.getSmartMealSessionItems('breakfast'),
        menuService.getSmartMealSessionItems('lunch'),
        menuService.getSmartMealSessionItems('dinner'),
      ]);

      const breakfastItems = breakfastResult.items;
      const lunchItems = lunchResult.items;
      const dinnerItems = dinnerResult.items;

      console.log('🌅 Loaded breakfast items:', breakfastItems?.length || 0, 'date:', breakfastResult.date, 'isCurrent:', breakfastResult.isCurrentDay);
      console.log('🌞 Loaded lunch items:', lunchItems?.length || 0, 'date:', lunchResult.date, 'isCurrent:', lunchResult.isCurrentDay);
      console.log('🌙 Loaded dinner items:', dinnerItems?.length || 0, 'date:', dinnerResult.date, 'isCurrent:', dinnerResult.isCurrentDay);
      console.log('🌅 Breakfast items data:', JSON.stringify(breakfastItems, null, 2));
      console.log('🌞 Lunch items data:', JSON.stringify(lunchItems, null, 2));
      console.log('🌙 Dinner items data:', JSON.stringify(dinnerItems, null, 2));

      // Helper function to separate items by meal type
      const separateByMealType = (items: any[]) => {
        const vegItems: FoodItem[] = [];
        const nonVegItems: FoodItem[] = [];
        
        // Ensure items is an array
        if (!Array.isArray(items)) {
          console.log('⚠️ Items is not an array:', items);
          return { vegItems, nonVegItems };
        }
        
        items.forEach(item => {
          if (item.foodItem) {
            const foodItem: FoodItem = {
              id: item.foodItem.id,
              name: item.foodItem.name,
              description: item.foodItem.description,
              price: item.foodItem.price,
              meal_type: item.foodItem.meal_type,
              image_url: item.foodItem.image_url,
              created_at: item.foodItem.created_at,
              updated_at: item.foodItem.updated_at
            };
            
            if (item.foodItem.meal_type === 'veg') {
              vegItems.push(foodItem);
            } else if (item.foodItem.meal_type === 'non-veg') {
              nonVegItems.push(foodItem);
            }
          }
        });
        
        return { vegItems, nonVegItems };
      };

      // Separate items by meal type for each meal time
      const breakfastSeparated = separateByMealType(breakfastItems);
      const lunchSeparated = separateByMealType(lunchItems);
      const dinnerSeparated = separateByMealType(dinnerItems);

      // Organize items by meal time
      const newMenuData: MenuDataType = {
        breakfast: { 
          Veg: breakfastSeparated.vegItems, 
          NonVeg: breakfastSeparated.nonVegItems 
        },
        lunch: { 
          Veg: lunchSeparated.vegItems, 
          NonVeg: lunchSeparated.nonVegItems 
        },
        dinner: { 
          Veg: dinnerSeparated.vegItems, 
          NonVeg: dinnerSeparated.nonVegItems 
        },
      };

      setMenuData(newMenuData);
      setEffectiveDates({
        breakfast: breakfastResult.date,
        lunch: lunchResult.date,
        dinner: dinnerResult.date,
      });
      
      // Set date labels for display
      setDateLabels({
        breakfast: menuService.formatDateForDisplay(breakfastResult.date, breakfastResult.isCurrentDay),
        lunch: menuService.formatDateForDisplay(lunchResult.date, lunchResult.isCurrentDay),
        dinner: menuService.formatDateForDisplay(dinnerResult.date, dinnerResult.isCurrentDay),
      });
      
    } catch (error) {
      console.error('Failed to load menu data:', error);
      Alert.alert('Error', 'Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCart = () => {
    const selectedList = Object.keys(selectedItems).filter((item) => selectedItems[item]);

    const cartFormattedItems = selectedList.map((name) => {
      let description = '';
      let mealType: 'veg' | 'non-veg' | 'other' = 'other';
      let price = 250;
      let foodItem: FoodItem | undefined;

      // Find the food item in the current meal time's menu
      const vegItem = menuData[activeButton].Veg.find((item) => item.name === name);
      const nonVegItem = menuData[activeButton].NonVeg.find((item) => item.name === name);
      
      if (vegItem) {
        foodItem = vegItem;
        description = vegItem.description;
        mealType = 'veg';
        price = parseFloat(vegItem.price);
      } else if (nonVegItem) {
        foodItem = nonVegItem;
        description = nonVegItem.description;
        mealType = 'non-veg';
        price = parseFloat(nonVegItem.price);
      }

      return {
        id: foodItem?.id.toString() || name,
        food_item_id: foodItem?.id,
        name,
        price,
        quantity: 1,
        image: foodItem?.image_url ? { uri: foodItem.image_url } : require('../../../assets/plate.jpeg'),
        meal_type: mealType,
        meal_time: activeButton,
        description,
        // Preserve the effective session date for ordering
        session_date: effectiveDates[activeButton] || null,
      };
    });

    const itemsToAdd = cartFormattedItems.filter(
      (newItem) => !cartItems.some((existingItem: { name: string }) => existingItem.name === newItem.name)
    );

    itemsToAdd.forEach((item) => dispatch(addToCart(item)));

    router.push('/(routes)/cart');
  };

  const toggleVeg = (category: MealType) => {
    const newVegState = !expansionState[category].Veg;
    console.log('🥬 Toggle Veg:', category, 'Current:', expansionState[category].Veg, 'New:', newVegState);
    console.log('🥬 Veg items available:', menuData[category].Veg.length);
    
    setExpansionState((prevState) => ({
      ...prevState,
      [category]: { ...prevState[category], Veg: newVegState },
    }));
  };

  const toggleNonVeg = (category: MealType) => {
    const newNonVegState = !expansionState[category].NonVeg;
    console.log('🍖 Toggle Non-Veg:', category, 'Current:', expansionState[category].NonVeg, 'New:', newNonVegState);
    console.log('🍖 Non-Veg items available:', menuData[category].NonVeg.length);
    
    setExpansionState((prevState) => ({
      ...prevState,
      [category]: { ...prevState[category], NonVeg: newNonVegState },
    }));
  };

  const handleMealSelection = (meal: string, isChecked: boolean) => {
    setSelectedItems((prevState) => ({
      ...prevState,
      [meal]: isChecked,
    }));
  };

  useEffect(() => {
    loadMenuData();
  }, [isAuthenticated]);

  // Refresh menu data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMenuData();
    }, [isAuthenticated])
  );


  const renderContent = () => {
    const currentCategory = activeButton;
    const isVegExpanded = expansionState[currentCategory].Veg;
    const isNonVegExpanded = expansionState[currentCategory].NonVeg;

    

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#69bf70" />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please log in to view menu items</Text>
        </View>
      );
    }

    return (
      <View>
        <View style={{ alignItems: 'flex-start', marginTop: padding.paddingTop, marginHorizontal: space.md }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>
            RC Caterings
          </Text>
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
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((category) => (
            <TouchableOpacity
              key={category}
              style={{
                flex: 1,
                paddingVertical: space.md,
                paddingHorizontal: space.sm,
                backgroundColor: activeButton === category ? color.brand : 'transparent',
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
                tone={activeButton === category ? 'inverse' : 'brand'}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </AppText>
              {dateLabels[category] ? (
                <AppText
                  variant="micro"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  tone={activeButton === category ? 'inverse' : 'brand'}
                  style={{ marginTop: 2, opacity: 0.8 }}
                >
                  {dateLabels[category]}
                </AppText>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: space.md }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0A0A0F' }}>
            Choose Your Preference
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleVeg(currentCategory)}
          style={{ marginTop: 20, marginHorizontal: space.md }}
        >
          <Image
            source={require('../../../assets/vegBack.jpg')}
            style={{ width: '100%', height: 150, alignSelf: 'center', borderRadius: 10 }}
          />
        </TouchableOpacity>
        <Animated.View style={{ height: isVegExpanded ? undefined : 0, overflow: 'hidden', marginHorizontal: space.md }}>
          {isVegExpanded && (
            <View>
              <AppText variant="body" weight="bold" tone="brand" style={{ marginBottom: space.sm }}>
                Vegetarian Items ({menuData[currentCategory].Veg.length})
              </AppText>
              {menuData[currentCategory].Veg.map((item) => (
                <RenderItem
                  key={item.id}
                  item={{
                    name: item.name,
                    description: item.description,
                    price: parseFloat(item.price),
                  }}
                  onPressCheckbox={handleMealSelection}
                  isChecked={selectedItems[item.name] || false}
                />
              ))}
            </View>
          )}
        </Animated.View>
        <TouchableOpacity
          onPress={() => toggleNonVeg(currentCategory)}
          style={{ marginTop: 20, marginHorizontal: space.md }}
        >
          <Image
            source={require('../../../assets/nonVegBackground.jpeg')}
            style={{ width: '100%', height: 150, alignSelf: 'center', borderRadius: 10 }}
          />
        </TouchableOpacity>
        <Animated.View style={{ height: isNonVegExpanded ? undefined : 0, overflow: 'hidden', marginHorizontal: space.md }}>
          {isNonVegExpanded && (
            <View>
              <AppText variant="body" weight="bold" tone="brand" style={{ marginBottom: space.sm }}>
                Non-Vegetarian Items ({menuData[currentCategory].NonVeg.length})
              </AppText>
              {menuData[currentCategory].NonVeg.map((item) => (
                <RenderItem
                  key={item.id}
                  item={{
                    name: item.name,
                    description: item.description,
                    price: parseFloat(item.price),
                  }}
                  onPressCheckbox={handleMealSelection}
                  isChecked={selectedItems[item.name] || false}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Extra bottom room (FAB height + gap) so the last row can scroll clear of the cart button */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: padding.paddingBottom + CART_FAB_SIZE + space.lg }}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
      <StatusBarScrim background="#f5f5f5" />
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
        <Image
          source={require('../../../assets/cart.png')}
          style={{ width: 30, height: 30, resizeMode: 'contain' }}
        />
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
    fontSize: 16,
    color: '#69bf70',
    fontWeight: '500',
  },
});

export default HomeScreen;