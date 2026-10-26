import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppButton } from '../ui/AppButton';
import { color } from '@/theme';

test('primary label is dark ink on the green fill', async () => {
  await render(<AppButton title="Go" onPress={jest.fn()} />);
  expect(StyleSheet.flatten(screen.getByText('Go').props.style).color).toBe(color.onBrand);
});

test('danger label stays white', async () => {
  await render(<AppButton title="Delete" variant="danger" onPress={jest.fn()} />);
  expect(StyleSheet.flatten(screen.getByText('Delete').props.style).color).toBe(color.brandInk);
});

test('keeps its accessible name while loading (no "busy" announcement)', async () => {
  await render(<AppButton title="Go" onPress={jest.fn()} loading />);
  expect(screen.getByLabelText('Go')).toBeTruthy();
});

test.each([
  ['outline', color.ink],
  ['dangerOutline', color.danger],
] as const)('%s is transparent with a 2 px border and a label in the same colour', async (variant, tone) => {
  await render(<AppButton title="Edit" variant={variant} onPress={jest.fn()} />);
  expect(StyleSheet.flatten(screen.getByText('Edit').props.style).color).toBe(tone);
  const button = StyleSheet.flatten(screen.getByLabelText('Edit').props.style);
  expect(button.backgroundColor).toBe('transparent');
  expect(button.borderWidth).toBe(2);
  expect(button.borderColor).toBe(tone);
  expect(button.minHeight).toBe(52);
});
