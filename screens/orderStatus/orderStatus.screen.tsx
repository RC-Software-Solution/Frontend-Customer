import { View, FlatList, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import CancelModal from '@/components/popupmodel/popupModel';
import { orderService, useAuth, menuService } from '@/services';
import { colomboToday } from '@/services/menu/todayMenu';
import { logApiError } from '@/services/utils/log';
import { Order } from '@/services/types/api.types';
import { useFocusEffect, router } from 'expo-router';
import { useScreenPadding } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState, StaleNotice } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { color, radius, space } from '@/theme';

const STATUS_NOTE: Record<string, string> = { preparing: "Being prepared, so it can't be changed now", delivering: 'Arriving soon' };

const OrderStatus: React.FC = () => {
  const padding = useScreenPadding({ tabBar: true, gutters: false });
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const cancelling = useRef(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<Array<{ food_item_id: number; name: string; meal_type: 'veg' | 'non-veg' | 'other'; quantity: number }>>([]);
  const [availableSessionItems, setAvailableSessionItems] = useState<Array<{ food_item_id: number; name: string; meal_type: 'veg' | 'non-veg' | 'other'; price: number }>>([]);

  const loadOrders = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      // skeleton for the first load only: a reload on focus keeps the cards on screen
      if (!hasLoaded.current) setLoading(true);
      // Fetch undelivered orders for today (pending, preparing, delivering) for all meal times
      const currentOrders = await orderService.getUndeliveredOrdersToday();
      setOrders(currentOrders);
      setError(null);
      hasLoaded.current = true;
    } catch (e) {
      logApiError('Failed to load orders:', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    setError(null);
    setLoading(true);
    loadOrders();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
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
    if (cancelling.current || !selectedOrderId) return;
    cancelling.current = true;

    let failure: string | null = null;
    try {
      await orderService.deleteOrder(selectedOrderId);
    } catch (error: any) {
      logApiError('Failed to cancel order:', error);
      failure = error?.message || 'Please try again.';
    }
    // Close and reload first: a refused cancel may mean the order is already gone.
    setModalVisible(false);
    setSelectedOrderId(null);
    cancelling.current = false;
    loadOrders();
    if (failure) Alert.alert('Could not cancel order', failure);
    else Alert.alert('Success', 'Order cancelled successfully');
  };

  // Open edit modal: map existing order items to food_item_id using the order's target_date session
  const handleOpenEdit = async (order: Order) => {
    try {
      setEditingOrder(order);
      // Fetch session items for the order's target_date and meal_time
      // Cross-day handling: if the session crosses midnight and order is for tomorrow's breakfast/lunch/dinner, we must fetch by the order's own target_date
      const targetDate = order.target_date || colomboToday();
      const sessionItems = await menuService.getMealSessionItemsBySession(order.meal_time as any, targetDate);
      // Build lookup by name for id and meal_type
      const nameToInfo = new Map<string, { food_item_id: number; meal_type: 'veg' | 'non-veg' | 'other' }>();
      const allChoices: Array<{ food_item_id: number; name: string; meal_type: 'veg' | 'non-veg' | 'other'; price: number }> = [];
      sessionItems.forEach((si: any) => {
        const fi = si.foodItem || si.food_item;
        if (fi) {
          const mt = (fi.meal_type === 'non-veg' || fi.meal_type === 'nonveg') ? 'non-veg' : (fi.meal_type === 'veg' ? 'veg' : 'other');
          nameToInfo.set(fi.name, { food_item_id: fi.id, meal_type: mt });
          allChoices.push({ food_item_id: fi.id, name: fi.name, meal_type: mt, price: parseFloat(fi.price) || 0 });
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
    <Card style={{ marginHorizontal: space.md }}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitle}>
          <AppText variant="body" weight="bold">{item.meal_time.charAt(0).toUpperCase() + item.meal_time.slice(1)}</AppText>
          <AppText variant="micro" tone="muted" numberOfLines={1}>{item.order_id}</AppText>
        </View>
        <StatusChip value={item.status} />
      </View>
      {item.items.map((food, index: number) => (
        <View key={index} style={styles.itemLine}>
          <AppText variant="caption" style={styles.itemName}>{food.food_name} x {food.quantity}</AppText>
          <AppText variant="caption" tone="muted">{food.meal_type}</AppText>
        </View>
      ))}
      <View style={styles.separator} />
      <View style={styles.footer}>
        <View>
          <AppText variant="caption" tone="muted">Total</AppText>
          <AppText variant="h2" weight="bold">Rs. {item.total_price.toFixed(2)}</AppText>
        </View>
        {item.status === 'pending' ? (
          <View style={styles.actionsRow}>
            <AppButton title="Edit" variant="outline" onPress={() => handleOpenEdit(item)} style={styles.actionButton} />
            <AppButton
              title="Cancel"
              variant="dangerOutline"
              onPress={() => {
                setSelectedOrderId(item.order_id);
                setModalVisible(true);
              }}
              style={styles.actionButton}
            />
          </View>
        ) : STATUS_NOTE[item.status] ? (
          <AppText variant="micro" tone="muted" style={{ maxWidth: 150, textAlign: 'right' }}>{STATUS_NOTE[item.status]}</AppText>
        ) : null}
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { paddingTop: padding.paddingTop }]}>
      <View style={{ alignItems: 'flex-start', marginTop: 0, marginHorizontal: space.md }}>
        <AppText variant="h1" weight="bold">RC Caterings</AppText>
      </View>
      <View style={styles.titleRow}>
        <AppText variant="h2" weight="bold">My Orders</AppText>
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => router.push('/(routes)/order-history' as never)}
          accessibilityRole="button"
          accessibilityLabel="Order history"
        >
          <AppText variant="caption" weight="bold" tone="brand">Order history</AppText>
          <Ionicons name="chevron-forward" size={18} color={color.brandStrong} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ marginTop: space.md }}>
          <CardSkeleton count={2} />
        </View>
      ) : error && orders.length === 0 ? (
        <View style={styles.centered}>
          <ErrorState title="Couldn't load your orders" error={error} onRetry={retry} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            icon="receipt-outline"
            title="No orders found"
            message="Your current orders will appear here"
            actionLabel="Browse the menu"
            onAction={() => router.push('/(tabs)')}
          />
        </View>
      ) : (
        <FlatList
          testID="orders-list"
          style={{ flex: 1, marginTop: space.md }}
          data={orders}
          keyExtractor={(item) => item.order_id}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={error ? <StaleNotice /> : null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
        />
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
            <AppText variant="h2" weight="bold" style={{ marginBottom: space.sm }}>Edit Order</AppText>
            <ScrollView style={{ flexShrink: 1 }}>
              {editItems.map((it) => (
                <View key={it.food_item_id} style={styles.editItemRow}>
                  <View style={styles.rowText}>
                    <AppText variant="body" weight="bold" numberOfLines={1}>{it.name}</AppText>
                    <AppText variant="caption" tone="muted" numberOfLines={1}>{it.meal_type}</AppText>
                  </View>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: color.field }]}
                      onPress={() => decrementItem(it.food_item_id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease quantity of ${it.name}`}
                    >
                      <Ionicons name="remove" size={24} color={color.ink} />
                    </TouchableOpacity>
                    <AppText variant="body" weight="bold" style={styles.qtyVal}>{it.quantity}</AppText>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: color.brand }]}
                      onPress={() => incrementItem(it.food_item_id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Increase quantity of ${it.name}`}
                    >
                      <Ionicons name="add" size={24} color={color.onBrand} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => removeItem(it.food_item_id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${it.name}`}
                    >
                      <Ionicons name="trash-outline" size={22} color={color.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Add new items */}
            <AppText variant="body" weight="bold" style={{ marginTop: space.sm, marginBottom: space.xs }}>Add Items</AppText>
            <ScrollView style={{ flexShrink: 1 }}>
              {availableSessionItems
                .filter((c) => !editItems.some((e) => e.food_item_id === c.food_item_id))
                .map((c) => (
                  <View key={c.food_item_id} style={styles.editItemRow}>
                    <View style={styles.rowText}>
                      <AppText variant="body" weight="bold" numberOfLines={1}>{c.name}</AppText>
                      <AppText variant="caption" tone="muted" numberOfLines={1}>{c.meal_type} · Rs. {c.price.toFixed(2)}</AppText>
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => addItem(c)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${c.name}`}
                    >
                      <AppText variant="caption" weight="bold" tone="brand">+ Add</AppText>
                    </TouchableOpacity>
                  </View>
                ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <AppButton title="Close" variant="secondary" onPress={() => { setEditVisible(false); setEditingOrder(null); }} style={styles.modalBtn} />
              <AppButton title="Save Changes" onPress={handleSaveEdits} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm + space.xs, marginHorizontal: space.md },
  historyLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingHorizontal: space.xs },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
  cardTitle: { flex: 1 },
  itemLine: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm, marginTop: space.sm + 2 },
  itemName: { flex: 1 },
  separator: { height: 1, backgroundColor: color.border, marginVertical: space.sm + space.xs },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  actionsRow: { flexDirection: 'row', gap: space.sm },
  actionButton: { paddingHorizontal: space.md },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: color.scrim, justifyContent: 'center', alignItems: 'center' },
  modalContainer: {
    backgroundColor: color.surface,
    width: '90%',
    maxHeight: '85%',
    borderRadius: radius.lg,
    padding: space.md,
  },
  editItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm, paddingVertical: space.xs, borderBottomWidth: 1, borderColor: color.border },
  rowText: { flex: 1 },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyVal: { minWidth: 32, textAlign: 'center' },
  iconButton: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  addButton: { minHeight: 48, paddingHorizontal: space.sm, alignItems: 'center', justifyContent: 'center' },
  modalActions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  modalBtn: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrderStatus;
