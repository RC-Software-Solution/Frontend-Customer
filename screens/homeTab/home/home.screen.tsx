import { View, Text, TouchableOpacity, FlatList, Image, Animated, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RenderItem from '@/components/flatList/flatList';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/store/cartSlice';
import { RootState } from '@/store';

// Define types for menu categories
type MealType = 'breakfast' | 'lunch' | 'dinner';
export type MenuItem = {
  name: string;
  description: string;
  price: number;
};
type MenuDataType = {
  [key in MealType]: {
    Veg: MenuItem[];
    NonVeg: MenuItem[];
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
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const [timeRemaining, setTimeRemaining] = useState(3 * 3600 + 14 * 60 + 58);
  const [availableOrders, setAvailableOrders] = useState(50);
  const [activeButton, setActiveButton] = useState<MealType>('breakfast');
  const [expansionState, setExpansionState] = useState<ExpansionState>({
    breakfast: { Veg: false, NonVeg: false },
    lunch: { Veg: false, NonVeg: false },
    dinner: { Veg: false, NonVeg: false },
  });

  const menuData: MenuDataType = {
    breakfast: {
      Veg: [
        { name: 'Veg - Full Meal', description: 'Full vegetarian breakfast meal', price: 260 },
        { name: 'Veg - Half Meal', description: 'Half vegetarian breakfast meal', price: 240 },
      ],
      NonVeg: [
        { name: 'Chicken - Full Meal', description: 'Full chicken breakfast meal', price: 280 },
        { name: 'Chicken - Half Meal', description: 'Half chicken breakfast meal', price: 260 },
      ],
    },
    lunch: {
      Veg: [
        { name: 'Veg Biryani', description: 'Spiced vegetarian biryani', price: 220 },
        { name: 'Paneer Curry', description: 'Creamy paneer curry', price: 200 },
        { name: 'Dal Tadka', description: 'Tempered lentil curry', price: 180 },
      ],
      NonVeg: [
        { name: 'Chicken Curry', description: 'Spicy chicken curry', price: 250 },
        { name: 'Fish Fry', description: 'Crispy fried fish', price: 270 },
      ],
    },
    dinner: {
      Veg: [
        { name: 'Roti with Sabzi', description: 'Roti with mixed vegetable curry', price: 200 },
        { name: 'Veg Fried Rice', description: 'Vegetable fried rice', price: 190 },
      ],
      NonVeg: [
        { name: 'Butter Chicken', description: 'Creamy butter chicken', price: 300 },
        { name: 'Mutton Curry', description: 'Spicy mutton curry', price: 320 },
      ],
    },
  };

  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const handleViewCart = () => {
    const selectedList = Object.keys(selectedItems).filter((item) => selectedItems[item]);

    const cartFormattedItems = selectedList.map((name) => {
      let description = '';
      let mealType: 'veg' | 'non-veg' | 'other' = 'other';
      let price = 250;
      for (const mealTime of ['breakfast', 'lunch', 'dinner'] as MealType[]) {
        const vegItem = menuData[mealTime].Veg.find((item) => item.name === name);
        const nonVegItem = menuData[mealTime].NonVeg.find((item) => item.name === name);
        if (vegItem) {
          description = vegItem.description;
          mealType = 'veg';
          price = vegItem.price;
        } else if (nonVegItem) {
          description = nonVegItem.description;
          mealType = 'non-veg';
          price = nonVegItem.price;
        }
      }

      return {
        id: name,
        name,
        price,
        quantity: 1,
        image: require('../../../assets/plate.jpeg'),
        meal_type: mealType,
        meal_time: activeButton,
        description,
      };
    });

    const itemsToAdd = cartFormattedItems.filter(
      (newItem) => !cartItems.some((existingItem: { name: string }) => existingItem.name === newItem.name)
    );

    itemsToAdd.forEach((item) => dispatch(addToCart(item)));

    router.push('/(routes)/cart');
  };

  const toggleVeg = (category: MealType) => {
    setExpansionState((prevState) => ({
      ...prevState,
      [category]: { ...prevState[category], Veg: !prevState[category].Veg },
    }));
  };

  const toggleNonVeg = (category: MealType) => {
    setExpansionState((prevState) => ({
      ...prevState,
      [category]: { ...prevState[category], NonVeg: !prevState[category].NonVeg },
    }));
  };

  const handleMealSelection = (meal: string, isChecked: boolean) => {
    setSelectedItems((prevState) => ({
      ...prevState,
      [meal]: isChecked,
    }));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderContent = () => {
    const currentCategory = activeButton;
    const isVegExpanded = expansionState[currentCategory].Veg;
    const isNonVegExpanded = expansionState[currentCategory].NonVeg;

    return (
      <View>
        <View style={{ alignItems: 'flex-start', marginTop: 70, marginHorizontal: 15 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>
            RC Caterings
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 30,
            marginHorizontal: 15,
            backgroundColor: '#fff',
            borderRadius: 20,
            marginBottom: 15,
          }}
        >
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((category) => (
            <TouchableOpacity
              key={category}
              style={{
                paddingVertical: 18,
                paddingHorizontal: 43,
                backgroundColor: activeButton === category ? '#69bf70' : 'transparent',
                borderRadius: 16,
              }}
              onPress={() => setActiveButton(category)}
            >
              <Text style={{ color: activeButton === category ? 'white' : '#69bf70', fontWeight: 'bold' }}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ alignItems: 'flex-end', marginTop: 20, marginHorizontal: 15 }}>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0A0A0F' }}>
            Available Orders: {availableOrders}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginTop: 8, marginHorizontal: 15 }}>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0A0A0F' }}>
            Remaining time: {formatTime(timeRemaining)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: 15 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0A0A0F' }}>
            Choose Your Preference
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleVeg(currentCategory)}
          style={{ marginTop: 20, marginHorizontal: 15 }}
        >
          <Image
            source={require('../../../assets/vegBack.jpg')}
            style={{ width: '100%', height: 150, alignSelf: 'center', borderRadius: 10 }}
          />
        </TouchableOpacity>
        <Animated.View style={{ height: isVegExpanded ? undefined : 0, overflow: 'hidden', marginHorizontal: 15 }}>
          {isVegExpanded && (
            <FlatList
              data={menuData[currentCategory].Veg}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <RenderItem
                  item={item}
                  onPressCheckbox={handleMealSelection}
                  isChecked={selectedItems[item.name] || false}
                />
              )}
            />
          )}
        </Animated.View>
        <TouchableOpacity
          onPress={() => toggleNonVeg(currentCategory)}
          style={{ marginTop: 20, marginHorizontal: 15 }}
        >
          <Image
            source={require('../../../assets/nonVegBackground.jpeg')}
            style={{ width: '100%', height: 150, alignSelf: 'center', borderRadius: 10 }}
          />
        </TouchableOpacity>
        <Animated.View style={{ height: isNonVegExpanded ? undefined : 0, overflow: 'hidden', marginHorizontal: 16 }}>
          {isNonVegExpanded && (
            <FlatList
              data={menuData[currentCategory].NonVeg}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <RenderItem
                  item={item}
                  onPressCheckbox={handleMealSelection}
                  isChecked={selectedItems[item.name] || false}
                />
              )}
            />
          )}
        </Animated.View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <FlatList data={[1]} keyExtractor={() => 'mainContent'} renderItem={renderContent} />
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 150,
          right: 20,
          backgroundColor: '#69bf70',
          padding: 20,
          borderRadius: 50,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3.84,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
          width: 60,
          height: 60,
        }}
        onPress={handleViewCart}
      >
        <Image
          source={require('../../../assets/cart.png')}
          style={{
            width: 80,
            height: 80,
            resizeMode: 'contain',
            top: -7,
            left: 5,
          }}
        />
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  cartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#69bf70',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});

export default HomeScreen;