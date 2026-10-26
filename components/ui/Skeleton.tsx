// Jest decision: real Reanimated cannot load under Jest here (its worklets runtime needs the native module: "Cannot read properties of undefined (reading 'loadUnpackers')"),
// so jest.setup.ts maps it to react-native-reanimated/mock. A global mock, not a per-file one, because every screen test that renders a skeleton imports this file.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Card } from './Card';
import { color, radius, space } from '@/theme';

// One grey bar (the States board's `field` colour). Static: the pulse lives on the group.
export function Skeleton({ width, height, radius: r = radius.sm }: { width: number | `${number}%`; height: number; radius?: number }) {
  return <View testID="skeleton-bar" style={{ width, height, borderRadius: r, backgroundColor: color.field }} />;
}

// Pulses opacity 1 -> 0.5 and back, forever. Opacity only: no layout, no blur. withTiming follows the device's reduce-motion setting.
// Announced once as "Loading"; the bars inside are hidden from screen readers.
export function SkeletonGroup({ children }: { children: React.ReactNode }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.5, { duration: 800 }), -1, true);
    return () => cancelAnimation(pulse);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      style={style}
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      {/* hidden on its own node: on the group itself, no-hide-descendants would hide the "Loading" label too */}
      <View importantForAccessibility="no-hide-descendants">{children}</View>
    </Animated.View>
  );
}

// The States board's loading card. No elevation: on Android a shadow under a half-transparent card shows through as a grey frame.
// It is an order card drawn in grey bars.
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <SkeletonGroup>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} testID="card-skeleton" style={{ marginHorizontal: space.md, elevation: 0, shadowOpacity: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Skeleton width={110} height={18} />
              <View style={{ marginTop: space.sm }}>
                <Skeleton width={170} height={12} />
              </View>
            </View>
            <Skeleton width={72} height={24} radius={radius.md} />
          </View>
          <View style={{ marginTop: space.md }}>
            <Skeleton width={210} height={14} />
          </View>
          <View style={{ height: 1, backgroundColor: color.border, marginVertical: 14 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={96} height={24} />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Skeleton width={76} height={48} radius={radius.pill} />
              <Skeleton width={92} height={48} radius={radius.pill} />
            </View>
          </View>
        </Card>
      ))}
    </SkeletonGroup>
  );
}
