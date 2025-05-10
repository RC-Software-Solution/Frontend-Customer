import React, { useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNavigation } from "@react-navigation/native";
const CartScreen = () => {
  const [basket, setBasket] = useState([
    { id: "1", name: "Chicken - Full Size Meal", price: 260, quantity: 1, image: require('../../assets/plate.jpeg') },
    { id: "2", name: "Chicken - Half Size Meal", price: 240, quantity: 1, image: require('../../assets/plate.jpeg') },
  ]);

  const updateQuantity = (id: string, action: "increase" | "decrease") => {
    setBasket((prevBasket) =>
      prevBasket.map((item) =>
        item.id === id
          ? { ...item, quantity: action === "increase" ? item.quantity + 1 : Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

 
    const navigation = useNavigation();
  const removeItem = (id: string) => {
    setBasket((prevBasket) => prevBasket.filter((item) => item.id !== id));
  };
  
  const totalAmount = basket.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalQuantity = basket.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <View style={styles.container}>
       <TouchableOpacity style={styles.backButton}  onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>

      <Text style={styles.header}>🛒 Food Basket</Text>
      <FlatList
        data={basket}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Image source={item.image} style={styles.image} />
            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>Rs. {item.price.toFixed(2)}</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity onPress={() => updateQuantity(item.id, "decrease")} style={styles.button}>
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.id, "increase")} style={styles.button}>
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeButton}>
              <Text style={styles.removeText}>✖</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Parcel Quantity: {totalQuantity}</Text>
        <Text style={styles.summaryText}>Total: Rs. {totalAmount.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.confirmButton}>
        <Text style={styles.confirmText}>CONFIRM ORDER</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", color: "#69bf70", textAlign: "center", marginBottom: 30,marginTop:60 },
  itemContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9f9f9", padding: 14, borderRadius: 20, marginBottom: 10, elevation: 5,
    
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'relative', // Make sure the button can be positioned absolutely
    marginTop: 10,
  marginHorizontal: 16, },
  image: { width: 70, height: 70, borderRadius: 10 },
  details: { flex: 1, marginLeft: 10 },
  name: { fontSize: 16, fontWeight: "bold" },
  price: { fontSize: 14, color: "#666" },
  quantityControl: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  button: { backgroundColor: "#ddd", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  buttonText: { fontSize: 18, fontWeight: "bold" },
  quantity: { marginHorizontal: 10, fontSize: 16, fontWeight: "bold" },
  removeButton: { padding: 10 },
  removeText: { fontSize: 18, color: "red" },
  summary: { flexDirection: "row", justifyContent: "space-between", padding: 20, borderTopWidth: 1, borderColor: "#ddd", marginTop: 10, marginHorizontal: 16 },
  summaryText: { fontSize: 16, fontWeight: "bold" },
  confirmButton: { backgroundColor: "#69bf70", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 , marginBottom: 50, width: "90%", alignSelf: "center", marginHorizontal: 16},
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  backButton: { position: "absolute", top: 50, left: 20, zIndex: 10 },
});


export default CartScreen