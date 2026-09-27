import React from 'react';
import { Text, TextProps } from 'react-native';
import { color, type } from '@/theme';

const tones = {
  ink: color.ink,
  muted: color.muted,
  subtle: color.subtle,
  brand: color.brand,
  danger: color.danger,
  inverse: color.brandInk,
} as const;

type AppTextProps = TextProps & {
  variant?: keyof typeof type;
  tone?: keyof typeof tones;
  weight?: 'regular' | 'bold';
};

export function AppText({
  variant = 'body',
  tone = 'ink',
  weight = 'regular',
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: type[variant],
          color: tones[tone],
          fontWeight: weight === 'bold' ? '700' : '400',
        },
        style,
      ]}
      {...rest}
    />
  );
}
