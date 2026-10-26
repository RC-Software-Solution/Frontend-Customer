import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from 'expo-router/js-tabs';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, shadow, space } from '@/theme';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/theme/layout';
import TabBarButton from '../tabBarButton/tabBarButton';

export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const [dimensions, setDimensions] = useState<{ height: number; width: number } | null>(null);
  const buttonWidth = dimensions ? dimensions.width / state.routes.length : 0;
  const tabPositionX = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const unread = useSelector((s: RootState) => s.notices.unread);

  useEffect(() => {
    if (!dimensions) return;
    tabPositionX.value = withSpring(buttonWidth * state.index, { damping: 95, stiffness: 180 });
  }, [state.index, buttonWidth, dimensions]);

  const onTabbarLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    const first = dimensions === null;
    setDimensions({ height, width });
    if (first) {
      tabPositionX.value = (width / state.routes.length) * state.index;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPositionX.value }],
  }));

  return (
    <View
      onLayout={onTabbarLayout}
      style={[styles.tabbar, { bottom: insets.bottom + TAB_BAR_GAP }]}
    >
      {dimensions ? (
        <Animated.View
          style={[
            animatedStyle,
            {
              position: 'absolute',
              backgroundColor: color.brand,
              width: buttonWidth - space.sm,
              height: dimensions.height - space.md,
              marginHorizontal: space.xs,
              borderRadius: radius.lg,
            },
          ]}
        />
      ) : null}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          tabPositionX.value = withSpring(buttonWidth * index, { damping: 95, stiffness: 180 });
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        return (
          <TabBarButton
            key={route.key}
            onPress={onPress}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            isFocused={isFocused}
            routeName={route.name}
            label={label}
            badge={route.name === 'notification/index' ? unread : 0}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    height: TAB_BAR_HEIGHT,
    ...shadow.bar,
  },
});
