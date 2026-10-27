import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { orderService } from '@/services';
import { Order } from '@/services/types/api.types';
import { mealTitle } from '@/services/utils/order-title';
import { logApiError } from '@/services/utils/log';
import { useScreenPadding } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { StatusChip } from '@/components/ui/StatusChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState, StaleNotice } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { color, space } from '@/theme';

const PAGE_SIZE = 20;
const MORE_FAILED = "Couldn't load more. Try again";

type Phase = 'loading' | 'ready' | 'error';

// Every order the customer has ever placed, newest first, one flat list (the Orders tab only shows today's).
// The server returns no total, so a page of exactly PAGE_SIZE means "maybe more".
const OrderHistoryScreen: React.FC = () => {
  const padding = useScreenPadding({ gutters: false });
  const [items, setItems] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [loadError, setLoadError] = useState<any>(null);
  const generation = useRef(0); // a refresh makes any page request still in flight stale
  const fetchingMore = useRef(false);

  const loadFirst = useCallback(async (keepOnError: boolean) => {
    try {
      const rows = await orderService.getOrderHistory(1, PAGE_SIZE);
      generation.current++; // only a refresh that worked makes an in-flight page stale: a failed one must not strand it
      setItems(rows);
      setPage(1);
      setHasMore(rows.length === PAGE_SIZE);
      setMoreFailed(false);
      setLoadingMore(false);
      fetchingMore.current = false;
      setRefreshFailed(false);
      setLoadError(null);
      setPhase('ready');
    } catch (error) {
      logApiError('Failed to load order history:', error);
      if (keepOnError) setRefreshFailed(true);
      else {
        setLoadError(error);
        setPhase('error');
      }
    }
  }, []);

  useEffect(() => {
    loadFirst(false);
  }, [loadFirst]);

  const retryFirst = () => {
    setLoadError(null);
    setPhase('loading');
    loadFirst(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFirst(true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (fetchingMore.current) return;
    fetchingMore.current = true;
    const mine = generation.current;
    setMoreFailed(false);
    setLoadingMore(true);
    try {
      const rows = await orderService.getOrderHistory(page + 1, PAGE_SIZE);
      if (mine !== generation.current) return;
      setItems((prev) => {
        const seen = new Set(prev.map((o) => o.order_id));
        return [...prev, ...rows.filter((o) => !seen.has(o.order_id))];
      });
      setPage(page + 1);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (error) {
      logApiError('Failed to load more order history:', error);
      if (mine === generation.current) setMoreFailed(true);
    } finally {
      if (mine === generation.current) {
        setLoadingMore(false);
        fetchingMore.current = false;
      }
    }
  };

  const onEndReached = () => {
    if (phase === 'ready' && hasMore && !loadingMore && !refreshing && !moreFailed) loadMore();
  };

  const renderItem = ({ item }: { item: Order }) => (
    <Card style={{ marginHorizontal: space.md }}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitle}>
          <AppText variant="body" weight="bold">{mealTitle(item)}</AppText>
          <AppText variant="micro" tone="muted" numberOfLines={1}>{item.order_id}</AppText>
        </View>
        <StatusChip value={item.status} />
      </View>
      {item.items.map((food, index) => (
        <View key={index} style={styles.itemLine}>
          <AppText variant="caption" style={styles.itemName}>{food.food_name} x {food.quantity}</AppText>
          <AppText variant="caption" tone="muted">{food.meal_type}</AppText>
        </View>
      ))}
      <View style={styles.separator} />
      <View>
        <AppText variant="caption" tone="muted">Total</AppText>
        <AppText variant="h2" weight="bold">Rs. {item.total_price.toFixed(2)}</AppText>
      </View>
    </Card>
  );

  const footer = loadingMore ? (
    <ActivityIndicator style={styles.footer} accessibilityLabel="Loading more" color={color.brandStrong} />
  ) : moreFailed ? (
    <TouchableOpacity
      style={[styles.footer, styles.moreRetry]}
      onPress={loadMore}
      accessibilityRole="button"
      accessibilityLabel={MORE_FAILED}
    >
      <AppText tone="brand" weight="bold">{MORE_FAILED}</AppText>
    </TouchableOpacity>
  ) : null;

  return (
    <View style={[styles.container, { paddingTop: padding.paddingTop }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color={color.ink} />
        </TouchableOpacity>
        <AppText variant="h2" weight="bold">Order history</AppText>
      </View>

      {phase === 'loading' ? (
        <View style={{ marginTop: space.sm }}>
          <CardSkeleton count={3} />
        </View>
      ) : phase === 'error' ? (
        <View style={styles.centered}>
          {/* a server answer (numeric non-zero status) gets the generic wording; no response, or an error without a status, keeps the offline sentence */}
          <ErrorState
            title="Couldn't load your order history"
            error={loadError}
            message={typeof loadError?.status === 'number' && loadError.status !== 0 ? undefined : 'Check your connection and try again.'}
            onRetry={retryFirst}
          />
        </View>
      ) : (
        <FlatList
          testID="history-list"
          style={styles.list}
          data={items}
          keyExtractor={(o) => o.order_id}
          renderItem={renderItem}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[color.brandStrong]} />}
          ListHeaderComponent={refreshFailed ? <StaleNotice /> : undefined}
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title="No order history yet" message="Orders you have placed will appear here." />
          }
          ListFooterComponent={footer ?? undefined}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ paddingBottom: padding.paddingBottom }, items.length === 0 && styles.emptyContent]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, gap: space.xs },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, marginTop: space.sm },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
  cardTitle: { flex: 1 },
  itemLine: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm, marginTop: space.sm + 2 },
  itemName: { flex: 1 },
  separator: { height: 1, backgroundColor: color.border, marginVertical: space.sm + space.xs },
  footer: { marginVertical: space.md },
  moreRetry: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginVertical: 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default OrderHistoryScreen;
