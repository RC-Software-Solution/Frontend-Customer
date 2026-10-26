import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PlatformPressable } from 'expo-router/react-navigation';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { color, radius, space } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// outline when idle, filled when selected
const icons: Record<string, [IconName, IconName]> = {
  index: ['restaurant-outline', 'restaurant'],
  'order-status/index': ['time-outline', 'time'],
  'pending-payments/index': ['receipt-outline', 'receipt'],
  'notification/index': ['notifications-outline', 'notifications'],
  'profile/index': ['person-outline', 'person'],
};

const TabBarButton = ({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  label,
  badge = 0,
}: {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  label: string;
  badge?: number;
}) => {
  const [idle, active] = icons[routeName] ?? icons.index;
  const tone = isFocused ? 'onBrand' : 'muted';
  return (
    <PlatformPressable
      android_ripple={{ borderless: false, color: 'transparent' }}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={styles.item}
    >
      <View>
        <Ionicons
          name={isFocused ? active : idle}
          size={24}
          color={isFocused ? color.onBrand : color.muted}
        />
        {badge > 0 ? (
          <View style={styles.badge} accessibilityLabel={`${badge} unread`}>
            <AppText variant="micro" weight="bold" tone="inverse">
              {badge > 9 ? '9+' : String(badge)}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText
        variant="micro"
        weight={isFocused ? 'bold' : 'semibold'}
        tone={tone}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </AppText>
    </PlatformPressable>
  );
};

export default TabBarButton;

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignSelf: 'stretch',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.xs,
  },
  badge: {
    position: 'absolute',
    top: -space.xs,
    right: -space.sm - space.xs,
    minWidth: 16,
    height: 16,
    borderRadius: radius.sm,
    paddingHorizontal: space.xs,
    backgroundColor: color.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
