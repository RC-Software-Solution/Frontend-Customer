import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderService, useAuth } from '@/services';
import { Order } from '@/services/types/api.types';
import { mealTitle } from '@/services/utils/order-title';
import { useFocusEffect } from 'expo-router';
import { useScreenPadding } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { color, radius, space, status } from '@/theme';

const PendingPaymentsScreen = () => {
    const padding = useScreenPadding({ tabBar: true, gutters: false });
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
            const orders = await orderService.getPendingPaymentOrders();
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
        <Card style={{ marginHorizontal: space.md }}>
            <View style={styles.cardTop}>
                <View style={styles.cardTitle}>
                    <AppText variant="body" weight="bold">{mealTitle(item)}</AppText>
                    <AppText variant="micro" tone="muted" numberOfLines={1}>{item.order_id}</AppText>
                </View>
                <AppText variant="h2" weight="bold">Rs. {item.total_price.toFixed(2)}</AppText>
            </View>
            <View style={{ marginTop: space.sm }}>
                <StatusChip value={item.status} />
            </View>
        </Card>
    );

    const total = pendingOrders.reduce((sum, o) => sum + o.total_price, 0);

    const header = (
        <View>
            {pendingOrders.length >= 2 ? (
                <View style={styles.banner}>
                    <Ionicons name="alert-circle-outline" size={20} color={status.delivery_failed.fg} style={{ marginTop: 1 }} />
                    <AppText variant="caption" weight="bold" style={styles.bannerText}>
                        You can't place new orders while you have {pendingOrders.length} unpaid orders. Pay these to order again.
                    </AppText>
                </View>
            ) : (
                <AppText variant="caption" tone="muted" style={styles.intro}>
                    Unpaid orders appear here. With 2 unpaid orders you can't place new ones.
                </AppText>
            )}
            <View style={styles.totalCard}>
                <AppText variant="caption" weight="semibold" tone="inverse">Total unpaid</AppText>
                <AppText variant="h1" weight="bold" tone="inverse">Rs. {total.toFixed(2)}</AppText>
                <AppText variant="micro" tone="inverse">{pendingOrders.length} {pendingOrders.length === 1 ? 'order' : 'orders'}</AppText>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: padding.paddingTop }]}>
            <View style={{ alignItems: 'flex-start', marginTop: 0, marginHorizontal: space.md }}>
                <AppText variant="h1" weight="bold">RC Caterings</AppText>
            </View>
            <View style={{ alignItems: 'flex-start', marginTop: space.sm + space.xs, marginBottom: space.sm + space.xs, marginHorizontal: space.md }}>
                <AppText variant="h2" weight="bold">Payments</AppText>
            </View>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={color.brandStrong} />
                    <AppText tone="brand" style={{ marginTop: space.sm }}>Loading pending payments...</AppText>
                </View>
            ) : pendingOrders.length === 0 ? (
                <View style={styles.centered}>
                    <EmptyState icon="receipt-outline" title="No pending payments" message="All your orders are paid" />
                </View>
            ) : (
                <FlatList
                    data={pendingOrders}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.order_id}
                    ListHeaderComponent={header}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: color.bg },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
    cardTitle: { flex: 1 },
    banner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: space.sm + 2,
        marginHorizontal: space.md,
        marginBottom: space.sm + space.xs,
        padding: space.md,
        borderRadius: radius.md,
        backgroundColor: status.delivery_failed.bg,
    },
    bannerText: { flex: 1, color: status.delivery_failed.fg },
    intro: { marginHorizontal: space.md, marginBottom: space.sm + space.xs },
    totalCard: {
        marginHorizontal: space.md,
        marginBottom: space.md,
        padding: space.md,
        borderRadius: radius.lg,
        backgroundColor: color.ink,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PendingPaymentsScreen;
