import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderService, useAuth } from '@/services';
import { Order } from '@/services/types/api.types';
import { mealTitle } from '@/services/utils/order-title';
import { logApiError } from '@/services/utils/log';
import { useFocusEffect } from 'expo-router';
import { useScreenPadding } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState, StaleNotice } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { color, radius, space, status } from '@/theme';

const PendingPaymentsScreen = () => {
    const padding = useScreenPadding({ tabBar: true, gutters: false });
    const { isAuthenticated, user } = useAuth();
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);
    const [refreshing, setRefreshing] = useState(false);
    const hasLoaded = useRef(false);

    const loadPendingPayments = async () => {
        if (!isAuthenticated || !user) {
            setLoading(false);
            return;
        }

        try {
            // skeleton for the first load only: a reload on focus keeps the rows on screen
            if (!hasLoaded.current) setLoading(true);
            const orders = await orderService.getPendingPaymentOrders();
            setPendingOrders(orders);
            setError(null);
            hasLoaded.current = true;
        } catch (e) {
            logApiError('Failed to load pending payments:', e);
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    const retry = () => {
        setError(null);
        setLoading(true);
        loadPendingPayments();
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPendingPayments();
        setRefreshing(false);
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
            {error ? <StaleNotice /> : null}
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
                <CardSkeleton count={2} />
            ) : error && pendingOrders.length === 0 ? (
                <View style={styles.centered}>
                    <ErrorState title="Couldn't load your payments" error={error} onRetry={retry} />
                </View>
            ) : pendingOrders.length === 0 ? (
                <View style={styles.centered}>
                    <EmptyState icon="receipt-outline" title="No pending payments" message="All your orders are paid" />
                </View>
            ) : (
                <FlatList
                    testID="payments-list"
                    data={pendingOrders}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.order_id}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
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
