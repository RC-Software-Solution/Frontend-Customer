import { View, Text, TouchableOpacity, FlatList, Image, Animated, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RenderItem from '@/components/flatList/flatList';
import { router } from 'expo-router';
// Define types for menu categories
type MealType = "Breakfast" | "Lunch" | "Dinner";
type MenuDataType = {
  [key in MealType]: {
    Veg: string[];
    NonVeg: string[];
  };
};

type ExpansionState = {
  [key in MealType]: {
    Veg: boolean;
    NonVeg: boolean;
  };
};

const HomeScreen = () => {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const [timeRemaining, setTimeRemaining] = useState(3 * 3600 + 14 * 60 + 58); // 03:14:58 in seconds
  const [availableOrders, setAvailableOrders] = useState(50); // Placeholder order count
  const [activeButton, setActiveButton] = useState<MealType>("Breakfast");
  const [expansionState, setExpansionState] = useState<ExpansionState>({
    Breakfast: { Veg: false, NonVeg: false },
    Lunch: { Veg: false, NonVeg: false },
    Dinner: { Veg: false, NonVeg: false },
  });

  const menuData: MenuDataType = {
    Breakfast: {
      Veg: ["Veg - Full Meal", "Veg - Half Meal"],
      NonVeg: ["Chicken - Full Meal", "Chicken - Half Meal"],
    },
    Lunch: {
      Veg: ["Veg Biryani", "Paneer Curry", "Dal Tadka"],
      NonVeg: ["Chicken Curry", "Fish Fry"],
    },
    Dinner: {
      Veg: ["Roti with Sabzi", "Veg Fried Rice"],
      NonVeg: ["Butter Chicken", "Mutton Curry"],
    },
  };

  const handleViewCart = () => {
    console.log("View Cart Pressed");
    router.push('/(routes)/cart');
  };

  const toggleVeg = (category: MealType) => {
    setExpansionState(prevState => ({
      ...prevState,
      [category]: { ...prevState[category], Veg: !prevState[category].Veg },
    }));
  };

  const toggleNonVeg = (category: MealType) => {
    setExpansionState(prevState => ({
      ...prevState,
      [category]: { ...prevState[category], NonVeg: !prevState[category].NonVeg },
    }));
  };

  const handleMealSelection = (meal: string, isChecked: boolean) => {
    setSelectedItems(prevState => ({
      ...prevState,
      [meal]: isChecked,
    }));
  };
 
useEffect(() => {
  const timer = setInterval(() => {
    setTimeRemaining(prevTime => {
      if (prevTime <= 0) {
        clearInterval(timer);
        return 0;
      }
      return prevTime - 1;
    });
  }, 1000);

  return () => clearInterval(timer); // Cleanup on unmount
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
        {/* Header */}
        <View style={{ alignItems: "flex-start", marginTop: 70, marginHorizontal: 15 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: "#OAOAOF" }}>
            RC Caterings
          </Text>
        </View>

        {/* Category Selection Tabs */}
        <View style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 30,
          marginHorizontal: 15,
          backgroundColor: "#fff",
          borderRadius: 20,
          marginBottom: 15
        }}>
          {(["Breakfast", "Lunch", "Dinner"] as MealType[]).map((category) => (
            <TouchableOpacity key={category}
              style={{
                paddingVertical: 18,
                paddingHorizontal: 43,
                backgroundColor: activeButton === category ? "#69bf70" : "transparent",
                borderRadius: 16,
              }}
              onPress={() => setActiveButton(category)}
            >
              <Text style={{ color: activeButton === category ? "white" : "#69bf70", fontWeight: "bold" }}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ alignItems: "flex-end", marginTop: 20, marginHorizontal: 15 }}>
          <Text style={{ fontSize: 15, fontWeight: "bold", color: "#OAOAOF" }}>
            Available Orders: {availableOrders}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", marginTop: 8, marginHorizontal: 15 }}>
        <Text style={{ fontSize: 15, fontWeight: "bold", color: "#OAOAOF" }}>
  Remaining time: {formatTime(timeRemaining)}
</Text>

        </View>

        <View style={{ alignItems: "flex-start", marginTop: 20, marginHorizontal: 15 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#OAOAOF" }}>
            Choose Your Preference
          </Text>
        </View>

        {/* Veg Section */}
        <TouchableOpacity onPress={() => toggleVeg(currentCategory)} style={{ marginTop: 20, marginHorizontal: 15 }}>
          <Image source={require('../../../assets/vegBack.jpg')}
            style={{ width: "100%", height: 150, alignSelf: "center", borderRadius: 10, }}
          />
        </TouchableOpacity>
        <Animated.View style={{ height: isVegExpanded ? undefined : 0, overflow: "hidden", marginHorizontal: 15 }}>
          {isVegExpanded && (
            <FlatList
              data={menuData[currentCategory].Veg}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <RenderItem item={item} onPressCheckbox={handleMealSelection} isChecked={selectedItems[item] || false} />
              )}
            />
          )}
        </Animated.View>

        {/* Non-Veg Section */}
        <TouchableOpacity onPress={() => toggleNonVeg(currentCategory)} style={{ marginTop: 20, marginHorizontal: 15 }}>
          <Image source={require('../../../assets/nonVegBackground.jpeg')}
            style={{ width: "100%", height: 150, alignSelf: "center", borderRadius: 10 }}
          />
        </TouchableOpacity>
        <Animated.View style={{ height: isNonVegExpanded ? undefined : 0, overflow: "hidden", marginHorizontal: 16 }}>
          {isNonVegExpanded && (
            <FlatList
              data={menuData[currentCategory].NonVeg}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <RenderItem item={item} onPressCheckbox={handleMealSelection} isChecked={selectedItems[item] || false} />
              )}
            />
          )}
        </Animated.View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <FlatList
        data={[1]} // Dummy data to render the content once
        keyExtractor={() => "mainContent"}
        renderItem={renderContent}
      />
      {/* Floating View Cart Button */}
      <TouchableOpacity style={{
        position: 'absolute',
        bottom: 150,  // Distance from the bottom
        right: 20,   // Distance from the right
        backgroundColor: '#69bf70', // Green color
        padding: 20,
        borderRadius: 50,
        elevation: 5, // Adds shadow on Android
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: "visible",
        width:60,
        height:60

      }}
        onPress={handleViewCart}>
        <Image
          source={require('../../../assets/cart.png')} // Replace with the correct path
          style={{
            width: 80, // Adjust the size of the icon
            height: 80,
            resizeMode: 'contain',
            top: -7,
            left:5,
             // Move it slightly upwards
           
          }}
        />
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = {
  cartButton: {
    position: 'absolute',
    bottom: 20,  // Distance from the bottom
    right: 20,   // Distance from the right
    backgroundColor: '#69bf70', // Green color
    padding: 15,
    borderRadius: 50,
    elevation: 5, // Adds shadow on Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    width: 30, // Adjust the size of the icon
    height: 30,
    resizeMode: 'contain',
  }
};


export default HomeScreen;