import React from 'react';
import { View, ViewProps } from 'react-native';
import { color, radius, shadow, space } from '@/theme';

export function Card({ style, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          padding: space.md,
          marginBottom: space.sm,
          ...shadow.card,
        },
        style,
      ]}
      {...rest}
    />
  );
}
