import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { color, radius, space } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger';

const fills: Record<Variant, string> = {
  primary: color.brand,
  secondary: color.field,
  danger: color.danger,
};

const labelTones: Record<Variant, 'inverse' | 'ink'> = {
  primary: 'inverse',
  secondary: 'ink',
  danger: 'inverse',
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inert = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      style={[
        {
          backgroundColor: fills[variant],
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 52,
          opacity: inert ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color.brandInk} />
      ) : (
        <AppText variant="body" weight="bold" tone={labelTones[variant]}>
          {title}
        </AppText>
      )}
    </TouchableOpacity>
  );
}
