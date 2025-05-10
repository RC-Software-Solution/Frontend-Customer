import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { useState } from 'react';
import CancelModal from '@/components/popupmodel/popupModel';
// Define TypeScript Interfaces
interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  totalPrice: number;
}

const orders: Order[] = [
  {
    id: '1',
    orderNumber: '5012',
    items: [
      { name: 'Chicken - Full Size Meal', quantity: 2 },
      { name: 'Non Vegetarian - Full Size Meal', quantity: 1 },
    ],
    totalPrice: 780.0,
  },
  {
    id: '2',
    orderNumber: '5013',
    items: [{ name: 'Veg Meal - Medium Size', quantity: 1 }],
    totalPrice: 350.0,
  },
  {
    id: '3',
    orderNumber: '5013',
    items: [
        { name: 'Chicken - Full Size Meal', quantity: 2 },
        { name: 'Non Vegetarian - Full Size Meal', quantity: 1 },
        { name: 'Vegetarian - Full Size Meal', quantity: 4 },
        { name: 'Non Vegetarian - Half Size Meal', quantity: 1 },
      ],
    
    totalPrice: 350.0,
  },
];

const OrderStatus: React.FC = () => {

  const [modalVisible, setModalVisible] = useState(false);

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      {/* Container to align content and button in the same row */}
      <View style={styles.cardContent}>
        <View style={styles.cardTextContent}>
          <Text style={styles.orderNumber}>Order Number - {item.orderNumber}</Text>
          {item.items.map((food: OrderItem, index: number) => (
            <Text key={index} style={styles.itemText}>
              {food.name} - {food.quantity}
            </Text>
          ))}
          <Text style={styles.totalPrice}>Total Price - Rs. {item.totalPrice.toFixed(2)}</Text>
        </View>

        {/* Edit Button Positioned to the Bottom Right */}
        <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
          <Text style={{ color: 'white',fontWeight: "bold", }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'flex-start', marginTop: 70, marginHorizontal: 15 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>RC Caterings</Text>
      </View>
      <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: 15 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#69bf70' }}>My Orders</Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 30,
         
          borderRadius: 20,
          marginBottom: 15,
        }}
      >
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <CancelModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onConfirm={() => {
          setModalVisible(false);
          // Handle cancellation logic
        }} 
        title="Cancel Order"
        message="Are you sure you want to cancel this order?"
        confirmText="Cancel"
        cancelText="Keep"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
   marginHorizontal:15,
    elevation: 5,
    
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'relative', // Make sure the button can be positioned absolutely
    marginTop: 10,
  },

  cardContent: {
    flexDirection: 'row', // Align text and button in a row
    justifyContent: 'space-between', // Space between text and button
    alignItems: 'flex-start', // Align items to the top
    position: 'relative',
  },

  cardTextContent: {
    flex: 1, // Allow text content to take up remaining space
  },

  orderNumber: {
    fontSize: 18,
   
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#0A0A0F',
    marginHorizontal: 10,
  },
  itemText: {
    fontSize: 15,
    color: '#0A0A0F',
    marginHorizontal: 10,
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 14,
    color: '#69bf70',
    marginHorizontal: 10,
  },

  editButton: {
    backgroundColor: '#0A0A0F',
    padding: 8,
    borderRadius: 12,
    position: 'absolute',
    bottom: -1, // Position the button at the bottom of the card
    right: 10, // Position the button at the right of the card
    width: "20%",
   
    alignItems: 'center',
   
  },
});

export default OrderStatus;
