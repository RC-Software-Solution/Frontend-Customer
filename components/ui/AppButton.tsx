import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { color, radius, space } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'dangerOutline';

const fills: Record<Variant, string> = {
  primary: color.brand,
  secondary: color.field,
  danger: color.danger,
  outline: 'transparent',
  dangerOutline: 'transparent',
};

const labelTones: Record<Variant, 'onBrand' | 'ink' | 'inverse' | 'danger'> = {
  primary: 'onBrand',
  secondary: 'ink',
  danger: 'inverse',
  outline: 'ink',
  dangerOutline: 'danger',
};

const spinnerColors: Record<Variant, string> = {
  primary: color.onBrand,
  secondary: color.ink,
  danger: color.brandInk,
  outline: color.ink,
  dangerOutline: color.danger,
};

// The outline variants draw a 2 px border in their label colour.
const borders: Partial<Record<Variant, string>> = {
  outline: color.ink,
  dangerOutline: color.danger,
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
      accessibilityLabel={title}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={[
        {
          backgroundColor: fills[variant],
          ...(borders[variant] ? { borderWidth: 2, borderColor: borders[variant] } : null),
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
        <ActivityIndicator size="small" color={spinnerColors[variant]} />
      ) : (
        <AppText variant="body" weight="bold" tone={labelTones[variant]}>
          {title}
        </AppText>
      )}
    </TouchableOpacity>
  );
}
