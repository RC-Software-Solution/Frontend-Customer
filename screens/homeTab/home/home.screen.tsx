import { View, TouchableOpacity, ScrollView, Image, StyleSheet, Alert, AppState } from 'react-native';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router, useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { setMenu } from '@/store/menuSlice';
import { RootState } from '@/store';
import { menuService, useAuth } from '@/services';
import { MealType, MEAL_TYPES, buildTabs, nextTransitionMs } from '@/services/menu/todayMenu';
import { useScreenPadding, StatusBarScrim } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { Ionicons } from '@expo/vector-icons';
import { color, space, radius, shadow, status } from '@/theme';

const CART_FAB_SIZE = 56;

const HomeScreen = () => {
  const { isAuthenticated } = useAuth();
  const [activeButton, setActiveButton] = useState<MealType>('breakfast');
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);
  const alerted = useRef(false); // the failure alert shows once per outage, so a retry that fails again is not met by a second popup
  const [loadError, setLoadError] = useState<unknown>(null);

  const padding = useScreenPadding({ tabBar: true, gutters: false });
  const dispatch = useDispatch();
  const cartCount = useSelector((state: RootState) => state.cart.items.reduce((acc, item) => acc + item.quantity, 0));
  // kept in the store so the Menu list screen follows the same refreshes
  const menu = useSelector((state: RootState) => state.menu.menu);

  // What each meal tab shows is decided by the server (today's date in Sri Lanka, each
  // session upcoming/open/closed). Other days are never shown.
  const tabs = useMemo(() => (menu ? buildTabs(menu) : null), [menu]);

  const loadMenuData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      // spinner only for the first load; later refreshes update quietly
      if (!hasLoaded.current) setLoading(true);
      dispatch(setMenu(await menuService.getTodaysMenu()));
      hasLoaded.current = true;
      alerted.current = false;
      setLoadError(null);
    } catch (error) {
      console.error('Failed to load menu data:', error);
      if (!hasLoaded.current) {
        setLoadError(error);
        if (!alerted.current) Alert.alert('Error', 'Failed to load menu items. Please try again.');
        alerted.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, dispatch]);

  // Refresh when this screen is focused (also runs on first mount)
  useFocusEffect(
    useCallback(() => {
      loadMenuData();
    }, [loadMenuData])
  );

  // ...when the app returns from the background (the day may have changed overnight)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && loadMenuData());
    return () => sub.remove();
  }, [loadMenuData]);

  // ...and exactly when a session opens/closes or the day rolls over, so nothing goes stale on screen
  useEffect(() => {
    if (!menu) return;
    const ms = nextTransitionMs(menu);
    if (ms === null) return;
    const timer = setTimeout(loadMenuData, Math.min(ms, 2 ** 31 - 1) + 1000);
    return () => clearTimeout(timer);
  }, [menu, loadMenuData]);

  // A banner opens that kind's Menu list; the pill over the photo counts its dishes
  const renderSection = (title: string, banner: any, count: number, kind: 'veg' | 'nonveg') => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(routes)/menu', params: { meal: activeButton, kind } })}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      style={{ marginHorizontal: space.md }}
    >
      <Image
        source={banner}
        resizeMode="cover"
        style={{ width: '100%', height: 150, alignSelf: 'center', borderRadius: radius.lg }}
      />
      <View style={styles.countPill}>
        <AppText variant="micro" weight="bold" tone="inverse">
          {count} {count === 1 ? 'item' : 'items'}
        </AppText>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      // the Home layout drawn in grey bars: heading, tab row, two banners
      return (
        <SkeletonGroup>
          <View style={{ marginTop: padding.paddingTop, marginHorizontal: space.md }}>
            <Skeleton width={160} height={28} />
          </View>
          <View style={{ marginTop: space.lg, marginHorizontal: space.md, marginBottom: space.md }}>
            <Skeleton width="100%" height={64} radius={radius.lg} />
          </View>
          <View style={{ gap: space.md, marginHorizontal: space.md }}>
            <Skeleton width="100%" height={150} radius={radius.lg} />
            <Skeleton width="100%" height={150} radius={radius.lg} />
          </View>
        </SkeletonGroup>
      );
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.loadingContainer}>
          <AppText variant="body" tone="brand" weight="semibold" style={styles.loadingText}>
            Please log in to view menu items
          </AppText>
        </View>
      );
    }

    if (!tabs) {
      return (
        <View style={styles.loadingContainer}>
          <ErrorState title="Couldn't load the menu" error={loadError} onRetry={loadMenuData} />
        </View>
      );
    }

    const tab = tabs[activeButton];

    return (
      <View>
        <View style={{ alignItems: 'flex-start', marginTop: padding.paddingTop, marginHorizontal: space.md }}>
          <AppText variant="h1" weight="bold">
            RC Caterings
          </AppText>
        </View>
        <View
          style={{
            flexDirection: 'row',
            marginTop: space.lg,
            marginHorizontal: space.md,
            backgroundColor: color.surface,
            borderRadius: radius.lg,
            marginBottom: space.md,
            padding: space.xs,
          }}
        >
          {MEAL_TYPES.map((category) => {
            const selected = activeButton === category;
            return (
              <TouchableOpacity
                key={category}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  flex: 1,
                  minHeight: 64,
                  paddingVertical: space.md,
                  paddingHorizontal: space.sm,
                  backgroundColor: selected ? color.brand : 'transparent',
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setActiveButton(category)}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  tone={selected ? 'onBrand' : 'brand'}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </AppText>
                <AppText
                  variant="micro"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  tone={selected ? 'onBrand' : 'muted'}
                  style={{ marginTop: 2 }}
                >
                  {tabs[category].hint}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab.banner ? (
          <View style={styles.banner}>
            <AppText variant="body" weight="bold" style={{ color: status.pending.fg }}>
              {tab.banner}
            </AppText>
          </View>
        ) : null}

        {tab.state === 'empty' ? null : (
          <>
            <View style={{ alignItems: 'flex-start', marginTop: space.sm + space.xs, marginBottom: space.sm + space.xs, marginHorizontal: space.md }}>
              <AppText variant="h2" weight="bold">
                Choose your preference
              </AppText>
            </View>
            <View style={{ gap: space.md }}>
              {renderSection('Vegetarian Items', require('../../../assets/vegBack.jpg'), tab.veg.length, 'veg')}
              {renderSection('Non-Vegetarian Items', require('../../../assets/nonVegBackground.jpeg'), tab.nonVeg.length, 'nonveg')}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: color.bg }}>
      {/* Extra bottom room (FAB height + gap) so the last row can scroll clear of the cart button */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: padding.paddingBottom + CART_FAB_SIZE + space.lg }}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
      <StatusBarScrim background={color.bg} />
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: padding.paddingBottom + space.sm,
          right: space.md,
          backgroundColor: color.brand,
          borderRadius: radius.pill,
          width: CART_FAB_SIZE,
          height: CART_FAB_SIZE,
          justifyContent: 'center',
          alignItems: 'center',
          ...shadow.card,
        }}
        onPress={() => router.push('/(routes)/cart')}
        accessibilityRole="button"
        accessibilityLabel={cartCount > 0 ? `View cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'View cart'}
      >
        <Ionicons name="cart-outline" size={28} color={color.onBrand} />
        {cartCount > 0 ? (
          <View style={styles.cartBadge}>
            <AppText variant="micro" weight="bold" tone="inverse">
              {cartCount}
            </AppText>
          </View>
        ) : null}
      </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    marginTop: 10,
  },
  banner: {
    marginTop: space.sm,
    marginHorizontal: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: status.pending.bg,
  },
  countPill: {
    position: 'absolute',
    right: space.md,
    bottom: space.md,
    backgroundColor: color.scrim,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: -space.xs,
    right: -space.xs,
    minWidth: 20,
    height: 20,
    paddingHorizontal: space.xs,
    borderRadius: radius.pill,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
