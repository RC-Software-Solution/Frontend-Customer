import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import React from 'react';
import { useState, useEffect } from 'react';
import CancelModal from '@/components/popupmodel/popupModel';
import { orderService, useAuth, menuService } from '@/services';
import { Order } from '@/services/types/api.types';
import { useFocusEffect } from 'expo-router';

const OrderStatus: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<Array<{ food_item_id: number; name: string; meal_type: 'veg' | 'non-veg' | 'other'; quantity: number }>>([]);
  const [availableSessionItems, setAvailableSessionItems] = useState<Array<{ food_item_id: number; name: string; meal_type: 'veg' | 'non-veg' | 'other' }>>([]);

  const loadOrders = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch undelivered orders for today (pending, preparing) for all meal times
      const currentOrders = await orderService.getUndeliveredOrdersToday();
      setOrders(currentOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isAuthenticated, user]);

  // Refresh orders when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [isAuthenticated, user])
  );

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;

    try {
      await orderService.deleteOrder(selectedOrderId);
      Alert.alert('Success', 'Order cancelled successfully');
      setModalVisible(false);
      setSelectedOrderId(null);
      loadOrders(); // Refresh the list
    } catch (error) {
      console.error('Failed to cancel order:', error);
      Alert.alert('Error', 'Failed to cancel order. Please try again.');
    }
  };

  // Open edit modal: map existing order items to food_item_id using the order's target_date session
  const handleOpenEdit = async (order: Order) => {
    try {
      setEditingOrder(order);
      // Fetch session items for the order's target_date and meal_time
      // Cross-day handling: if the session crosses midnight and order is for tomorrow's breakfast/lunch/dinner, we must fetch by the order's own target_date
      const targetDate = order.target_date || new Date().toISOString().split('T')[0];
      const sessionItems = await menuService.getMealSessionItemsBySession(order.meal_time as any, targetDate);
      // Build lookup by name for id and meal_type
      const nameToInfo = new Map<string, { food_item_id: number; meal_type: 'veg' | 'non-veg' | 'other' }>();
      const allChoices: Array<{ food_item_id: number; name: string; meal_type: 'veg' | 'non-veg' | 'other' }> = [];
      sessionItems.forEach((si: any) => {
        const fi = si.foodItem || si.food_item;
        if (fi) {
          const mt = (fi.meal_type === 'non-veg' || fi.meal_type === 'nonveg') ? 'non-veg' : (fi.meal_type === 'veg' ? 'veg' : 'other');
          nameToInfo.set(fi.name, { food_item_id: fi.id, meal_type: mt });
          allChoices.push({ food_item_id: fi.id, name: fi.name, meal_type: mt });
        }
      });
      setAvailableSessionItems(allChoices);

      // Map existing order items
      const mapped = order.items.map((it) => {
        const info = nameToInfo.get(it.food_name);
        return {
          food_item_id: info?.food_item_id || 0,
          name: it.food_name,
          meal_type: (it.meal_type === 'non-veg' || (it as any).meal_type === 'nonveg') ? 'non-veg' : (it.meal_type as any) || 'other',
          quantity: it.quantity,
        };
      });
      setEditItems(mapped);
      setEditVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to open editor. Please try again.');
    }
  };

  const incrementItem = (food_item_id: number) => {
    setEditItems((prev) => prev.map((it) => it.food_item_id === food_item_id ? { ...it, quantity: it.quantity + 1 } : it));
  };
  const decrementItem = (food_item_id: number) => {
    setEditItems((prev) => prev.map((it) => it.food_item_id === food_item_id ? { ...it, quantity: Math.max(0, it.quantity - 1) } : it));
  };
  const removeItem = (food_item_id: number) => {
    setEditItems((prev) => prev.filter((it) => it.food_item_id !== food_item_id));
  };
  const addItem = (choice: { food_item_id: number; name: string; meal_type: 'veg' | 'non-veg' | 'other' }) => {
    setEditItems((prev) => {
      if (prev.some((it) => it.food_item_id === choice.food_item_id)) return prev;
      return [...prev, { food_item_id: choice.food_item_id, name: choice.name, meal_type: choice.meal_type, quantity: 1 }];
    });
  };

  const handleSaveEdits = async () => {
    if (!editingOrder) return;
    try {
      // If all quantities are zero or list empty => cancel order
      const filtered = editItems.filter((it) => it.quantity > 0 && it.food_item_id);
      if (filtered.length === 0) {
        await orderService.deleteOrder(editingOrder.order_id);
        Alert.alert('Success', 'Order cancelled successfully');
        setEditVisible(false);
        setEditingOrder(null);
        loadOrders();
        return;
      }

      const payload = {
        items: filtered.map((it) => ({ food_item_id: it.food_item_id, quantity: it.quantity }))
      };
      await orderService.updateOrder(editingOrder.order_id, payload as any);
      Alert.alert('Success', 'Order updated successfully');
      setEditVisible(false);
      setEditingOrder(null);
      loadOrders();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save changes');
    }
  };

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardTextContent}>
          <Text style={styles.orderNumber}>Order ID - {item.order_id}</Text>
          <Text style={styles.statusText}>Status - {item.status.toUpperCase()}</Text>
          <Text style={styles.mealTimeText}>Meal Time - {item.meal_time.toUpperCase()}</Text>
          {item.items.map((food, index: number) => (
            <Text key={index} style={styles.itemText}>
              {food.food_name} - {food.quantity} ({food.meal_type})
            </Text>
          ))}
          <Text style={styles.totalPrice}>Total Price - Rs. {item.total_price.toFixed(2)}</Text>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#0A0A0F' }]} 
          onPress={() => handleOpenEdit(item)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#d9534f' }]} 
          onPress={() => {
            setSelectedOrderId(item.order_id);
            setModalVisible(true);
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancel</Text>
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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#69bf70" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubText}>Your current orders will appear here</Text>
        </View>
      ) : (
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
            keyExtractor={(item) => item.order_id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
      <CancelModal 
        visible={modalVisible} 
        onClose={() => {
          setModalVisible(false);
          setSelectedOrderId(null);
        }} 
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep Order"
      />

      {/* Edit Modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Order</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {editItems.map((it) => (
                <View key={it.food_item_id} style={styles.editItemRow}>
                  <Text style={styles.editItemText}>{it.name} ({it.meal_type})</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementItem(it.food_item_id)}><Text>-</Text></TouchableOpacity>
                    <Text style={styles.qtyVal}>{it.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementItem(it.food_item_id)}><Text>+</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(it.food_item_id)}><Text style={{ color: '#d9534f' }}>Remove</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Add new items */}
            <Text style={[styles.modalSubtitle, { marginTop: 10 }]}>Add Items</Text>
            <ScrollView style={{ maxHeight: 160 }}>
              {availableSessionItems
                .filter((c) => !editItems.some((e) => e.food_item_id === c.food_item_id))
                .map((c) => (
                  <TouchableOpacity key={c.food_item_id} style={styles.addChoiceRow} onPress={() => addItem(c)}>
                    <Text style={styles.addChoiceText}>{c.name} ({c.meal_type})</Text>
                    <Text style={{ color: '#69bf70', fontWeight: 'bold' }}>+ Add</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ddd' }]} onPress={() => { setEditVisible(false); setEditingOrder(null); }}>
                <Text>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#69bf70' }]} onPress={handleSaveEdits}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginHorizontal: 10 },
  actionButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#69bf70',
    marginHorizontal: 10,
    marginBottom: 5,
  },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', width: '90%', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0A0A0F', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, fontWeight: 'bold', color: '#0A0A0F', marginBottom: 6 },
  editItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  editItemText: { fontSize: 15, color: '#0A0A0F' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  qtyVal: { minWidth: 20, textAlign: 'center', fontWeight: 'bold' },
  removeBtn: { marginLeft: 8 },
  addChoiceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  addChoiceText: { fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  mealTimeText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
    marginBottom: 10,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
});

export default OrderStatus;
