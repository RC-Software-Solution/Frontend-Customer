import React from 'react';
import { Text, TextProps } from 'react-native';
import { color, type } from '@/theme';

const tones = {
  ink: color.ink,
  muted: color.muted,
  subtle: color.subtle,
  brand: color.brandStrong, // text-safe green; the fill green fails contrast
  danger: color.danger,
  inverse: color.brandInk,
  onBrand: color.onBrand,
} as const;

// One family, three files. Do not pass fontWeight: on Android a custom family plus fontWeight fake-bolds.
const families = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
} as const;

type AppTextProps = TextProps & {
  variant?: keyof typeof type;
  tone?: keyof typeof tones;
  weight?: keyof typeof families;
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
      style={[{ fontSize: type[variant], color: tones[tone], fontFamily: families[weight] }, style]}
      {...rest}
    />
  );
}
