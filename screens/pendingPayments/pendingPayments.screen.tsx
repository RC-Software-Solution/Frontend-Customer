import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { orderService, useAuth } from '@/services';
import { Order } from '@/services/types/api.types';
import { useFocusEffect } from 'expo-router';

const PendingPaymentsScreen = () => {
    const { isAuthenticated, user } = useAuth();
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPendingPayments = async () => {
        if (!isAuthenticated || !user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('Loading pending payments for user:', user.id);
            const orders = await orderService.getPendingPaymentOrders();
            console.log('Received pending payment orders:', orders);
            setPendingOrders(orders);
        } catch (error) {
            console.error('Failed to load pending payments:', error);
            Alert.alert('Error', 'Failed to load pending payments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPendingPayments();
    }, [isAuthenticated, user]);

    // Refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadPendingPayments();
        }, [isAuthenticated, user])
    );

    const renderItem = ({ item }: { item: Order }) => (
        <View style={styles.card}>
            <Image source={require('../../assets/pendPay.png')} style={styles.icon} />
            <View style={styles.orderDetails}>
                <Text style={styles.orderId} numberOfLines={1} ellipsizeMode="tail">
                    Order ID - {item.order_id}
                </Text>
                <Text style={styles.details}>
                    Date: {new Date(item.created_at).toLocaleDateString('en-GB')}
                </Text>
                <Text style={styles.price}>Price: Rs. {item.total_price.toFixed(2)}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={{ alignItems: 'flex-start', marginTop: 70, marginHorizontal: 15 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0A0A0F' }}>RC Caterings</Text>
            </View>
             <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: 15 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#69bf70' }}>Pending Payments</Text>
                  </View>
                  <View style={{ alignItems: 'flex-start', marginTop: 20, marginHorizontal: 15 ,}}>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 25 }}>
                    If you have two unpaid orders, you won't be able to place new ones. Clear payments to continue.
                    </Text>
                  </View>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#69bf70" />
                    <Text style={styles.loadingText}>Loading pending payments...</Text>
                </View>
            ) : pendingOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No pending payments</Text>
                    <Text style={styles.emptySubText}>All your orders are paid</Text>
                </View>
            ) : (
                <FlatList
                    data={pendingOrders}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.order_id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
    description: { fontSize: 14, color: '#666', marginBottom: 15 },
    list: { paddingBottom: 20 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 10,
        marginHorizontal: 15,
        elevation: 5,
        borderColor: '#oaoaoa',
        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        marginTop: 10,
    },
    icon: { width: 90, height: 90, marginRight: 15, marginLeft: 15 },
    orderDetails: {
        flex: 1,
        marginRight: 10,
    },
    orderId: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#69bf70', 
        paddingBottom: 10,
        flexShrink: 1,
    },
    details: { fontSize: 14, color: '#oaoaoa' },
    price: { fontSize: 14, color: '#oaoaoa', fontWeight: 'bold', paddingTop: 10 },
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

export default PendingPaymentsScreen;
