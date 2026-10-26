import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppText } from '../ui/AppText';
import { color } from '@/theme';

const styleOf = (text: string) => StyleSheet.flatten(screen.getByText(text).props.style);

test('regular uses Nunito 400 and sets no fontWeight', async () => {
  await render(<AppText>hi</AppText>);
  expect(styleOf('hi').fontFamily).toBe('Nunito_400Regular');
  expect(styleOf('hi').fontWeight).toBeUndefined();
});

test('semibold and bold map to their own font files', async () => {
  await render(
    <>
      <AppText weight="semibold">semi</AppText>
      <AppText weight="bold">bold</AppText>
    </>,
  );
  expect(styleOf('semi').fontFamily).toBe('Nunito_600SemiBold');
  expect(styleOf('bold').fontFamily).toBe('Nunito_700Bold');
});

test('tone brand is the AA-safe green, never the fill green', async () => {
  await render(<AppText tone="brand">green</AppText>);
  expect(styleOf('green').color).toBe(color.brandStrong);
});

test('tone onBrand is the dark ink used on green fills', async () => {
  await render(<AppText tone="onBrand">label</AppText>);
  expect(styleOf('label').color).toBe(color.onBrand);
});
